'use client';

import React, { useEffect, useState } from 'react';
import { dataService } from '@/lib/services/data-service';
import { Member, AccessAnomaly } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Users, Lock, Clock, MapPin, Search, AlertCircle, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function AccessControlPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [anomalies, setAnomalies] = useState<AccessAnomaly[]>([]);
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        dataService.getAnomalies().then(setAnomalies);
        dataService.getMembers().then(setMembers);
    }, []);

    const handleDismiss = async (id: string) => {
        await dataService.addAuditEntry(
            `${user?.role}.${user?.name.split(' ')[1] || 'Staff'}`,
            'DISMISS_ANOMALY',
            id,
            'Anomaly dismissed after manual review.'
        );
        const updated = await dataService.getAnomalies();
        setAnomalies(updated);
    };

    const handleRestrict = async (memberId: string, anomalyId: string) => {
        await dataService.updateMemberStatus(
            memberId,
            'Restricted',
            `${user?.role}.${user?.name.split(' ')[1] || 'Staff'}`,
            `Account restricted due to high-severity anomaly ${anomalyId}.`
        );
        handleDismiss(anomalyId); // Also clear the anomaly
        router.push('/admin/members');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access & Guests</h1>
                    <p className="text-muted-foreground mt-1">Real-time resource entitlement management and anomaly detection.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass border-border-muted font-mono text-[10px] uppercase h-9">
                        Resource Map
                    </Button>
                    <Button className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-mono text-[10px] uppercase h-9">
                        Update Rules
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="glass border-border-muted overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Active Anomalies</CardTitle>
                                <CardDescription className="text-xs">Detected behavioral deviations requiring human verification.</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-signal-red/10 text-signal-red border-signal-red/20 font-mono text-[10px]">
                                {anomalies.length} BLOCKED EVENTS
                            </Badge>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="divide-y divide-border-muted/50">
                                {anomalies.map((anom) => (
                                    <div key={anom.id} className="flex items-center justify-between p-6 hover:bg-canvas-muted/50 transition-colors group">
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "p-2 rounded bg-canvas-muted border border-border-muted",
                                                anom.severity === 'High' ? "text-signal-red" : "text-signal-amber"
                                            )}>
                                                <AlertCircle className="size-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold font-mono tracking-tight">{anom.type}</span>
                                                    <Badge variant="secondary" className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground">{anom.id}</Badge>
                                                </div>
                                                <p className="text-sm text-foreground mb-2">{anom.description}</p>
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                                                    <span className="flex items-center gap-1"><Clock className="size-3" /> {format(new Date(anom.timestamp), 'HH:mm:ss')}</span>
                                                    <span className="flex items-center gap-1"><MapPin className="size-3" /> Area: Suite B</span>
                                                    <span className="flex items-center gap-1 text-signal-cyan underline cursor-pointer">View Member Profile</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-[10px] font-mono text-muted-foreground uppercase"
                                                onClick={() => handleDismiss(anom.id)}
                                            >
                                                Dismiss
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8 bg-signal-red text-white hover:bg-signal-red/90 text-[10px] font-mono uppercase"
                                                onClick={() => handleRestrict(anom.memberId, anom.id)}
                                            >
                                                Restrict
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-border-muted">
                        <CardHeader>
                            <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Resource Entitlements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: 'Founder Tier', access: 'All Suites, 24/7, 10 Guests', color: 'text-amber-500' },
                                    { name: 'Suite Tier', access: 'Primary Suites, 08:00-02:00, 4 Guests', color: 'text-signal-cyan' },
                                    { name: 'Associate Tier', access: 'Communal Areas, Weekdays, 2 Guests', color: 'text-slate-400' },
                                ].map((tier, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-canvas-muted/50 border border-border-muted hover:border-border-muted/80 transition-all">
                                        <p className={cn("text-xs font-bold font-mono uppercase mb-1", tier.color)}>{tier.name}</p>
                                        <p className="text-sm font-medium">{tier.access}</p>
                                        <Button variant="link" className="p-0 h-auto text-[10px] text-muted-foreground mt-2 uppercase tracking-widest hover:text-foreground">Modify Rules</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                        <Users className="size-3" /> Live Check-ins
                    </h2>
                    <div className="space-y-3">
                        {members.slice(0, 5).map((m, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-canvas-muted/30 border border-border-muted hover:bg-canvas-card transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-8">
                                        <AvatarImage src={m.avatarUrl} />
                                        <AvatarFallback>{m.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{m.name}</p>
                                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{m.tier} // SUITE A</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-mono text-muted-foreground">IN: 19:42</p>
                                    <div className="size-1.5 bg-emerald-500 rounded-full ml-auto mt-1 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground border border-dashed border-border-muted">
                        View All Activity
                    </Button>
                </div>
            </div>
        </div>
    );
}
