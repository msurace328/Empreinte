"use client";
import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { MemberStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MetricCard } from '@/components/dashboard/metric-card';
import { AnomalyFeed } from '@/components/dashboard/anomaly-feed';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, Lock, Eye, UserCheck, Ban, RotateCcw, MoreHorizontal, AlertTriangle, BadgeCheck, Clock } from 'lucide-react';

type FilterKey = 'all' | 'Active' | 'Watch' | 'Restricted' | 'stale' | 'exception';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All access' },
    { key: 'Active', label: 'Active' },
    { key: 'Watch', label: 'Watchlist' },
    { key: 'Restricted', label: 'Restricted' },
    { key: 'stale', label: 'Stale 30d+' },
    { key: 'exception', label: 'Trust exceptions' },
];

const EXCEPTION_THRESHOLD = 70;
const daysSince = (iso: string) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : 0);
const trustBar = (t: number) => (t >= 70 ? 'bg-emerald-500' : t >= 40 ? 'bg-signal-amber' : 'bg-signal-red');
const trustText = (t: number) => (t >= 70 ? 'text-emerald-500' : t >= 40 ? 'text-signal-amber' : 'text-signal-red');

const STATUS_STYLE: Partial<Record<MemberStatus, string>> = {
    Active: 'border-signal-cyan/20 text-signal-cyan bg-signal-cyan/5',
    Watch: 'border-signal-amber/20 text-signal-amber bg-signal-amber/5',
    Restricted: 'border-signal-red/20 text-signal-red bg-signal-red/5',
};
const styleFor = (s: MemberStatus) => STATUS_STYLE[s] ?? 'border-border-muted text-muted-foreground';
const labelFor = (s: MemberStatus) => (s === 'Watch' ? 'Watchlist' : s);

