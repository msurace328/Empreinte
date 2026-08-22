import { Member, Application, AccessAnomaly, RevenueOpportunity, AuditEntry, Suite, Booking, Guest, MessageThread, Expense } from '../types';


const baseMembers: Member[] = [
    {
        id: 'm-001',
        name: 'Kevin Balfe',
        email: 'kevin@balfe-holdings.com',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        tier: 'Founder',
        status: 'Active',
        joinDate: '2025-01-15T09:00:00Z',
        lastAccess: '2026-05-24T22:15:00Z',
        trustScore: 98,
    },
    {
        id: 'm-002',
        name: 'Elena Vance',
        email: 'elena.vance@vanguard.io',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        tier: 'Suite',
        status: 'Active',
        joinDate: '2025-03-10T11:00:00Z',
        lastAccess: '2026-05-25T01:30:00Z',
        trustScore: 92,
        referralId: 'm-001',
    },
    {
        id: 'm-003',
        name: 'Julian Thorne',
        email: 'j.thorne@apex.com',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        tier: 'Associate',
        status: 'Watch',
        joinDate: '2025-11-20T14:00:00Z',
        lastAccess: '2026-05-25T03:45:00Z',
        trustScore: 64,
    },
    // Adding more members for the "Power Cohort" story
    ...Array.from({ length: 15 }).map((_, i) => ({
        id: `m-pc-${i}`,
        name: `Growth Member ${101 + i}`,
        email: `member${i}@example.com`,
        avatarUrl: '',
        tier: 'Associate' as const,
        status: 'Active' as const,
        joinDate: '2025-12-01T10:00:00Z',
        lastAccess: '2026-05-24T18:00:00Z',
        trustScore: 85,
    })),
];


// A real circular-vouching ring: three accounts that vouch for each other in a
// closed loop, with no outside referrer. This is what the graph engine detects.
export const ringMembers: Member[] = [
    {
        id: 'm-101', name: 'Dorian Vale', email: 'd.vale@meridian-consult.co',
        avatarUrl: '', tier: 'Associate', status: 'Watch',
        joinDate: '2026-02-03T10:00:00Z', lastAccess: '2026-05-21T21:40:00Z',
        trustScore: 38, referralId: 'm-103',
    },
    {
        id: 'm-102', name: 'Sable Ruiz', email: 's.ruiz@meridian-consult.co',
        avatarUrl: '', tier: 'Associate', status: 'Watch',
        joinDate: '2026-02-05T10:00:00Z', lastAccess: '2026-05-20T20:05:00Z',
        trustScore: 35, referralId: 'm-101',
    },
    {
        id: 'm-103', name: 'Cassius Bright', email: 'c.bright@meridian-consult.co',
        avatarUrl: '', tier: 'Associate', status: 'Watch',
        joinDate: '2026-02-06T10:00:00Z', lastAccess: '2026-05-19T19:15:00Z',
        trustScore: 41, referralId: 'm-102',
    },
];

export const initialMembers: Member[] = [...baseMembers, ...ringMembers];

export const initialApplications: Application[] = [
    {
        id: 'app-001',
        name: 'Marcus Kaine',
        email: 'm.kaine@temp-mail.ai',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        tier: 'Suite',
        appliedDate: '2026-05-24T10:20:00Z',
        status: 'Pending',
        riskScore: 88,
    },
    {
        id: 'app-002',
        name: 'Sarah Drumm',
        email: 'sarah.d@corp.com',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988bad1fa?auto=format&fit=crop&q=80&w=200',
        tier: 'Associate',
        appliedDate: '2026-05-24T14:45:00Z',
        status: 'Pending',
        riskScore: 12,
    },
    {
        id: 'app-003',
        name: 'Identical Identity',
        email: 'theft@scam.com',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        tier: 'Founder',
        appliedDate: '2026-05-25T01:10:00Z',
        status: 'Pending',
        riskScore: 99,
    }
];

