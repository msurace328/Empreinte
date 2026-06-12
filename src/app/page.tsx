'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { MemberPortalDashboard } from '@/components/member/portal-dashboard';
import {
    LayoutDashboard, ShieldCheck, Lock, Ticket, Network, Brain, History, ShieldAlert, ArrowRight,
} from 'lucide-react';

const FEATURES = [
    { icon: LayoutDashboard, title: 'Command Center', desc: 'Trust-health, risk flags, and live anomalies at a glance.' },
    { icon: ShieldCheck, title: 'Identity Vetting', desc: 'Score every applicant and catch synthetic IDs before they’re in.' },
    { icon: Lock, title: 'Access & Guests', desc: 'Govern who gets in, vet guests, and revoke cleanly — all logged.' },
    { icon: Ticket, title: 'Suites & Game-Day', desc: 'Live occupancy, revenue, and the fixture schedule with guest lists.' },
    { icon: Network, title: 'Member Graph', desc: 'Map trust and referral ties; surface collusion rings.' },
    { icon: Brain, title: 'AI Revenue Intelligence', desc: 'Claude finds the revenue your suites leave on the table.' },
    { icon: History, title: 'Immutable Audit Log', desc: 'Hash-chained record of every decision — the proof insurers ask for.' },
    { icon: ShieldAlert, title: 'Security & RBAC', desc: 'Least-privilege roles, KYC integrations, and PII minimization.' },
];

export default function Home() {
    const { user, isLoading } = useAuth();

    if (isLoading) return null;

    // Members keep their portal; everyone else lands on the cover.
    if (user?.role === 'Member') {
        return <MemberPortalDashboard />;
    }

    return (
        <main className="relative min-h-screen bg-canvas-black text-foreground overflow-hidden">
            {/* ambient glow */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(94,230,201,0.12), transparent 55%)' }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-20">
                {/* Hero */}
                <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-center mb-6">
                        <img src="/logo.svg" alt="Empreinte" className="size-20 rounded-2xl shadow-[0_0_40px_rgba(94,230,201,0.25)]" />
                    </div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-signal-cyan mb-3">
                        Empreinte · Arena Operations
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
                        Trust, access &amp; revenue — <span className="text-signal-cyan">one operating layer.</span>
                    </h1>
                    <p className="mt-5 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                        Empreinte vets members, governs who gets through the door, logs every decision in an
                        immutable trail, and surfaces the revenue your suites are leaving on the table — built for
                        ARENA&apos;s premium membership operation.
                    </p>
                    <div className="mt-8">
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-2 rounded-lg bg-signal-cyan text-canvas-black font-bold px-6 py-3 text-sm transition-all hover:bg-signal-cyan/90 shadow-[0_0_24px_rgba(94,230,201,0.25)]"
                        >
                            Enter the Command Center <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>

                {/* What's inside */}
                <div className="mt-16">
                    <div className="text-center text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-6">
                        What&apos;s inside
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="glass border-border-muted rounded-xl p-5 text-left transition-colors hover:border-signal-cyan/30">
                                <f.icon className="size-5 text-signal-cyan mb-3" />
                                <h3 className="text-sm font-bold leading-tight">{f.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="mt-14 text-center">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-signal-cyan hover:text-signal-cyan/80 transition-colors"
                    >
                        Open the dashboard <ArrowRight className="size-4" />
                    </Link>
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                        <span className="size-1.5 rounded-full bg-signal-cyan animate-pulse" />
                        System live · built for premium membership &amp; access businesses
                    </div>
                </div>
            </div>
        </main>
    );
}
