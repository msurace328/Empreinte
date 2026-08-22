"use client";
import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ExpenseCategory } from '@/lib/types';
import {
    buildRevenue, buildPnl, byCategory, quarterlyBreakdown, money, toCsv, SET_ASIDE_RATE, quarterOf,
} from '@/lib/finance';
import {
    Download, TriangleAlert, Receipt, Plus, Info, FileSpreadsheet, PiggyBank, CalendarClock, CheckCircle2,
} from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = [
    'Payroll & Contractors', 'Rent & Facilities', 'Utilities', 'Insurance', 'Food & Beverage',
    'Marketing & Advertising', 'Software & Technology', 'Professional Services',
    'Equipment & Depreciation', 'Travel', 'Merchant & Bank Fees', 'Security & Compliance', 'Other',
];

// Categories with a non-obvious deductible portion get a default here so a new
// line is categorised correctly the moment it is entered.
const DEFAULT_RATE: Partial<Record<ExpenseCategory, number>> = { 'Food & Beverage': 0.5 };

export default function BooksPage() {
    const { members, bookings, guests, expenses, addExpense } = useData();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState({
        vendor: '', description: '', amount: '', category: 'Other' as ExpenseCategory, receipt: true,
    });

    const operator = user ? `${user.role}.${user.name.split(' ').pop()}` : 'operator';

    const revenue = useMemo(() => buildRevenue(members, bookings, guests), [members, bookings, guests]);
    const pnl = useMemo(() => buildPnl(revenue, expenses), [revenue, expenses]);
    const cats = useMemo(() => byCategory(expenses), [expenses]);
    const quarters = useMemo(() => quarterlyBreakdown(expenses, pnl.revenue), [expenses, pnl.revenue]);
    const flagged = useMemo(() => expenses.filter(e => e.reviewNote), [expenses]);
    const missingReceipts = useMemo(() => expenses.filter(e => !e.receipt), [expenses]);

    const download = (name: string, rows: (string | number)[][]) => {
        const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    };

    // One file per statement, named the way an accountant expects to receive them.
    const exportLedger = () => download(`arena-expense-ledger-${new Date().getFullYear()}.csv`, [
        ['date', 'vendor', 'description', 'category', 'amount', 'deductible_rate', 'deductible_amount', 'method', 'receipt_on_file', 'quarter', 'review_note'],
        ...expenses.map(e => [
            e.date.slice(0, 10), e.vendor, e.description, e.category, e.amount,
            e.deductibleRate, Math.round(e.amount * e.deductibleRate), e.method,
            e.receipt ? 'yes' : 'NO', quarterOf(e.date), e.reviewNote ?? '',
        ]),
    ]);

    const exportPnl = () => download(`arena-profit-and-loss-${new Date().getFullYear()}.csv`, [
        ['PROFIT & LOSS', `generated ${new Date().toISOString().slice(0, 10)}`],
        [],
        ['REVENUE'],
        ...revenue.map(r => [r.stream, r.amount]),
        ['Total revenue', pnl.revenue],
        [],
        ['EXPENSES BY CATEGORY', 'gross', 'deductible'],
        ...cats.map(c => [c.category, c.gross, Math.round(c.deductible)]),
        ['Total expenses', pnl.expensesGross, Math.round(pnl.expensesDeductible)],
        [],
        ['Net income (book)', pnl.netBook],
        ['Net income after deductible limits', Math.round(pnl.netTaxable)],
        [],
        ['NOTE', 'Prepared for review by a licensed tax professional. Not a tax return or tax advice.'],
    ]);

    const exportAll = () => { exportPnl(); setTimeout(exportLedger, 400); };

    const submitExpense = () => {
        const amount = Number(draft.amount);
        if (!draft.vendor.trim() || !amount) return;
        addExpense({
            date: new Date().toISOString(),
            vendor: draft.vendor.trim(),
            description: draft.description.trim() || draft.category,
            amount,
            category: draft.category,
            deductibleRate: DEFAULT_RATE[draft.category] ?? 1,
            receipt: draft.receipt,
            method: 'Card',
            reviewNote: draft.receipt ? undefined : 'No receipt on file — attach documentation before filing.',
        }, operator);
        setDraft({ vendor: '', description: '', amount: '', category: 'Other', receipt: true });
        setOpen(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Books &amp; Tax</h1>
                    <p className="text-muted-foreground mt-1">
                        Revenue, expenses, and a clean ledger — categorised and ready to hand to your accountant.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 text-[10px] font-mono uppercase tracking-widest">
                                <Plus className="mr-1.5 size-3" /> Record expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-border-muted bg-canvas-card">
                            <DialogHeader>
                                <DialogTitle>Record an expense</DialogTitle>
                                <DialogDescription className="text-xs">
                                    It lands in the ledger, categorised, and flows straight into the P&amp;L and the export.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Vendor</Label>
                                    <Input value={draft.vendor} onChange={e => setDraft({ ...draft, vendor: e.target.value })} placeholder="Harborline Catering" className="bg-canvas-muted" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Amount (USD)</Label>
                                    <Input value={draft.amount} onChange={e => setDraft({ ...draft, amount: e.target.value.replace(/[^0-9.]/g, '') })} placeholder="12500" className="bg-canvas-muted font-mono" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Category</Label>
                                    <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v as ExpenseCategory })}>
                                        <SelectTrigger className="bg-canvas-muted"><SelectValue /></SelectTrigger>
                                        <SelectContent className="glass border-border-muted max-h-64">
                                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {DEFAULT_RATE[draft.category] !== undefined && (
                                        <p className="text-[10px] text-signal-amber">
                                            Recorded at {Math.round((DEFAULT_RATE[draft.category] ?? 1) * 100)}% deductible — meals are commonly limited.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Description</Label>
                                    <Input value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="In-suite catering — May fixtures" className="bg-canvas-muted" />
                                </div>
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                    <input type="checkbox" checked={draft.receipt} onChange={e => setDraft({ ...draft, receipt: e.target.checked })} className="accent-[#5EE6C9]" />
                                    Receipt on file
                                </label>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={submitExpense} disabled={!draft.vendor.trim() || !Number(draft.amount)}
                                    className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90">Record</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button size="sm" onClick={exportAll}
                        className="h-9 bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-mono text-[10px] uppercase tracking-widest">
                        <FileSpreadsheet className="mr-1.5 size-3" /> Accountant pack
                    </Button>
                </div>
            </div>

            {/* Headline numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Revenue', value: money(pnl.revenue), note: 'Dues + suites + guest passes', tone: 'text-foreground' },
                    { label: 'Expenses', value: money(pnl.expensesGross), note: `${expenses.length} lines categorised`, tone: 'text-foreground' },
                    { label: 'Net income', value: money(pnl.netBook), note: `${(pnl.margin * 100).toFixed(1)}% margin`, tone: pnl.netBook >= 0 ? 'text-emerald-500' : 'text-signal-red' },
                    { label: 'Suggested set-aside', value: money(Math.max(0, pnl.netTaxable * SET_ASIDE_RATE)), note: `${SET_ASIDE_RATE * 100}% of net — a placeholder, not a calculation`, tone: 'text-signal-cyan' },
                ].map(k => (
                    <Card key={k.label} className="glass border-border-muted">
                        <CardContent className="p-5">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{k.label}</div>
                            <div className={cn('text-2xl font-mono font-bold tracking-tighter mt-1', k.tone)}>{k.value}</div>
                            <div className="text-[10px] text-muted-foreground mt-1 leading-snug">{k.note}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* The honest framing, stated once and prominently */}
            <div className="rounded-lg border border-border-muted bg-canvas-muted/40 p-4 flex items-start gap-3">
                <Info className="size-4 text-signal-cyan mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-medium">This organises your records; it does not file or advise.</span>{' '}
                    Empreinte categorises spend, flags what needs a decision, and exports a clean pack. What you actually owe
                    depends on entity type, state, credits, and prior-year positions — that is your accountant&apos;s call, not this screen&apos;s.
                </p>
            </div>

            <Tabs defaultValue="pnl" className="space-y-6">
                <TabsList className="bg-canvas-muted border border-border-muted">
                    <TabsTrigger value="pnl">P&amp;L</TabsTrigger>
                    <TabsTrigger value="ledger">Ledger</TabsTrigger>
                    <TabsTrigger value="review">
                        Needs review
                        {(flagged.length + missingReceipts.length) > 0 && (
                            <span className="ml-1.5 text-[9px] font-mono text-signal-amber">{flagged.length}</span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="quarters">Quarterly</TabsTrigger>
                </TabsList>

                {/* P&L */}
                <TabsContent value="pnl" className="space-y-6">
                    <Card className="glass border-border-muted">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Profit &amp; Loss</CardTitle>
                                <CardDescription className="text-xs mt-1">Season to date.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={exportPnl} className="h-8 text-[10px] font-mono uppercase tracking-widest">
                                <Download className="mr-1.5 size-3" /> CSV
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    <TableRow className="border-border-muted hover:bg-transparent">
                                        <TableCell colSpan={3} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-canvas-muted/40">Revenue</TableCell>
                                    </TableRow>
                                    {revenue.map(r => (
                                        <TableRow key={r.stream} className="border-border-muted">
                                            <TableCell className="text-sm">{r.stream}</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground font-mono">{r.detail}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{money(r.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="border-border-muted">
                                        <TableCell className="text-sm font-bold" colSpan={2}>Total revenue</TableCell>
                                        <TableCell className="text-right font-mono text-sm font-bold">{money(pnl.revenue)}</TableCell>
                                    </TableRow>

                                    <TableRow className="border-border-muted hover:bg-transparent">
                                        <TableCell colSpan={3} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-canvas-muted/40">Expenses</TableCell>
                                    </TableRow>
                                    {cats.map(c => (
                                        <TableRow key={c.category} className="border-border-muted">
                                            <TableCell className="text-sm">
                                                {c.category}
                                                {c.flagged > 0 && <TriangleAlert className="inline ml-2 size-3 text-signal-amber" />}
                                            </TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground font-mono">
                                                {c.count} line{c.count === 1 ? '' : 's'}
                                                {c.deductible < c.gross && ` · ${money(c.deductible)} deductible`}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">({money(c.gross)})</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="border-border-muted">
                                        <TableCell className="text-sm font-bold" colSpan={2}>Total expenses</TableCell>
                                        <TableCell className="text-right font-mono text-sm font-bold">({money(pnl.expensesGross)})</TableCell>
                                    </TableRow>

                                    <TableRow className="border-border-muted bg-canvas-muted/30 hover:bg-canvas-muted/30">
                                        <TableCell className="text-base font-bold" colSpan={2}>Net income</TableCell>
                                        <TableCell className={cn('text-right font-mono text-lg font-bold tracking-tighter',
                                            pnl.netBook >= 0 ? 'text-emerald-500' : 'text-signal-red')}>
                                            {money(pnl.netBook)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Ledger */}
                <TabsContent value="ledger">
                    <Card className="glass border-border-muted">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Expense Ledger</CardTitle>
                                <CardDescription className="text-xs mt-1">{expenses.length} lines, every one categorised.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={exportLedger} className="h-8 text-[10px] font-mono uppercase tracking-widest">
                                <Download className="mr-1.5 size-3" /> CSV
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-canvas-muted/50">
                                    <TableRow className="border-border-muted hover:bg-transparent">
                                        {['Date', 'Vendor', 'Category', 'Amount', 'Deductible', ''].map(h => (
                                            <TableHead key={h} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...expenses].sort((a, b) => +new Date(b.date) - +new Date(a.date)).map(e => (
                                        <TableRow key={e.id} className="border-border-muted">
                                            <TableCell className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">{format(new Date(e.date), 'MMM d')}</TableCell>
                                            <TableCell className="text-sm">
                                                <div className="font-medium">{e.vendor}</div>
                                                <div className="text-[10px] text-muted-foreground">{e.description}</div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline" className="font-mono text-[9px] whitespace-nowrap">{e.category}</Badge></TableCell>
                                            <TableCell className="text-right font-mono text-sm whitespace-nowrap">{money(e.amount)}</TableCell>
                                            <TableCell className="text-right font-mono text-[11px] whitespace-nowrap">
                                                <span className={e.deductibleRate < 1 ? 'text-signal-amber' : 'text-muted-foreground'}>
                                                    {money(e.amount * e.deductibleRate)}
                                                    {e.deductibleRate < 1 && ` (${e.deductibleRate * 100}%)`}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!e.receipt && <Receipt className="inline size-3.5 text-signal-red" aria-label="No receipt" />}
                                                {e.reviewNote && <TriangleAlert className="inline ml-1.5 size-3.5 text-signal-amber" aria-label="Needs review" />}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Needs review — the money-saving surface, framed as questions for the accountant */}
                <TabsContent value="review" className="space-y-4">
                    {flagged.length === 0 && missingReceipts.length === 0 ? (
                        <Card className="glass border-border-muted">
                            <CardContent className="py-12 text-center">
                                <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                                <p className="text-sm mt-3">Nothing outstanding. Every line is categorised and substantiated.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card className="glass border-signal-amber/25 bg-signal-amber/[0.04]">
                                <CardHeader>
                                    <CardTitle className="text-sm font-mono uppercase tracking-widest text-signal-amber flex items-center gap-2">
                                        <PiggyBank className="size-4" /> Worth asking your accountant
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Lines where the treatment is a judgement call. Getting these right is usually where the money is.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {flagged.map(e => (
                                        <div key={e.id} className="rounded-lg border border-border-muted bg-canvas-muted/30 p-4">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">{e.vendor}</p>
                                                    <p className="text-[10px] font-mono text-muted-foreground">{e.description} · {format(new Date(e.date), 'MMM d, yyyy')}</p>
                                                </div>
                                                <span className="font-mono text-sm shrink-0">{money(e.amount)}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">{e.reviewNote}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {missingReceipts.length > 0 && (
                                <Card className="glass border-signal-red/25 bg-signal-red/[0.04]">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-mono uppercase tracking-widest text-signal-red flex items-center gap-2">
                                            <Receipt className="size-4" /> Missing documentation
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {money(missingReceipts.reduce((a, e) => a + e.amount, 0))} of spend with no receipt on file.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {missingReceipts.map(e => (
                                            <div key={e.id} className="flex items-center justify-between gap-4 text-sm border-b border-border-muted last:border-0 py-2">
                                                <span>{e.vendor} <span className="text-[10px] text-muted-foreground font-mono">· {format(new Date(e.date), 'MMM d')}</span></span>
                                                <span className="font-mono">{money(e.amount)}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* Quarterly */}
                <TabsContent value="quarters">
                    <Card className="glass border-border-muted">
                        <CardHeader>
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <CalendarClock className="size-4" /> Quarterly view
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Spend by quarter with a suggested set-aside. Estimated-payment dates are the usual US calendar-year dates — confirm yours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-canvas-muted/50">
                                    <TableRow className="border-border-muted hover:bg-transparent">
                                        {['Quarter', 'Revenue', 'Spend', 'Net', 'Set aside', 'Estimate due'].map(h => (
                                            <TableHead key={h} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quarters.map(q => (
                                        <TableRow key={q.key} className="border-border-muted">
                                            <TableCell className="font-mono text-sm">{q.label}</TableCell>
                                            <TableCell className="font-mono text-sm text-muted-foreground">{money(q.rev)}</TableCell>
                                            <TableCell className="font-mono text-sm">({money(q.spend)})</TableCell>
                                            <TableCell className={cn('font-mono text-sm', q.net >= 0 ? 'text-emerald-500' : 'text-signal-red')}>{money(q.net)}</TableCell>
                                            <TableCell className="font-mono text-sm text-signal-cyan">{money(q.setAside)}</TableCell>
                                            <TableCell className="font-mono text-[11px] text-muted-foreground">{q.estDue}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
