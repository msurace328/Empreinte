'use client';

import React from 'react';
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

export function MetricCard({ title, value, trend, description, className, icon: Icon, accent }: MetricCardProps) {
    return (
        <Card className={cn("glass overflow-hidden group", accent && "border-signal-cyan/30", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{title}</p>
                    {Icon && <Icon className={cn("size-4 text-muted-foreground transition-colors group-hover:text-signal-cyan", accent && "text-signal-cyan")} />}
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                    <h3 className={cn("text-3xl font-bold tracking-tight", accent && "text-signal-cyan")}>{value}</h3>
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
