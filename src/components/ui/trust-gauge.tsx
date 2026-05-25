'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TrustGaugeProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function TrustGauge({ score, size = 'md', className }: TrustGaugeProps) {
    const radius = size === 'sm' ? 30 : size === 'md' ? 60 : 100;
    const stroke = size === 'sm' ? 4 : size === 'md' ? 8 : 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 90) return 'text-signal-cyan';
        if (s >= 60) return 'text-signal-amber';
        return 'text-signal-red';
    };

    const dims = size === 'sm' ? 'size-20' : size === 'md' ? 'size-40' : 'size-64';

    return (
        <div className={cn("relative flex items-center justify-center", dims, className)}>
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
            >
                {/* Background Circle */}
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset: 0 }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-border-muted"
                />
                {/* Progress Circle */}
                <motion.circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={cn("transition-colors duration-500", getColor(score))}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <motion.span
                    className={cn(
                        "font-bold font-mono tracking-tighter",
                        size === 'sm' ? "text-lg" : size === 'md' ? "text-4xl" : "text-7xl"
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {Math.round(score)}
                </motion.span>
                {size !== 'sm' && (
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Trust Score</span>
                )}
            </div>
        </div>
    );
}