export const initialAnomalies: AccessAnomaly[] = [
    {
        id: 'an-001',
        memberId: 'm-003',
        type: 'ConcurrentUse',
        timestamp: '2026-05-25T03:50:00Z',
        severity: 'High',
        description: 'Credential used simultaneously in London and NYC.',
        isResolved: false,
    },
    {
        id: 'an-002',
        memberId: 'm-003',
        type: 'GuestSpike',
        timestamp: '2026-05-24T23:00:00Z',
        severity: 'Medium',
        description: '12 guest registrations in a 2-hour window.',
        isResolved: false,
    }
];

export const initialOpportunities: RevenueOpportunity[] = [
    {
        id: 'opp-001',
        title: 'Midweek Optimization',
        gap: 'The Zenith Loft (Suite A) is at 12% occupancy every Tuesday.',
        evidence: 'Historical booking data over the last 90 days show consistent Tuesday troughs.',
        projectedUpside: 45000,
        assumptions: '15% increase in Tuesday occupancy via member guest credits.',
        action: 'Launch Midweek Guest Pass campaign for Founder members.',
        status: 'Open',
    },
    {
        id: 'opp-002',
        title: 'Tier Upgrade Campaign',
        gap: 'A cohort of 12 Associate members book suites with Suite-level frequency.',
        evidence: 'High-frequency booking pattern (5+ bookings/qtr) among Associate members.',
        projectedUpside: 72000,
        assumptions: '60% conversion rate of target cohort to Suite tier.',
        action: 'Automated Suite Upgrade invitation with 1st month waived.',
        status: 'Open',
    }
];

export const initialAuditLog: AuditEntry[] = [
    {
        id: 'log-001',
        timestamp: '2026-05-24T09:00:00Z',
        operator: 'Director.Vance',
        action: 'RESTRICT_MEMBER',
        targetId: 'm-003',
        reason: 'Flagged for credential sharing anomaly.',
        hash: '8f2a1b...',
        previousHash: '000000...',
    },
    {
        id: 'log-002',
        timestamp: '2026-05-24T10:00:00Z',
        operator: 'Admin.Sterling',
        action: 'REJECT_APPLICATION',
        targetId: 'app-fraud-x',
        reason: 'Synthetic identity detected (AI photo + Disposable phone).',
        hash: '3c4d5e...',
        previousHash: '8f2a1b...',
    }
];

export const initialSuites: Suite[] = [
    { id: 's-001', name: 'The Zenith Loft', capacity: 12, basePrice: 2500 },
    { id: 's-002', name: 'The Obsidian Room', capacity: 6, basePrice: 1200 },
    { id: 's-003', name: 'Skyline Terrace', capacity: 25, basePrice: 5000 },
];

export const initialBookings: Booking[] = [
    // Seeding some history for revenue graphs
    ...Array.from({ length: 40 }).map((_, i) => ({
        id: `b-${i}`,
        memberId: i % 3 === 0 ? 'm-001' : (i % 3 === 1 ? 'm-002' : 'm-003'),
        suiteId: `s-00${(i % 3) + 1}`,
        date: `2026-05-${Math.max(1, 25 - Math.floor(i / 2))}`.padStart(10, '0'),
        startTime: '19:00',
        duration: 4,
        partySize: 4 + (i % 5),
        amount: 1200 + (i * 100),
        status: 'Completed' as const,
    }))
];

export const initialGuests: Guest[] = [
    {
        id: 'gp-3308',
        name: 'Jordan Bell',
        sponsorId: 'm-002',
        sponsorName: 'Elena Vance',
        requestedAt: '2026-05-25T08:04:00Z',
        status: 'Pending',
        trustScore: 81,
        checks: { idVerified: true, billingCurrent: true, backgroundClear: false },
    },
    {
        id: 'gp-3309',
        name: 'Nia Okafor',
        sponsorId: 'm-001',
        sponsorName: 'Kevin Balfe',
        requestedAt: '2026-05-25T07:31:00Z',
        status: 'Pending',
        trustScore: 58,
        checks: { idVerified: false, billingCurrent: true, backgroundClear: false },
    },
    {
        id: 'gp-3310',
        name: 'Priya Anand',
        sponsorId: 'm-002',
        sponsorName: 'Elena Vance',
        requestedAt: '2026-05-24T19:10:00Z',
        status: 'Approved',
        trustScore: 90,
        checks: { idVerified: true, billingCurrent: true, backgroundClear: true },
    },
];

