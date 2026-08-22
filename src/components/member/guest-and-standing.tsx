'use client';

import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { Member } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { UserPlus, ShieldCheck, Clock, Check, X, TrendingUp } from 'lucide-react';

const GUEST_ALLOWANCE: Record<Member['tier'], number> = {
    Associate: 2,
    Suite: 8,
    Founder: 999,
};

// What actually moves a member's standing. Shown to the member so the score
// is something they can act on rather than a number done to them.
function standingFactors(member: Member, sponsoredCount: number, deniedCount: number) {
    return [
        { label: 'Identity verified', ok: member.trustScore >= 50, note: 'Government ID on file and matched.' },
        { label: 'Billing current', ok: member.status !== 'Restricted', note: 'No outstanding balance on the season.' },
        { label: 'Access pattern normal', ok: member.status === 'Active', note: 'No concurrent-use or off-hours anomalies.' },
        { label: 'Guests in good standing', ok: deniedCount === 0, note: sponsoredCount ? `${sponsoredCount} guest${sponsoredCount > 1 ? 's' : ''} sponsored, ${deniedCount} denied.` : 'No guests sponsored yet.' },
    ];
}

export function GuestAndStanding({ member }: { member: Member }) {
    const { guests, sponsorGuest } = useData();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [justAdded, setJustAdded] = useState<string | null>(null);

    const mine = useMemo(() => guests.filter(g => g.sponsorId === member.id), [guests, member.id]);
    const allowance = GUEST_ALLOWANCE[member.tier];
    const used = mine.filter(g => g.status !== 'Denied').length;
    const denied = mine.filter(g => g.status === 'Denied').length;
    const unlimited = allowance >= 999;

    const factors = standingFactors(member, mine.length, denied);
    const tone = member.trustScore >= 70 ? 'text-emerald-500' : member.trustScore >= 40 ? 'text-signal-amber' : 'text-signal-red';

    const submit = () => {
        if (!name.trim()) return;
        const g = sponsorGuest({ name: name.trim(), sponsorId: member.id, sponsorName: member.name });
        setJustAdded(g.name);
        setName('');
        setOpen(false);
        setTimeout(() => setJustAdded(null), 5000);
    };

    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Guests */}
            <Card className="glass border-border-muted">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div>
                        <CardTitle className="text-lg">Your guests</CardTitle>
                        <CardDescription className="text-xs mt-1">
                            {unlimited ? 'Unlimited sponsored passes' : `${used} of ${allowance} passes used this season`}
                        </CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" disabled={!unlimited && used >= allowance}
                                className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 shrink-0">
                                <UserPlus className="mr-1.5 size-3.5" /> Sponsor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-border-muted bg-canvas-card">
                            <DialogHeader>
                                <DialogTitle>Sponsor a guest</DialogTitle>
                                <DialogDescription className="text-xs">
                                    You are vouching for this person. They still clear ID, billing, and background
                                    checks before a pass is issued — and their conduct reflects on your standing.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 py-2">
                                <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Guest name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                                    placeholder="Full name as it appears on their ID" className="bg-canvas-muted" />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={submit} disabled={!name.trim()}
                                    className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90">
                                    Submit for vetting
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="space-y-2">
                    {justAdded && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 animate-in fade-in slide-in-from-top-1">
                            {justAdded} submitted — the membership team is vetting them now.
                        </div>
                    )}
                    {mine.length === 0 && !justAdded && (
                        <p className="text-xs text-muted-foreground py-4">
                            No guests yet. Sponsor someone and we vet them before the night of.
                        </p>
                    )}
                    {mine.map(g => (
                        <div key={g.id} className="flex items-center justify-between gap-3 rounded-lg border border-border-muted bg-canvas-muted/30 px-3 py-2.5">
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{g.name}</p>
                                <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                    <Clock className="size-2.5" /> {format(new Date(g.requestedAt), 'MMM d')} · {g.id}
                                </p>
                            </div>
                            <Badge variant="outline" className={cn('font-mono text-[9px] shrink-0',
                                g.status === 'Approved' ? 'border-emerald-500/25 text-emerald-500 bg-emerald-500/5' :
                                g.status === 'Denied' ? 'border-signal-red/25 text-signal-red bg-signal-red/5' :
                                'border-signal-amber/25 text-signal-amber bg-signal-amber/5')}>
                                {g.status === 'Approved' ? 'PASS ISSUED' : g.status === 'Denied' ? 'DENIED' : 'VETTING'}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Standing */}
            <Card className="glass border-border-muted">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Your standing</CardTitle>
                            <CardDescription className="text-xs mt-1">
                                What ARENA sees when you walk up to the door.
                            </CardDescription>
                        </div>
                        <div className="text-right shrink-0">
                            <div className={cn('text-3xl font-mono font-bold tracking-tighter', tone)}>{member.trustScore}</div>
                            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Trust score</div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                    <div className="h-1.5 rounded-full bg-canvas-muted overflow-hidden border border-border-muted/50">
                        <div className={cn('h-full transition-all duration-1000',
                            member.trustScore >= 70 ? 'bg-emerald-500' : member.trustScore >= 40 ? 'bg-signal-amber' : 'bg-signal-red')}
                            style={{ width: `${member.trustScore}%` }} />
                    </div>
                    {factors.map(f => (
                        <div key={f.label} className="flex items-start gap-2.5 py-1.5">
                            <div className={cn('mt-0.5 rounded p-0.5', f.ok ? 'bg-emerald-500/10 text-emerald-500' : 'bg-signal-amber/10 text-signal-amber')}>
                                {f.ok ? <Check className="size-3" /> : <X className="size-3" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium">{f.label}</p>
                                <p className="text-[10px] text-muted-foreground leading-snug">{f.note}</p>
                            </div>
                        </div>
                    ))}
                    <p className="text-[10px] font-mono text-muted-foreground/70 pt-2 flex items-center gap-1.5">
                        {member.trustScore >= 70
                            ? <><ShieldCheck className="size-3 text-emerald-500" /> Cleared for entry at every gate.</>
                            : <><TrendingUp className="size-3 text-signal-amber" /> Clear the open items to restore full access.</>}
                    </p>
                </CardContent>
            </Card>
        </section>
    );
}
