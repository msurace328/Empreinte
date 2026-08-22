'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { MembershipTier } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ShieldCheck, Loader2, ArrowRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TierPlan {
    tier: MembershipTier;
    price: number;
    cadence: string;
    tagline: string;
    perks: string[];
    featured?: boolean;
}

// ── PRICING ──────────────────────────────────────────────────────────────
// Everything about what a membership costs lives in this one array.
// Change `price` / `cadence` / `perks` here and it updates the pricing
// cards, the apply dialog, and the payment step everywhere in the app.
export const TIERS: TierPlan[] = [
    {
        tier: 'Associate', price: 45000, cadence: 'per season', tagline: 'Get in the building.',
        perks: ['Shared suite access, 6 fixtures a season', '2 guest passes per fixture', 'Priority concert presale window', 'Member app + digital access badge'],
    },
    {
        tier: 'Suite', price: 165000, cadence: 'per season', tagline: 'Your room, your nights.', featured: true,
        perks: ['Dedicated suite, 20 fixtures a season', '8 guest passes per fixture', 'Concert + playoff priority booking', 'Dedicated host & in-suite catering desk'],
    },
    {
        tier: 'Founder', price: 400000, cadence: 'per season', tagline: 'Everything, first.',
        perks: ['Unlimited suite access, all fixtures & concerts', 'Unlimited sponsored guest passes', 'First right of refusal on every event', 'Private entrance & 24/7 concierge line'],
    },
];

export const money = (n: number) => `$${n.toLocaleString()}`;

type Phase = 'form' | 'vetting' | 'submitted';

export function ApplyDialog({ open, onOpenChange, initialTier }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    initialTier?: MembershipTier;
}) {
    const { addApplication, members } = useData();
    const [phase, setPhase] = useState<Phase>('form');
    const [tier, setTier] = useState<MembershipTier>(initialTier ?? 'Suite');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [referral, setReferral] = useState('');
    const [appId, setAppId] = useState('');

    React.useEffect(() => { if (initialTier) setTier(initialTier); }, [initialTier]);

    const plan = TIERS.find(t => t.tier === tier)!;
    const valid = name.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

    const submit = () => {
        if (!valid) return;
        setPhase('vetting');
        // Identity vetting runs before any payment is taken — that is the whole point.
        setTimeout(() => {
            const app = addApplication({
                name: name.trim(),
                email: email.trim(),
                tier,
                referralId: referral.trim() || undefined,
            });
            setAppId(app.id);
            setPhase('submitted');
        }, 1800);
    };

    const reset = () => {
        setPhase('form'); setName(''); setEmail(''); setReferral(''); setAppId('');
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(reset, 250); }}>
            <DialogContent className="glass border-border-muted bg-canvas-card max-w-lg">
                {phase === 'form' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-xl">Apply for membership</DialogTitle>
                            <DialogDescription className="text-xs">
                                ARENA is a vetted club. Apply first — we verify identity before anyone is asked for payment.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-3 gap-2">
                                {TIERS.map(t => (
                                    <button
                                        key={t.tier}
                                        onClick={() => setTier(t.tier)}
                                        className={cn(
                                            'rounded-lg border p-3 text-left transition-colors',
                                            tier === t.tier ? 'border-signal-cyan bg-signal-cyan/10' : 'border-border-muted hover:border-signal-cyan/40'
                                        )}
                                    >
                                        <div className={cn('text-xs font-bold', tier === t.tier && 'text-signal-cyan')}>{t.tier}</div>
                                        <div className="text-[10px] font-mono text-muted-foreground mt-1">{money(t.price)}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Full name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Marchetti" className="bg-canvas-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Email</Label>
                                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" className="bg-canvas-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                    Member referral <span className="normal-case tracking-normal">(optional — speeds up vetting)</span>
                                </Label>
                                <Input value={referral} onChange={e => setReferral(e.target.value)} placeholder="m-001" className="bg-canvas-muted font-mono" />
                                {referral.trim() && (
                                    <p className="text-[10px] font-mono text-muted-foreground">
                                        {members.some(m => m.id === referral.trim())
                                            ? <span className="text-emerald-500">Verified member · {members.find(m => m.id === referral.trim())!.name}</span>
                                            : <span className="text-signal-amber">Not a known member ID — this will raise your risk score.</span>}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border border-border-muted bg-canvas-muted/40 p-3 flex items-start gap-2">
                                <Lock className="size-3.5 text-signal-cyan mt-0.5 shrink-0" />
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    No card is collected at this step. If your application clears vetting, you will receive a secure
                                    payment link for <span className="text-foreground font-mono">{money(plan.price)} {plan.cadence}</span>.
                                </p>
                            </div>
                        </div>

                        <Button onClick={submit} disabled={!valid} className="w-full bg-signal-cyan text-canvas-black font-bold hover:bg-signal-cyan/90">
                            Submit for vetting <ArrowRight className="ml-2 size-4" />
                        </Button>
                    </>
                )}

                {phase === 'vetting' && (
                    <div className="py-12 flex flex-col items-center text-center">
                        <Loader2 className="size-8 text-signal-cyan animate-spin" />
                        <h3 className="text-lg font-bold mt-5">Running identity checks…</h3>
                        <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                            Scoring email reputation, device fingerprint, and referral provenance.
                        </p>
                    </div>
                )}

                {phase === 'submitted' && (
                    <div className="py-8 flex flex-col items-center text-center">
                        <div className="size-14 rounded-full bg-signal-cyan/10 border border-signal-cyan/30 flex items-center justify-center">
                            <Check className="size-7 text-signal-cyan" />
                        </div>
                        <h3 className="text-xl font-bold mt-5">Application received</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                            Your {tier} application is in the review queue. A membership director reviews every
                            applicant personally — expect a decision within two business days.
                        </p>
                        <div className="mt-5 rounded-lg border border-border-muted bg-canvas-muted/40 px-4 py-2.5">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Reference</span>
                            <div className="font-mono text-signal-cyan text-sm">{appId}</div>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground/70 mt-5 flex items-center gap-1.5">
                            <ShieldCheck className="size-3" /> Now visible in the Review Queue
                        </p>
                        <Button variant="outline" className="mt-5 w-full" onClick={() => onOpenChange(false)}>Close</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
