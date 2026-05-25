export type MembershipTier = 'Founder' | 'Suite' | 'Associate';
export type MemberStatus = 'Active' | 'Watch' | 'Restricted' | 'Pending' | 'Removed';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Member {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    tier: MembershipTier;
    status: MemberStatus;
    joinDate: string;
    lastAccess: string;
    trustScore: number; // 0-100
    referralId?: string; // Who referred them
}

export interface Application {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    tier: MembershipTier;
    appliedDate: string;
    status: 'Pending' | 'Approved' | 'Waitlisted' | 'Rejected' | 'NeedsInfo';
    riskScore: number;
}

export interface RiskSignal {
    id: string;
    name: string;
    value: string | number;
    confidence: number; // 0-1
    impact: 'Positive' | 'Negative' | 'Neutral';
    reasoning: string;
    provenance: string; // Source e.g. "IdentityService", "ImageAnalysis"
}

export interface AccessAnomaly {
    id: string;
    memberId: string;
    type: 'ConcurrentUse' | 'OffHours' | 'GuestSpike' | 'CredentialSharing';
    timestamp: string;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
    isResolved: boolean;
}

export interface RevenueOpportunity {
    id: string;
    title: string;
    gap: string;
    evidence: string;
    projectedUpside: number;
    assumptions: string;
    action: string;
    status: 'Open' | 'Approved' | 'Dismissed';
}

export interface AuditEntry {
    id: string;
    timestamp: string;
    operator: string;
    action: string;
    targetId: string;
    reason: string;
    hash: string;
    previousHash: string;
}

export interface Suite {
    id: string;
    name: string;
    capacity: number;
    basePrice: number;
}

export interface Booking {
    id: string;
    memberId: string;
    suiteId: string;
    date: string;
    startTime: string;
    duration: number; // hours
    partySize: number;
    amount: number;
    status: 'Completed' | 'Upcoming' | 'Refunded' | 'NoShow';
}
