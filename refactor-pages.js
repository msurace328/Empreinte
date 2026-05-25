const fs = require('fs');
const path = require('path');

const writePage = (subpath, content) => {
  const fullPath = path.join(__dirname, 'src/app/admin', subpath);
  fs.writeFileSync(fullPath, content);
  console.log('Wrote', subpath);
};

writePage('applications/page.tsx', `"use client";
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
    const { applications, approveApplication, rejectApplication, waitlistApplication, requestInfoApplication } = useData();
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
        const op = \`\${user.role}.\${user.name.split(' ')[1] || user.name}\`;
        
        if (currentAction === 'Approved') approveApplication(selectedApp.id, op, reason);
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
                <div className="flex gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 bg-signal-cyan/5 text-signal-cyan border-signal-cyan/20">
                        {apps.length} PENDING
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
                                            <div className={cn("h-full transition-all duration-1000", app.riskScore > 70 ? "bg-signal-red shadow-[0_0_8px_rgba(239,68,68,0.4)]" : (app.riskScore > 30 ? "bg-signal-amber" : "bg-emerald-500"))} style={{ width: \`\${app.riskScore}%\` }} />
                                        </div>
                                        <span className={cn("text-[10px] font-bold font-mono", app.riskScore > 70 ? "text-signal-red" : (app.riskScore > 30 ? "text-signal-amber" : "text-emerald-500"))}>{app.riskScore}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button asChild variant="ghost" size="sm" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-signal-cyan"><Link href={\`/admin/members/\${app.id}\`}>Profile</Link></Button>
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
}`);

writePage('revenue/page.tsx', `"use client";
import React from 'react';
import { useData } from '@/lib/providers/data-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function RevenuePage() {
    const { opportunities, approveOpportunity, dismissOpportunity } = useData();
    const { user } = useAuth();
    
    const handleApprove = (id: string) => {
        if (!user) return;
        approveOpportunity(id, \`\${user.role}.\${user.name}\`, "Revenue opportunity enacted via dashboard");
    };

    const handleDismiss = (id: string) => {
        if (!user) return;
        dismissOpportunity(id, \`\${user.role}.\${user.name}\`, "Revenue opportunity dismissed manually");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Revenue Intelligence</h1>
                <p className="text-muted-foreground mt-1">AI-surfaced opportunities for business expansion.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map(opp => (
                    <Card key={opp.id} className="glass border-border-muted relative overflow-hidden">
                        <CardHeader className="pb-4">
                            <Badge variant="outline" className="w-fit font-mono text-[10px]">{opp.type}</Badge>
                            <CardTitle className="text-xl mt-2">{opp.title}</CardTitle>
                            <CardDescription className="text-xs">{opp.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-mono text-signal-cyan font-bold tracking-tighter mb-6">+\${opp.potentialValue.toLocaleString()}</div>
                            {opp.status === 'Open' ? (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 text-muted-foreground" onClick={() => handleDismiss(opp.id)}>DISMISS</Button>
                                    <Button size="sm" className="flex-1 bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90" onClick={() => handleApprove(opp.id)}>APPROVE <ArrowRight className="ml-1 size-3"/></Button>
                                </div>
                            ) : (
                                <div className="text-emerald-500 font-mono text-[10px] uppercase flex items-center gap-2">
                                    <CheckCircle2 className="size-4" /> {opp.status}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}`);

