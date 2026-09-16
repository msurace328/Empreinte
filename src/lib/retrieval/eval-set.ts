import type { Chunk } from './corpus.ts';

/**
 * Labeled retrieval evaluation set. Relevance is defined as a predicate over
 * chunk metadata — structured ground truth the retriever never sees as text —
 * so labels are deterministic and reviewable, and the retriever has to
 * recover them from language alone.
 */
export interface EvalQuery {
    id: string;
    query: string;
    isRelevant: (c: Chunk) => boolean;
}

export const evalQueries: EvalQuery[] = [
    { id: 'q01', query: 'members in the manufactured referral ring', isRelevant: c => c.metadata.kind === 'member' && c.metadata.inRing === true },
    { id: 'q02', query: 'restricted members', isRelevant: c => c.metadata.kind === 'member' && c.metadata.status === 'Restricted' },
    { id: 'q03', query: 'members under watch', isRelevant: c => c.metadata.kind === 'member' && c.metadata.status === 'Watch' },
    { id: 'q04', query: 'pending membership applications awaiting review', isRelevant: c => c.metadata.kind === 'application' && c.metadata.status === 'Pending' },
    { id: 'q05', query: 'rejected applicants', isRelevant: c => c.metadata.kind === 'application' && c.metadata.status === 'Rejected' },
    { id: 'q06', query: 'credential sharing incidents', isRelevant: c => c.metadata.kind === 'anomaly' && c.text.includes('CredentialSharing') },
    { id: 'q07', query: 'unresolved access anomalies', isRelevant: c => c.metadata.kind === 'anomaly' && c.metadata.status === 'Open' },
    { id: 'q08', query: 'high severity security incidents', isRelevant: c => c.metadata.kind === 'anomaly' && c.metadata.severity === 'High' },
    { id: 'q09', query: 'off hours facility access', isRelevant: c => c.metadata.kind === 'anomaly' && c.text.includes('OffHours') },
    { id: 'q10', query: 'guest visit spikes', isRelevant: c => c.metadata.kind === 'anomaly' && c.text.includes('GuestSpike') },
    { id: 'q11', query: 'open revenue opportunities we have not acted on', isRelevant: c => c.metadata.kind === 'opportunity' && c.metadata.status === 'Open' },
    { id: 'q12', query: 'midweek suite utilization gaps', isRelevant: c => (c.metadata.kind === 'opportunity' && /midweek|weekday/i.test(c.text)) || (c.metadata.kind === 'booking' && (c.metadata.weekday ?? 0) >= 2 && (c.metadata.weekday ?? 0) <= 4) },
    { id: 'q13', query: 'member restriction decisions and the reasons recorded', isRelevant: c => c.metadata.kind === 'audit' && /restrict/i.test(c.text) },
    { id: 'q14', query: 'no show suite bookings', isRelevant: c => c.metadata.kind === 'booking' && c.metadata.status === 'NoShow' },
    { id: 'q15', query: 'refunded bookings', isRelevant: c => c.metadata.kind === 'booking' && c.metadata.status === 'Refunded' },
    { id: 'q16', query: 'denied guest requests', isRelevant: c => c.metadata.kind === 'guest' && c.metadata.status === 'Denied' },
    { id: 'q17', query: 'guests with failed verification checks', isRelevant: c => c.metadata.kind === 'guest' && /(unverified|delinquent|flagged)/.test(c.text) },
    { id: 'q18', query: 'member conversations about billing or payment', isRelevant: c => c.metadata.kind === 'thread' && /(billing|payment|invoice|charge)/i.test(c.text) },
    { id: 'q19', query: 'audit actions taken by operators on ring members', isRelevant: c => c.metadata.kind === 'audit' && c.text.length > 0 && c.metadata.memberId !== undefined },
    { id: 'q20', query: 'high trust founder tier members in good standing', isRelevant: c => c.metadata.kind === 'member' && c.metadata.status === 'Active' && /Founder tier/.test(c.text) },
];
