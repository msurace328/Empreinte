'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
    anchor: string;          // data-tour-id of the element to spotlight
    route?: string;          // navigate here when the step activates
    title: string;
    body: string;
    roles: UserRole[];
}

const ALL: UserRole[] = ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'];

const STEPS: TourStep[] = [
    {
        anchor: '/admin', route: '/admin', title: 'Command Center', roles: ALL,
        body: 'Mission control. Active members, pending applications, open risk flags, and the aggregate Trust-Health Index — with a live anomaly feed streaming behavioral and identity signals as they happen.',
    },
    {
        anchor: '/admin/applications', route: '/admin/applications', title: 'Review Queue', roles: ['Admin', 'MembershipDirector'],
        body: 'Every membership application lands here for vetting. Each applicant carries a computed risk state — approve, waitlist, request more info, or reject, and every decision is written to the audit log with your name on it.',
    },
    {
        anchor: '/admin/members', route: '/admin/members', title: 'Members', roles: ALL,
        body: 'The full roster. Open any member to get their dossier: trust gauge, identity intelligence (device fingerprints, image forensics, duplicate documents), access anomalies, booking history, and their personal audit trail.',
    },
    {
        anchor: '/admin/inbox', route: '/admin/inbox', title: 'Inbox', roles: ['Admin', 'MembershipDirector', 'FrontDesk'],
        body: 'Member and guest messages, attached to the identity behind them. Every thread shows that person\u2019s live trust score and status, so you answer knowing who you are talking to — and one click opens their full dossier. Replies are audited under your name.',
    },
    {
        anchor: '/admin/access', route: '/admin/access', title: 'Access & Guests', roles: ALL,
        body: 'Who can get through the door right now. Watchlist, restrict, or reinstate credentials; spot stale access that should be revoked; and vet sponsored guests — ID, billing, and background checks — before a pass is ever issued.',
    },
    {
        anchor: '/admin/suites', route: '/admin/suites', title: 'Suites & Game-Day', roles: ALL,
        body: 'Suite inventory and the fixture schedule. Occupancy and revenue per suite, plus who holds which suite on game day and how many guests they are bringing — with one-click guest-list vetting.',
    },
    {
        anchor: '/admin/graph', route: '/admin/graph', title: 'Member Graph', roles: ['Admin', 'MembershipDirector', 'Auditor'],
        body: 'The trust topology. Members are nodes, referrals are edges. The graph engine flags circular-vouching rings — clusters of accounts vouching for each other to manufacture trust that no single application review would catch.',
    },
    {
        anchor: '/admin/revenue', route: '/admin/revenue', title: 'Revenue Intel', roles: ['Admin', 'MembershipDirector'],
        body: 'The money you are leaving on the table. Gaps computed live from booking, suite, and member data, plus an on-demand Claude analysis. Scroll to the bottom for the Moonshot Vault — four unconventional plays modeled on assets you already own, visible to the founder seat only.',
    },
    {
        anchor: '/admin/audit', route: '/admin/audit', title: 'Audit Log', roles: ['Admin', 'Auditor'],
        body: 'The immutable record. Every restrict, approve, revoke, and revenue decision — hash-chained and append-only. This is the trail your insurer, your lawyers, and your members will ask for.',
    },
    {
        anchor: '/admin/settings', route: '/admin/settings', title: 'Security', roles: ['Admin'],
        body: 'Role-based access control for ARENA staff and the platform security posture: encryption at rest, audit hashing, session expiry, and PII minimization defaults.',
    },
    {
        anchor: 'role-switcher', title: 'You are viewing as CEO', roles: ALL,
        body: 'This console adapts to whoever signs in. Switch to Membership Director, Front Desk, Auditor — or Member, to see the self-service portal your members get. Each role sees only the tabs it is cleared for.',
    },
];

const SEEN_KEY = 'empreinte_tour_seen';

