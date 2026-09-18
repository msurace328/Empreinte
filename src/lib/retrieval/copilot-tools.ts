import { toolDefinitions as searchTools, runTool as runSearchTool } from './agent-tools.ts';

/**
 * Tools for the Application Copilot. Adds a deterministic email-domain
 * check alongside the shared search_operations retrieval tool. Domain
 * intelligence is a lookup, not a judgment call, so it is code, not model.
 */
const DISPOSABLE_DOMAINS = new Set([
    'temp-mail.ai', 'quickinbox.top', 'mailinator.com', 'guerrillamail.com',
    '10minutemail.com', 'throwawaymail.com', 'getnada.com', 'tempmail.dev',
]);

export const copilotToolDefinitions = [
    ...searchTools,
    {
        name: 'check_email_domain',
        description:
            'Deterministic check of an email address domain: whether it is a known disposable/temporary mail provider, and whether other applicants, members, or guests in the records use the same domain.',
        input_schema: {
            type: 'object' as const,
            properties: {
                email: { type: 'string', description: 'The email address to check' },
            },
            required: ['email'],
        },
    },
];

export async function runCopilotTool(name: string, input: Record<string, unknown>): Promise<string> {
    if (name === 'check_email_domain') {
        const email = String(input.email ?? '').toLowerCase();
        const domain = email.split('@')[1] ?? '';
        const sameDomain = await runSearchTool('search_operations', { query: domain, k: 10 });
        return JSON.stringify({
            domain,
            disposable: DISPOSABLE_DOMAINS.has(domain),
            recordsMentioningDomain: JSON.parse(sameDomain),
        });
    }
    return runSearchTool(name, input);
}
