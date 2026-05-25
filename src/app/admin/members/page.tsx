"use client";
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
            id: `m-${Date.now().toString().slice(-4)}`,
            name: newName,
            email: newName.toLowerCase().replace(' ', '') + '@test.com',
            avatarUrl: '',
            tier: 'Associate',
            status: 'Active',
            joinDate: new Date().toISOString(),
            lastAccess: new Date().toISOString(),
            trustScore: 85,
        }, `${user.role}.${user.name}`);
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
                            <TableCell className="text-right"><Button variant="outline" asChild size="sm"><Link href={`/admin/members/${m.id}`}>View Profile</Link></Button></TableCell>
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
}