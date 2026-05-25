'use client';

import React, { useEffect, useState } from 'react';
import { dataService } from '@/lib/services/data-service';
import { Member } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, MoreHorizontal, UserCheck, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';

export default function MembersDirectoryPage() {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        dataService.getMembers().then(setMembers);
    }, []);

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddMember = async () => {
        if (!newName || !newEmail || !user) return;

        // Mocking a new member add
        const newMember: Member = {
            id: `m-${Date.now().toString().slice(-4)}`,
            name: newName,
            email: newEmail,
            avatarUrl: '',
            tier: 'Associate',
            status: 'Active',
            joinDate: new Date().toISOString(),
            lastAccess: new Date().toISOString(),
            trustScore: 85,
        };

        // We should add a method to DataService for this, but for now we can mock it or just log it
        await dataService.addAuditEntry(
            `${user.role}.${user.name.split(' ')[1] || user.name}`,
            'ADD_MEMBER',
            newMember.id,
            `Manual onboarding: ${newName} (${newEmail})`
        );

        setIsAddOpen(false);
        setNewName('');
        setNewEmail('');
        // In a real app we'd push to the service, here we'll just show success
        alert(`Member ${newName} added and logged to audit trail.`);
        dataService.getMembers().then(setMembers);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Members Directory</h1>
                    <p className="text-muted-foreground mt-1">Operational view of all ARENA active and restricted accounts.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-mono text-[10px] uppercase tracking-widest">
                            Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass border-border-muted">
                        <DialogHeader>
                            <DialogTitle>Quick Onboard Member</DialogTitle>
                            <DialogDescription className="text-xs font-mono uppercase tracking-tight">Manual Administrative Entry</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Full Name</label>
                                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. John Doe" className="bg-canvas-muted border-border-muted" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Email Address</label>
                                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@example.com" className="bg-canvas-muted border-border-muted" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90" onClick={handleAddMember}>Confirm Onboarding</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or ID..."
                        className="pl-10 glass border-border-muted bg-canvas-muted/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="glass border-border-muted">
                    <Filter className="size-4" />
                </Button>
            </div>

            <Card className="glass border-border-muted overflow-hidden">
                <Table>
                    <TableHeader className="bg-canvas-muted/50">
                        <TableRow className="border-border-muted hover:bg-transparent">
                            <TableHead className="w-[300px] font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Member</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tier</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Trust</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Last Access</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Profile</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((member) => (
                            <TableRow
                                key={member.id}
                                className="border-border-muted hover:bg-canvas-muted/30 transition-colors cursor-pointer group"
                                onClick={() => router.push(`/admin/members/${member.id}`)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border border-border-muted shadow-sm">
                                            <AvatarImage src={member.avatarUrl} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{member.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">{member.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px]",
                                        member.tier === 'Founder' ? "border-amber-500/50 text-amber-500 bg-amber-500/5" : (member.tier === 'Suite' ? "border-signal-cyan/50 text-signal-cyan bg-signal-cyan/5" : "border-slate-500/50 text-slate-400 bg-slate-500/5")
                                    )}>
                                        {member.tier}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "size-1.5 rounded-full",
                                            member.status === 'Active' ? "bg-emerald-500" : (member.status === 'Watch' ? "bg-amber-500" : "bg-rose-500")
                                        )} />
                                        <span className="text-[10px] font-mono uppercase tracking-wider">{member.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold font-mono px-1.5 py-0.5 rounded",
                                            member.trustScore > 90 ? "bg-emerald-500/10 text-emerald-500" : (member.trustScore > 60 ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500")
                                        )}>
                                            {member.trustScore}%
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-[10px] font-mono text-muted-foreground">{format(new Date(member.lastAccess), 'MMM d, HH:mm')}</p>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground group-hover:text-signal-cyan">
                                        <ArrowUpRight className="size-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
