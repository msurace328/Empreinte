"use client";
import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { verifyChain, GENESIS, VerifyResult } from '@/lib/hash-chain';
import {
    ShieldCheck, ShieldAlert, Download, Link2, Search, Loader2, FlaskConical, RotateCcw, Fingerprint,
} from 'lucide-react';

const short = (h: string) => (h === GENESIS ? 'genesis' : `${h.slice(0, 8)}…${h.slice(-4)}`);

export default function AuditPage() {
    const { auditLog, tamperWithAuditEntry, resealAuditLog } = useData();
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [checking, setChecking] = useState(false);

    const isAdmin = user?.role === 'Admin';

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return auditLog;
        return auditLog.filter(e =>
            [e.action, e.targetId, e.operator, e.reason].some(v => v.toLowerCase().includes(q)));
    }, [auditLog, query]);

    // Verification is instant, but a beat of latency makes it legible as work
    // rather than looking like a hardcoded badge.
    const verify = () => {
        setChecking(true);
        setResult(null);
        setTimeout(() => {
            setResult(verifyChain(auditLog));
            setChecking(false);
        }, 550);
    };

    const exportLog = () => {
        const rowsOut = [
            ['timestamp', 'operator', 'action', 'target', 'reason', 'previous_hash', 'hash'],
            ...auditLog.map(e => [e.timestamp, e.operator, e.action, e.targetId, e.reason, e.previousHash, e.hash]),
        ];
        const csv = rowsOut.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, "'")}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `arena-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const brokenId = result && !result.ok ? result.brokenEntry?.id : null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Audit Trail</h1>
                    <p className="text-muted-foreground mt-1">
                        Every decision, hash-chained. Each record is signed over the one before it.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={exportLog}
                        className="h-9 text-[10px] font-mono uppercase tracking-widest">
                        <Download className="mr-1.5 size-3" /> Export CSV
                    </Button>
                    <Button size="sm" onClick={verify} disabled={checking}
                        className="h-9 bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 font-mono text-[10px] uppercase tracking-widest">
                        {checking
                            ? <><Loader2 className="mr-1.5 size-3 animate-spin" /> Verifying…</>
                            : <><Fingerprint className="mr-1.5 size-3" /> Verify integrity</>}
                    </Button>
                </div>
            </div>

            {/* Verification verdict */}
            {result && (
                <div className={cn('rounded-lg border p-5 animate-in fade-in slide-in-from-top-2',
                    result.ok
                        ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
                        : 'border-signal-red/35 bg-signal-red/[0.08]')}>
                    <div className="flex items-start gap-3">
                        {result.ok
                            ? <ShieldCheck className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                            : <ShieldAlert className="size-5 text-signal-red mt-0.5 shrink-0" />}
                        <div className="min-w-0">
                            <p className={cn('font-bold', result.ok ? 'text-emerald-400' : 'text-signal-red')}>
                                {result.ok
                                    ? `Chain intact — ${result.checked} records verified`
                                    : 'Tampering detected'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                {result.ok
                                    ? 'Every record was re-hashed with SHA-256 over its own contents plus the signature of the record before it, back to the genesis anchor. Nothing has been altered, removed, or reordered.'
                                    : <>
                                        {result.reason}{' '}The break is at <span className="font-mono text-foreground">{result.brokenEntry?.id}</span>
                                        {result.checked > 0
                                            ? <> — the {result.checked} record{result.checked === 1 ? '' : 's'} before it verified cleanly, and everything after it is now unprovable.</>
                                            : <>, the oldest record in the chain, so nothing after it can be trusted.</>}
                                    </>}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Demo control — visible to the founder seat only */}
            {isAdmin && (
                <Card className="glass border-border-muted">
                    <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3 min-w-0">
                            <FlaskConical className="size-4 text-signal-amber mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium">Prove it</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    Rewrite a historical record the way someone with database access would, then verify. The
                                    chain has to catch it.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm"
                                onClick={() => { const target = auditLog[Math.min(2, auditLog.length - 1)]; if (target) { tamperWithAuditEntry(target.id); setResult(null); } }}
                                className="h-8 text-[10px] font-mono uppercase tracking-widest text-signal-amber border-signal-amber/30">
                                Alter a record
                            </Button>
                            <Button variant="ghost" size="sm"
                                onClick={() => { resealAuditLog(); setResult(null); }}
                                className="h-8 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                <RotateCcw className="mr-1.5 size-3" /> Re-seal
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="glass border-border-muted">
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 flex-wrap">
                    <div>
                        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                            Records
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            {rows.length} of {auditLog.length} · newest first · append-only
                        </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Filter by action, target, operator…"
                            className="bg-canvas-muted pl-9 h-9 text-xs" />
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-canvas-muted/50">
                            <TableRow className="border-border-muted hover:bg-transparent">
                                {['Time', 'Action', 'Target', 'Operator', 'Reason', 'Signature'].map(h => (
                                    <TableHead key={h} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow className="border-border-muted hover:bg-transparent">
                                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-10">
                                        No records match that filter.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map(entry => {
                                const isBroken = entry.id === brokenId;
                                const negative = /RESTRICT|REJECT|DENY|DENIED|TAMPER/.test(entry.action);
                                const caution = /WATCH|WAITLIST|OVERRIDE|NEEDS/.test(entry.action);
                                return (
                                    <TableRow key={entry.id}
                                        className={cn('border-border-muted',
                                            isBroken && 'bg-signal-red/10 hover:bg-signal-red/[0.14]')}>
                                        <TableCell className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                                            {format(new Date(entry.timestamp), 'MMM d HH:mm:ss')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn('font-mono text-[9px] whitespace-nowrap',
                                                negative ? 'border-signal-red/25 text-signal-red bg-signal-red/5'
                                                    : caution ? 'border-signal-amber/25 text-signal-amber bg-signal-amber/5'
                                                        : 'border-emerald-500/25 text-emerald-500 bg-emerald-500/5')}>
                                                {entry.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-[11px] font-mono whitespace-nowrap">{entry.targetId}</TableCell>
                                        <TableCell className="text-[11px] whitespace-nowrap">{entry.operator}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[280px]">
                                            <span className="line-clamp-2">{entry.reason}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn('flex items-center gap-1.5 font-mono text-[10px]',
                                                isBroken ? 'text-signal-red' : 'text-muted-foreground/70')}>
                                                <Link2 className="size-3 shrink-0" />
                                                <span title={`${entry.previousHash} -> ${entry.hash}`}>
                                                    {short(entry.previousHash)} → {short(entry.hash)}
                                                </span>
                                            </div>
                                            {isBroken && (
                                                <p className="text-[9px] text-signal-red mt-1">signature does not match contents</p>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <p className="text-[10px] font-mono text-muted-foreground/70 flex items-start gap-2 leading-relaxed">
                <ShieldCheck className="size-3 mt-0.5 shrink-0" />
                SHA-256 over each record plus its predecessor&apos;s signature, anchored at a fixed genesis value.
                Editing any historical field invalidates that record and every record after it.
            </p>
        </div>
    );
}
