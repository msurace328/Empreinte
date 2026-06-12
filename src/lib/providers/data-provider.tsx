"use client";

import React, { createContext, useContext, useState } from 'react';
import { Member, Application, RiskSignal, AccessAnomaly, RevenueOpportunity, AuditEntry, Booking, Guest } from '@/lib/types';
import { initialMembers, initialApplications, initialOpportunities, initialAnomalies, initialAuditLog, initialBookings, initialSuites, initialGuests } from '@/lib/services/seed-data';

interface DataContextType {
    members: Member[];
    applications: Application[];
    opportunities: RevenueOpportunity[];
    anomalies: AccessAnomaly[];
    auditLog: AuditEntry[];
    bookings: Booking[];
    guests: Guest[];

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [opportunities, setOpportunities] = useState<RevenueOpportunity[]>(initialOpportunities);
    const [anomalies, setAnomalies] = useState<AccessAnomaly[]>(initialAnomalies);
    const [auditLog, setAuditLog] = useState<AuditEntry[]>(initialAuditLog);
    const [bookings] = useState<Booking[]>(initialBookings);
    const [guests, setGuests] = useState<Guest[]>(initialGuests);

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

    const denyGuest = (guestId: string, operator: string, reason: string) => {
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, status: 'Denied' } : g));
        addAuditEntry(operator, 'DENY_GUEST', guestId, reason || 'Guest request denied at vetting.');
    };

    return (
        <DataContext.Provider value={{
            members, applications, opportunities, anomalies, auditLog, bookings, guests,
            approveApplication, rejectApplication, waitlistApplication, requestInfoApplication,
            restrictMember, watchMember, reinstateMember, approveOpportunity, dismissOpportunity,
            dismissAnomaly, addMember, issueGuestPass, denyGuest, addAuditEntry
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
