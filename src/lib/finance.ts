import type { Expense, ExpenseCategory, Booking, Member, MembershipTier, Guest } from '@/lib/types';

/** Season dues by tier — the same numbers the public pricing page shows. */
export const TIER_PRICE: Record<MembershipTier, number> = {
    Associate: 45000,
    Suite: 165000,
    Founder: 400000,
};

export const money = (n: number) =>
    `$${Math.round(n).toLocaleString()}`;

export const QUARTERS = [
    { key: 'Q1', label: 'Q1', months: [0, 1, 2], estDue: 'Apr 15' },
    { key: 'Q2', label: 'Q2', months: [3, 4, 5], estDue: 'Jun 15' },
    { key: 'Q3', label: 'Q3', months: [6, 7, 8], estDue: 'Sep 15' },
    { key: 'Q4', label: 'Q4', months: [9, 10, 11], estDue: 'Jan 15' },
] as const;

/**
 * Expense dates are calendar dates ('2026-01-01'), not instants. `new Date()`
 * parses those as UTC midnight, so reading the month back with getMonth() shifts
 * the date into the viewer's timezone: January 1 lands in Q4 for anyone west of
 * UTC. A quarter is a property of the date on the receipt, not of who is looking
 * at it, so read it in UTC.
 */
export function quarterOf(iso: string): string {
    const m = new Date(iso).getUTCMonth();
    return QUARTERS.find(q => (q.months as readonly number[]).includes(m))!.key;
}

export interface RevenueLine {
    stream: string;
    amount: number;
    detail: string;
}

/**
 * Recognised revenue for the season.
 *
 * Dues come from the roster rather than from invoices: an invoice is how a new
 * member is collected once, while the books need the recurring dues every
 * active membership represents. Counting both would double up.
 */
export function buildRevenue(members: Member[], bookings: Booking[], guests: Guest[] = []): RevenueLine[] {
    const paying = members.filter(m => m.status === 'Active' || m.status === 'Watch');
    const duesTotal = paying.reduce((a, m) => a + (TIER_PRICE[m.tier] ?? 0), 0);

    const booked = bookings.filter(b => b.status === 'Completed' || b.status === 'Upcoming');
    const suiteTotal = booked.reduce((a, b) => a + b.amount, 0);

    const passes = guests.filter(g => g.status === 'Approved');
    const passTotal = passes.length * 750;

    const byTier = paying.reduce<Record<string, number>>((acc, m) => {
        acc[m.tier] = (acc[m.tier] ?? 0) + 1;
        return acc;
    }, {});
    const tierDetail = Object.entries(byTier).map(([t, n]) => `${n} ${t}`).join(' · ') || 'no active memberships';

    return [
        { stream: 'Membership dues', amount: duesTotal, detail: tierDetail },
        { stream: 'Suite bookings', amount: suiteTotal, detail: `${booked.length} bookings on the season` },
        { stream: 'Guest passes', amount: passTotal, detail: `${passes.length} issued at $750` },
    ].filter(r => r.amount > 0 || r.stream === 'Membership dues');
}

export interface CategoryTotal {
    category: ExpenseCategory;
    gross: number;
    deductible: number;
    count: number;
    flagged: number;
}

export function byCategory(expenses: Expense[]): CategoryTotal[] {
    const map = new Map<ExpenseCategory, CategoryTotal>();
    for (const e of expenses) {
        const row = map.get(e.category) ?? { category: e.category, gross: 0, deductible: 0, count: 0, flagged: 0 };
        row.gross += e.amount;
        row.deductible += e.amount * e.deductibleRate;
        row.count += 1;
        if (e.reviewNote) row.flagged += 1;
        map.set(e.category, row);
    }
    return [...map.values()].sort((a, b) => b.gross - a.gross);
}

export interface Pnl {
    revenue: number;
    expensesGross: number;
    expensesDeductible: number;
    netBook: number;       // revenue - gross expenses (what the books say)
    netTaxable: number;    // revenue - deductible expenses (the return's starting point)
    margin: number;
}

export function buildPnl(revenue: RevenueLine[], expenses: Expense[]): Pnl {
    const rev = revenue.reduce((a, r) => a + r.amount, 0);
    const gross = expenses.reduce((a, e) => a + e.amount, 0);
    const deductible = expenses.reduce((a, e) => a + e.amount * e.deductibleRate, 0);
    return {
        revenue: rev,
        expensesGross: gross,
        expensesDeductible: deductible,
        netBook: rev - gross,
        netTaxable: rev - deductible,
        margin: rev ? (rev - gross) / rev : 0,
    };
}

/**
 * A set-aside estimate, not a tax computation. Real liability depends on
 * entity type, state, credits, carryforwards and prior-year safe harbours —
 * all of which belong to the filer's accountant, not to this screen.
 */
export const SET_ASIDE_RATE = 0.25;

export function quarterlyBreakdown(expenses: Expense[], revenue: number) {
    return QUARTERS.map(q => {
        const spend = expenses
            .filter(e => quarterOf(e.date) === q.key)
            .reduce((a, e) => a + e.amount, 0);
        // Revenue is spread evenly for the estimate; replace with booked dates
        // once dues carry their own recognition schedule.
        const rev = revenue / 4;
        const net = rev - spend;
        return { ...q, spend, rev, net, setAside: Math.max(0, net * SET_ASIDE_RATE) };
    });
}

export function toCsv(rows: (string | number)[][]): string {
    return rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, "'")}"`).join(',')).join('\n');
}
