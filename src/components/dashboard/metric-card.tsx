'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    trend?: {
        value: number;
        isUp: boolean;
    };
    description?: string;
    className?: string;
    icon?: React.ElementType;
    accent?: boolean;
}

interface Parsed {
    prefix: string;
    suffix: string;
    target: number;
    decimals: number;
    grouping: boolean;
}

function parseValue(value: string | number): Parsed | null {
    const str = String(value);
    const m = str.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
    if (!m) return null;
    const numRaw = m[2] ?? '';
    const target = parseFloat(numRaw.replace(/,/g, ''));
    if (Number.isNaN(target)) return null;
    const decimals = numRaw.includes('.') ? (numRaw.split('.')[1]?.length ?? 0) : 0;
    const grouping = numRaw.includes(',') || Math.abs(target) >= 1000;
    return { prefix: m[1] ?? '', suffix: m[3] ?? '', target, decimals, grouping };
}

function format(p: Parsed, n: number): string {
    const body = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: p.decimals,
        maximumFractionDigits: p.decimals,
        useGrouping: p.grouping,
    }).format(n);
    return p.prefix + body + p.suffix;
}

function useCountUp(value: string | number, duration = 1100): string {
    const parsed = useMemo(() => parseValue(value), [value]);
    const [display, setDisplay] = useState<string>(() => (parsed ? format(parsed, 0) : String(value)));
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!parsed) {
            setDisplay(String(value));
            return;
        }

        const reduce = typeof window !== 'undefined'
            && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
            setDisplay(format(parsed, parsed.target));
            return;
        }

        const start = performance.now();
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            setDisplay(format(parsed, parsed.target * eased));
            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                setDisplay(format(parsed, parsed.target));
            }
        };
        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [parsed, value, duration]);

    return display;
}

export function MetricCard({ title, value, trend, description, className, icon: Icon, accent }: MetricCardProps) {
    const display = useCountUp(value);

    return (
        <Card className={cn("glass overflow-hidden group", accent && "border-signal-cyan/30", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{title}</p>
                    {Icon && <Icon className={cn("size-4 text-muted-foreground transition-colors group-hover:text-signal-cyan", accent && "text-signal-cyan")} />}
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                    <h3 className={cn("text-3xl font-bold tracking-tight tabular-nums", accent && "text-signal-cyan")}>{display}</h3>
                    {trend && (
                        <div className={cn(
                            "flex items-center text-xs font-mono",
                            trend.isUp ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {trend.isUp ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
                            {trend.value}%
                        </div>
                    )}
                </div>
                {description && (
                    <p className="mt-1 text-xs text-muted-foreground font-mono truncate">{description}</p>
                )}
            </CardContent>
            {accent && (
                <div className="absolute top-0 right-0 p-1">
                    <div className="size-1.5 bg-signal-cyan rounded-full shadow-[0_0_8px_rgba(94,230,201,0.6)]" />
                </div>
            )}
        </Card>
    );
}

