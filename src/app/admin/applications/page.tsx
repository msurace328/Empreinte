"use client";
import React, { useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { Application } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldAlert, MoreHorizontal, UserCheck, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

interface CopilotReview {
    disposition: 'Approved' | 'Rejected' | 'Waitlisted' | 'NeedsInfo';
    riskScore: number;
    rationale: string;
    signals: string[];
    applicantMessage: string;
}

export default function ApplicationsPage() {
    const { applications, approveApplication, rejectApplication, waitlistApplication, requestInfoApplication, issueInvoice, invoices } = useData();
    const [issued, setIssued] = useState<{ id: string; name: string; amount: number; token: string } | null>(null);
    const apps = applications.filter(a => !['Approved', 'Rejected'].includes(a.status));

    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [reason, setReason] = useState('');
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [isConfirmDestructiveOpen, setIsConfirmDestructiveOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState<Application['status'] | null>(null);
    const { user } = useAuth();

    // Copilot state
    const [copilotApp, setCopilotApp] = useState<Application | null>(null);
    const [copilotLoading, setCopilotLoading] = useState(false);
    const [copilotError, setCopilotError] = useState<string | null>(null);
    const [copilotReview, setCopilotReview] = useState<CopilotReview | null>(null);
    const [copilotToolCount, setCopilotToolCount] = useState(0);

    const operatorId = () => (user ? `${user.role}.${user.name.split(' ')[1] || user.name}` : 'Operator.Unknown');

    const handleAction = (action: Application['status'], app: Application) => {
        setCurrentAction(action);
        setSelectedApp(app);
        if (action === 'Rejected') setIsConfirmDestructiveOpen(true);
        else setIsActionOpen(true);
    };

    const applyDecision = (action: Application['status'], app: Application, op: string, why: string) => {
        if (action === 'Approved') {
            approveApplication(app.id, op, why);
            // Vetting cleared — now, and only now, we ask for payment.
            const inv = issueInvoice({ applicationId: app.id, operator: op });
            if (inv) setIssued({ id: inv.id, name: inv.memberName, amount: inv.amount, token: inv.checkoutToken });
        }
        else if (action === 'Rejected') rejectApplication(app.id, op, why);
        else if (action === 'Waitlisted') waitlistApplication(app.id, op, why);
        else if (action === 'NeedsInfo') requestInfoApplication(app.id, op, why);
    };

    const confirmAction = () => {
        if (!selectedApp || !currentAction || !user) return;
        applyDecision(currentAction, selectedApp, operatorId(), reason);
        setIsActionOpen(false);
        setIsConfirmDestructiveOpen(false);
        setReason('');
    };

    const runCopilot = async (app: Application) => {
        setCopilotApp(app);
        setCopilotReview(null);
        setCopilotError(null);
        setCopilotToolCount(0);
        setCopilotLoading(true);
        try {
            const res = await fetch('/api/application-copilot', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ applicationId: app.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Copilot error ${res.status}`);
            setCopilotReview(data.review as CopilotReview);
            setCopilotToolCount(Array.isArray(data.toolCalls) ? data.toolCalls.length : 0);
        } catch (e) {
            setCopilotError(e instanceof Error ? e.message : 'Copilot failed');
        } finally {
            setCopilotLoading(false);
        }
    };

    const acceptCopilot = () => {
        if (!copilotApp || !copilotReview || !user) return;
        const why = `Accepted Copilot recommendation: ${copilotReview.rationale}`;
        applyDecision(copilotReview.disposition, copilotApp, operatorId(), why);
        setCopilotApp(null);
        setCopilotReview(null);
    };

    const dispositionTone = (d: string) =>
        d === 'Approved' ? 'text-emerald-500 border-emerald-500/40'
        : d === 'Rejected' ? 'text-signal-red border-signal-red/40'
        : 'text-signal-amber border-signal-amber/40';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
                    <p className="text-muted-foreground mt-1">Vetting pending applications for ARENA membership.</p>
                </div>
                <div className="flex gap-2 items-center">
                    {invoices.filter(i => i.status === 'Awaiting payment').length > 0 && (
                        <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 bg-signal-amber/5 text-signal-amber border-signal-amber/20">
                            {invoices.filter(i => i.status === 'Awaiting payment').length} AWAITING PAYMENT
                        </Badge>
                    )}
                    <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 bg-signal-cyan/5 text-signal-cyan border-signal-cyan/20">
                        {apps.length} PENDING
                    </Badge>
                </div>
            </div>

            {issued && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.07] p-4 flex items-start justify-between gap-4 flex-wrap animate-in fade-in slide-in-from-top-2">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-emerald-400">
                            {issued.name} approved · payment link issued for ${issued.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            No card was taken during vetting. Send them this link to complete membership.
                        </p>
                        <code className="text-[10px] font-mono text-muted-foreground/80 mt-2 block truncate">
                            /checkout?t={issued.token}
                        </code>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button asChild size="sm" className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90">
                            <Link href={`/checkout?t=${issued.token}`} target="_blank">Open link</Link>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIssued(null)} className="text-muted-foreground">Dismiss</Button>
                    </div>
                </div>
            )}

            <Card className="glass border-border-muted overflow-hidden">
                <Table>
                    <TableHeader className="bg-canvas-muted/50">
                        <TableRow className="border-border-muted hover:bg-transparent">
                            <TableHead className="w-[300px] font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Applicant</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tier</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Risk State</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {apps.map((app) => (
                            <TableRow key={app.id} className="border-border-muted hover:bg-canvas-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border border-border-muted shadow-sm"><AvatarImage src={app.avatarUrl} /><AvatarFallback>{app.name.charAt(0)}</AvatarFallback></Avatar>
                                        <div><p className="text-sm font-medium">{app.name}</p><p className="text-[10px] text-muted-foreground font-mono">{app.email}</p></div>
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant="outline" className={cn("font-mono text-[10px]", app.tier === 'Founder' ? "border-amber-500/50 text-amber-500" : (app.tier === 'Suite' ? "border-signal-cyan/50 text-signal-cyan" : "border-slate-500/50 text-slate-400"))}>{app.tier}</Badge></TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 max-w-[120px] h-1.5 bg-canvas-muted rounded-full overflow-hidden border border-border-muted/50">
                                            <div className={cn("h-full transition-all duration-1000", app.riskScore > 70 ? "bg-signal-red shadow-[0_0_8px_rgba(239,68,68,0.4)]" : (app.riskScore > 30 ? "bg-signal-amber" : "bg-emerald-500"))} style={{ width: `${app.riskScore}%` }} />
                                        </div>
                                        <span className={cn("text-[10px] font-bold font-mono", app.riskScore > 70 ? "text-signal-red" : (app.riskScore > 30 ? "text-signal-amber" : "text-emerald-500"))}>{app.riskScore}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => runCopilot(app)} className="text-xs font-mono uppercase tracking-widest text-signal-cyan hover:text-signal-cyan/80">
                                            <Sparkles className="mr-1 size-3.5" /> Copilot
                                        </Button>
                                        <Button asChild variant="ghost" size="sm" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-signal-cyan"><Link href={`/admin/members/${app.id}`}>Profile</Link></Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="glass border-border-muted w-48">
                                                <DropdownMenuItem className="text-emerald-500" onClick={() => handleAction('Approved', app)}><UserCheck className="mr-2 size-4" /> Approve</DropdownMenuItem>
                                                <DropdownMenuItem className="text-signal-red" onClick={() => handleAction('Rejected', app)}><ShieldAlert className="mr-2 size-4" /> Reject</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Copilot review dialog: the agent recommends, the operator decides. */}
            <Dialog open={!!copilotApp} onOpenChange={(open) => { if (!open) { setCopilotApp(null); setCopilotReview(null); setCopilotError(null); } }}>
                <DialogContent className="glass border-border-muted max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="size-4 text-signal-cyan" />
                            Copilot review{copilotApp ? `: ${copilotApp.name}` : ''}
                        </DialogTitle>
                    </DialogHeader>

                    {copilotLoading && (
                        <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            <span className="text-sm">Investigating records: identity reuse, referral proximity, domain intelligence...</span>
                        </div>
                    )}

                    {copilotError && (
                        <div className="rounded-lg border border-signal-red/30 bg-signal-red/[0.07] p-3 text-sm text-signal-red">{copilotError}</div>
                    )}

                    {copilotReview && !copilotLoading && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn("font-mono text-xs py-1 px-3", dispositionTone(copilotReview.disposition))}>
                                    RECOMMEND: {copilotReview.disposition.toUpperCase()}
                                </Badge>
                                <span className="text-xs font-mono text-muted-foreground">Copilot risk {copilotReview.riskScore}/100 · {copilotToolCount} record searches</span>
                            </div>
                            <p className="text-sm text-foreground/90">{copilotReview.rationale}</p>
                            {copilotReview.signals.length > 0 && (
                                <ul className="space-y-1">
                                    {copilotReview.signals.map((s, i) => (
                                        <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-signal-cyan shrink-0">›</span>{s}</li>
                                    ))}
                                </ul>
                            )}
                            <div className="rounded-lg border border-border-muted bg-canvas-muted/40 p-3">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Drafted applicant message</p>
                                <p className="text-xs text-foreground/80 whitespace-pre-wrap">{copilotReview.applicantMessage}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Accepting records this decision to the audit chain under your operator identity, with the Copilot rationale as the reason.</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setCopilotApp(null); setCopilotReview(null); }}>Dismiss (decide manually)</Button>
                        <Button onClick={acceptCopilot} disabled={!copilotReview || copilotLoading} className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90">
                            Accept recommendation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
                <DialogContent className="glass border-border-muted"><DialogHeader><DialogTitle>Confirm Decision</DialogTitle></DialogHeader>
                    <div className="py-4"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="bg-canvas-muted" /></div>
                    <DialogFooter><Button variant="ghost" onClick={() => setIsActionOpen(false)}>Cancel</Button><Button onClick={confirmAction}>Execute</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isConfirmDestructiveOpen} onOpenChange={setIsConfirmDestructiveOpen}>
                <AlertDialogContent className="glass border-signal-red/20 bg-canvas-card">
                    <AlertDialogHeader><AlertDialogTitle className="text-signal-red">Confirm Rejection</AlertDialogTitle></AlertDialogHeader>
                    <div className="py-2"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection Reason" className="bg-canvas-muted" /></div>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => setIsConfirmDestructiveOpen(false)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-signal-red text-white" onClick={confirmAction}>Reject</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
