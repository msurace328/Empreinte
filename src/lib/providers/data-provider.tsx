"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Member, Application, RiskSignal, AccessAnomaly, RevenueOpportunity, AuditEntry, Booking, Guest, MessageThread, CheckInEvent, CheckInResult, Invoice, Expense } from '@/lib/types';
import { hashEntry, rechain, GENESIS } from '@/lib/hash-chain';
import { safeStorage } from '@/lib/safe-storage';
import { initialMembers, initialApplications, initialOpportunities, initialAnomalies, initialAuditLog, initialBookings, initialSuites, initialGuests, initialThreads, initialExpenses } from '@/lib/services/seed-data';

interface DataContextType {
    members: Member[];
    applications: Application[];
    opportunities: RevenueOpportunity[];
    anomalies: AccessAnomaly[];
    auditLog: AuditEntry[];
    bookings: Booking[];
    guests: Guest[];
    threads: MessageThread[];
    checkIns: CheckInEvent[];
    invoices: Invoice[];
    expenses: Expense[];

    // Actions
    approveApplication: (appId: string, operator: string, reason: string) => void;
    rejectApplication: (appId: string, operator: string, reason: string) => void;
    waitlistApplication: (appId: string, operator: string, reason: string) => void;
    requestInfoApplication: (appId: string, operator: string, reason: string) => void;
    restrictMember: (memberId: string, operator: string, reason: string) => void;
    watchMember: (memberId: string, operator: string, reason: string) => void;
    reinstateMember: (memberId: string, operator: string, reason: string) => void;
    approveOpportunity: (id: string, operator: string, reason: string) => void;
    dismissOpportunity: (id: string, operator: string, reason: string) => void;
    dismissAnomaly: (id: string, operator: string) => void;
    addMember: (member: Member, operator: string) => void;
    issueGuestPass: (guestId: string, operator: string, reason: string) => void;
    denyGuest: (guestId: string, operator: string, reason: string) => void;
    addAuditEntry: (operator: string, action: string, targetId: string, reason: string) => void;
    tamperWithAuditEntry: (entryId: string) => void;
    resealAuditLog: () => void;
    addApplication: (input: { name: string; email: string; tier: Application['tier']; referralId?: string }) => Application;
    replyToThread: (threadId: string, operator: string, body: string) => void;
    markThreadRead: (threadId: string) => void;
    resetDemoData: () => void;
    backend: 'kv' | 'memory' | 'unavailable';
    hydrated: boolean;
    sponsorGuest: (input: { name: string; sponsorId: string; sponsorName: string }) => Guest;
    openThread: (input: { subject: string; body: string; memberId: string; memberName: string; avatarUrl?: string }) => MessageThread;
    issueInvoice: (input: { applicationId: string; operator: string }) => Invoice | null;
    markInvoicePaid: (invoiceId: string) => Invoice | null;
    addExpense: (input: Omit<Expense, 'id'>, operator: string) => Expense;
    recordCheckIn: (input: {
        subjectId: string; subjectKind: 'Member' | 'Guest'; result: CheckInResult;
        reason: string; gate: string; operator: string;
    }) => CheckInEvent | null;
}

// Bump when the seed data shape or content changes. Sessions saved under an
// older version are discarded on load, so shipped seed updates actually reach
// people who already have a session stored.
// v3: audit entries carry a real SHA-256 chain; v2 sessions hold the old
// placeholder hashes and would fail verification, so they are retired.
const SESSION_VERSION = 3;
const STORE_KEY = `empreinte_session_v${SESSION_VERSION}`;

// Kept in sync with the TIERS constant the public pricing page renders.
const TIER_PRICING: Record<Member['tier'], { price: number; cadence: string }> = {
    Associate: { price: 45000, cadence: 'per season' },
    Suite: { price: 165000, cadence: 'per season' },
    Founder: { price: 400000, cadence: 'per season' },
};

