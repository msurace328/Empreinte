"use client";
import React from 'react';
import { useData } from '@/lib/providers/data-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function RevenuePage() {
    const { opportunities, approveOpportunity, dismissOpportunity } = useData();
    const { user } = useAuth();
    
    const handleApprove = (id: string) => {
        if (!user) return;
        approveOpportunity(id, `${user.role}.${user.name}`, "Revenue opportunity enacted via dashboard");
    };

    const handleDismiss = (id: string) => {
        if (!user) return;
        dismissOpportunity(id, `${user.role}.${user.name}`, "Revenue opportunity dismissed manually");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Revenue Intelligence</h1>
                <p className="text-muted-foreground mt-1">AI-surfaced opportunities for business expansion.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map(opp => (
                    <Card key={opp.id} className="glass border-border-muted relative overflow-hidden">
                        <CardHeader className="pb-4">
                            <Badge variant="outline" className="w-fit font-mono text-[10px]">{opp.type}</Badge>
                            <CardTitle className="text-xl mt-2">{opp.title}</CardTitle>
                            <CardDescription className="text-xs">{opp.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-mono text-signal-cyan font-bold tracking-tighter mb-6">+${opp.potentialValue.toLocaleString()}</div>
                            {opp.status === 'Open' ? (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 text-muted-foreground" onClick={() => handleDismiss(opp.id)}>DISMISS</Button>
                                    <Button size="sm" className="flex-1 bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90" onClick={() => handleApprove(opp.id)}>APPROVE <ArrowRight className="ml-1 size-3"/></Button>
                                </div>
                            ) : (
                                <div className="text-emerald-500 font-mono text-[10px] uppercase flex items-center gap-2">
                                    <CheckCircle2 className="size-4" /> {opp.status}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}