export function GuidedTour() {
    const router = useRouter();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

    const steps = useMemo(
        () => STEPS.filter(s => user && s.roles.includes(user.role as UserRole)),
        [user]
    );
    const step = steps[index];

    // First visit: open the tour on its own after the shell settles.
    useEffect(() => {
        if (!user || user.role === 'Member') return;
        if (!localStorage.getItem(SEEN_KEY)) {
            const t = setTimeout(() => setOpen(true), 1200);
            return () => clearTimeout(t);
        }
    }, [user]);

    const start = () => { setIndex(0); setOpen(true); };
    const close = useCallback(() => {
        setOpen(false);
        localStorage.setItem(SEEN_KEY, '1');
    }, []);

    const go = useCallback((next: number) => {
        if (next < 0 || next >= steps.length) return;
        setIndex(next);
    }, [steps.length]);

    // Navigate with the step and measure the spotlight target.
    useEffect(() => {
        if (!open || !step) return;
        if (step.route) router.push(step.route);
        const measure = () => {
            const el = document.querySelector(`[data-tour-id="${step.anchor}"]`);
            if (el) {
                const r = el.getBoundingClientRect();
                setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [open, step, router]);

    // Arrow-key navigation while the tour is open.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Right') go(index + 1);
            else if (e.key === 'ArrowLeft' || e.key === 'Left') go(index - 1);
            else if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, index, go, close]);

    if (!user || user.role === 'Member') return null;

    const cardTop = rect ? Math.min(Math.max(rect.top - 12, 16), (typeof window !== 'undefined' ? window.innerHeight : 800) - 280) : 120;

    return (
        <>
            {/* Persistent launcher — the "arrow" you can reach for anytime */}
            {!open && (
                <button
                    onClick={start}
                    aria-label="Open guided tour"
                    className="fixed bottom-6 right-6 z-[90] group flex items-center gap-2 rounded-full border border-signal-cyan/30 bg-canvas-card/90 backdrop-blur px-4 py-2.5 text-signal-cyan shadow-lg shadow-signal-cyan/10 hover:bg-signal-cyan/10 transition-colors"
                >
                    <span className="absolute inset-0 rounded-full border border-signal-cyan/40 animate-ping opacity-20 pointer-events-none" />
                    <Compass className="size-4" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Tour</span>
                </button>
            )}

            <AnimatePresence>
                {open && step && (
                    <motion.div
                        key="tour-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >
                        {/* Dim everything; the spotlight ring carries the focus */}
                        <div className="absolute inset-0 bg-canvas-black/70 backdrop-blur-[1px]" onClick={close} />

                        {/* Spotlight ring over the sidebar item */}
                        {rect && (
                            <motion.div
                                layout
                                initial={false}
                                animate={{ top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                                className="absolute rounded-lg border-2 border-signal-cyan shadow-[0_0_24px_rgba(45,212,191,0.35)] pointer-events-none"
                            >
                                <span className="absolute inset-0 rounded-lg border border-signal-cyan/50 animate-pulse" />
                            </motion.div>
                        )}

                        {/* Explanation card beside the sidebar */}
                        <motion.div
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0, top: cardTop }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="absolute left-[280px] w-[380px] max-w-[calc(100vw-300px)] rounded-xl border border-border-muted bg-canvas-card/95 backdrop-blur-xl p-6 shadow-2xl"
                            style={{ top: cardTop }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-signal-cyan">
                                    Step {index + 1} / {steps.length}
                                </span>
                                <button onClick={close} aria-label="Close tour" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold tracking-tight mb-2">{step.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>

                            <div className="flex items-center justify-between mt-6">
                                <div className="flex gap-1.5">
                                    {steps.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => go(i)}
                                            aria-label={`Go to step ${i + 1}`}
                                            className={cn('size-1.5 rounded-full transition-all', i === index ? 'bg-signal-cyan w-4' : 'bg-border-muted hover:bg-muted-foreground')}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => go(index - 1)}
                                        disabled={index === 0}
                                        aria-label="Previous step"
                                        className="size-8 rounded-lg border border-border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-canvas-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                    >
                                        <ArrowLeft className="size-4" />
                                    </button>
                                    {index === steps.length - 1 ? (
                                        <button
                                            onClick={close}
                                            className="h-8 px-4 rounded-lg bg-signal-cyan text-canvas-black text-xs font-bold hover:bg-signal-cyan/90 transition-colors"
                                        >
                                            Finish
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => go(index + 1)}
                                            aria-label="Next step"
                                            className="size-8 rounded-lg bg-signal-cyan text-canvas-black flex items-center justify-center hover:bg-signal-cyan/90 transition-colors"
                                        >
                                            <ArrowRight className="size-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground/60 mt-4">← → to navigate · esc to close</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
