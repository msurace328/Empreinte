'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/lib/providers/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lock, Unlock, Rocket, TrendingUp, AlertTriangle, ChevronDown, Check } from 'lucide-react';

const money = (n: number) => `$${n.toLocaleString()}`;

interface Moonshot {
    id: string;
    codename: string;
    thesis: string;
    mechanism: string;
    upside: number;
    horizon: string;
    risk: 'Contained' | 'Elevated' | 'Bet the quarter';
    unlock: string;
}

// Asset-backed plays: each one monetizes something ARENA already owns
// (empty inventory, verified identity, proprietary demand data) rather
// than asking members for more money.
const MOONSHOTS: Moonshot[] = [
    {
        id: 'ms-01',
        codename: 'Dark Inventory',
        thesis: 'Your empty suites are a perishable asset you currently throw away.',
        mechanism: 'Any suite unclaimed 48 hours before doors opens to a silent, invite-only auction among vetted members. Nobody sees the clearing price, so your published rack rate never erodes — you capture the spread instead of eating the vacancy.',
        upside: 1_840_000,
        horizon: 'One season',
        risk: 'Contained',
        unlock: 'Booking data you already have. No new inventory, no new members.',
    },
    {
        id: 'ms-02',
        codename: 'Trust Passport',
        thesis: 'You have already paid to verify these identities. Everyone else still has to.',
        mechanism: 'License the trust score as a portable credential. A member cleared at ARENA walks into partner venues, private clubs, and charter services pre-vetted. You charge the receiving venue per verification — recurring revenue on work you already did once.',
        upside: 3_200_000,
        horizon: '18 months',
        risk: 'Elevated',
        unlock: 'Requires member consent flow and one anchor partner venue.',
    },
    {
        id: 'ms-03',
        codename: 'Second Market',
        thesis: 'Memberships already resell — you are just not in the room when it happens.',
        mechanism: 'Sanction the resale you cannot stop. Members list a season seat, ARENA vets the buyer and clears the transfer, taking a percentage on both sides. Kills the grey market, converts it into a fee line, and every new holder arrives pre-vetted.',
        upside: 2_450_000,
        horizon: 'Two seasons',
        risk: 'Elevated',
        unlock: 'Transfer rules in the membership agreement. Legal review first.',
    },
    {
        id: 'ms-04',
        codename: 'Demand Oracle',
        thesis: 'You know which acts sell suites before the promoters do.',
        mechanism: 'Your booking curve is a leading indicator of premium demand by artist and matchup. Sell that signal back to promoters and rights holders as a pricing feed — or take an equity stake in the tour instead of a fee, and own upside on the shows you help fill.',
        upside: 5_600_000,
        horizon: '2-3 years',
        risk: 'Bet the quarter',
        unlock: 'Three seasons of booking history. You have one.',
    },
];

const RISK_STYLE: Record<Moonshot['risk'], string> = {
    'Contained': 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5',
    'Elevated': 'border-signal-amber/20 text-signal-amber bg-signal-amber/5',
    'Bet the quarter': 'border-signal-red/20 text-signal-red bg-signal-red/5',
};

