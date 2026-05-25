'use client';

import React from 'react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TrustTrendChart } from '@/components/dashboard/trust-trend-chart';
import { AnomalyFeed } from '@/components/dashboard/anomaly-feed';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserCheck, ShieldAlert, Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
                    <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">v1.2.0-STABLE // ARENA ACTIVE SESSION</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="glass border-border-muted font-mono text-[10px] uppercase tracking-widest">
                        Export Report
                    </Button>
                    <Button size="sm" className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-mono text-[10px] uppercase tracking-widest">
                        Live Feed
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Active Members"
                    value="1,284"
                    trend={{ value: 4, isUp: true }}
                    description="Total active memberships"
                    icon={Users}
                />
                <MetricCard
                    title="Pending Applications"
                    value="12"
                    description="Requires vetting"
                    icon={UserCheck}
                    accent
                />
                <MetricCard
                    title="Open Risk Flags"
                    value="4"
                    trend={{ value: 2, isUp: false }}
                    description="High severity anomalies"
                    icon={ShieldAlert}
                />
                <MetricCard
                    title="Trust-Health Index"
                    value="96.4%"
                    trend={{ value: 0.2, isUp: true }}
                    description="Aggregate network trust"
                    icon={Activity}
                />
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
                        <CardDescription className="text-xs">Live behavioral & identity signals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnomalyFeed />
                        <Button variant="ghost" size="sm" className="w-full mt-4 text-xs group text-muted-foreground hover:text-foreground">
                            View all alerts <ArrowRight className="ml-2 size-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                <Card className="lg:col-span-3 glass border-border-muted">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium font-mono uppercase tracking-widest text-muted-foreground">Recent Decisions</CardTitle>
                            <CardDescription className="text-xs">Vetting and access control history</CardDescription>
                        </div>
                        <Link href="/admin/audit">
                            <Button variant="link" className="text-signal-cyan p-0 h-auto text-xs font-mono uppercase tracking-widest">Audit Trail</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { op: 'Director.Vance', act: 'APPROVED', target: 'Marcus Kaine', time: '12m ago', reason: 'Identity verified via secondary doc check.' },
                                { op: 'Admin.Sterling', act: 'RESTRICTED', target: 'Julian Thorne', time: '1h ago', reason: 'Concurrent use anomaly from unauthorized IP.' },
                                { op: 'Director.Vance', act: 'WAITLISTED', target: 'Sarah Drumm', time: '3h ago', reason: 'Pending manual vouch verification.' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-border-muted last:border-0 group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "size-2 rounded-full",
                                            item.act === 'APPROVED' ? "bg-emerald-500" : (item.act === 'RESTRICTED' ? "bg-rose-500" : "bg-amber-500")
                                        )} />
                                        <div>
                                            <p className="text-sm font-medium">{item.act} <span className="text-muted-foreground">for</span> {item.target}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">{item.reason}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.time}</p>
                                        <p className="text-[10px] font-mono text-muted-foreground/50">{item.op}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
