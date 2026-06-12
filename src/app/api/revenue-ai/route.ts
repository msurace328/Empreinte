import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// POST /api/revenue-ai  — sends a compact data summary to Claude and returns opportunities.
export async function POST(req: NextRequest) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set in the environment.' }, { status: 500 });
    }

    try {
        const { summary } = await req.json();

        const prompt = `You are a revenue strategist for ARENA, a premium sports-suite membership business. Analyze the operating data below and surface exactly 3 specific, non-obvious revenue opportunities the operator is most likely missing. Tie every recommendation directly to numbers in the data.

DATA:
${JSON.stringify(summary, null, 2)}

Return ONLY a JSON array (no prose, no markdown code fences) of exactly 3 objects, each with these keys:
"title": short headline (under 6 words),
"action": a 3-5 word imperative,
"rationale": one sentence grounded in the data,
"projectedUpside": integer dollars (your best estimate),
"confidence": one of "High", "Medium", "Low".`;

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!res.ok) {
            const detail = await res.text();
            return NextResponse.json({ error: `Claude API error ${res.status}: ${detail}` }, { status: 502 });
        }

        const data = await res.json();
        const text = (data.content || [])
            .filter((c: { type: string }) => c.type === 'text')
            .map((c: { text: string }) => c.text)
            .join('\n')
            .trim();

        const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        let opportunities: unknown = [];
        try {
            opportunities = JSON.parse(clean);
        } catch {
            opportunities = [];
        }

        return NextResponse.json({ opportunities, raw: text });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
