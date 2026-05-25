'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { dataService } from '@/lib/services/data-service';
import { intelligenceService } from '@/lib/services/intelligence-service';
import { Member, Application, RiskSignal, AccessAnomaly, Booking } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrustGauge } from '@/components/ui/trust-gauge';
import { SignalBreakdown } from '@/components/member/signal-breakdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldAlert, ShieldCheck, Clock, MapPin, Users, History, ArrowUpRight, Search, CheckCircle2, XCircle, AlertTriangle, ChevronLeft, Activity, Network, MoreVertical, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';

export default function MemberProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<{
        profile: Member | Application | null;
        signals: RiskSignal[];
        anomalies: AccessAnomaly[];
        bookings: Booking[];
        imageSignals: RiskSignal[];
    }>({
        profile: null,
        signals: [],
        anomalies: [],
        bookings: [],
        imageSignals: [],
    });
    const { user } = useAuth();

    useEffect(() => {
        const id = params.id as string;
        const fetchData = async () => {
            let profile: Member | Application | null = await dataService.getMember(id) || await dataService.getApplication(id) || null;
            if (!profile) return;

            const [riskResult, accessResult, bookingResult, imgResult] = await Promise.all([
                intelligenceService.scoreRisk(profile),
                intelligenceService.detectAccessAnomalies(profile as any),
                dataService.getBookingsForMember(id),
                intelligenceService.assessImageAuthenticity(profile.avatarUrl)
            ]);

            setData({
                profile,
                signals: riskResult.signals,
                anomalies: accessResult,
                bookings: bookingResult,
                imageSignals: imgResult,
            });
        };
        fetchData();
    }, [params.id]);

    const [reason, setReason] = useState('');
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [isConfirmRestrictOpen, setIsConfirmRestrictOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!data.profile) return <div className="p-8 text-muted-foreground font-mono">Loading dossier...</div>;

    const handleRestrict = async () => {
        if (!user || !data.profile) return;
        await dataService.updateMemberStatus(
            data.profile.id,
            'Restricted',
            `${user.role}.${user.name.split(' ')[1] || user.name}`,
            reason || 'Administrative restriction triggered from dossier.'
        );
        setIsConfirmRestrictOpen(false);
        setReason('');
        const profile = await dataService.getMember(data.profile.id) || await dataService.getApplication(data.profile.id) || null;
        if (profile) setData(d => ({ ...d, profile }));
    };

    const handleReinstate = async () => {
        if (!user || !data.profile) return;
        await dataService.updateMemberStatus(
            data.profile.id,
            'Active',
            `${user.role}.${user.name.split(' ')[1] || user.name}`,
            'Account reinstated after manual review.'
        );
        const profile = await dataService.getMember(data.profile.id) || await dataService.getApplication(data.profile.id) || null;
        if (profile) setData(d => ({ ...d, profile }));
    };

    const handleApprove = async () => {
        if (!user || !data.profile) return;
        if ('riskScore' in data.profile && !('trustScore' in data.profile)) {
            await dataService.updateApplicationStatus(
                data.profile.id,
                'Approved',
                `${user.role}.${user.name.split(' ')[1] || user.name}`,
                'Manual approval from dossier view.'
            );
            router.push('/admin/applications');
        }
    };

    const score = 'trustScore' in data.profile ? data.profile.trustScore : 100 - data.profile.riskScore;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="mr-2 size-4" /> Back to Queue
                </Button>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass font-mono text-[10px] uppercase tracking-widest border-border-muted h-9 px-4" onClick={() => alert('Dossier download initiated...')}>Download Dossier</Button>
                    {'riskScore' in data.profile && !('trustScore' in data.profile) ? (
                        <Button onClick={handleApprove} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-mono text-[10px] uppercase tracking-widest h-9 px-4 border border-emerald-500/20 transition-all duration-300">Approve Application</Button>
                    ) : (
                        data.profile.status === 'Restricted' ? (
                            <Button onClick={handleReinstate} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-mono text-[10px] uppercase tracking-widest h-9 px-4 border border-emerald-500/20 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">Reinstate Account</Button>
                        ) : (
                            <Button onClick={() => setIsConfirmRestrictOpen(true)} className="bg-signal-red/10 text-signal-red hover:bg-signal-red/20 font-mono text-[10px] uppercase tracking-widest h-9 px-4 border border-signal-red/20 transition-all duration-300">Restrict Account</Button>
                        )
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Dossier Header & Trust Gauge */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="glass border-border-muted overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-signal-cyan" />
                        <CardContent className="pt-8 pb-10 flex flex-col items-center">
                            <div className="relative group">
                                <Avatar className="size-32 border-2 border-border-muted shadow-2xl transition-transform duration-500 group-hover:scale-105">
                                    <AvatarImage src={data.profile.avatarUrl} className="object-cover" />
                                    <AvatarFallback className="text-4xl">{data.profile.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-2 -right-2 glass size-10 rounded-full flex items-center justify-center border-border-muted shadow-xl">
                                    {score > 80 ? <ShieldCheck className="size-6 text-signal-cyan" /> : <ShieldAlert className="size-6 text-signal-red animate-pulse" />}
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <h2 className="text-2xl font-bold tracking-tight">{data.profile.name}</h2>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase border-border-muted text-muted-foreground">{data.profile.id}</Badge>
                                    {'tier' in data.profile && (
                                        <Badge variant="outline" className="font-mono text-[10px] uppercase border-signal-cyan/20 text-signal-cyan bg-signal-cyan/5">
                                            {data.profile.tier} Tier
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <Separator className="my-8 bg-border-muted/50" />

                            <TrustGauge score={score} size="lg" />

                            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                                <div className="text-center p-3 rounded-lg bg-canvas-muted/50 border border-border-muted">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Last Activity</p>
                                    <p className="text-xs font-bold mt-1">{'lastAccess' in data.profile ? format(new Date(data.profile.lastAccess), 'HH:mm') : 'N/A'}</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-canvas-muted/50 border border-border-muted">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Join Date</p>
                                    <p className="text-xs font-bold mt-1">{format(new Date('joinDate' in data.profile ? data.profile.joinDate : 'appliedDate' in data.profile ? data.profile.appliedDate : new Date()), 'MMM yyyy')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-border-muted">
                        <CardHeader>
                            <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Activity className="size-3" /> Identity Signals
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SignalBreakdown signals={data.imageSignals} title="Authenticity Analysis" />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Detailed Breakdown */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass border-border-muted h-full">
                            <CardHeader>
                                <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <ShieldAlert className="size-3" /> Risk Signals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SignalBreakdown signals={data.signals} />
                                {data.signals.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center border border-dashed border-border-muted rounded-md italic">No negative signals detected.</p>}
                            </CardContent>
                        </Card>

                        <Card className="glass border-border-muted h-full">
                            <CardHeader>
                                <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Activity className="size-3" /> Access Anomalies
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.anomalies.map((anom) => (
                                    <div key={anom.id} className="p-3 border border-signal-red/20 bg-signal-red/5 rounded-md space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-mono text-signal-red font-bold uppercase tracking-widest">{anom.type}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{format(new Date(anom.timestamp), 'HH:mm')}</span>
                                        </div>
                                        <p className="text-xs font-medium">{anom.description}</p>
                                    </div>
                                ))}
                                {data.anomalies.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center border border-dashed border-border-muted rounded-md italic">Behavior consistent with profile.</p>}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="glass border-border-muted">
                        <Tabs defaultValue="bookings" className="w-full">
                            <div className="px-6 pt-4 flex items-center justify-between border-b border-border-muted">
                                <TabsList className="bg-transparent h-auto p-0 gap-6">
                                    <TabsTrigger value="bookings" className="data-[state=active]:bg-transparent data-[state=active]:text-signal-cyan data-[state=active]:border-b-2 data-[state=active]:border-signal-cyan rounded-none px-0 py-3 text-xs font-mono uppercase tracking-widest">History</TabsTrigger>
                                    <TabsTrigger value="vouch" className="data-[state=active]:bg-transparent data-[state=active]:text-signal-cyan data-[state=active]:border-b-2 data-[state=active]:border-signal-cyan rounded-none px-0 py-3 text-xs font-mono uppercase tracking-widest">Network</TabsTrigger>
                                    <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:text-signal-cyan data-[state=active]:border-b-2 data-[state=active]:border-signal-cyan rounded-none px-0 py-3 text-xs font-mono uppercase tracking-widest">Operator Notes</TabsTrigger>
                                </TabsList>
                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                            </div>
                            <TabsContent value="bookings" className="p-6">
                                <div className="space-y-4">
                                    {data.bookings.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between p-4 bg-canvas-muted/30 rounded-lg border border-border-muted hover:border-signal-cyan/20 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded bg-canvas-muted flex items-center justify-center group-hover:bg-signal-cyan/10 transition-colors">
                                                    <MapPin className="size-5 text-muted-foreground group-hover:text-signal-cyan" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">Suite {booking.suiteId.slice(-3)}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono"><Calendar className="size-3" /> {format(new Date(booking.date), 'MMM d, yyyy')}</div>
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono"><Clock className="size-3" /> {booking.startTime} ({booking.duration}h)</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold font-mono tracking-tighter text-signal-cyan">${booking.amount.toLocaleString()}</p>
                                                <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">{booking.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {data.bookings.length === 0 && <p className="text-xs text-muted-foreground p-8 text-center font-mono">No previous transactions on file.</p>}
                                </div>
                            </TabsContent>
                            <TabsContent value="vouch" className="p-6">
                                <div className="space-y-6">
                                    <div className="p-4 bg-canvas-muted/30 rounded-lg border border-border-muted">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Referrer</p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <Avatar className="size-8 border border-border-muted">
                                                <AvatarFallback>AS</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">Alexander Sterling</p>
                                                <p className="text-[10px] text-signal-cyan font-mono tracking-widest">FOUNDER TIER // TRUST 98%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 border border-signal-red/20 bg-signal-red/5 rounded-lg">
                                        <Network className="size-5 text-signal-red" />
                                        <div>
                                            <p className="text-sm font-bold">Suspicious Cluster Detected</p>
                                            <p className="text-xs text-muted-foreground">This member sits inside a circular vouching ring (m-442, m-448, app-001).</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="notes" className="p-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-canvas-muted/50 rounded-lg border border-border-muted">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Director.Vance // 2 days ago</span>
                                        </div>
                                        <p className="text-xs italic">"Manually verified business credentials via LinkedIn and company registrar. Fits existing Suite member profile well."</p>
                                    </div>
                                    <Button variant="outline" className="w-full glass border-dashed border-border-muted text-xs text-muted-foreground">+ Add Internal Note</Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
            </div>
            <AlertDialog open={isConfirmRestrictOpen} onOpenChange={setIsConfirmRestrictOpen}>
                <AlertDialogContent className="glass border-signal-red/20 bg-canvas-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-signal-red flex items-center gap-2">
                            <ShieldAlert className="size-5" /> Confirm Account Restriction
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Are you sure you want to restrict this account? All resource entitlements will be revoked immediately and the member will be notified.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Restriction Reason</label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Credential sharing detected"
                            className="bg-canvas-muted border-border-muted mt-2"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsConfirmRestrictOpen(false); setReason(''); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-signal-red text-white hover:bg-signal-red/90"
                            onClick={handleRestrict}
                        >
                            Confirm Restriction
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

