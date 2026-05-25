'use client';

import React from 'react';
import { RiskSignal } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SignalBreakdownProps {
    signals: RiskSignal[];
    title?: string;
    className?: string;
}

export function SignalBreakdown({ signals, title, className }: SignalBreakdownProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {title && <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">{title}</h4>}
            {signals.map((signal) => (
                <div
                    key={signal.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-border-muted bg-canvas-muted/30 group hover:bg-canvas-muted/50 transition-colors"
                >
                    <div className={cn(
                        "mt-1 p-1 rounded",
                        signal.impact === 'Positive' ? "bg-emerald-500/10 text-emerald-500" : (signal.impact === 'Negative' ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-slate-400")
                    )}>
                        {signal.impact === 'Positive' ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
                    </div>
                    <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wide">{signal.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-muted-foreground">CONF {Math.round(signal.confidence * 100)}%</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="size-3 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="glass border-border-muted max-w-xs">
                                        <p className="text-[10px] font-mono text-signal-cyan uppercase tracking-widest mb-1">Provenance: {signal.provenance}</p>
                                        <p className="text-xs">{signal.reasoning}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{signal.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
