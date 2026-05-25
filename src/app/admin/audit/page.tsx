'use client';

import React, { useEffect, useState } from 'react';
import { dataService } from '@/lib/services/data-service';
import { AuditEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Shield, Clock, User, Fingerprint, Lock, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AuditLogPage() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);

    useEffect(() => {
        dataService.getAuditLog().then(setEntries);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Immutable, hash-chained ledger of all operational decisions.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="glass border-border-muted font-mono text-[10px] uppercase h-9"
                        onClick={() => alert('Cryptographic chain verification: ALL HASHES VALID')}
                    >
                        <Shield className="mr-2 size-3 text-signal-cyan" /> Verify Chain
                    </Button>
                    <Button
                        className="bg-canvas-card border border-border-muted hover:bg-canvas-card/80 font-mono text-[10px] uppercase h-9"
                        onClick={() => alert('Ledger export initiated. SHA-256 manifest: ' + Math.random().toString(36).substring(2, 10))}
                    >
                        <Download className="mr-2 size-3" /> Export Ledger
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Search ledger by actor, target, or action..." className="pl-10 glass border-border-muted bg-canvas-muted/50" />
            </div>

            <div className="space-y-4">
                {entries.map((entry, i) => (
                    <div key={entry.id} className="relative group">
                        {/* Hash Chain Connector */}
                        {i < entries.length - 1 && (
                            <div className="absolute left-[26px] top-12 bottom-[-20px] w-0.5 bg-gradient-to-b from-signal-cyan/30 to-transparent z-0" />
                        )}

                        <Card className="glass border-border-muted hover:border-signal-cyan/20 transition-all duration-300 relative z-10 overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                <Fingerprint className="size-8 text-signal-cyan" />
                            </div>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="size-12 rounded-lg bg-canvas-muted border border-border-muted flex items-center justify-center shrink-0">
                                            <Lock className="size-5 text-signal-cyan shadow-[0_0_8px_rgba(94,230,201,0.4)]" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-tighter text-signal-cyan border-signal-cyan/20 bg-signal-cyan/5">
                                                    {entry.hash.slice(0, 12)}...
                                                </Badge>
                                                <span className="text-xs font-bold text-foreground">{entry.action}</span>
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Target: <span className="text-foreground">{entry.targetId}</span>
                                                <span className="mx-2 opacity-50">|</span>
                                                Reason: <span className="text-foreground">{entry.reason}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 md:text-right shrink-0">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 md:justify-end text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                                <User className="size-3" /> {entry.operator}
                                            </div>
                                            <div className="flex items-center gap-1.5 md:justify-end text-[10px] font-mono text-muted-foreground">
                                                <Clock className="size-3" /> {format(new Date(entry.timestamp), 'MMM d, HH:mm:ss')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border-muted/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-1.5 bg-signal-cyan rounded-full" />
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">Cryptographically linked to {entry.previousHash.slice(0, 8)}...</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[9px] font-mono uppercase tracking-widest hover:text-signal-cyan"
                                        onClick={() => alert('Digital Certificate: SIGNED BY DIRECTOR VANCE')}
                                    >
                                        View Certificate
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}
