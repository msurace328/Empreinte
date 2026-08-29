import { UserRole } from '@/hooks/use-auth';

export interface NavItem {
    title: string;
    href: string;
    roles: UserRole[];
}

/**
 * Single source of truth for what each desk can reach. The sidebar renders
 * from this, the command palette filters on it, and the Security page reads
 * it to describe each role — so the documented permissions cannot drift from
 * the enforced ones.
 */
export const NAV_ITEMS: NavItem[] = [
    { title: 'Command Center', href: '/admin', roles: ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'] },
    { title: 'Door Console', href: '/admin/door', roles: ['Admin', 'MembershipDirector', 'FrontDesk'] },
    { title: 'Review Queue', href: '/admin/applications', roles: ['Admin', 'MembershipDirector'] },
    { title: 'Members', href: '/admin/members', roles: ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'] },
    { title: 'Inbox', href: '/admin/inbox', roles: ['Admin', 'MembershipDirector', 'FrontDesk'] },
    { title: 'Access & Guests', href: '/admin/access', roles: ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'] },
    { title: 'Suites & Game-Day', href: '/admin/suites', roles: ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'] },
    { title: 'Member Graph', href: '/admin/graph', roles: ['Admin', 'MembershipDirector', 'Auditor'] },
    { title: 'Revenue Intel', href: '/admin/revenue', roles: ['Admin', 'MembershipDirector'] },
    { title: 'Books & Tax', href: '/admin/books', roles: ['Admin'] },
    { title: 'Audit Log', href: '/admin/audit', roles: ['Admin', 'Auditor'] },
    { title: 'Security', href: '/admin/settings', roles: ['Admin'] },
];

export const ROLE_LABELS: Record<UserRole, string> = {
    Admin: 'Admin',
    MembershipDirector: 'Membership Director',
    FrontDesk: 'Front-desk Operator',
    Auditor: 'Auditor',
    Member: 'Member',
};

/** What a role can and cannot open, straight from the enforced config. */
export function permissionsFor(role: UserRole) {
    const allowed = NAV_ITEMS.filter(i => i.roles.includes(role));
    const denied = NAV_ITEMS.filter(i => !i.roles.includes(role));
    return { allowed, denied };
}

/** Extra capabilities that are not simply "can open this page". */
export const ROLE_CAPABILITIES: Record<UserRole, string[]> = {
    Admin: ['Approve and reject applications', 'Restrict, watchlist, and reinstate members', 'Issue and void invoices', 'Record expenses and export the accountant pack', 'Verify and re-seal the audit chain'],
    MembershipDirector: ['Approve and reject applications', 'Restrict, watchlist, and reinstate members', 'Issue guest passes', 'Read the audit log'],
    FrontDesk: ['Admit, deny, and override at the door', 'Issue and deny guest passes', 'Read basic member profiles'],
    Auditor: ['Read every record', 'Verify the audit chain', 'No write access of any kind'],
    Member: ['Book suites', 'Sponsor guests', 'See their own standing'],
};
