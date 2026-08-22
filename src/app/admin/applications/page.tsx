"use client";
import React, { useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { Application } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, ShieldAlert, MoreHorizontal, UserCheck, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

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

    const handleAction = (action: Application['status'], app: Application) => {
        setCurrentAction(action);
        setSelectedApp(app);
        if (action === 'Rejected') setIsConfirmDestructiveOpen(true);
        else setIsActionOpen(true);
    };

    const confirmAction = () => {
        if (!selectedApp || !currentAction || !user) return;
        const op = `${user.role}.${user.name.split(' ')[1] || user.name}`;
        
        if (currentAction === 'Approved') {
            approveApplication(selectedApp.id, op, reason);
            // Vetting cleared — now, and only now, we ask for payment.
            const inv = issueInvoice({ applicationId: selectedApp.id, operator: op });
            if (inv) setIssued({ id: inv.id, name: inv.memberName, amount: inv.amount, token: inv.checkoutToken });
        }
        else if (currentAction === 'Rejected') rejectApplication(selectedApp.id, op, reason);
        else if (currentAction === 'Waitlisted') waitlistApplication(selectedApp.id, op, reason);
        else if (currentAction === 'NeedsInfo') requestInfoApplication(selectedApp.id, op, reason);
        
        setIsActionOpen(false);
        setIsConfirmDestructiveOpen(false);
        setReason('');
    };

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