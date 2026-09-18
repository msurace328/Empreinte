import { NextRequest, NextResponse } from 'next/server';
import { copilotToolDefinitions, runCopilotTool } from '@/lib/retrieval/copilot-tools';
import { initialApplications } from '@/lib/services/seed-data';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_TOOL_ROUNDS = 6;

// POST /api/application-copilot — multi-step agentic review of one intake.
// Workflow: gather -> investigate with tools -> score -> recommend a
// disposition -> draft the applicant message. The agent recommends; the
// operator decides. The response includes a proposed audit entry that the
// client appends through the existing hash-chained rechain flow.
export async function POST(req: NextRequest) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example) and restart the dev server.' }, { status: 500 });
    }

    try {
        const { applicationId } = await req.json();
        const application = initialApplications.find(a => a.id === applicationId);
        if (!application) {
            return NextResponse.json({ error: `Unknown applicationId: ${applicationId}` }, { status: 404 });
        }

        const prompt = `You are the Application Copilot for ARENA, a premium membership business. Review this membership application by following this workflow, in order:

1. GATHER: read the application below.
2. INVESTIGATE: use your tools. Check the email domain. Search the records for identity reuse (same name, same photo, same email domain as existing members or applicants), proximity to the closed referral loop, denied guests or incidents under any connected sponsor, and anything else material.
3. SCORE: weigh what you found. Cite specific records.
4. RECOMMEND: one disposition: "Approved", "NeedsInfo", "Waitlisted", or "Rejected". You recommend; a human operator makes the final call.
5. DRAFT: a short, professional message to the applicant matching the disposition (for NeedsInfo, say exactly what to provide; for Rejected, be courteous and final without detailing detection methods).

APPLICATION:
${JSON.stringify(application, null, 2)}

When the workflow is complete, return ONLY a JSON object (no prose, no markdown fences) with keys:
"disposition": one of "Approved" | "NeedsInfo" | "Waitlisted" | "Rejected",
"riskScore": integer 0-100, your own assessment,
"rationale": 2-3 sentences citing the specific records or checks behind the recommendation,
"signals": array of short strings, one per concrete signal found (empty if none),
"applicantMessage": the drafted message as a single string.`;

        type ContentBlock =
            | { type: 'text'; text: string }
            | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
            | { type: 'tool_result'; tool_use_id: string; content: string };

        const messages: Array<{ role: 'user' | 'assistant'; content: string | ContentBlock[] }> = [
            { role: 'user', content: prompt },
        ];

        const toolCalls: Array<{ name: string; input: Record<string, unknown> }> = [];
        let finalText = '';

        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-5',
                    max_tokens: 4096,
                    tools: copilotToolDefinitions,
                    messages,
                }),
            });

            if (!res.ok) {
                const detail = await res.text();
                return NextResponse.json({ error: `Claude API error ${res.status}: ${detail}` }, { status: 502 });
            }

            const data = await res.json();
            const content = (data.content ?? []) as ContentBlock[];

            finalText = content
                .filter((c): c is Extract<ContentBlock, { type: 'text' }> => c.type === 'text')
                .map(c => c.text)
                .join('\n')
                .trim();

            if (data.stop_reason !== 'tool_use') break;

            const uses = content.filter(
                (c): c is Extract<ContentBlock, { type: 'tool_use' }> => c.type === 'tool_use',
            );
            messages.push({ role: 'assistant', content });

            const results: ContentBlock[] = [];
            for (const use of uses) {
                toolCalls.push({ name: use.name, input: use.input });
                const output = await runCopilotTool(use.name, use.input);
                results.push({ type: 'tool_result', tool_use_id: use.id, content: output });
            }
            messages.push({ role: 'user', content: results });
        }

        const clean = finalText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const objectMatch = clean.match(/\{[\s\S]*\}/);

        let review: { disposition?: string; rationale?: string } & Record<string, unknown> = {};
        try {
            review = JSON.parse(objectMatch ? objectMatch[0] : clean);
        } catch {
            return NextResponse.json({ error: 'Copilot returned unparseable output', raw: finalText, toolCalls }, { status: 502 });
        }

        // Proposed audit entry: the client appends it via the existing
        // rechain flow, which recomputes previousHash/hash for the chain.
        const proposedAuditEntry = {
            id: `log-copilot-${Date.now()}`,
            timestamp: new Date().toISOString(),
            operator: 'Copilot.Agent',
            action: `RECOMMEND_${String(review.disposition ?? 'UNKNOWN').toUpperCase()}`,
            targetId: application.id,
            reason: String(review.rationale ?? ''),
        };

        return NextResponse.json({ review, proposedAuditEntry, toolCalls });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
