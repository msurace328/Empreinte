'use client';

import React, { useEffect, useState } from 'react';
import { dataService } from '@/lib/services/data-service';
import { RevenueOpportunity, Booking } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { DollarSign, TrendingUp, Target, Zap, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export default function RevenueIntelligencePage() {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<RevenueOpportunity[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        dataService.getOpportunities().then(setOpportunities);
        dataService.getBookings().then(setBookings);
    }, []);

    const totalRevenue = bookings.reduce((acc, b) => acc + b.amount, 0);

    // Group bookings by date for trend
    const revenueByDate = bookings.reduce((acc: any, b) => {
        const date = b.date.slice(-5); // MM-DD
        acc[date] = (acc[date] || 0) + b.amount;
        return acc;
    }, {});

    const chartData = Object.entries(revenueByDate).map(([date, amount]) => ({ date, amount })).sort((a: any, b: any) => a.date.localeCompare(b.date));

    const handleApprove = async (id: string) => {
        await dataService.approveOpportunity(id);
        const updated = await dataService.getOpportunities();
        setOpportunities(updated);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Revenue Intelligence</h1>
                    <p className="text-muted-foreground mt-1">Growth diagnostics and automated opportunity detection.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass border-border-muted font-mono text-[10px] uppercase tracking-widest h-9">
                        Settings
                    </Button>
                    <Button className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-mono text-[10px] uppercase tracking-widest h-9">
                        Export Data
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}k`} trend={{ value: 12, isUp: true }} icon={DollarSign} accent />
                <MetricCard title="Avg. Rev / Member" value="$842" trend={{ value: 3, isUp: true }} icon={TrendingUp} />
                <MetricCard title="Suite Occupancy" value="78%" trend={{ value: 5, isUp: false }} icon={Target} />
                <MetricCard title="RR (Unrecognized)" value="$14.2k" description="Forward bookings" icon={Clock} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 glass border-border-muted overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Revenue Trend</CardTitle>
                        <CardDescription className="text-xs">Aggregate daily revenue across all ARENA suites.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#15191E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#5EE6C9', fontSize: '12px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#5EE6C9"
                                    strokeWidth={3}
                                    dot={{ fill: '#0B0D10', stroke: '#5EE6C9', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Opportunity Engine */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-mono uppercase tracking-widest text-signal-cyan flex items-center gap-2">
                            <Zap className="size-3" /> Opportunity Engine
                        </h2>
                        <Badge variant="outline" className="font-mono text-[10px] border-signal-cyan/20 text-signal-cyan bg-signal-cyan/5">
                            {opportunities.filter(o => o.status === 'Open').length} ACTIVE PROPOSALS
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {opportunities.map((opp) => (
                            <Card key={opp.id} className={cn(
                                "glass border-border-muted group transition-all duration-300",
                                opp.status === 'Approved' ? "opacity-60 grayscale-[0.5]" : "hover:border-signal-cyan/30"
                            )}>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="secondary" className="bg-canvas-muted text-[10px] font-mono tracking-tight">{opp.id}</Badge>
                                        <span className="text-xs font-bold font-mono text-signal-cyan">+${(opp.projectedUpside / 1000).toFixed(0)}k</span>
                                    </div>
                                    <h3 className="text-sm font-bold mb-1">{opp.title}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{opp.gap}</p>

                                    <div className="p-3 bg-canvas-muted/50 rounded-md border border-border-muted mb-4">
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Evidence</p>
                                        <p className="text-[11px] leading-snug">{opp.evidence}</p>
                                    </div>

                                    {opp.status === 'Open' ? (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 glass text-[10px] font-mono border-border-muted h-8"
                                                onClick={() => {
                                                    dataService.addAuditEntry(
                                                        `${user?.role}.${user?.name.split(' ')[1] || 'Staff'}`,
                                                        'DISMISS_OPPORTUNITY',
                                                        opp.id,
                                                        'Opportunity dismissed by revenue director.'
                                                    ).then(() => dataService.getOpportunities().then(setOpportunities));
                                                }}
                                            >
                                                DISMISS
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 text-[10px] font-mono h-8"
                                                onClick={() => handleApprove(opp.id)}
                                            >
                                                APPROVE <ArrowRight className="ml-1 size-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] uppercase">
                                            <CheckCircle2 className="size-4" /> Enacted & Tracking
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground">
                        Model Settings
                    </Button>
                </div>
            </div>

            <div className="pb-12">
                <Card className="glass border-border-muted">
                    <CardHeader>
                        <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Suite Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'The Zenith Loft', revenue: 45000, color: '#5EE6C9' },
                                { name: 'The Obsidian Room', revenue: 28000, color: '#F59E0B' },
                                { name: 'Skyline Terrace', revenue: 62000, color: '#10B981' },
                            ]}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }} />
                                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                    {[0, 1, 2].map((_, i) => <Cell key={i} fill={i === 0 ? '#5EE6C9' : (i === 1 ? '#F59E0B' : '#10B981')} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