export const initialThreads: MessageThread[] = [
    {
        id: 'th-001',
        subject: 'Suite upgrade for the June 20 fixture',
        kind: 'Member',
        participantId: 'm-002',
        participantName: 'Elena Vance',
        participantAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        unread: true,
        messages: [
            { id: 'msg-001', from: 'member', authorName: 'Elena Vance', body: 'Hi — I have the Obsidian Room for ARENA vs Northside on June 20, but my party grew to 11. Can I move up to the Zenith Loft if it is open? Happy to cover the difference.', at: '2026-05-25T09:12:00Z' },
        ],
    },
    {
        id: 'th-002',
        subject: 'Guest pass still pending — Jordan Bell',
        kind: 'Guest',
        participantId: 'm-002',
        participantName: 'Elena Vance',
        participantAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        unread: true,
        messages: [
            { id: 'msg-002', from: 'member', authorName: 'Elena Vance', body: 'I sponsored Jordan Bell for a guest pass last week and it still shows pending. He is flying in for the concert Friday — anything holding it up on your side?', at: '2026-05-25T08:40:00Z' },
            { id: 'msg-003', from: 'ops', authorName: 'Operator Seven', body: 'Thanks Elena — his background check is still processing with the vendor. We will chase it today and confirm before Thursday noon.', at: '2026-05-25T08:55:00Z' },
        ],
    },
    {
        id: 'th-003',
        subject: 'Question about my billing hold',
        kind: 'Member',
        participantId: 'm-003',
        participantName: 'Julian Thorne',
        participantAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        unread: false,
        messages: [
            { id: 'msg-004', from: 'member', authorName: 'Julian Thorne', body: 'My card was declined for the season renewal and now my access badge reads limited. What do I need to clear this?', at: '2026-05-24T16:20:00Z' },
            { id: 'msg-005', from: 'ops', authorName: 'Elena Vance', body: 'Julian, your account is on a temporary watch while billing reconciles. Update the card on file and access is restored automatically once the payment clears.', at: '2026-05-24T17:05:00Z' },
        ],
    },
    {
        id: 'th-004',
        subject: 'Nightly digest · 2 anomalies, 3 applications',
        kind: 'System',
        participantName: 'Empreinte Sentinel',
        unread: false,
        messages: [
            { id: 'msg-006', from: 'member', authorName: 'Empreinte Sentinel', body: 'Overnight summary: 2 access anomalies flagged (1 high severity), 3 applications awaiting review, 1 guest pass issued. Trust-Health Index steady at 96.4%.', at: '2026-05-25T06:00:00Z' },
        ],
    },
];

