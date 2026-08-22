'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '@/lib/providers/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { ShieldAlert, X, ArrowRight, TriangleAlert } from 'lucide-react';

interface Toast {
    id: string;
    tone: 'high' | 'warn';
    title: string;
    body: string;
    href: string;
}

// Surfaces things the operator would otherwise miss while working on another
// page: a high-severity anomaly landing, or someone overriding the door.
export function AlertCenter() {
    const router = useRouter();
    const { anomalies, checkIns } = useData();
    const { user } = useAuth();
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Everything present on first render is "already known" — we only announce
    // what arrives after the operator is watching.
    const seenAnomalies = useRef<Set<string> | null>(null);
    const seenCheckIns = useRef<Set<string> | null>(null);

    useEffect(() => {
        if (seenAnomalies.current === null) {
            seenAnomalies.current = new Set(anomalies.map(a => a.id));
            return;
        }
        const fresh = anomalies.filter(a => !seenAnomalies.current!.has(a.id) && a.severity === 'High');
        fresh.forEach(a => seenAnomalies.current!.add(a.id));
        anomalies.forEach(a => seenAnomalies.current!.add(a.id));
        if (fresh.length) {
            setToasts(t => [
                ...fresh.map(a => ({
                    id: `an-${a.id}`,
                    tone: 'high' as const,
                    title: `High-severity anomaly · ${a.type}`,
                    body: a.description,
                    href: `/admin/members/${a.memberId}`,
                })),
                ...t,
            ].slice(0, 3));
        }
    }, [anomalies]);

    useEffect(() => {
        if (seenCheckIns.current === null) {
            seenCheckIns.current = new Set(checkIns.map(c => c.id));
            return;
        }
        const fresh = checkIns.filter(c => !seenCheckIns.current!.has(c.id) && c.result === 'Override');
        checkIns.forEach(c => seenCheckIns.current!.add(c.id));
        if (fresh.length) {
            setToasts(t => [
                ...fresh.map(c => ({
                    id: `ci-${c.id}`,
                    tone: 'warn' as const,
                    title: `Door override at ${c.gate}`,
                    body: `${c.operator} admitted ${c.subjectName} against the system's decision.`,
                    href: '/admin/audit',
                })),
                ...t,
            ].slice(0, 3));
        }
    }, [checkIns]);

    // Auto-dismiss so the corner never silts up.
    useEffect(() => {
        if (!toasts.length) return;
        const timer = setTimeout(() => setToasts(t => t.slice(0, -1)), 9000);
        return () => clearTimeout(timer);
    }, [toasts]);

    const dismiss = (id: string) => setToasts(t => t.filter(x => x.id !== id));

    if (!user || user.role === 'Member') return null;

    return (
        <div className="fixed bottom-20 right-4 sm:right-6 z-[95] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))] pointer-events-none">
            <AnimatePresence initial={false}>
                {toasts.map(t => (
                    <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, x: 40, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        className={cn('pointer-events-auto rounded-xl border p-4 shadow-2xl backdrop-blur-xl',
                            t.tone === 'high'
                                ? 'border-signal-red/40 bg-signal-red/[0.12]'
                                : 'border-signal-amber/40 bg-signal-amber/[0.12]')}
                    >
                        <div className="flex items-start gap-3">
                            {t.tone === 'high'
                                ? <ShieldAlert className="size-4 text-signal-red mt-0.5 shrink-0" />
                                : <TriangleAlert className="size-4 text-signal-amber mt-0.5 shrink-0" />}
                            <div className="min-w-0 flex-1">
                                <p className={cn('text-xs font-bold', t.tone === 'high' ? 'text-signal-red' : 'text-signal-amber')}>
                                    {t.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 leading-snug">{t.body}</p>
                                <button
                                    onClick={() => { router.push(t.href); dismiss(t.id); }}
                                    className="text-[10px] font-mono uppercase tracking-widest text-foreground/80 hover:text-foreground mt-2 flex items-center gap-1"
                                >
                                    Investigate <ArrowRight className="size-3" />
                                </button>
                            </div>
                            <button onClick={() => dismiss(t.id)} aria-label="Dismiss"
                                className="text-muted-foreground hover:text-foreground shrink-0">
                                <X className="size-3.5" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
