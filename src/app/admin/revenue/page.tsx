"use client";
import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { MoonshotVault } from '@/components/dashboard/moonshot-vault';
import { initialSuites } from '@/lib/services/seed-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, CheckCircle2, Sparkles, Loader2, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type OppStatus = 'Open' | 'Approved' | 'Dismissed';
interface Opp {
    id: string;
    action: string;
    title: string;
    gap: string;
    evidence: string;
    projectedUpside: number;
}
interface AiOpp {
    title: string;
    action: string;
    rationale: string;
    projectedUpside: number;
    confidence: string;
}

const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString()}`;
const round = (n: number) => Math.round(n / 100) * 100;

export default function RevenuePage() {
    const { bookings, members, addAuditEntry } = useData();
    const { user } = useAuth();
    const suites = initialSuites;

    const [statuses, setStatuses] = useState<Record<string, OppStatus>>({});
    const [aiLoading, setAiLoading] = useState(false);
    const [aiOpps, setAiOpps] = useState<AiOpp[]>([]);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiRan, setAiRan] = useState(false);

    const bySuite = useMemo(() => suites.map((s) => {
        const sb = bookings.filter((b) => b.suiteId === s.id);
        const revenue = sb.reduce((a, b) => a + b.amount, 0);
        const avgParty = sb.length ? sb.reduce((a, b) => a + b.partySize, 0) / sb.length : 0;
        const occ = s.capacity ? avgParty / s.capacity : 0;
        return { s, count: sb.length, revenue, avgParty, occ };
    }), [bookings, suites]);

    // ---- Deterministic gaps from live data ----
    const opportunities = useMemo<Opp[]>(() => {
        const out: Opp[] = [];

        const worst = [...bySuite].filter((x) => x.count > 0).sort((a, b) => a.occ - b.occ)[0];
        if (worst) {
            const perSeat = worst.s.basePrice / worst.s.capacity;
            const emptySeats = Math.max(0, (worst.s.capacity - worst.avgParty)) * worst.count;
            const upside = round(emptySeats * perSeat);
            if (upside > 0) out.push({
                id: 'gap-occupancy', action: 'Fill empty seats', title: `${worst.s.name} runs light`,
                gap: `Lowest-occupancy suite at ${Math.round(worst.occ * 100)}% — seats go out empty every fixture.`,
                evidence: `${worst.count} bookings, avg party ${worst.avgParty.toFixed(1)} of ${worst.s.capacity} seats.`,
                projectedUpside: upside,
            });
        }

        const best = [...bySuite].filter((x) => x.count > 0).sort((a, b) => b.occ - a.occ)[0];
        if (best && best.occ >= 0.6) {
            const upside = round(best.revenue * 0.15);
            if (upside > 0) out.push({
                id: 'gap-pricing', action: 'Raise price 15%', title: `${best.s.name} is underpriced`,
                gap: `Highest-demand suite at ${Math.round(best.occ * 100)}% occupancy — pricing hasn't kept up with demand.`,
                evidence: `${money(best.revenue)} booked at ${money(best.s.basePrice)} base across ${best.count} bookings.`,
                projectedUpside: upside,
            });
        }

        const countByMember: Record<string, number> = {};
        bookings.forEach((b) => { countByMember[b.memberId] = (countByMember[b.memberId] || 0) + 1; });
        const cohort = members.filter((m) => m.tier === 'Associate' && (countByMember[m.id] || 0) >= 3);
        if (cohort.length > 0) {
            out.push({
                id: 'gap-upgrade', action: 'Tier upgrade outreach', title: 'Associates booking like Suite members',
                gap: `${cohort.length} Associate member${cohort.length > 1 ? 's' : ''} book with Suite-tier frequency but pay Associate rates.`,
                evidence: `Cohort: ${cohort.map((m) => m.name).slice(0, 3).join(', ')}${cohort.length > 3 ? '…' : ''} (3+ bookings each).`,
                projectedUpside: round(cohort.length * 1000 * 12 * 0.5),
            });
        }

        const spendByMember: Record<string, number> = {};
        bookings.forEach((b) => { spendByMember[b.memberId] = (spendByMember[b.memberId] || 0) + b.amount; });
        const atRisk = members.filter((m) => m.status === 'Watch' || m.status === 'Restricted');
        const atRiskRevenue = round(atRisk.reduce((a, m) => a + (spendByMember[m.id] || 0), 0));
        if (atRisk.length > 0 && atRiskRevenue > 0) {
            out.push({
                id: 'gap-retention', action: 'Protect at-risk revenue', title: 'Revenue tied to flagged members',
                gap: `${atRisk.length} flagged member${atRisk.length > 1 ? 's' : ''} (watchlist/restricted) account for live booking revenue at churn risk.`,
                evidence: `${money(atRiskRevenue)} historical spend across flagged accounts.`,
                projectedUpside: atRiskRevenue,
            });
        }

        return out;
    }, [bySuite, bookings, members]);

    // Compact summary sent to Claude
    const summary = useMemo(() => {
        const byTier: Record<string, number> = {};
        members.forEach((m) => { byTier[m.tier] = (byTier[m.tier] || 0) + 1; });
        return {
            suites: bySuite.map((x) => ({
                name: x.s.name, capacity: x.s.capacity, basePrice: x.s.basePrice,
                bookings: x.count, revenue: x.revenue, avgParty: +x.avgParty.toFixed(1), occupancyPct: Math.round(x.occ * 100),
            })),
            members: { total: members.length, byTier, flagged: members.filter((m) => m.status === 'Watch' || m.status === 'Restricted').length },
            bookings: { total: bookings.length, totalRevenue: bookings.reduce((a, b) => a + b.amount, 0) },
        };
    }, [bySuite, members, bookings]);

    const statusOf = (id: string): OppStatus => statuses[id] ?? 'Open';
    const totalOpen = opportunities.filter((o) => statusOf(o.id) === 'Open').reduce((a, o) => a + o.projectedUpside, 0);

    const act = (id: string, kind: 'approve' | 'dismiss') => {
        if (!user) return;
        const op = `${user.role}.${user.name.split(' ').pop()}`;
        setStatuses((s) => ({ ...s, [id]: kind === 'approve' ? 'Approved' : 'Dismissed' }));
        addAuditEntry(op, kind === 'approve' ? 'APPROVE_OPPORTUNITY' : 'DISMISS_OPPORTUNITY', id,
            kind === 'approve' ? 'Revenue opportunity enacted via dashboard' : 'Revenue opportunity dismissed manually');
    };

    const runAI = async () => {
        setAiLoading(true); setAiError(null); setAiRan(true);
        try {
            const res = await fetch('/api/revenue-ai', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ summary }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            setAiOpps(Array.isArray(data.opportunities) ? data.opportunities : []);
        } catch (e) {
            setAiError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setAiLoading(false);
        }
    };

    const confTone = (c: string) => (c === 'High' ? 'text-emerald-500' : c === 'Low' ? 'text-signal-red' : 'text-signal-amber');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Revenue Intelligence</h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-signal-cyan" /> Gaps computed live from booking, suite, and member data.
                    </p>
                </div>
                <Card className="glass border-signal-cyan/20 bg-signal-cyan/5">
                    <CardContent className="px-5 py-3">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Identified upside · open</div>
                        <div className="text-2xl font-mono font-bold text-signal-cyan tracking-tighter">{money(totalOpen)}</div>
                    </CardContent>
                </Card>
            </div>

            {opportunities.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {opportunities.map((opp) => {
                        const st = statusOf(opp.id);
                        return (
                            <Card key={opp.id} className="glass border-border-muted relative overflow-hidden">
                                <CardHeader className="pb-4">
                                    <Badge variant="outline" className="w-fit font-mono text-[10px]">{opp.action}</Badge>
                                    <CardTitle className="text-xl mt-2">{opp.title}</CardTitle>
                                    <CardDescription className="text-xs">{opp.gap}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-mono text-signal-cyan font-bold tracking-tighter mb-1">+{money(opp.projectedUpside)}</div>
                                    <p className="text-[10px] text-muted-foreground font-mono mb-5 flex items-center gap-1">
                                        <TrendingUp className="size-3" /> {opp.evidence}
                                    </p>
                                    {st === 'Open' ? (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" className="flex-1 text-muted-foreground" onClick={() => act(opp.id, 'dismiss')}>DISMISS</Button>
                                            <Button size="sm" className="flex-1 bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90" onClick={() => act(opp.id, 'approve')}>APPROVE <ArrowRight className="ml-1 size-3" /></Button>
                                        </div>
                                    ) : (
                                        <div className="text-emerald-500 font-mono text-[10px] uppercase flex items-center gap-2">
                                            <CheckCircle2 className="size-4" /> {st}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ---- Live AI analysis ---- */}
            <Card className="glass border-signal-cyan/20 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                    <div>
                        <CardTitle className="text-sm font-mono uppercase tracking-widest text-signal-cyan flex items-center gap-2">
                            <Brain className="size-4" /> Live AI Analyst
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">Claude reads your live data and surfaces opportunities on demand.</CardDescription>
                    </div>
                    <Button size="sm" onClick={runAI} disabled={aiLoading}
                        className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90">
                        {aiLoading ? (<><Loader2 className="mr-1 size-3 animate-spin" /> Analyzing…</>) : (<><Sparkles className="mr-1 size-3" /> Run live AI analysis</>)}
                    </Button>
                </CardHeader>
                <CardContent>
                    {aiError && (
                        <div className="text-xs font-mono text-signal-red border border-signal-red/20 bg-signal-red/5 rounded-lg p-3">{aiError}</div>
                    )}
                    {!aiRan && !aiError && (
                        <p className="text-xs text-muted-foreground">Press the button to have Claude analyze occupancy, pricing, tiers, and churn risk against your current numbers.</p>
                    )}
                    {aiRan && !aiLoading && !aiError && aiOpps.length === 0 && (
                        <p className="text-xs text-muted-foreground">No structured suggestions returned this run. Try again.</p>
                    )}
                    {aiOpps.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {aiOpps.map((o, i) => (
                                <div key={i} className="rounded-xl p-4 bg-canvas-muted/40 border border-signal-cyan/15 space-y-2">
                                    <Badge variant="outline" className="w-fit font-mono text-[10px] text-signal-cyan border-signal-cyan/30">{o.action}</Badge>
                                    <h4 className="text-sm font-bold">{o.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-snug">{o.rationale}</p>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-lg font-mono font-bold text-signal-cyan tracking-tighter">+{money(o.projectedUpside)}</span>
                                        <span className={`text-[10px] font-mono uppercase ${confTone(o.confidence)}`}>{o.confidence}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <MoonshotVault />

        </div>
    );
}
