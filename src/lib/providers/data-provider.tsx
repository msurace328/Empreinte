"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Member, Application, RiskSignal, AccessAnomaly, RevenueOpportunity, AuditEntry, Booking, Guest, MessageThread, CheckInEvent, CheckInResult } from '@/lib/types';
import { initialMembers, initialApplications, initialOpportunities, initialAnomalies, initialAuditLog, initialBookings, initialSuites, initialGuests, initialThreads } from '@/lib/services/seed-data';

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
    addApplication: (input: { name: string; email: string; tier: Application['tier']; referralId?: string }) => Application;
    replyToThread: (threadId: string, operator: string, body: string) => void;
    markThreadRead: (threadId: string) => void;
    resetDemoData: () => void;
    recordCheckIn: (input: {
        subjectId: string; subjectKind: 'Member' | 'Guest'; result: CheckInResult;
        reason: string; gate: string; operator: string;
    }) => CheckInEvent | null;
}

const STORE_KEY = 'empreinte_session_v1';

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [opportunities, setOpportunities] = useState<RevenueOpportunity[]>(initialOpportunities);
    const [anomalies, setAnomalies] = useState<AccessAnomaly[]>(initialAnomalies);
    const [auditLog, setAuditLog] = useState<AuditEntry[]>(initialAuditLog);
    const [bookings] = useState<Booking[]>(initialBookings);
    const [guests, setGuests] = useState<Guest[]>(initialGuests);
    const [threads, setThreads] = useState<MessageThread[]>(initialThreads);
    const [checkIns, setCheckIns] = useState<CheckInEvent[]>([]);
    const [hydrated, setHydrated] = useState(false);

    // Restore the session on mount, then keep it in sync. Seeded defaults are
    // used whenever nothing has been stored yet.
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (raw) {
                const snap = JSON.parse(raw);
                if (snap.members) setMembers(snap.members);
                if (snap.applications) setApplications(snap.applications);
                if (snap.opportunities) setOpportunities(snap.opportunities);
                if (snap.anomalies) setAnomalies(snap.anomalies);
                if (snap.auditLog) setAuditLog(snap.auditLog);
                if (snap.guests) setGuests(snap.guests);
                if (snap.threads) setThreads(snap.threads);
                if (snap.checkIns) setCheckIns(snap.checkIns);
            }
        } catch {
            // Corrupt or unavailable storage just falls back to seed data.
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify({
                members, applications, opportunities, anomalies, auditLog, guests, threads, checkIns,
            }));
        } catch {
            // Quota or private-mode failures are non-fatal; the session just stops persisting.
        }
    }, [hydrated, members, applications, opportunities, anomalies, auditLog, guests, threads, checkIns]);

    const resetDemoData = () => {
        try { localStorage.removeItem(STORE_KEY); } catch {}
        setMembers(initialMembers);
        setApplications(initialApplications);
        setOpportunities(initialOpportunities);
        setAnomalies(initialAnomalies);
        setAuditLog(initialAuditLog);
        setGuests(initialGuests);
        setThreads(initialThreads);
        setCheckIns([]);
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
        const entry: AuditEntry = {
            id: `ax-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString(),
            operator,
            action,
            targetId,
            reason,
            hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`, previousHash: `0x000000`
        };
        setAuditLog(prev => [entry, ...prev]);
    };

    const approveApplication = (appId: string, operator: string, reason: string) => {
        setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'Approved' } : app));

        const app = applications.find(a => a.id === appId);
        if (app) {
            const newMember: Member = {
                id: `m-${app.id.split('-')[1]}`,
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
            addApplication, replyToThread, markThreadRead, resetDemoData, recordCheckIn
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
