'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/providers/data-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphNode {
    id: string;
    name: string;
    val: number;
    color: string;
    trustScore: number;
    inRing: boolean;
}

// Walk each member's referral chain. If following it returns to where we
// started, those accounts vouch for each other in a closed loop — the
// "manufactured trust" pattern no single application review would catch.
function findReferralCycles(members: { id: string; referralId?: string }[]): string[][] {
    const referrerOf = new Map(members.map(m => [m.id, m.referralId]));
    const seen = new Set<string>();
    const cycles: string[][] = [];

    for (const m of members) {
        if (seen.has(m.id)) continue;
        const path: string[] = [];
        const onPath = new Map<string, number>();
        let cursor: string | undefined = m.id;

        while (cursor && !seen.has(cursor)) {
            if (onPath.has(cursor)) {
                cycles.push(path.slice(onPath.get(cursor)!));
                break;
            }
            onPath.set(cursor, path.length);
            path.push(cursor);
            cursor = referrerOf.get(cursor);
        }
        path.forEach(id => seen.add(id));
    }
    return cycles.filter(c => c.length > 1);
}

export default function MemberGraphPage() {
    const router = useRouter();
    const { members } = useData();
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [highlightRings, setHighlightRings] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);

    const cycles = useMemo(() => findReferralCycles(members), [members]);
    const ringIds = useMemo(() => new Set(cycles.flat()), [cycles]);

    const graphData = useMemo(() => {
        const nodes: GraphNode[] = members.map(m => ({
            id: m.id,
            name: m.name,
            val: m.tier === 'Founder' ? 5 : m.tier === 'Suite' ? 3 : 2,
            color: ringIds.has(m.id) && highlightRings
                ? '#EF4444'
                : m.status === 'Restricted' ? '#EF4444'
                : m.status === 'Watch' ? '#F59E0B'
                : '#5EE6C9',
            trustScore: m.trustScore,
            inRing: ringIds.has(m.id),
        }));
        const ids = new Set(members.map(m => m.id));
        const links = members
            .filter(m => m.referralId && ids.has(m.referralId))
            .map(m => ({ source: m.referralId as string, target: m.id }));
        return { nodes, links };
    }, [members, ringIds, highlightRings]);

    useEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const fit = useCallback(() => fgRef.current?.zoomToFit(600, 60), []);

    return (
        <div className="space-y-6 animate-in fade-in duration-700 lg:h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Member Graph</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Topology of trust and referral relationships.</p>
                </div>
                <Badge variant="outline" className={cn('font-mono text-[10px] py-1 px-3',
                    cycles.length
                        ? 'text-signal-red border-signal-red/20 bg-signal-red/5'
                        : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5')}>
                    {cycles.length
                        ? `${cycles.length} CIRCULAR CLUSTER${cycles.length > 1 ? 'S' : ''} DETECTED`
                        : 'NO CIRCULAR VOUCHING'}
                </Badge>
            </div>

            {cycles.length > 0 && (
                <div className="rounded-lg border border-signal-red/25 bg-signal-red/[0.06] p-4">
                    <p className="text-sm font-medium text-signal-red flex items-center gap-2">
                        <ShieldAlert className="size-4" /> Manufactured trust detected
                    </p>
                    {cycles.map((cycle, i) => (
                        <p key={i} className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            {cycle.map(id => members.find(m => m.id === id)?.name ?? id).join(' → ')} → back to the start.
                            {' '}These {cycle.length} accounts vouch for each other in a closed loop with no outside referrer.
                        </p>
                    ))}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {[...ringIds].map(id => (
                            <Button key={id} size="sm" variant="outline"
                                onClick={() => router.push(`/admin/members/${id}`)}
                                className="h-7 text-[10px] font-mono border-signal-red/25 text-signal-red">
                                Open {members.find(m => m.id === id)?.name ?? id}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <Card className="glass border-border-muted flex-1 relative overflow-hidden min-h-[420px]" ref={containerRef}>
                <div className="absolute top-4 left-4 z-10 glass p-3 rounded-lg border-border-muted space-y-2">
                    {[
                        { c: 'bg-signal-cyan', l: 'Active Member' },
                        { c: 'bg-signal-amber', l: 'Watchlist' },
                        { c: 'bg-signal-red animate-pulse', l: 'Threat Ring' },
                    ].map(x => (
                        <div key={x.l} className="flex items-center gap-2">
                            <div className={cn('size-2 rounded-full', x.c)} />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{x.l}</span>
                        </div>
                    ))}
                </div>

                <div className="w-full h-full">
                    {containerSize.width > 0 && (
                        <ForceGraph2D
                            ref={fgRef}
                            graphData={graphData}
                            width={containerSize.width}
                            height={containerSize.height}
                            backgroundColor="rgba(0,0,0,0)"
                            linkColor={() => 'rgba(255,255,255,0.1)'}
                            linkDirectionalParticles={1}
                            linkDirectionalParticleSpeed={0.005}
                            nodeLabel={(node) => {
                                const n = node as unknown as GraphNode;
                                return `${n.name} (${n.id}) · trust ${n.trustScore}${n.inRing ? ' · IN RING' : ''}`;
                            }}
                            onNodeClick={(node) => router.push(`/admin/members/${(node as unknown as GraphNode).id}`)}
                        />
                    )}
                </div>

                <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setHighlightRings(v => !v)}
                        className={cn('glass text-[10px] font-mono bg-canvas-black/50', highlightRings && 'border-signal-red/40 text-signal-red')}>
                        <ShieldAlert className="mr-2 size-3" /> Highlight Anomalies
                    </Button>
                    <Button variant="outline" size="sm" onClick={fit} className="glass text-[10px] font-mono bg-canvas-black/50">
                        <Maximize2 className="mr-2 size-3" /> Fit View
                    </Button>
                </div>
            </Card>
        </div>
    );
}