writePage('members/[id]/page.tsx', `"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/lib/providers/data-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, ShieldAlert, ChevronLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

export default function MemberProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { members, applications, restrictMember, reinstateMember, approveApplication } = useData();
    const { user } = useAuth();
    
    const [reason, setReason] = useState('');
    const [isConfirmRestrictOpen, setIsConfirmRestrictOpen] = useState(false);
    
    const id = params.id as string;
    const profile = members.find(m => m.id === id) || applications.find(a => a.id === id);
    if (!profile) return <div className="p-8 font-mono">Loading dossier...</div>;

    const isApp = 'riskScore' in profile && !('trustScore' in profile);
    const score = isApp ? 100 - (profile as any).riskScore : (profile as any).trustScore;

    const handleRestrict = () => {
        if (!user) return;
        restrictMember(id, \`\${user.role}.\${user.name}\`, reason || "Administrative restriction triggered from dossier");
        setIsConfirmRestrictOpen(false);
    };

    const handleReinstate = () => {
        if (!user) return;
        reinstateMember(id, \`\${user.role}.\${user.name}\`, "Account reinstated after manual review");
    };

    const handleApprove = () => {
        if (!user) return;
        approveApplication(id, \`\${user.role}.\${user.name}\`, "Manual approval from dossier");
        router.push('/admin/applications');
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.back()}><ChevronLeft className="mr-2 size-4" /> Back</Button>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass h-9 text-[10px]" onClick={() => alert('Dossier download initiated...')}>Download Dossier</Button>
                    {isApp ? (
                        <Button onClick={handleApprove} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] h-9">Approve Application</Button>
                    ) : profile.status === 'Restricted' ? (
                        <Button onClick={handleReinstate} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] h-9">Reinstate Account</Button>
                    ) : (
                        <Button onClick={() => setIsConfirmRestrictOpen(true)} className="bg-signal-red/10 text-signal-red border border-signal-red/20 text-[10px] h-9">Restrict Account</Button>
                    )}
                </div>
            </div>

            <Card className="glass border-border-muted p-8">
                <div className="flex flex-col items-center">
                    <Avatar className="size-32"><AvatarImage src={profile.avatarUrl} /><AvatarFallback>{profile.name.charAt(0)}</AvatarFallback></Avatar>
                    <h2 className="text-2xl font-bold mt-4">{profile.name}</h2>
                    <Badge variant="outline" className="mt-2 text-[10px] uppercase font-mono">{profile.status}</Badge>
                </div>
            </Card>

            <AlertDialog open={isConfirmRestrictOpen} onOpenChange={setIsConfirmRestrictOpen}>
                <AlertDialogContent className="glass border-signal-red/20 bg-canvas-card">
                    <AlertDialogHeader><AlertDialogTitle className="text-signal-red">Confirm Restriction</AlertDialogTitle></AlertDialogHeader>
                    <div className="py-4"><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason" className="bg-canvas-muted" /></div>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => setIsConfirmRestrictOpen(false)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-signal-red text-white" onClick={handleRestrict}>Confirm Restriction</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}`);

writePage('members/page.tsx', `"use client";
import React, { useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export default function MembersPage() {
    const { members, addMember } = useData();
    const { user } = useAuth();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const handleAddMember = () => {
        if (!user || !newName) return;
        addMember({
            id: \`m-\${Date.now().toString().slice(-4)}\`,
            name: newName,
            email: newName.toLowerCase().replace(' ', '') + '@test.com',
            avatarUrl: '',
            tier: 'Associate',
            status: 'Active',
            joinDate: new Date().toISOString(),
            lastAccess: new Date().toISOString(),
            trustScore: 85,
        }, \`\${user.role}.\${user.name}\`);
        setIsAddOpen(false);
        setNewName('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <h1 className="text-3xl font-bold">Directory</h1>
                <Button onClick={() => setIsAddOpen(true)}>Add Member</Button>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                    {members.map(m => (
                        <TableRow key={m.id}>
                            <TableCell>{m.name}</TableCell>
                            <TableCell><Badge>{m.status}</Badge></TableCell>
                            <TableCell className="text-right"><Button variant="outline" asChild size="sm"><Link href={\`/admin/members/\${m.id}\`}>View Profile</Link></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent><DialogHeader><DialogTitle>Add Member</DialogTitle></DialogHeader>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Member Name" />
                    <DialogFooter><Button onClick={handleAddMember}>Add</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}`);

writePage('audit/page.tsx', `"use client";
import React from 'react';
import { useData } from '@/lib/providers/data-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function AuditPage() {
    const { auditLog } = useData();

    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <h1 className="text-3xl font-bold">Audit Trail</h1>
                <Button variant="outline" onClick={() => alert('Exporting audit log...')}>Export PDF</Button>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Operator</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
                <TableBody>
                    {auditLog.map(entry => (
                        <TableRow key={entry.id}>
                            <TableCell className="text-xs font-mono">{format(new Date(entry.timestamp), 'HH:mm:ss')}</TableCell>
                            <TableCell><Badge>{entry.action}</Badge></TableCell>
                            <TableCell className="text-xs font-mono">{entry.targetId}</TableCell>
                            <TableCell className="text-xs">{entry.operator}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{entry.reason}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}`);

writePage('access/page.tsx', `"use client";
import React from 'react';
import { useData } from '@/lib/providers/data-provider';

export default function AccessPage() {
    return <div><h1 className="text-3xl font-bold">Access</h1><p>View access history here.</p></div>;
}`);

