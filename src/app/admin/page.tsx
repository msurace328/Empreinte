'use client';

import React, { useMemo } from 'react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TrustTrendChart } from '@/components/dashboard/trust-trend-chart';
import { AnomalyFeed } from '@/components/dashboard/anomaly-feed';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserCheck, ShieldAlert, Activity, ArrowRight, DoorOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useData } from '@/lib/providers/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';

// Greeting reflects who is actually signed in, so the console reads as
// "your desk" rather than one generic admin screen.
const ROLE_SUBTITLE: Record<string, string> = {
    Admin: 'Full operating picture · trust, access, and revenue',
    MembershipDirector: 'Vetting, members, and the revenue you own',
    FrontDesk: 'Door operations and guest vetting',
    Auditor: 'Read-only oversight and the immutable record',
};

export default function DashboardPage() {
    const { members, applications, anomalies, auditLog, checkIns } = useData();
    const { user } = useAuth();

    const stats = useMemo(() => {
        const active = members.filter(m => m.status === 'Active').length;
        const pending = applications.filter(a => !['Approved', 'Rejected'].includes(a.status)).length;
        const flags = anomalies.filter(a => !a.isResolved).length
            + members.filter(m => m.status === 'Restricted' || m.trustScore < 40).length;
        const trust = members.length
            ? members.reduce((sum, m) => sum + m.trustScore, 0) / members.length
            : 0;
        return { active, pending, flags, trust, overrides: checkIns.filter(c => c.result === 'Override').length };
    }, [members, applications, anomalies, checkIns]);

    const recent = auditLog.slice(0, 5);

    // Export what is on screen, from real state — a demo with a dead button
    // teaches the wrong thing about the product.
    const exportReport = () => {
        const rows = [
            ['metric', 'value'],
            ['active_members', String(stats.active)],
            ['pending_applications', String(stats.pending)],
            ['open_risk_flags', String(stats.flags)],
            ['trust_health_index', stats.trust.toFixed(1)],
            ['door_scans', String(checkIns.length)],
            ['door_overrides', String(stats.overrides)],
            [],
            ['timestamp', 'operator', 'action', 'target', 'reason'],
            ...auditLog.map(e => [e.timestamp, e.operator, e.action, e.targetId, e.reason.replace(/"/g, "'")]),
        ];
        const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `empreinte-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const firstName = user?.name.split(' ')[0] ?? 'there';

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Good to see you, {firstName}.</h1>
                    <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">
                        {user?.title ?? user?.role} // {ROLE_SUBTITLE[user?.role ?? ''] ?? 'ARENA active session'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={exportReport}
                        className="glass border-border-muted font-mono text-[10px] uppercase tracking-widest">
                        <Download className="mr-1.5 size-3" /> Export Report
                    </Button>
                    <Button asChild size="sm" className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-mono text-[10px] uppercase tracking-widest">
                        <Link href="/admin/door"><DoorOpen className="mr-1.5 size-3" /> Door Console</Link>
                    </Button>
                </div>
            </div>

            {stats.overrides > 0 && (
                <Link href="/admin/audit" className="block rounded-lg border border-signal-amber/30 bg-signal-amber/10 px-4 py-3 hover:bg-signal-amber/[0.14] transition-colors">
                    <p className="text-sm text-signal-amber font-medium">
                        {stats.overrides} door override{stats.overrides > 1 ? 's' : ''} this session
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Someone was admitted against the system&apos;s decision. Review the audit trail.
                    </p>
                </Link>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Active Members" value={stats.active} description="Memberships in good standing" icon={Users} />
                <MetricCard title="Pending Applications" value={stats.pending} description="Requires vetting" icon={UserCheck} accent />
                <MetricCard title="Open Risk Flags" value={stats.flags} description="Anomalies and trust exceptions" icon={ShieldAlert} />
                <MetricCard title="Trust-Health Index" value={`${stats.trust.toFixed(1)}%`} description="Aggregate network trust" icon={Activity} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 glass border-border-muted overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-sm font-medium font-mono uppercase tracking-widest text-muted-foreground">Trust-Health Trend</CardTitle>
                            <CardDescription className="text-xs">Real-time network legitimacy analysis</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-signal-cyan border-signal-cyan/20 bg-signal-cyan/5 font-mono text-[10px]">
                            +1.2% VS PREV WEEK
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <TrustTrendChart />
                    </CardContent>
                </Card>

                <Card className="glass border-border-muted h-full">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium font-mono uppercase tracking-widest text-muted-foreground">Anomaly Feed</CardTitle>
                        <CardDescription className="text-xs">Live behavioral &amp; identity signals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnomalyFeed />
                        <Button asChild variant="ghost" size="sm" className="w-full mt-4 text-xs group text-muted-foreground hover:text-foreground">
                            <Link href="/admin/access">View all alerts <ArrowRight className="ml-2 size-3 group-hover:translate-x-1 transition-transform" /></Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                <Card className="lg:col-span-3 glass border-border-muted">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium font-mono uppercase tracking-widest text-muted-foreground">Recent Decisions</CardTitle>
                            <CardDescription className="text-xs">Live from the audit log — vetting, access, and door activity</CardDescription>
                        </div>
                        <Link href="/admin/audit">
                            <Button variant="link" className="text-signal-cyan p-0 h-auto text-xs font-mono uppercase tracking-widest">Audit Trail</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recent.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4">No decisions recorded yet this session.</p>
                        ) : (
                            <div className="space-y-4">
                                {recent.map((item) => {
                                    const negative = /RESTRICT|REJECT|DENY|DENIED/.test(item.action);
                                    const caution = /WATCH|WAITLIST|OVERRIDE|NEEDS/.test(item.action);
                                    return (
                                        <div key={item.id} className="flex items-center justify-between py-3 border-b border-border-muted last:border-0 gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={cn('size-2 rounded-full shrink-0',
                                                    negative ? 'bg-rose-500' : caution ? 'bg-amber-500' : 'bg-emerald-500')} />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {item.action} <span className="text-muted-foreground">·</span> {item.targetId}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-mono truncate">{item.reason}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] font-mono text-muted-foreground">{item.operator}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground/60">
                                                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
