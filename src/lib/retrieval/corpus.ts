import {
    initialMembers, ringMembers, initialApplications, initialAnomalies,
    initialOpportunities, initialAuditLog, initialSuites, initialBookings,
    initialGuests, initialThreads,
} from '../services/seed-data.ts';

/**
 * Retrieval corpus. One chunk per unit that answers an operator's question:
 * a member dossier line, one anomaly, one opportunity, one audit action —
 * never token-count windows. Text is written the way an operator would
 * search for it; metadata carries the structured ground truth used for
 * filtering and for labeling the eval set.
 */
export interface Chunk {
    id: string;
    text: string;
    metadata: {
        kind: 'member' | 'application' | 'anomaly' | 'opportunity'
            | 'audit' | 'booking' | 'guest' | 'thread';
        memberId?: string;
        date?: string;
        severity?: string;
        status?: string;
        inRing?: boolean;
        weekday?: number; // 1 Mon .. 7 Sun, UTC
    };
}

const ringIds = new Set(ringMembers.map(m => m.id));
const memberName = (id: string) =>
    initialMembers.find(m => m.id === id)?.name ?? id;
const suiteName = (id: string) =>
    initialSuites.find(s => s.id === id)?.name ?? id;
const isoWeekday = (iso: string) => {
    const d = new Date(iso).getUTCDay(); // 0 Sun .. 6 Sat
    return d === 0 ? 7 : d;
};

export function buildCorpus(): Chunk[] {
    const chunks: Chunk[] = [];

    for (const m of initialMembers) {
        const referred = m.referralId
            ? ` Referred by ${memberName(m.referralId)}.`
            : '';
        chunks.push({
            id: `member:${m.id}`,
            text: `Member dossier: ${m.name} (${m.email}), ${m.tier} tier, status ${m.status}, trust score ${m.trustScore}. Joined ${m.joinDate}, last access ${m.lastAccess}.${referred}${ringIds.has(m.id) ? ' Part of a linked referral cluster.' : ''}`,
            metadata: { kind: 'member', memberId: m.id, status: m.status, date: m.joinDate, inRing: ringIds.has(m.id) },
        });
    }

    for (const a of initialApplications) {
        chunks.push({
            id: `application:${a.id}`,
            text: `Membership application: ${a.name} (${a.email}) applied for ${a.tier} tier on ${a.appliedDate}. Status ${a.status}, risk score ${a.riskScore} out of 100.`,
            metadata: { kind: 'application', status: a.status, date: a.appliedDate },
        });
    }

    for (const an of initialAnomalies) {
        chunks.push({
            id: `anomaly:${an.id}`,
            text: `Access anomaly for ${memberName(an.memberId)}: ${an.type} — ${an.description} Severity ${an.severity}, ${an.isResolved ? 'resolved' : 'unresolved'}. Observed ${an.timestamp}.`,
            metadata: { kind: 'anomaly', memberId: an.memberId, severity: an.severity, date: an.timestamp, status: an.isResolved ? 'Resolved' : 'Open' },
        });
    }

    for (const o of initialOpportunities) {
        chunks.push({
            id: `opportunity:${o.id}`,
            text: `Revenue opportunity: ${o.title}. Gap: ${o.gap} Evidence: ${o.evidence} Projected upside $${o.projectedUpside.toLocaleString('en-US')}. Recommended action: ${o.action} Assumptions: ${o.assumptions}`,
            metadata: { kind: 'opportunity', status: o.status },
        });
    }

    for (const e of initialAuditLog) {
        const humanAction = e.action.replace(/_/g, ' ').toLowerCase();
        chunks.push({
            id: `audit:${e.id}`,
            text: `Audit entry ${e.timestamp}: operator ${e.operator} recorded the decision to ${humanAction} for ${memberName(e.targetId)}. Reason: ${e.reason}`,
            metadata: { kind: 'audit', memberId: e.targetId, date: e.timestamp },
        });
    }
    for (const b of initialBookings) {
        chunks.push({
            id: `booking:${b.id}`,
            text: `Suite booking: ${memberName(b.memberId)} booked ${suiteName(b.suiteId)} on ${b.date} at ${b.startTime} for ${b.duration} hours, party of ${b.partySize}, $${b.amount}. Status ${b.status}.`,
            metadata: { kind: 'booking', memberId: b.memberId, date: b.date, status: b.status, weekday: isoWeekday(b.date) },
        });
    }

    for (const g of initialGuests) {
        const checks = [
            g.checks.idVerified ? 'ID verified' : 'ID unverified',
            g.checks.billingCurrent ? 'billing current' : 'billing delinquent',
            g.checks.backgroundClear ? 'background clear' : 'background flagged',
        ].join(', ');
        chunks.push({
            id: `guest:${g.id}`,
            text: `Guest request: ${g.name}, sponsored by member ${g.sponsorName}. Trust score ${g.trustScore}. Checks: ${checks}. Status ${g.status}. Requested ${g.requestedAt}.`,
            metadata: { kind: 'guest', memberId: g.sponsorId, status: g.status, date: g.requestedAt },
        });
    }

    for (const t of initialThreads) {
        const body = t.messages.map(m => `${m.authorName}: ${m.body}`).join(' ');
        chunks.push({
            id: `thread:${t.id}`,
            text: `Message thread (${t.kind}) with ${t.participantName} — ${t.subject}. ${body}`,
            metadata: { kind: 'thread', memberId: t.participantId, date: t.messages[0]?.at },
        });
    }

    return chunks;
}