export default function AccessPage() {
    const { members, restrictMember, watchMember, reinstateMember, guests, issueGuestPass, denyGuest } = useData();
    const { user } = useAuth();

    const [filter, setFilter] = useState<FilterKey>('all');

    const operator = user ? `${user.role}.${user.name.split(' ').pop()}` : 'operator';
    const pendingGuests = guests.filter((g) => g.status === 'Pending');

    const rows = useMemo(() => {
        return members
            .map((m) => ({ ...m, _stale: daysSince(m.lastAccess) > 30 }))
            .filter((m) => {
                if (filter === 'all') return true;
                if (filter === 'stale') return m._stale;
                if (filter === 'exception') return m.trustScore < EXCEPTION_THRESHOLD;
                return m.status === filter;
            })
            .sort((a, b) => a.trustScore - b.trustScore);
    }, [members, filter]);

    const kpis = useMemo(() => ({
        active: members.filter((m) => m.status === 'Active').length,
        watch: members.filter((m) => m.status === 'Watch').length,
        restricted: members.filter((m) => m.status === 'Restricted').length,
        exceptions: members.filter((m) => m.trustScore < EXCEPTION_THRESHOLD).length,
    }), [members]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access &amp; Guests</h1>
                    <p className="text-muted-foreground mt-1">Live credential posture, guest vetting, and revocation for ARENA.</p>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 bg-signal-cyan/5 text-signal-cyan border-signal-cyan/20">
                    {kpis.active} ACTIVE CREDENTIALS
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Active Access" value={kpis.active} icon={ShieldCheck} accent description="Credentials live now" />
                <MetricCard title="Watchlist" value={kpis.watch} icon={Eye} description="Elevated monitoring" />
                <MetricCard title="Restricted" value={kpis.restricted} icon={Lock} description="Access pulled" />
                <MetricCard title="Trust Exceptions" value={kpis.exceptions} icon={ShieldAlert} description={`Trust score < ${EXCEPTION_THRESHOLD}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="glass border-border-muted overflow-hidden lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                        <div>
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Access Roster</CardTitle>
                            <CardDescription className="text-xs mt-1">{rows.length} of {members.length} credentials</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-end">
                            {FILTERS.map((f) => (
                                <Button key={f.key} size="sm" variant="outline"
                                    onClick={() => setFilter(f.key)}
                                    className={cn(
                                        'h-7 text-[10px] font-mono uppercase tracking-wider px-2.5 border-border-muted',
                                        filter === f.key ? 'bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30' : 'text-muted-foreground'
                                    )}>
                                    {f.label}
                                </Button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-canvas-muted/50">
                                <TableRow className="border-border-muted hover:bg-transparent">
                                    <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Member</TableHead>
                                    <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                    <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Trust</TableHead>
                                    <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Last Access</TableHead>
                                    <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 && (
                                    <TableRow className="border-border-muted hover:bg-transparent">
                                        <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-10">
                                            Nothing in this view. Every credential is accounted for — switch filters to inspect another slice.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {rows.map((m) => {
                                    const isExc = m.trustScore < EXCEPTION_THRESHOLD;
                                    return (
                                        <TableRow key={m.id} className="border-border-muted hover:bg-canvas-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-9 border border-border-muted">
                                                        <AvatarImage src={m.avatarUrl} />
                                                        <AvatarFallback className="bg-canvas-card text-xs">{m.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-medium">{m.name}</p>
                                                            {isExc && <AlertTriangle className="size-3 text-signal-red" />}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground font-mono">{m.id} · {m.tier}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn('font-mono text-[10px]', styleFor(m.status))}>
                                                    {labelFor(m.status)}
                                                </Badge>
                                                {m._stale && <span className="ml-2 text-[9px] font-mono text-muted-foreground uppercase">stale</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 max-w-[110px] h-1.5 bg-canvas-muted rounded-full overflow-hidden border border-border-muted/50">
                                                        <div className={cn('h-full transition-all duration-1000', trustBar(m.trustScore))} style={{ width: `${m.trustScore}%` }} />
                                                    </div>
                                                    <span className={cn('text-[10px] font-bold font-mono', trustText(m.trustScore))}>{m.trustScore}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                                    <Clock className="size-3" /> {m.lastAccess ? `${daysSince(m.lastAccess)}d ago` : '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button asChild variant="ghost" size="sm" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-signal-cyan">
                                                        <Link href={`/admin/members/${m.id}`}>Profile</Link>
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreHorizontal className="size-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="glass border-border-muted w-48">
                                                            <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Change access</DropdownMenuLabel>
                                                            <DropdownMenuSeparator className="bg-border-muted" />
                                                            {m.status !== 'Restricted' && (
                                                                <DropdownMenuItem className="text-signal-red" onClick={() => restrictMember(m.id, operator, 'Access restricted from Access console.')}>
                                                                    <Ban className="mr-2 size-4" /> Restrict access
                                                                </DropdownMenuItem>
                                                            )}
                                                            {m.status !== 'Watch' && (
                                                                <DropdownMenuItem className="text-signal-amber" onClick={() => watchMember(m.id, operator, 'Moved to watchlist from Access console.')}>
                                                                    <Eye className="mr-2 size-4" /> Move to watchlist
                                                                </DropdownMenuItem>
                                                            )}
                                                            {m.status !== 'Active' && (
                                                                <DropdownMenuItem className="text-signal-cyan" onClick={() => reinstateMember(m.id, operator, 'Access reinstated from Access console.')}>
                                                                    <RotateCcw className="mr-2 size-4" /> Reinstate
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    <Card className="glass border-border-muted">
                        <CardHeader>
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <UserCheck className="size-4" /> Guest Vetting
                            </CardTitle>
                            <CardDescription className="text-xs">{pendingGuests.length} awaiting a decision before a pass is issued.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pendingGuests.length === 0 && <p className="text-xs text-muted-foreground">Queue clear. New sponsored guests land here.</p>}
                            {pendingGuests.map((g) => {
                                const flags = [
                                    { l: 'ID', ok: g.checks.idVerified },
                                    { l: 'Billing', ok: g.checks.billingCurrent },
                                    { l: 'Background', ok: g.checks.backgroundClear },
                                ];
                                return (
                                    <div key={g.id} className="p-3 rounded-lg bg-canvas-muted/30 border border-border-muted space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">{g.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono">sponsor · {g.sponsorName}</p>
                                            </div>
                                            <span className={cn('text-[10px] font-bold font-mono', trustText(g.trustScore))}>{g.trustScore}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {flags.map((f) => (
                                                <span key={f.l} className={cn('text-[9px] font-mono px-1.5 py-0.5 rounded', f.ok ? 'text-emerald-500 bg-emerald-500/10' : 'text-signal-red bg-signal-red/10')}>{f.l}</span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="flex-1 h-7 text-[10px] bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90"
                                                onClick={() => issueGuestPass(g.id, operator, `Guest pass issued · sponsor ${g.sponsorName}.`)}>
                                                <BadgeCheck className="mr-1 size-3" /> Issue pass
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] text-signal-red border-signal-red/30"
                                                onClick={() => denyGuest(g.id, operator, 'Failed vetting at the door.')}>
                                                <Ban className="mr-1 size-3" /> Deny
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card className="glass border-border-muted">
                        <CardHeader>
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <ShieldAlert className="size-4" /> Access Anomalies
                            </CardTitle>
                            <CardDescription className="text-xs">Live behavioral &amp; identity signals on the door.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AnomalyFeed />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <p className="text-[10px] font-mono text-muted-foreground/70 flex items-center gap-2">
                <ShieldCheck className="size-3" /> Operator: {operator} · Restrict / Watchlist / Reinstate and every guest decision write to the global Audit Log.
            </p>
        </div>
    );
}
