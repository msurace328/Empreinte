'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { dataService } from '@/lib/services/data-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Network, Maximize2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function MemberGraphPage() {
    const router = useRouter();
    const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = async () => {
            const members = await dataService.getMembers();

            const nodes = members.map(m => ({
                id: m.id,
                name: m.name,
                val: m.tier === 'Founder' ? 5 : (m.tier === 'Suite' ? 3 : 2),
                color: m.status === 'Restricted' ? '#EF4444' : (m.status === 'Watch' ? '#F59E0B' : '#5EE6C9'),
                trustScore: m.trustScore,
            }));

            const links = members
                .filter(m => m.referralId)
                .map(m => ({
                    source: m.referralId,
                    target: m.id,
                }));

            // Add the "Story" cluster - circular referral ring
            const clusterNodes = [
                { id: 'c-1', name: 'Cluster Node 1', val: 2, color: '#EF4444' },
                { id: 'c-2', name: 'Cluster Node 2', val: 2, color: '#EF4444' },
                { id: 'c-3', name: 'Cluster Node 3', val: 2, color: '#EF4444' },
            ];
            const clusterLinks = [
                { source: 'c-1', target: 'c-2' },
                { source: 'c-2', target: 'c-3' },
                { source: 'c-3', target: 'c-1' },
            ];

            setGraphData({
                nodes: [...nodes, ...clusterNodes],
                links: [...links, ...clusterLinks]
            });
        };
        init();
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            setContainerSize({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });
        }
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Member Graph</h1>
                    <p className="text-muted-foreground mt-1">Topology of trust and referral relationships.</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-signal-red border-signal-red/20 bg-signal-red/5 font-mono text-[10px] py-1 px-3">
                        1 CIRCULAR CLUSTER DETECTED
                    </Badge>
                    <Button variant="outline" size="icon" className="glass border-border-muted overflow-hidden">
                        <RefreshCw className="size-4" />
                    </Button>
                </div>
            </div>

            <Card className="glass border-border-muted flex-1 relative overflow-hidden" ref={containerRef}>
                <div className="absolute top-4 left-4 z-10 glass p-3 rounded-lg border-border-muted space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="size-2 bg-signal-cyan rounded-full" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Active Member</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 bg-signal-amber rounded-full" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Watchlist</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 bg-signal-red rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Threat Ring</span>
                    </div>
                </div>

                <div className="w-full h-full">
                    {containerSize.width > 0 && (
                        <ForceGraph2D
                            graphData={graphData}
                            width={containerSize.width}
                            height={containerSize.height}
                            backgroundColor="rgba(0,0,0,0)"
                            linkColor={() => 'rgba(255,255,255,0.1)'}
                            linkDirectionalParticles={1}
                            linkDirectionalParticleSpeed={0.005}
                            nodeLabel={(node: any) => `${node.name} (${node.id})`}
                            onNodeClick={(node: any) => router.push(`/admin/members/${node.id}`)}
                        />
                    )}
                </div>

                <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                    <Button variant="outline" size="sm" className="glass text-[10px] font-mono bg-canvas-black/50">
                        <ShieldAlert className="mr-2 size-3 text-signal-red" /> Highlight Anomalies
                    </Button>
                    <Button variant="outline" size="sm" className="glass text-[10px] font-mono bg-canvas-black/50">
                        <Maximize2 className="mr-2 size-3" /> Fit View
                    </Button>
                </div>
            </Card>
        </div>
    );
}
