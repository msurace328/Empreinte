'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccessAnomaly } from '@/lib/types';
import { dataService } from '@/lib/services/data-service';
import { AlertTriangle, Clock, MapPin, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function AnomalyFeed() {
    const [anomalies, setAnomalies] = useState<AccessAnomaly[]>([]);

    useEffect(() => {
        dataService.getAnomalies().then(setAnomalies);
    }, []);

    return (
        <div className="space-y-4">
            {anomalies.map((anomaly) => (
                <div
                    key={anomaly.id}
                    className="group relative flex gap-4 p-4 rounded-lg border border-border-muted bg-canvas-muted/50 hover:bg-canvas-card transition-all duration-200"
                >
                    <div className={cn(
                        "mt-1 size-2 rounded-full",
                        anomaly.severity === 'High' ? "bg-signal-red animate-pulse" : (anomaly.severity === 'Medium' ? "bg-signal-amber" : "bg-blue-400")
                    )} />
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{anomaly.type}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{formatDistanceToNow(new Date(anomaly.timestamp))} ago</span>
                        </div>
                        <p className="text-sm font-medium leading-snug">{anomaly.description}</p>
                        <div className="flex items-center gap-3 pt-1">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                <Clock className="size-3" /> {new Date(anomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                <MapPin className="size-3" /> Suite B
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
