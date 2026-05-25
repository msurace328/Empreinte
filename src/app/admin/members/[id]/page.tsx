"use client";
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
        restrictMember(id, `${user.role}.${user.name}`, reason || "Administrative restriction triggered from dossier");
        setIsConfirmRestrictOpen(false);
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
}