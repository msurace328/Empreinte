import test from 'node:test';
import assert from 'node:assert/strict';
import type { Expense } from '../types.ts';
import {
    quarterOf, buildPnl, byCategory, toCsv, quarterlyBreakdown,
    SET_ASIDE_RATE, TIER_PRICE, money,
} from '../finance.ts';

const expense = (over: Partial<Expense> = {}): Expense => ({
    id: 'e1',
    date: '2026-02-10',
    vendor: 'Vendor',
    description: 'Line item',
    amount: 1000,
    category: 'Software & Technology',
    deductibleRate: 1,
    receipt: true,
    method: 'Card',
    ...over,
});

test('quarterOf maps every month to the right quarter', () => {
    const expected = ['Q1','Q1','Q1','Q2','Q2','Q2','Q3','Q3','Q3','Q4','Q4','Q4'];
    expected.forEach((q, i) => {
        const month = String(i + 1).padStart(2, '0');
        assert.equal(quarterOf(`2026-${month}-15`), q, `month ${month}`);
    });
});

test('quarterOf holds at the year boundaries', () => {
    assert.equal(quarterOf('2026-01-01'), 'Q1');
    assert.equal(quarterOf('2026-12-31'), 'Q4');
});

test('buildPnl separates what the books say from what the return starts at', () => {
    const revenue = [{ stream: 'Dues', amount: 100000, detail: '' }];
    const expenses = [
        expense({ amount: 10000, deductibleRate: 1 }),
        expense({ id: 'e2', amount: 4000, deductibleRate: 0.5 }), // meals, commonly limited
    ];

    const pnl = buildPnl(revenue, expenses);
    assert.equal(pnl.revenue, 100000);
    assert.equal(pnl.expensesGross, 14000);
    assert.equal(pnl.expensesDeductible, 12000);
    assert.equal(pnl.netBook, 86000, 'book net uses gross spend');
    assert.equal(pnl.netTaxable, 88000, 'taxable net uses the deductible portion');
});

test('buildPnl does not divide by zero on a year with no revenue', () => {
    const pnl = buildPnl([], [expense({ amount: 500 })]);
    assert.equal(pnl.margin, 0);
    assert.equal(pnl.netBook, -500);
});

test('byCategory groups by category and keeps gross and deductible apart', () => {
    const totals = byCategory([
        expense({ amount: 100, deductibleRate: 1 }),
        expense({ id: 'e2', amount: 250, deductibleRate: 0.5 }),
        expense({ id: 'e3', amount: 400, category: 'Travel' }),
    ]);

    const ops = totals.find(t => t.category === 'Software & Technology')!;
    assert.equal(ops.gross, 350);
    assert.equal(ops.deductible, 225, 'deductible applies each line rate, not the total');
    assert.equal(ops.count, 2);
    assert.equal(ops.flagged, 0);
});

test('byCategory counts lines an accountant needs to look at', () => {
    const totals = byCategory([
        expense({ amount: 100 }),
        expense({ id: 'e2', amount: 200, reviewNote: 'capital purchase, may qualify for first-year expensing' }),
    ]);
    assert.equal(totals[0].flagged, 1);
});

test('byCategory sorts the biggest spend first', () => {
    const totals = byCategory([
        expense({ amount: 100, category: 'Software & Technology' }),
        expense({ id: 'e2', amount: 900, category: 'Travel' }),
    ]);
    assert.equal(totals[0].category, 'Travel');
});

test('quarterlyBreakdown never suggests setting aside on a loss', () => {
    const heavyQ1 = [expense({ date: '2026-02-01', amount: 1_000_000 })];
    const rows = quarterlyBreakdown(heavyQ1, 100000);
    const q1 = rows.find(r => r.key === 'Q1')!;
    assert.ok(q1.net < 0, 'Q1 should be a loss in this fixture');
    assert.equal(q1.setAside, 0, 'a loss must not generate a set-aside');
    rows.forEach(r => assert.ok(r.setAside >= 0, `${r.key} set-aside must not be negative`));
});

test('quarterlyBreakdown applies the stated set-aside rate to a profit', () => {
    const rows = quarterlyBreakdown([], 400000);
    const q1 = rows.find(r => r.key === 'Q1')!;
    assert.equal(q1.rev, 100000, 'revenue is spread evenly across four quarters');
    assert.equal(q1.setAside, 100000 * SET_ASIDE_RATE);
});

test('toCsv neutralises quotes so a field cannot break out of its column', () => {
    const csv = toCsv([['Dinner with "the board"', 250]]);
    assert.equal(csv, `"Dinner with 'the board'",\"250\"`.replace(/\\"/g, '"'));
    assert.ok(!csv.includes('""'), 'no unescaped double quote may survive');
});

test('toCsv renders null and undefined as empty cells', () => {
    const csv = toCsv([[null as unknown as string, undefined as unknown as string]]);
    assert.equal(csv, '"",""');
});

test('tier pricing is the single source of truth and is internally ordered', () => {
    assert.ok(TIER_PRICE.Associate < TIER_PRICE.Suite);
    assert.ok(TIER_PRICE.Suite < TIER_PRICE.Founder);
});

test('money rounds rather than truncating', () => {
    assert.equal(money(1000.4), '$1,000');
    assert.equal(money(1000.6), '$1,001');
});
