"use client";
import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Member, Guest } from '@/lib/types';
import { DoorOpen, Search, ShieldCheck, ShieldAlert, Ban, UserCheck, ScanLine, Clock, TriangleAlert } from 'lucide-react';

const GATES = ['North Gate', 'Suite Level', 'Members Entrance'];

type Subject =
    | { kind: 'Member'; data: Member }
    | { kind: 'Guest'; data: Guest };

export default function DoorPage() {
    const { members, guests, checkIns, recordCheckIn } = useData();
    const { user } = useAuth();

    const [query, setQuery] = useState('');
    const [gate, setGate] = useState(GATES[0]);
    const [selected, setSelected] = useState<Subject | null>(null);
    const [overrideOpen, setOverrideOpen] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [flash, setFlash] = useState<{ tone: 'ok' | 'deny'; text: string } | null>(null);

    const operator = user ? `${user.role}.${user.name.split(' ').pop()}` : 'operator';

    const results = useMemo<Subject[]>(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        const m: Subject[] = members
            .filter(x => x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || x.email.toLowerCase().includes(q))
            .map(data => ({ kind: 'Member' as const, data }));
        const g: Subject[] = guests
            .filter(x => x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q))
            .map(data => ({ kind: 'Guest' as const, data }));
        return [...m, ...g].slice(0, 6);
    }, [query, members, guests]);

    // What the door decides, and why — the operator sees the reason, not just a verdict.
    const verdict = useMemo(() => {
        if (!selected) return null;
        if (selected.kind === 'Member') {
            const m = selected.data;
            if (m.status === 'Restricted') return { admit: false, headline: 'Access pulled', reason: 'This membership is restricted. Do not admit — route to a membership director.' };
            if (m.status === 'Watch') return { admit: true, headline: 'Admit with a note', reason: 'On the watchlist. Admit normally, but the entry is flagged for review.' };
            if (m.trustScore < 40) return { admit: false, headline: 'Trust below threshold', reason: `Trust score ${m.trustScore} is under the admit floor of 40.` };
            return { admit: true, headline: 'Cleared', reason: `${m.tier} membership in good standing.` };
        }
        const g = selected.data;
        if (g.status === 'Denied') return { admit: false, headline: 'Guest pass denied', reason: `This request was denied at vetting. Sponsor was ${g.sponsorName}. Do not admit.` };
        if (g.status === 'Pending') return { admit: false, headline: 'No pass issued yet', reason: `Still awaiting a vetting decision — no pass exists. Sponsor is ${g.sponsorName}. Route to the membership desk.` };
        const failed = [
            !g.checks.idVerified && 'ID not verified',
            !g.checks.billingCurrent && 'billing not current',
            !g.checks.backgroundClear && 'background not clear',
        ].filter(Boolean) as string[];
        if (failed.length) return { admit: false, headline: 'Guest vetting incomplete', reason: `Outstanding: ${failed.join(', ')}. Sponsor is ${g.sponsorName}.` };
        return { admit: true, headline: 'Guest cleared', reason: `Pass valid. Sponsored by ${g.sponsorName}.` };
    }, [selected]);

    const commit = (result: 'Admitted' | 'Denied' | 'Override', reason: string) => {
        if (!selected) return;
        recordCheckIn({ subjectId: selected.data.id, subjectKind: selected.kind, result, reason, gate, operator });
        setFlash({
            tone: result === 'Denied' ? 'deny' : 'ok',
            text: result === 'Denied' ? `Turned away · ${selected.data.name}` : `${result === 'Override' ? 'Override admit' : 'Admitted'} · ${selected.data.name}`,
        });
        setSelected(null);
        setQuery('');
        setTimeout(() => setFlash(null), 2600);
    };

    const todays = checkIns.length;
    const denied = checkIns.filter(c => c.result === 'Denied').length;
    const overrides = checkIns.filter(c => c.result === 'Override').length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Door Console</h1>
                    <p className="text-muted-foreground mt-1">Look up whoever is standing in front of you and decide, fast.</p>
                </div>
                <div className="flex items-center gap-2">
                    {GATES.map(g => (
                        <Button key={g} size="sm" variant="outline"
                            onClick={() => setGate(g)}
                            className={cn('h-8 text-[10px] font-mono uppercase tracking-wider border-border-muted',
                                gate === g ? 'bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30' : 'text-muted-foreground')}>
                            {g}
                        </Button>
                    ))}
                </div>
            </div>

            {flash && (
                <div className={cn('rounded-lg border px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2',
                    flash.tone === 'ok'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-signal-red/30 bg-signal-red/10 text-signal-red')}>
                    {flash.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lookup + decision */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass border-border-muted">
                        <CardContent className="p-5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    autoFocus
                                    value={query}
                                    onChange={e => { setQuery(e.target.value); setSelected(null); }}
                                    placeholder="Scan a badge or type a name, member ID, or email…"
                                    className="bg-canvas-muted pl-9 h-12 text-base"
                                />
                            </div>

                            {results.length > 0 && !selected && (
                                <div className="mt-3 space-y-1.5">
                                    {results.map(r => (
                                        <button key={`${r.kind}-${r.data.id}`} onClick={() => setSelected(r)}
                                            className="w-full flex items-center gap-3 rounded-lg border border-border-muted bg-canvas-muted/30 px-3 py-2.5 text-left hover:border-signal-cyan/40 transition-colors">
                                            <Avatar className="size-9 border border-border-muted">
                                                <AvatarImage src={r.kind === 'Member' ? r.data.avatarUrl : undefined} />
                                                <AvatarFallback className="bg-canvas-card text-xs">{r.data.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{r.data.name}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground">
                                                    {r.data.id} · {r.kind === 'Member' ? r.data.tier : `guest of ${r.data.sponsorName} · ${r.data.status.toLowerCase()}`}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="font-mono text-[9px]">{r.kind}</Badge>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {query.trim() && results.length === 0 && (
                                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-2">
                                    <TriangleAlert className="size-3.5 text-signal-amber" />
                                    No match. An unrecognized badge is not an admit — send them to the membership desk.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {selected && verdict && (
                        <Card className={cn('border-2 animate-in fade-in zoom-in-95 duration-200',
                            verdict.admit ? 'border-emerald-500/40 bg-emerald-500/[0.04]' : 'border-signal-red/40 bg-signal-red/[0.04]')}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className="size-16 border border-border-muted">
                                        <AvatarImage src={selected.kind === 'Member' ? selected.data.avatarUrl : undefined} />
                                        <AvatarFallback className="bg-canvas-card text-xl">{selected.data.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-xl font-bold tracking-tight">{selected.data.name}</h2>
                                            <Badge variant="outline" className="font-mono text-[9px]">
                                                {selected.kind === 'Member' ? selected.data.tier : 'GUEST'}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] font-mono text-muted-foreground mt-1">
                                            {selected.data.id} · trust {selected.data.trustScore}
                                            {selected.kind === 'Member' && selected.data.lastAccess && ` · last in ${format(new Date(selected.data.lastAccess), 'MMM d')}`}
                                        </p>

                                        <div className={cn('mt-4 rounded-lg border p-4',
                                            verdict.admit ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-signal-red/25 bg-signal-red/5')}>
                                            <div className="flex items-center gap-2">
                                                {verdict.admit
                                                    ? <ShieldCheck className="size-5 text-emerald-500" />
                                                    : <ShieldAlert className="size-5 text-signal-red" />}
                                                <span className={cn('text-base font-bold', verdict.admit ? 'text-emerald-400' : 'text-signal-red')}>
                                                    {verdict.headline}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{verdict.reason}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {verdict.admit ? (
                                                <>
                                                    <Button onClick={() => commit('Admitted', verdict.headline)}
                                                        className="bg-emerald-500 text-canvas-black hover:bg-emerald-500/90 font-bold">
                                                        <DoorOpen className="mr-2 size-4" /> Admit
                                                    </Button>
                                                    <Button variant="outline" onClick={() => commit('Denied', 'Operator turned away at the door.')}
                                                        className="text-signal-red border-signal-red/30">
                                                        <Ban className="mr-2 size-4" /> Turn away
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button onClick={() => commit('Denied', verdict.headline)}
                                                        className="bg-signal-red text-white hover:bg-signal-red/90 font-bold">
                                                        <Ban className="mr-2 size-4" /> Deny entry
                                                    </Button>
                                                    <Button variant="outline" onClick={() => setOverrideOpen(true)}
                                                        className="text-signal-amber border-signal-amber/30">
                                                        <ShieldAlert className="mr-2 size-4" /> Override…
                                                    </Button>
                                                </>
                                            )}
                                            <Button variant="ghost" onClick={() => { setSelected(null); setQuery(''); }} className="text-muted-foreground">
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Live door feed */}
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Scans', value: todays, tone: 'text-foreground' },
                            { label: 'Denied', value: denied, tone: 'text-signal-red' },
                            { label: 'Overrides', value: overrides, tone: 'text-signal-amber' },
                        ].map(k => (
                            <Card key={k.label} className="glass border-border-muted">
                                <CardContent className="p-3">
                                    <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{k.label}</div>
                                    <div className={cn('text-2xl font-mono font-bold tracking-tighter mt-0.5', k.tone)}>{k.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="glass border-border-muted">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <ScanLine className="size-4" /> Door Feed
                            </CardTitle>
                            <CardDescription className="text-xs">This shift, newest first.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[420px]">
                                {checkIns.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-12 px-6">
                                        Nothing scanned yet. Every admit, denial, and override lands here and in the audit log.
                                    </p>
                                ) : checkIns.map(c => (
                                    <div key={c.id} className="px-4 py-3 border-b border-border-muted">
                                        <div className="flex items-start gap-2.5">
                                            <div className={cn('size-1.5 rounded-full mt-1.5 shrink-0',
                                                c.result === 'Admitted' ? 'bg-emerald-500' : c.result === 'Override' ? 'bg-signal-amber' : 'bg-signal-red')} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-medium truncate">{c.subjectName}</p>
                                                    <Badge variant="outline" className={cn('font-mono text-[9px] shrink-0',
                                                        c.result === 'Admitted' ? 'border-emerald-500/20 text-emerald-500' :
                                                        c.result === 'Override' ? 'border-signal-amber/20 text-signal-amber' :
                                                        'border-signal-red/20 text-signal-red')}>
                                                        {c.result.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{c.reason}</p>
                                                <p className="text-[9px] font-mono text-muted-foreground/60 mt-1 flex items-center gap-1">
                                                    <Clock className="size-2.5" /> {format(new Date(c.at), 'HH:mm')} · {c.gate} · {c.operator}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <p className="text-[10px] font-mono text-muted-foreground/70 flex items-center gap-2">
                <UserCheck className="size-3" /> Operator: {operator} · {gate} · every decision is written to the audit log.
            </p>

            <AlertDialog open={overrideOpen} onOpenChange={setOverrideOpen}>
                <AlertDialogContent className="glass border-signal-amber/30 bg-canvas-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-signal-amber">Override the door</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                            You are admitting someone the system says to refuse. This is recorded against your name
                            and surfaces in the Command Center as an override.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Input value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                            placeholder="Who authorized this, and why?" className="bg-canvas-muted" />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOverrideOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-signal-amber text-canvas-black"
                            onClick={() => {
                                commit('Override', overrideReason.trim() || 'Override with no reason given.');
                                setOverrideReason('');
                                setOverrideOpen(false);
                            }}>
                            Override and admit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