// Small stable hash so a given application always yields the same demo token.
function hashString(input: string): number {
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (h << 5) - h + input.charCodeAt(i) | 0;
    return h;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [opportunities, setOpportunities] = useState<RevenueOpportunity[]>(initialOpportunities);
    const [anomalies, setAnomalies] = useState<AccessAnomaly[]>(initialAnomalies);
    const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => rechain(initialAuditLog));
    const [bookings] = useState<Booking[]>(initialBookings);
    const [guests, setGuests] = useState<Guest[]>(initialGuests);
    const [threads, setThreads] = useState<MessageThread[]>(initialThreads);
    const [checkIns, setCheckIns] = useState<CheckInEvent[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [hydrated, setHydrated] = useState(false);
    const [backend, setBackend] = useState<'kv' | 'memory' | 'unavailable'>('unavailable');
    // Original wording of any record the demo has rewritten, so it can be undone.
    const tamperedOriginals = React.useRef(new Map<string, string>());

    // Restore the session on mount, then keep it in sync. The server is the
    // source of truth when a store is configured; localStorage is the offline
    // mirror so the demo still works with no backend at all.
    useEffect(() => {
        let cancelled = false;

        const apply = (snap: Record<string, unknown> | null) => {
            if (!snap || cancelled) return false;
            if (snap.version !== SESSION_VERSION) return false;
            if (snap.members) setMembers(snap.members as Member[]);
            if (snap.applications) setApplications(snap.applications as Application[]);
            if (snap.opportunities) setOpportunities(snap.opportunities as RevenueOpportunity[]);
            if (snap.anomalies) setAnomalies(snap.anomalies as AccessAnomaly[]);
            if (snap.auditLog) setAuditLog(snap.auditLog as AuditEntry[]);
            if (snap.guests) setGuests(snap.guests as Guest[]);
            if (snap.threads) setThreads(snap.threads as MessageThread[]);
            if (snap.checkIns) setCheckIns(snap.checkIns as CheckInEvent[]);
            if (snap.invoices) setInvoices(snap.invoices as Invoice[]);
            if (snap.expenses) setExpenses(snap.expenses as Expense[]);
            return true;
        };

        (async () => {
            let restored = false;
            try {
                const res = await fetch('/api/state', { cache: 'no-store' });
                if (res.ok) {
                    const { data, backend } = await res.json();
                    if (!cancelled) setBackend(backend ?? 'unavailable');
                    restored = apply(data);
                }
            } catch {
                // Server unreachable — fall through to the local mirror.
            }

            if (!restored) {
                try {
                    const raw = safeStorage.get('local', STORE_KEY);
                    if (raw) apply(JSON.parse(raw));
                } catch {
                    // Corrupt or unavailable storage just falls back to seed data.
                }
            }
            if (!cancelled) setHydrated(true);
        })();

        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        const snapshot = { version: SESSION_VERSION, members, applications, opportunities, anomalies, auditLog, guests, threads, checkIns, invoices, expenses };
        try {
            safeStorage.set('local', STORE_KEY, JSON.stringify(snapshot));
        } catch {
            // Quota or private-mode failures are non-fatal; the session just stops persisting.
        }
        // Debounced write-through so a burst of edits is one request.
        const t = setTimeout(() => {
            fetch('/api/state', {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(snapshot),
            }).catch(() => { /* offline is fine; the local mirror still holds */ });
        }, 700);
        return () => clearTimeout(t);
    }, [hydrated, members, applications, opportunities, anomalies, auditLog, guests, threads, checkIns, invoices, expenses]);

    const resetDemoData = () => {
        safeStorage.remove('local', STORE_KEY);
        fetch('/api/state', { method: 'DELETE' }).catch(() => {});
        setMembers(initialMembers);
        setApplications(initialApplications);
        setOpportunities(initialOpportunities);
        setAnomalies(initialAnomalies);
        setAuditLog(rechain(initialAuditLog));
        setGuests(initialGuests);
        setThreads(initialThreads);
        setCheckIns([]);
        setInvoices([]);
        setExpenses(initialExpenses);
    };

    const addExpense: DataContextType['addExpense'] = (input, operator) => {
        const expense: Expense = { ...input, id: `ex-${String(Date.now()).slice(-6)}` };
        setExpenses(prev => [expense, ...prev]);
        addAuditEntry(operator, 'EXPENSE_RECORDED', expense.id, `${expense.vendor} · $${expense.amount.toLocaleString()} · ${expense.category}.`);
        return expense;
    };

    // Vetting cleared, so now we ask for money — never before. The checkout
    // token stands in for a Stripe Checkout Session id.
    const issueInvoice: DataContextType['issueInvoice'] = ({ applicationId, operator }) => {
        const app = applications.find(a => a.id === applicationId);
        if (!app) return null;
        const existing = invoices.find(i => i.applicationId === applicationId && i.status === 'Awaiting payment');
        if (existing) return existing;
        const plan = TIER_PRICING[app.tier];
        const invoice: Invoice = {
            id: `inv-${String(Date.now()).slice(-6)}`,
            applicationId,
            memberName: app.name,
            email: app.email,
            tier: app.tier,
            amount: plan.price,
            cadence: plan.cadence,
            status: 'Awaiting payment',
            issuedAt: new Date().toISOString(),
            checkoutToken: `cs_demo_${Math.abs(hashString(applicationId + app.email)).toString(36)}`,
        };
        setInvoices(prev => [invoice, ...prev]);
        addAuditEntry(operator, 'INVOICE_ISSUED', invoice.id, `${app.tier} membership · $${plan.price.toLocaleString()} ${plan.cadence} · sent to ${app.email}.`);
        return invoice;
    };

    const markInvoicePaid: DataContextType['markInvoicePaid'] = (invoiceId) => {
        const invoice = invoices.find(i => i.id === invoiceId);
        if (!invoice || invoice.status === 'Paid') return invoice ?? null;
        const paidAt = new Date().toISOString();
        setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: 'Paid', paidAt } : i));
        addAuditEntry('payments.webhook', 'PAYMENT_RECEIVED', invoice.id, `$${invoice.amount.toLocaleString()} received for ${invoice.tier} membership.`);
        return { ...invoice, status: 'Paid', paidAt };
    };

    // The door. Admitting someone stamps their lastAccess so the roster's
    // staleness view stays honest, and every scan is audited either way.
    const recordCheckIn: DataContextType['recordCheckIn'] = ({ subjectId, subjectKind, result, reason, gate, operator }) => {
        const member = subjectKind === 'Member' ? members.find(m => m.id === subjectId) : undefined;
        const guest = subjectKind === 'Guest' ? guests.find(g => g.id === subjectId) : undefined;
        const subject = member ?? guest;
        if (!subject) return null;

        const at = new Date().toISOString();
        const event: CheckInEvent = {
            id: `ci-${String(Date.now()).slice(-6)}`,
            subjectId,
            subjectName: subject.name,
            subjectKind,
            tier: member?.tier,
            sponsorName: guest?.sponsorName,
            result,
            reason,
            gate,
            operator,
            at,
            trustScore: subject.trustScore,
        };
        setCheckIns(prev => [event, ...prev]);
        if (result !== 'Denied' && member) {
            setMembers(prev => prev.map(m => m.id === subjectId ? { ...m, lastAccess: at } : m));
        }
        addAuditEntry(operator, `CHECKIN_${result.toUpperCase()}`, subjectId, `${gate} · ${reason}`);
        return event;
    };

    const addAuditEntry = (operator: string, action: string, targetId: string, reason: string) => {
        const base = {
            id: `ax-${Date.now().toString().slice(-6)}`,
            timestamp: new Date().toISOString(),
            operator,
            action,
            targetId,
            reason,
        };
        // Chain inside the updater so the predecessor is always the entry that
        // actually landed before this one, even under batched updates.
        setAuditLog(prev => {
            const previousHash = prev[0]?.hash ?? GENESIS;
            const entry: AuditEntry = { ...base, previousHash, hash: hashEntry(base, previousHash) };
            return [entry, ...prev];
        });
    };

    /**
     * Demo affordance: rewrite a record's reason without touching its hash,
     * exactly as an attacker editing the database would. Verification then
     * has to catch it. Nothing calls this in normal operation.
     */
    const tamperWithAuditEntry = (entryId: string) => {
        // Record the real wording here, not inside the updater — React may run
        // an updater more than once, and it has to stay free of side effects.
        const target = auditLog.find(e => e.id === entryId);
        if (target && !tamperedOriginals.current.has(entryId)) {
            tamperedOriginals.current.set(entryId, target.reason);
        }
        setAuditLog(prev => prev.map(e => e.id === entryId
            ? { ...e, reason: 'Access granted — approved by management.' }
            : e));
    };

    /** Put the original wording back and re-sign the chain. */
    const resealAuditLog = () => {
        // Snapshot before scheduling: the updater runs later, so clearing the
        // ref first would leave it empty by the time the updater reads it.
        const originals = new Map(tamperedOriginals.current);
        tamperedOriginals.current.clear();
        setAuditLog(prev => rechain(prev.map(e => {
            const original = originals.get(e.id);
            return original ? { ...e, reason: original } : e;
        })));
    };

    const approveApplication = (appId: string, operator: string, reason: string) => {
        setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'Approved' } : app));

        const app = applications.find(a => a.id === appId);
        if (app) {
            // Never derive a member id from the application number — app-001
            // would mint m-001 and collide with an existing member. Allocate
            // the next free id instead.
            const taken = new Set(members.map(m => m.id));
            let n = members.length + 1;
            let nextId = `m-${String(n).padStart(3, '0')}`;
            while (taken.has(nextId)) {
                n += 1;
                nextId = `m-${String(n).padStart(3, '0')}`;
            }
            const newMember: Member = {
                id: nextId,
                name: app.name,
                email: app.email,
                avatarUrl: app.avatarUrl,
                tier: app.tier,
                status: 'Active',
                joinDate: new Date().toISOString(),
                lastAccess: new Date().toISOString(),
                trustScore: 100 - app.riskScore,
            };
            setMembers(prev => [...prev, newMember]);
            addAuditEntry(operator, 'APPROVE_APPLICATION', appId, reason || 'Manual application approval.');
        }
    };

    const rejectApplication = (appId: string, operator: string, reason: string) => {
        setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'Rejected' } : app));
        addAuditEntry(operator, 'REJECT_APPLICATION', appId, reason || 'Manual application rejection.');
    };

    const waitlistApplication = (appId: string, operator: string, reason: string) => {
        setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'Waitlisted' } : app));
        addAuditEntry(operator, 'WAITLIST_APPLICATION', appId, reason || 'Application waitlisted.');
    };

    const requestInfoApplication = (appId: string, operator: string, reason: string) => {
        setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'NeedsInfo' } : app));
        addAuditEntry(operator, 'REQUEST_INFO', appId, reason || 'Requested additional information.');
    };

    const restrictMember = (memberId: string, operator: string, reason: string) => {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'Restricted' } : m));
        addAuditEntry(operator, 'RESTRICT_MEMBER', memberId, reason || 'Account restricted securely.');
    };

    const watchMember = (memberId: string, operator: string, reason: string) => {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'Watch' } : m));
        addAuditEntry(operator, 'WATCH_MEMBER', memberId, reason || 'Account moved to watchlist for monitoring.');
    };

    const reinstateMember = (memberId: string, operator: string, reason: string) => {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'Active' } : m));
        addAuditEntry(operator, 'REINSTATE_MEMBER', memberId, reason || 'Account reinstated securely.');
    };

    const approveOpportunity = (id: string, operator: string, reason: string) => {
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: 'Approved' } : o));
        addAuditEntry(operator, 'APPROVE_OPPORTUNITY', id, reason || 'Revenue opportunity enacted.');
    };

    const dismissOpportunity = (id: string, operator: string, reason: string) => {
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: 'Dismissed' } : o));
        addAuditEntry(operator, 'DISMISS_OPPORTUNITY', id, reason || 'Revenue opportunity dismissed.');
    };

    const dismissAnomaly = (id: string, operator: string) => {
        setAnomalies(prev => prev.filter(a => a.id !== id));
        addAuditEntry(operator, 'DISMISS_ANOMALY', id, 'Cleared access anomaly from queue.');
    };

    const addMember = (member: Member, operator: string) => {
        setMembers(prev => [...prev, member]);
        addAuditEntry(operator, 'ADD_MEMBER', member.id, 'Directory manual add member.');
    };

    const issueGuestPass = (guestId: string, operator: string, reason: string) => {
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, status: 'Approved' } : g));
        addAuditEntry(operator, 'ISSUE_GUEST_PASS', guestId, reason || 'Guest pass issued after vetting.');
    };

    // Public application intake from the landing page. Risk is scored on arrival;
    // payment is only collected after vetting clears, so no payment data lives here.
    const addApplication: DataContextType['addApplication'] = ({ name, email, tier, referralId }) => {
        const id = `app-${String(Date.now()).slice(-6)}`;
        let riskScore = 12;
        if (/temp-mail|scam|mailinator|guerrilla/i.test(email)) riskScore += 45;
        if (referralId && !members.some(m => m.id === referralId)) riskScore += 20;
        if (referralId && members.some(m => m.id === referralId)) riskScore -= 5;
        const app: Application = {
            id, name, email,
            avatarUrl: '',
            tier,
            appliedDate: new Date().toISOString(),
            status: 'Pending',
            riskScore: Math.max(1, Math.min(99, riskScore)),
        };
        setApplications(prev => [app, ...prev]);
        addAuditEntry('public.intake', 'APPLICATION_RECEIVED', id, `Membership application received for ${tier} tier${referralId ? ` · referred by ${referralId}` : ''}.`);
        return app;
    };

    // A member sponsoring a guest from the portal creates the same vetting task
    // the front desk sees — one queue, whoever it came from.
    const sponsorGuest: DataContextType['sponsorGuest'] = ({ name, sponsorId, sponsorName }) => {
        const sponsor = members.find(m => m.id === sponsorId);
        const guest: Guest = {
            id: `gp-${String(Date.now()).slice(-4)}`,
            name,
            sponsorId,
            sponsorName,
            requestedAt: new Date().toISOString(),
            status: 'Pending',
            // A guest inherits some standing from who vouched for them, but must
            // still clear their own checks before a pass is issued.
            trustScore: Math.max(30, Math.min(75, Math.round((sponsor?.trustScore ?? 60) * 0.7))),
            checks: { idVerified: false, billingCurrent: true, backgroundClear: false },
        };
        setGuests(prev => [guest, ...prev]);
        addAuditEntry(`member.${sponsorName}`, 'GUEST_SPONSORED', guest.id, `${sponsorName} sponsored ${name} — awaiting vetting.`);
        return guest;
    };

    // A member writing in from the portal creates the same thread the ops
    // Inbox works from — one queue, whichever side it came from.
    const openThread: DataContextType['openThread'] = ({ subject, body, memberId, memberName, avatarUrl }) => {
        const thread: MessageThread = {
            id: `th-${String(Date.now()).slice(-5)}`,
            subject,
            kind: 'Member',
            participantId: memberId,
            participantName: memberName,
            participantAvatar: avatarUrl,
            unread: true,
            messages: [{
                id: `msg-${String(Date.now()).slice(-5)}`,
                from: 'member',
                authorName: memberName,
                body,
                at: new Date().toISOString(),
            }],
        };
        setThreads(prev => [thread, ...prev]);
        addAuditEntry(`member.${memberName}`, 'MEMBER_MESSAGE', thread.id, subject);
        return thread;
    };

    const replyToThread = (threadId: string, operator: string, body: string) => {
        setThreads(prev => prev.map(t => t.id === threadId ? {
            ...t,
            unread: false,
            messages: [...t.messages, {
                id: `msg-${String(Date.now()).slice(-6)}`,
                from: 'ops' as const,
                authorName: operator,
                body,
                at: new Date().toISOString(),
            }],
        } : t));
        addAuditEntry(operator, 'MESSAGE_SENT', threadId, 'Reply sent from the Inbox.');
    };

    const markThreadRead = (threadId: string) => {
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unread: false } : t));
    };

    const denyGuest = (guestId: string, operator: string, reason: string) => {
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, status: 'Denied' } : g));
        addAuditEntry(operator, 'DENY_GUEST', guestId, reason || 'Guest request denied at vetting.');
    };

    return (
        <DataContext.Provider value={{
            members, applications, opportunities, anomalies, auditLog, bookings, guests, threads, checkIns,
            approveApplication, rejectApplication, waitlistApplication, requestInfoApplication,
            restrictMember, watchMember, reinstateMember, approveOpportunity, dismissOpportunity,
            dismissAnomaly, addMember, issueGuestPass, denyGuest, addAuditEntry,
            addApplication, replyToThread, markThreadRead, tamperWithAuditEntry, resealAuditLog, resetDemoData, recordCheckIn, backend, hydrated, sponsorGuest, openThread, invoices, issueInvoice, markInvoicePaid, expenses, addExpense
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
