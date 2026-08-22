"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/lib/providers/data-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TrustGauge } from '@/components/ui/trust-gauge';
import { SignalBreakdown } from '@/components/member/signal-breakdown';
import { intelligenceService } from '@/lib/services/intelligence-service';
import { Application, Member, AccessAnomaly, RiskSignal } from '@/lib/types';
import { ShieldCheck, ShieldAlert, ChevronLeft, Fingerprint, Activity, History, CalendarDays, Clock, SearchX } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const SEVERITY_STYLE: Record<AccessAnomaly['severity'], string> = {
    High: 'border-signal-red/20 text-signal-red bg-signal-red/5',
    Medium: 'border-signal-amber/20 text-signal-amber bg-signal-amber/5',
    Low: 'border-border-muted text-muted-foreground',
};

export default function MemberProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { members, applications, bookings, anomalies, auditLog, restrictMember, reinstateMember, approveApplication } = useData();
    const { user } = useAuth();

    const [reason, setReason] = useState('');
    const [isConfirmRestrictOpen, setIsConfirmRestrictOpen] = useState(false);
    const [signals, setSignals] = useState<RiskSignal[] | null>(null);
    const [liveAnomalies, setLiveAnomalies] = useState<AccessAnomaly[] | null>(null);

    const id = params.id as string;
    const member = members.find(m => m.id === id);
    const application = applications.find(a => a.id === id);
    const profile = member ?? application;
    const isApp = !member && !!application;

    // Assemble the intelligence dossier: identity + image forensics, and live anomaly sweep for members.
    useEffect(() => {
        let cancelled = false;
        if (!profile) return;
        (async () => {
            const candidate = profile as Member | Application;
            const [identity, image, risk] = await Promise.all([
                isApp ? intelligenceService.assessIdentity(candidate as Application) : Promise.resolve([]),
                intelligenceService.assessImageAuthenticity(candidate.avatarUrl ?? ''),
                intelligenceService.scoreRisk(candidate),
            ]);
            if (cancelled) return;
            setSignals([...identity, ...risk.signals, ...image]);
            if (member) {
                const detected = await intelligenceService.detectAccessAnomalies(member);
                if (!cancelled) setLiveAnomalies(detected);
            } else {
                setLiveAnomalies([]);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isApp, profile?.status]);

    const memberBookings = useMemo(() => bookings.filter(b => b.memberId === id), [bookings, id]);
    const memberAnomalies = useMemo(() => {
        const stored = anomalies.filter(a => a.memberId === id);
        const detected = (liveAnomalies ?? []).filter(d => !stored.some(s => s.id === d.id));
        return [...detected, ...stored];
    }, [anomalies, liveAnomalies, id]);
    const auditTrail = useMemo(() => auditLog.filter(e => e.targetId === id), [auditLog, id]);

    // No record for this id — say so plainly instead of spinning forever.
    if (!profile) {
        return (
            <div className="max-w-lg mx-auto py-20 text-center animate-in fade-in duration-500">
                <div className="size-14 rounded-full bg-signal-amber/10 border border-signal-amber/30 flex items-center justify-center mx-auto">
                    <SearchX className="size-7 text-signal-amber" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mt-5">No dossier for this identity</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Nothing on file under <span className="font-mono text-foreground">{id}</span>. It may have been
                    removed, or the link points at a record that never existed.
                </p>
                <div className="flex gap-2 justify-center mt-6">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ChevronLeft className="mr-2 size-4" /> Back
                    </Button>
                    <Button asChild className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90">
                        <Link href="/admin/members">Open the roster</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const score = isApp ? 100 - (application as Application).riskScore : (member as Member).trustScore;
    const negatives = (signals ?? []).filter(s => s.impact === 'Negative').length;

    const handleRestrict = () => {
        if (!user) return;
        restrictMember(id, `${user.role}.${user.name}`, reason || "Administrative restriction triggered from dossier");
        setIsConfirmRestrictOpen(false);
        setReason('');
    };

    const handleReinstate = () => {
        if (!user) return;
        reinstateMember(id, `${user.role}.${user.name}`, "Account reinstated after manual review");
    };

    const handleApprove = () => {
        if (!user) return;
        approveApplication(id, `${user.role}.${user.name}`, "Manual approval from dossier");
        router.push('/admin/applications');
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.back()}><ChevronLeft className="mr-2 size-4" /> Back</Button>
                <div className="flex gap-3">
                    {isApp ? (
                        <Button onClick={handleApprove} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] h-9">Approve Application</Button>
                    ) : profile.status === 'Restricted' ? (
                        <Button onClick={handleReinstate} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] h-9">Reinstate Account</Button>
                    ) : (
                        <Button onClick={() => setIsConfirmRestrictOpen(true)} className="bg-signal-red/10 text-signal-red border border-signal-red/20 text-[10px] h-9">Restrict Account</Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Identity card */}
                <Card className="glass border-border-muted">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <Avatar className="size-24 border border-border-muted">
                            <AvatarImage src={profile.avatarUrl} />
                            <AvatarFallback className="bg-canvas-card text-2xl">{profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-2xl font-bold mt-4">{profile.name}</h2>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{profile.email}</p>
                        <div className="flex gap-2 mt-3">
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">{profile.tier}</Badge>
                            <Badge variant="outline" className={cn("text-[10px] uppercase font-mono",
                                profile.status === 'Restricted' ? 'border-signal-red/20 text-signal-red' :
                                profile.status === 'Watch' ? 'border-signal-amber/20 text-signal-amber' :
                                'border-signal-cyan/20 text-signal-cyan')}>
                                {profile.status}
                            </Badge>
                        </div>
                        <div className="mt-6"><TrustGauge score={score} size="md" /></div>
                        <div className="w-full mt-6 space-y-2 text-left">
                            <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-muted-foreground uppercase tracking-widest">ID</span>
                                <span>{profile.id}</span>
                            </div>
                            {member && (
                                <>
                                    <div className="flex justify-between text-[11px] font-mono">
                                        <span className="text-muted-foreground uppercase tracking-widest">Joined</span>
                                        <span>{member.joinDate ? format(new Date(member.joinDate), 'MMM d, yyyy') : '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-mono">
                                        <span className="text-muted-foreground uppercase tracking-widest">Last access</span>
                                        <span>{member.lastAccess ? format(new Date(member.lastAccess), 'MMM d, yyyy') : '—'}</span>
                                    </div>
                                    {member.referralId && (
                                        <div className="flex justify-between text-[11px] font-mono">
                                            <span className="text-muted-foreground uppercase tracking-widest">Referred by</span>
                                            <span>{members.find(m => m.id === member.referralId)?.name ?? member.referralId}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            {application && (
                                <div className="flex justify-between text-[11px] font-mono">
                                    <span className="text-muted-foreground uppercase tracking-widest">Applied</span>
                                    <span>{format(new Date(application.appliedDate), 'MMM d, yyyy')}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Intelligence column */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="glass border-border-muted">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Fingerprint className="size-4" /> Identity Intelligence
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">Signals from identity, network, and image forensics.</CardDescription>
                            </div>
                            {signals && (
                                <Badge variant="outline" className={cn("font-mono text-[10px]",
                                    negatives > 0 ? 'border-signal-red/20 text-signal-red bg-signal-red/5' : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5')}>
                                    {negatives > 0 ? `${negatives} NEGATIVE SIGNAL${negatives > 1 ? 'S' : ''}` : 'ALL CLEAR'}
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            {!signals ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                </div>
                            ) : (
                                <SignalBreakdown signals={signals} />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass border-border-muted">
                        <CardHeader>
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Activity className="size-4" /> Access Anomalies
                            </CardTitle>
                            <CardDescription className="text-xs">Behavioral signals attributed to this identity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {liveAnomalies === null ? (
                                <Skeleton className="h-14 w-full" />
                            ) : memberAnomalies.length === 0 ? (
                                <p className="text-xs text-muted-foreground flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-500" /> No anomalies on record.</p>
                            ) : (
                                memberAnomalies.map(a => (
                                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-md border border-border-muted bg-canvas-muted/30">
                                        <ShieldAlert className={cn("size-4 mt-0.5", a.severity === 'High' ? 'text-signal-red' : a.severity === 'Medium' ? 'text-signal-amber' : 'text-muted-foreground')} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold tracking-wide">{a.type}</span>
                                                <Badge variant="outline" className={cn('font-mono text-[9px]', SEVERITY_STYLE[a.severity])}>{a.severity.toUpperCase()}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground/70 mt-1 flex items-center gap-1">
                                                <Clock className="size-3" /> {format(new Date(a.timestamp), 'MMM d, yyyy HH:mm')}{a.isResolved && ' · resolved'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {member && (
                        <Card className="glass border-border-muted">
                            <CardHeader>
                                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <CalendarDays className="size-4" /> Booking History
                                </CardTitle>
                                <CardDescription className="text-xs">{memberBookings.length} bookings on file.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {memberBookings.length === 0 ? (
                                    <p className="text-xs text-muted-foreground px-6 pb-6">No bookings on file.</p>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-canvas-muted/50">
                                            <TableRow className="border-border-muted hover:bg-transparent">
                                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Date</TableHead>
                                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Suite</TableHead>
                                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Party</TableHead>
                                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount</TableHead>
                                                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {memberBookings.map(b => (
                                                <TableRow key={b.id} className="border-border-muted hover:bg-canvas-muted/30">
                                                    <TableCell className="text-xs font-mono">{format(new Date(b.date), 'MMM d, yyyy')}</TableCell>
                                                    <TableCell className="text-xs">{b.suiteId}</TableCell>
                                                    <TableCell className="text-xs font-mono">{b.partySize}</TableCell>
                                                    <TableCell className="text-xs font-mono">${b.amount.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className={cn('font-mono text-[9px]',
                                                            b.status === 'Upcoming' ? 'border-signal-cyan/20 text-signal-cyan' :
                                                            b.status === 'Completed' ? 'border-emerald-500/20 text-emerald-500' :
                                                            'border-signal-amber/20 text-signal-amber')}>
                                                            {b.status.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card className="glass border-border-muted">
                        <CardHeader>
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <History className="size-4" /> Audit Trail
                            </CardTitle>
                            <CardDescription className="text-xs">Every decision on this identity. Append-only.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            {auditTrail.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No entries yet. Decisions made on this dossier will appear here.</p>
                            ) : (
                                auditTrail.map((e, i) => (
                                    <div key={e.id} className={cn("flex items-start gap-3 py-3", i < auditTrail.length - 1 && "border-b border-border-muted")}>
                                        <div className="size-1.5 rounded-full bg-signal-cyan mt-1.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs"><span className="font-bold">{e.action}</span> · {e.reason}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{format(new Date(e.timestamp), 'MMM d, yyyy HH:mm')} · {e.operator} · #{e.hash.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={isConfirmRestrictOpen} onOpenChange={setIsConfirmRestrictOpen}>
                <AlertDialogContent className="glass border-signal-red/20 bg-canvas-card">
                    <AlertDialogHeader><AlertDialogTitle className="text-signal-red">Confirm Restriction</AlertDialogTitle></AlertDialogHeader>
                    <div className="py-4"><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason" className="bg-canvas-muted" /></div>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => setIsConfirmRestrictOpen(false)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-signal-red text-white" onClick={handleRestrict}>Confirm Restriction</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