// A season's worth of operating costs for a premium suite business. Amounts are
// illustrative; categories and deductible rates follow common US treatment.
export const initialExpenses: Expense[] = [
    { id: 'ex-001', date: '2026-01-08T00:00:00Z', vendor: 'Northside Facilities LLC', description: 'Suite level lease — Q1', amount: 148000, category: 'Rent & Facilities', deductibleRate: 1, receipt: true, method: 'ACH' },
    { id: 'ex-002', date: '2026-01-15T00:00:00Z', vendor: 'Commonwealth Power', description: 'Utilities — January', amount: 9840, category: 'Utilities', deductibleRate: 1, receipt: true, method: 'ACH' },
    { id: 'ex-003', date: '2026-01-31T00:00:00Z', vendor: 'Payroll — hospitality staff', description: 'Suite hosts, front desk, security (12 FTE)', amount: 212400, category: 'Payroll & Contractors', deductibleRate: 1, receipt: true, method: 'ACH' },
    { id: 'ex-004', date: '2026-02-03T00:00:00Z', vendor: 'Harborline Catering', description: 'In-suite catering — Jan fixtures', amount: 68200, category: 'Food & Beverage', deductibleRate: 0.5, reviewNote: 'Client-entertainment meals are commonly limited to 50%. Confirm which portion is staff meals — treatment differs.', receipt: true, method: 'Card' },
    { id: 'ex-005', date: '2026-02-10T00:00:00Z', vendor: 'Meridian Risk', description: 'General liability & liquor liability premium', amount: 44500, category: 'Insurance', deductibleRate: 1, receipt: true, method: 'ACH' },
    { id: 'ex-006', date: '2026-02-14T00:00:00Z', vendor: 'Empreinte Platform', description: 'Trust & access platform — annual', amount: 36000, category: 'Software & Technology', deductibleRate: 1, receipt: true, method: 'Card' },
    { id: 'ex-007', date: '2026-02-22T00:00:00Z', vendor: 'Sable & Roe LLP', description: 'Membership agreement redraft', amount: 18750, category: 'Professional Services', deductibleRate: 1, receipt: true, method: 'Check' },
    { id: 'ex-008', date: '2026-03-02T00:00:00Z', vendor: 'Vantage Displays', description: 'Suite AV refresh — 3 suites', amount: 92000, category: 'Equipment & Depreciation', deductibleRate: 1, reviewNote: 'Capital purchase. May qualify for first-year expensing rather than multi-year depreciation — ask your accountant which is better for this year.', receipt: true, method: 'ACH' },
    { id: 'ex-009', date: '2026-03-11T00:00:00Z', vendor: 'Fieldhouse Media', description: 'Season campaign — digital & print', amount: 54300, category: 'Marketing & Advertising', deductibleRate: 1, receipt: true, method: 'Card' },
    { id: 'ex-010', date: '2026-03-18T00:00:00Z', vendor: 'Stripe', description: 'Card processing fees — Q1', amount: 27900, category: 'Merchant & Bank Fees', deductibleRate: 1, receipt: true, method: 'Card' },
    { id: 'ex-011', date: '2026-04-01T00:00:00Z', vendor: 'Northside Facilities LLC', description: 'Suite level lease — Q2', amount: 148000, category: 'Rent & Facilities', deductibleRate: 1, receipt: true, method: 'ACH' },
    { id: 'ex-012', date: '2026-04-09T00:00:00Z', vendor: 'Sentinel Screening', description: 'Member background checks — 240 runs', amount: 14400, category: 'Security & Compliance', deductibleRate: 1, receipt: true, method: 'Card' },
    { id: 'ex-013', date: '2026-04-21T00:00:00Z', vendor: 'Harborline Catering', description: 'In-suite catering — Mar/Apr fixtures', amount: 81600, category: 'Food & Beverage', deductibleRate: 0.5, reviewNote: 'Same 50% question as the January invoice.', receipt: true, method: 'Card' },
    { id: 'ex-014', date: '2026-04-30T00:00:00Z', vendor: 'Payroll — hospitality staff', description: 'Suite hosts, front desk, security (12 FTE)', amount: 218900, category: 'Payroll & Contractors', deductibleRate: 1, receipt: true, method: 'ACH' },
    { id: 'ex-015', date: '2026-05-06T00:00:00Z', vendor: 'Anonymous — cash', description: 'Game-day supplies, unreceipted', amount: 3150, category: 'Other', deductibleRate: 1, reviewNote: 'No receipt on file. Unsubstantiated cash spend is the first thing an examiner pulls — attach documentation or drop the deduction.', receipt: false, method: 'Cash' },
    { id: 'ex-016', date: '2026-05-12T00:00:00Z', vendor: 'Commonwealth Power', description: 'Utilities — Feb through May', amount: 38600, category: 'Utilities', deductibleRate: 1, receipt: true, method: 'ACH' },
    { id: 'ex-017', date: '2026-05-19T00:00:00Z', vendor: 'Delta / lodging', description: 'League ops conference — 2 staff', amount: 8900, category: 'Travel', deductibleRate: 1, receipt: true, method: 'Card' },
    { id: 'ex-018', date: '2026-05-24T00:00:00Z', vendor: 'Rivera Bookkeeping', description: 'Monthly close & reconciliation', amount: 9600, category: 'Professional Services', deductibleRate: 1, receipt: true, method: 'ACH' },
];
