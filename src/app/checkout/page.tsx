'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/lib/providers/data-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, ShieldCheck, ArrowRight, Loader2, ExternalLink } from 'lucide-react';

const money = (n: number) => `$${n.toLocaleString()}`;

function CheckoutInner() {
    const params = useSearchParams();
    const { invoices, markInvoicePaid, hydrated } = useData();
    const [paying, setPaying] = useState(false);

    const token = params.get('t');
    const invoice = invoices.find(i => i.checkoutToken === token) ?? invoices.find(i => i.id === params.get('id'));

    // Do not judge the link before the session has loaded.
    if (!hydrated) {
        return (
            <div className="max-w-md mx-auto py-24 text-center px-6">
                <Loader2 className="size-6 text-signal-cyan animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-4">Retrieving your invoice…</p>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="max-w-md mx-auto py-24 text-center px-6">
                <h1 className="text-2xl font-bold tracking-tight">This payment link is not active</h1>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    Payment links are issued once an application clears vetting. If you just applied,
                    your link arrives by email after review.
                </p>
                <Button asChild variant="outline" className="mt-6"><Link href="/">Back to ARENA</Link></Button>
            </div>
        );
    }

    const paid = invoice.status === 'Paid';

    // Stands in for redirecting to Stripe Checkout. See README for the swap.
    const pay = () => {
        setPaying(true);
        setTimeout(() => {
            markInvoicePaid(invoice.id);
            setPaying(false);
        }, 1600);
    };

    return (
        <div className="max-w-lg mx-auto py-16 sm:py-24 px-6">
            <div className="flex items-center gap-3 mb-8">
                <img src="/logo.svg" alt="" className="size-8 rounded" />
                <div>
                    <div className="font-bold tracking-tight">Empreinte</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">ARENA Membership</div>
                </div>
            </div>

            <Card className="glass border-border-muted overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-border-muted">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Membership</p>
                                <h1 className="text-2xl font-bold tracking-tight mt-1">{invoice.tier}</h1>
                                <p className="text-xs text-muted-foreground mt-1">for {invoice.memberName}</p>
                            </div>
                            <Badge variant="outline" className={paid
                                ? 'font-mono text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                                : 'font-mono text-[10px] border-signal-amber/30 text-signal-amber bg-signal-amber/5'}>
                                {paid ? 'PAID' : 'AWAITING PAYMENT'}
                            </Badge>
                        </div>
                    </div>

                    <div className="p-6 space-y-3 border-b border-border-muted">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{invoice.tier} membership · {invoice.cadence}</span>
                            <span className="font-mono">{money(invoice.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Initiation</span>
                            <span className="font-mono text-muted-foreground">Waived</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border-muted">
                            <span className="font-bold">Total due today</span>
                            <span className="text-2xl font-mono font-bold tracking-tighter text-signal-cyan">{money(invoice.amount)}</span>
                        </div>
                    </div>

                    <div className="p-6">
                        {paid ? (
                            <div className="text-center">
                                <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                                    <Check className="size-6 text-emerald-500" />
                                </div>
                                <h2 className="text-lg font-bold mt-4">You&apos;re in.</h2>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    Payment received. Your digital access badge is active and your member
                                    portal is open.
                                </p>
                                <Button asChild className="mt-5 w-full bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-bold">
                                    <Link href="/">Open your portal <ArrowRight className="ml-2 size-4" /></Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button onClick={pay} disabled={paying}
                                    className="w-full bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-bold h-11">
                                    {paying
                                        ? <><Loader2 className="mr-2 size-4 animate-spin" /> Contacting payment provider…</>
                                        : <><Lock className="mr-2 size-4" /> Pay {money(invoice.amount)}</>}
                                </Button>
                                <p className="text-[10px] font-mono text-muted-foreground/70 mt-3 flex items-start gap-1.5 leading-relaxed">
                                    <ShieldCheck className="size-3 mt-0.5 shrink-0" />
                                    Demo checkout — no card is collected and no charge is made. Wiring this to
                                    Stripe Checkout is one server route; see the README.
                                </p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            <p className="text-[10px] font-mono text-muted-foreground/60 mt-6 text-center flex items-center justify-center gap-1.5">
                <ExternalLink className="size-3" /> Reference {invoice.id} · issued {new Date(invoice.issuedAt).toLocaleDateString()}
            </p>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <main className="min-h-screen bg-canvas-black text-foreground">
            <Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>}>
                <CheckoutInner />
            </Suspense>
        </main>
    );
}
