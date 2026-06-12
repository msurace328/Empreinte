"use client";
import React, { useMemo } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { initialSuites } from '@/lib/services/seed-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dashboard/metric-card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Ticket, Building2, CalendarDays, DollarSign, Users, ArrowRight } from 'lucide-react';

// Forward game-day schedule (local). Suite analytics below are derived from real Bookings.
const GAMES = [
    { id: 'gm-01', date: 'Sat Jun 20', matchup: 'ARENA vs Northside', suiteId: 's-003', holderId: 'm-001', guests: 18, status: 'Confirmed' },
    { id: 'gm-02', date: 'Sat Jun 20', matchup: 'ARENA vs Northside', suiteId: 's-001', holderId: 'm-002', guests: 9, status: 'Confirmed' },
    { id: 'gm-03', date: 'Sat Jun 20', matchup: 'ARENA vs Northside', suiteId: 's-002', holderId: 'm-003', guests: 5, status: 'Guests pending' },
    { id: 'gm-04', date: 'Wed Jun 24', matchup: 'ARENA vs Lakeside', suiteId: 's-001', holderId: 'm-001', guests: 6, status: 'Open suite' },
    { id: 'gm-05', date: 'Sat Jun 27', matchup: 'ARENA vs Crosstown', suiteId: 's-003', holderId: 'm-002', guests: 22, status: 'Confirmed' },
];

const STATUS_STYLE: Record<string, string> = {
    'Confirmed': 'border-signal-cyan/20 text-signal-cyan bg-signal-cyan/5',
    'Guests pending': 'border-signal-amber/20 text-signal-amber bg-signal-amber/5',
    'Open suite': 'border-border-muted text-muted-foreground',
};

const fmt = (n: number) => `$${n.toLocaleString()}`;

export default function SuitesPage() {
    const { bookings, members } = useData();
    const suites = initialSuites;

    const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;
    const suiteName = (id: string) => suites.find((s) => s.id === id)?.name ?? id;

    const suiteStats = useMemo(() => suites.map((s) => {
        const sb = bookings.filter((b) => b.suiteId === s.id);
        const revenue = sb.reduce((sum, b) => sum + b.amount, 0);
        const avgParty = sb.length ? sb.reduce((a, b) => a + b.partySize, 0) / sb.length : 0;
        const occupancy = s.capacity ? Math.min(100, Math.round((avgParty / s.capacity) * 100)) : 0;
        return { ...s, count: sb.length, revenue, occupancy };
    }), [bookings, suites]);

    const kpis = useMemo(() => {
        const revenue = bookings.reduce((sum, b) => sum + b.amount, 0);
        const occ = suiteStats.length ? Math.round(suiteStats.reduce((a, s) => a + s.occupancy, 0) / suiteStats.length) : 0;
        return { suites: suites.length, bookings: bookings.length, revenue, occupancy: occ };
    }, [bookings, suiteStats, suites]);

    const occTone = (o: number) => (o >= 70 ? 'bg-emerald-500' : o >= 40 ? 'bg-signal-amber' : 'bg-signal-red');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suites &amp; Game-Day</h1>
                    <p className="text-muted-foreground mt-1">Suite inventory, occupancy, and the upcoming fixture schedule.</p>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 bg-signal-cyan/5 text-signal-cyan border-signal-cyan/20">
                    {GAMES.length} UPCOMING FIXTURES
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Suites" value={kpis.suites} icon={Building2} accent description="In inventory" />
                <MetricCard title="Season Bookings" value={kpis.bookings} icon={Ticket} description="Booked to date" />
                <MetricCard title="Avg Occupancy" value={`${kpis.occupancy}%`} icon={Users} description="Party vs capacity" />
                <MetricCard title="Booked Revenue" value={fmt(kpis.revenue)} icon={DollarSign} description="Season to date" />
            </div>

            {/* Suite inventory */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suiteStats.map((s) => (
                    <Card key={s.id} className="glass border-border-muted">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{s.name}</CardTitle>
                                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">{s.capacity} seats</Badge>
                            </div>
                            <CardDescription className="text-xs font-mono">{fmt(s.basePrice)} base · {s.count} bookings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                                    <span>Occupancy</span><span>{s.occupancy}%</span>
                                </div>
                                <div className="h-1.5 bg-canvas-muted rounded-full overflow-hidden border border-border-muted/50">
                                    <div className={cn('h-full transition-all duration-1000', occTone(s.occupancy))} style={{ width: `${s.occupancy}%` }} />
                                </div>
                            </div>
                            <div className="text-2xl font-mono font-bold text-signal-cyan tracking-tighter">{fmt(s.revenue)}</div>
                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Revenue this season</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Game-day schedule */}
            <Card className="glass border-border-muted overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                    <div>
                        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <CalendarDays className="size-4" /> Game-Day Schedule
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">Who holds which suite, and how many guests are coming.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-canvas-muted/50">
                            <TableRow className="border-border-muted hover:bg-transparent">
                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Date</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Fixture</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Suite</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Suite Holder</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Guests</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Guest List</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {GAMES.map((g) => (
                                <TableRow key={g.id} className="border-border-muted hover:bg-canvas-muted/30 transition-colors">
                                    <TableCell className="text-xs font-mono whitespace-nowrap">{g.date}</TableCell>
                                    <TableCell className="text-sm font-medium">{g.matchup}</TableCell>
                                    <TableCell className="text-xs">{suiteName(g.suiteId)}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{memberName(g.holderId)}</TableCell>
                                    <TableCell>
                                        <span className="flex items-center gap-1 text-xs font-mono">
                                            <Users className="size-3 text-muted-foreground" /> {g.guests}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('font-mono text-[10px]', STATUS_STYLE[g.status] ?? STATUS_STYLE['Open suite'])}>
                                            {g.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="sm" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-signal-cyan">
                                            <Link href="/admin/access">Vet guests <ArrowRight className="ml-1 size-3" /></Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <p className="text-[10px] font-mono text-muted-foreground/70 flex items-center gap-2">
                <Ticket className="size-3" /> Suite occupancy and revenue are computed live from booking history · guest decisions flow through Access &amp; Guests into the Audit Log.
            </p>
        </div>
    );
}
