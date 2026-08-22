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

export type GuestStatus = 'Pending' | 'Approved' | 'Denied';

export interface Guest {
    id: string;
    name: string;
    sponsorId: string;      // member who vouched
    sponsorName: string;
    requestedAt: string;
    status: GuestStatus;
    trustScore: number;     // 0-100
    checks: {
        idVerified: boolean;
        billingCurrent: boolean;
        backgroundClear: boolean;
    };
}

export interface ThreadMessage {
    id: string;
    from: 'member' | 'ops';
    authorName: string;
    body: string;
    at: string;
}

export interface MessageThread {
    id: string;
    subject: string;
    kind: 'Member' | 'Guest' | 'System';
    participantId?: string;   // links the thread to a member/guest identity
    participantName: string;
    participantAvatar?: string;
    unread: boolean;
    messages: ThreadMessage[];
}

export type CheckInResult = 'Admitted' | 'Denied' | 'Override';

export interface CheckInEvent {
    id: string;
    subjectId: string;          // member or guest id
    subjectName: string;
    subjectKind: 'Member' | 'Guest';
    tier?: MembershipTier;
    sponsorName?: string;       // for guests
    result: CheckInResult;
    reason: string;
    gate: string;
    operator: string;
    at: string;
    trustScore: number;
}

export type InvoiceStatus = 'Awaiting payment' | 'Paid' | 'Void';

export interface Invoice {
    id: string;
    applicationId: string;
    memberName: string;
    email: string;
    tier: MembershipTier;
    amount: number;          // in whole dollars
    cadence: string;
    status: InvoiceStatus;
    issuedAt: string;
    paidAt?: string;
    checkoutToken: string;   // stands in for a Stripe Checkout Session id
}

/**
 * Bookkeeping. Categories mirror the expense lines a US business return
 * generally asks for, so the ledger exports in a shape an accountant expects.
 */
export type ExpenseCategory =
    | 'Payroll & Contractors'
    | 'Rent & Facilities'
    | 'Utilities'
    | 'Insurance'
    | 'Food & Beverage'
    | 'Marketing & Advertising'
    | 'Software & Technology'
    | 'Professional Services'
    | 'Equipment & Depreciation'
    | 'Travel'
    | 'Merchant & Bank Fees'
    | 'Security & Compliance'
    | 'Other';

export type RevenueStream = 'Membership dues' | 'Suite bookings' | 'Guest passes' | 'Food & beverage';

export interface Expense {
    id: string;
    date: string;
    vendor: string;
    description: string;
    amount: number;
    category: ExpenseCategory;
    /** Portion generally deductible for this category, 0–1. Meals are commonly limited. */
    deductibleRate: number;
    /** Set when the line needs a human decision before filing. */
    reviewNote?: string;
    receipt: boolean;
    method: 'Card' | 'ACH' | 'Check' | 'Cash';
}
