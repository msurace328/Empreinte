import { NextRequest, NextResponse } from 'next/server';
import { toolDefinitions, runTool } from '@/lib/retrieval/agent-tools';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_TOOL_ROUNDS = 5;

// POST /api/revenue-ai — a tool-using agent: Claude analyzes the operating
// summary and may call search_operations (the same hybrid retrieval layer
// that backs trust search) to inspect underlying records before answering.
export async function POST(req: NextRequest) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example) and restart the dev server.' }, { status: 500 });
    }

    try {
        const { summary } = await req.json();

        const prompt = `You are a revenue strategist for ARENA, a premium sports-suite membership business. Analyze the operating data below and surface exactly 3 specific, non-obvious revenue opportunities the operator is most likely missing. Tie every recommendation directly to numbers in the data.

You have a search_operations tool over the club's full operational records. Before finalizing, use it to verify at least one claim or discover supporting specifics (for example: no-show and refunded bookings, denied guests, midweek booking patterns, members under watch).

DATA SUMMARY:
${JSON.stringify(summary, null, 2)}

When you are done investigating, return ONLY a JSON array (no prose, no markdown code fences) of exactly 3 objects, each with these keys:
"title": short headline (under 6 words),
"action": a 3-5 word imperative,
"rationale": one sentence grounded in the data or in records you retrieved,
"projectedUpside": integer dollars (your best estimate),
"confidence": one of "High", "Medium", "Low".`;

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
                    tools: toolDefinitions,
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
                const output = await runTool(use.name, use.input);
                results.push({ type: 'tool_result', tool_use_id: use.id, content: output });
            }
            messages.push({ role: 'user', content: results });
        }

        const clean = finalText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const arrayMatch = clean.match(/\[[\s\S]*\]/);

        let opportunities: unknown = [];
        try {
            opportunities = JSON.parse(arrayMatch ? arrayMatch[0] : clean);
        } catch {
            opportunities = [];
        }

        return NextResponse.json({ opportunities, raw: finalText, toolCalls });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