export function MoonshotVault() {
    const { addAuditEntry } = useData();
    const { user } = useAuth();
    const [unlocked, setUnlocked] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [greenlit, setGreenlit] = useState<Record<string, boolean>>({});

    const total = useMemo(() => MOONSHOTS.reduce((a, m) => a + m.upside, 0), []);
    const operator = user ? `${user.role}.${user.name.split(' ').pop()}` : 'operator';

    // Founder-level strategy: only the CEO/Admin seat sees the vault at all.
    if (user?.role !== 'Admin') return null;

    const unlock = () => {
        setUnlocked(true);
        addAuditEntry(operator, 'VAULT_OPENED', 'moonshot-vault', 'Moonshot Vault opened — founder-level revenue strategy reviewed.');
    };

    const greenlight = (m: Moonshot) => {
        setGreenlit(g => ({ ...g, [m.id]: true }));
        addAuditEntry(operator, 'MOONSHOT_GREENLIT', m.id, `${m.codename} greenlit for exploration · modeled upside ${money(m.upside)}.`);
    };

    return (
        <Card className={cn('relative overflow-hidden transition-colors duration-700',
            unlocked ? 'border-signal-cyan/30 bg-signal-cyan/[0.03]' : 'border-border-muted glass')}>
            {/* Ambient shimmer once opened */}
            {unlocked && (
                <div className="pointer-events-none absolute inset-0"
                    style={{ background: 'radial-gradient(circle at 80% 0%, rgba(94,230,201,0.10), transparent 60%)' }} />
            )}

            <CardHeader className="relative flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                    <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Rocket className="size-4 text-signal-cyan" /> Moonshot Vault
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                        {unlocked
                            ? 'Asset-backed plays that monetize what ARENA already owns. Founder eyes only.'
                            : 'Sealed. Four unconventional revenue plays modeled against your own data.'}
                    </CardDescription>
                </div>
                {!unlocked ? (
                    <Button size="sm" onClick={unlock}
                        className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-bold text-[10px] h-8 shrink-0">
                        <Lock className="mr-1.5 size-3" /> Unlock
                    </Button>
                ) : (
                    <Badge variant="outline" className="font-mono text-[10px] border-signal-cyan/30 text-signal-cyan bg-signal-cyan/5 shrink-0">
                        <Unlock className="mr-1.5 size-3" /> {money(total)} MODELED
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="relative">
                <AnimatePresence mode="wait">
                    {!unlocked ? (
                        <motion.div key="sealed" exit={{ opacity: 0 }} className="py-6 text-center">
                            <div className="text-3xl font-mono font-bold tracking-tighter text-muted-foreground/30 blur-[6px] select-none">
                                {money(total)}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
                                These are not discounts or upsells. They monetize assets you already hold —
                                perishable inventory, verified identity, and proprietary demand data.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-3">
                            {MOONSHOTS.map((m, i) => {
                                const isOpen = expanded === m.id;
                                const isGreen = greenlit[m.id];
                                return (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.09, duration: 0.4 }}
                                        className={cn('rounded-xl border transition-colors',
                                            isGreen ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-border-muted bg-canvas-muted/25 hover:border-signal-cyan/25')}
                                    >
                                        <button onClick={() => setExpanded(isOpen ? null : m.id)} className="w-full text-left p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[9px] font-mono uppercase tracking-widest text-signal-cyan">{m.id}</span>
                                                        <span className="text-sm font-bold tracking-tight">{m.codename}</span>
                                                        <Badge variant="outline" className={cn('font-mono text-[9px]', RISK_STYLE[m.risk])}>{m.risk}</Badge>
                                                        {isGreen && (
                                                            <Badge variant="outline" className="font-mono text-[9px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                                                                <Check className="mr-1 size-2.5" /> GREENLIT
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{m.thesis}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-lg font-mono font-bold text-signal-cyan tracking-tighter">+{money(m.upside)}</div>
                                                    <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{m.horizon}</div>
                                                </div>
                                            </div>
                                            <ChevronDown className={cn('size-3.5 text-muted-foreground mt-2 transition-transform', isOpen && 'rotate-180')} />
                                        </button>

                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 space-y-3">
                                                        <div className="rounded-lg bg-canvas-black/40 border border-border-muted p-3">
                                                            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">How it works</div>
                                                            <p className="text-xs leading-relaxed">{m.mechanism}</p>
                                                        </div>
                                                        <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                                                            <AlertTriangle className="size-3 mt-0.5 shrink-0 text-signal-amber" />
                                                            <span>{m.unlock}</span>
                                                        </div>
                                                        {!isGreen && (
                                                            <Button size="sm" onClick={() => greenlight(m)}
                                                                className="h-7 text-[10px] bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90">
                                                                <TrendingUp className="mr-1.5 size-3" /> Greenlight for exploration
                                                            </Button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                            <p className="text-[10px] font-mono text-muted-foreground/60 pt-1">
                                Modeled against your booking, suite, and member data. Opening the vault and every greenlight is audited.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
