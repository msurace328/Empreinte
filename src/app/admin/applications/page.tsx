'use client';

import React, { useEffect, useState } from 'react';
import { dataService } from '@/lib/services/data-service';
import { intelligenceService } from '@/lib/services/intelligence-service';
import { Application, RiskSignal } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, ShieldAlert, MoreHorizontal, UserCheck, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export default function ApplicationsPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [reason, setReason] = useState('');
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [isConfirmDestructiveOpen, setIsConfirmDestructiveOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState<Application['status'] | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        dataService.getApplications().then(setApps);
    }, []);

    const handleAction = (action: Application['status'], app: Application) => {
        setCurrentAction(action);
        setSelectedApp(app);
        if (action === 'Rejected') {
            setIsConfirmDestructiveOpen(true);
        } else {
            setIsActionOpen(true);
        }
    };

    const confirmAction = async () => {
        if (!selectedApp || !currentAction || !user) return;

        await dataService.updateApplicationStatus(
            selectedApp.id,
            currentAction,
            `${user.role}.${user.name.split(' ')[1] || user.name}`,
            reason || `Manual ${currentAction} from dashboard.`
        );

        const updatedApps = await dataService.getApplications();
        setApps(updatedApps);
        setIsActionOpen(false);
        setReason('');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
                    <p className="text-muted-foreground mt-1">Vetting pending applications for ARENA membership.</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 bg-signal-cyan/5 text-signal-cyan border-signal-cyan/20">
                        {apps.filter(a => !['Approved', 'Rejected'].includes(a.status)).length} PENDING
                    </Badge>
                </div>
            </div>

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
                        {apps.filter(a => !['Approved', 'Rejected'].includes(a.status)).map((app) => (
                            <TableRow key={app.id} className="border-border-muted hover:bg-canvas-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border border-border-muted shadow-sm">
                                            <AvatarImage src={app.avatarUrl} />
                                            <AvatarFallback>{app.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{app.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">{app.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px]",
                                        app.tier === 'Founder' ? "border-amber-500/50 text-amber-500" : (app.tier === 'Suite' ? "border-signal-cyan/50 text-signal-cyan" : "border-slate-500/50 text-slate-400")
                                    )}>
                                        {app.tier}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 max-w-[120px] h-1.5 bg-canvas-muted rounded-full overflow-hidden border border-border-muted/50">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    app.riskScore > 70 ? "bg-signal-red shadow-[0_0_8px_rgba(239,68,68,0.4)]" : (app.riskScore > 30 ? "bg-signal-amber" : "bg-emerald-500")
                                                )}
                                                style={{ width: `${app.riskScore}%` }}
                                            />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold font-mono",
                                            app.riskScore > 70 ? "text-signal-red" : (app.riskScore > 30 ? "text-signal-amber" : "text-emerald-500")
                                        )}>
                                            {app.riskScore}%
                                        </span>
                                        {app.riskScore > 70 && <ShieldAlert className="size-3 text-signal-red animate-pulse" />}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-signal-cyan"
                                        >
                                            <Link href={`/admin/members/${app.id}`}>Profile</Link>
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="glass border-border-muted w-48">
                                                <DropdownMenuLabel>Decisions</DropdownMenuLabel>
                                                <DropdownMenuItem className="text-emerald-500" onClick={() => handleAction('Approved', app)}>
                                                    <UserCheck className="mr-2 size-4" /> Approve
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-amber-500" onClick={() => handleAction('Waitlisted', app)}>
                                                    <Clock className="mr-2 size-4" /> Waitlist
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-blue-500" onClick={() => handleAction('NeedsInfo', app)}>
                                                    <AlertTriangle className="mr-2 size-4" /> Request Info
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-signal-red" onClick={() => handleAction('Rejected', app)}>
                                                    <ShieldAlert className="mr-2 size-4" /> Reject
                                                </DropdownMenuItem>
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
                <DialogContent className="glass border-border-muted sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {currentAction === 'Approved' ? <ShieldCheck className="text-emerald-500" /> :
                                currentAction === 'NeedsInfo' ? <AlertTriangle className="text-blue-500" /> :
                                    <Clock className="text-amber-500" />}
                            Confirm Decision: {currentAction}
                        </DialogTitle>
                        <DialogDescription className="font-mono text-xs uppercase tracking-tight">
                            For {selectedApp?.name} ({selectedApp?.id})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Reason for decision (writes to audit log)</label>
                            <Input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={currentAction === 'NeedsInfo' ? "Specify what info is missing..." : "Enter explanation..."}
                                className="bg-canvas-muted border-border-muted"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsActionOpen(false)}>Cancel</Button>
                        <Button className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90" onClick={confirmAction}>Execute</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isConfirmDestructiveOpen} onOpenChange={setIsConfirmDestructiveOpen}>
                <AlertDialogContent className="glass border-signal-red/20 bg-canvas-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-signal-red flex items-center gap-2">
                            <ShieldAlert className="size-5" /> Confirm Rejection
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Are you sure you want to REJECT this application? This action is logged and will notify the candidate.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Rejection Reason</label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Identity verification failure"
                            className="bg-canvas-muted border-border-muted mt-2"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsConfirmDestructiveOpen(false); setReason(''); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-signal-red text-white hover:bg-signal-red/90"
                            onClick={confirmAction}
                        >
                            Reject Application
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
