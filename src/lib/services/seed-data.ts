import { Member, Application, AccessAnomaly, RevenueOpportunity, AuditEntry, Suite, Booking, Guest } from '../types';


export const initialMembers: Member[] = [
    {
        id: 'm-001',
        name: 'Alexander Sterling',
        email: 'alex@sterling-holdings.com',
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
        name:
