"use client";
import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useData } from '@/lib/providers/data-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { ShieldCheck, History, KeyRound, Bell, ArrowRight } from 'lucide-react';

const ROLE_POWERS: Record<string, string[]> = {
    Admin: ['Full system access, settings, and financial data', 'Sees the Moonshot Vault', 'Can define custom roles'],
    MembershipDirector: ['Vetting, member management, and audit log read', 'Revenue intelligence', 'Cannot change security settings'],
    FrontDesk: ['Door decisions, check-ins, and guest passes', 'Basic member profiles', 'No revenue, audit, or graph access'],
    Auditor: ['Global read-only access to records', 'Immutable audit log', 'Cannot change any record'],
};

export default function AccountPage() {
    const { user } = useAuth();
    const { auditLog } = useData();

    if (!user) return null;

    const mine = auditLog.filter(e => e.operator.includes(user.name.split(' ').pop() ?? '')).slice(0, 8);
    const powers = ROLE_POWERS[user.role] ?? [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Your account</h1>
                <p className="text-muted-foreground mt-1">Who you are in this console, and what you have done with it.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass border-border-muted">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Avatar className="size-20 border border-border-muted">
                            <AvatarImage src={user.role === 'Admin' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' : ''} />
                            <AvatarFallback className="bg-canvas-card text-2xl">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold mt-4">{user.name}</h2>
                        <Badge variant="outline" className="mt-2 font-mono text-[10px] border-signal-cyan/25 text-signal-cyan">
                            {user.title ?? user.role}
                        </Badge>
                        <p className="text-xs text-muted-foreground font-mono mt-3">{user.email}</p>
                        <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">{user.id}</p>
                    </CardContent>
                </Card>

                <Card className="glass border-border-muted lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <KeyRound className="size-4" /> What this seat can do
                        </CardTitle>
                        <CardDescription className="text-xs">Least-privilege scope for the {user.role} role.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                        {powers.map(p => (
                            <div key={p} className="flex items-start gap-2.5 text-sm">
                                <ShieldCheck className="size-4 text-signal-cyan mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{p}</span>
                            </div>
                        ))}
                        {user.role === 'Admin' && (
                            <Button asChild variant="outline" size="sm" className="mt-3 text-[10px] font-mono uppercase tracking-widest">
                                <Link href="/admin/settings">Manage roles <ArrowRight className="ml-1.5 size-3" /></Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="glass border-border-muted">
                <CardHeader>
                    <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <History className="size-4" /> Your recent activity
                    </CardTitle>
                    <CardDescription className="text-xs">Decisions recorded against your name this session.</CardDescription>
                </CardHeader>
                <CardContent>
                    {mine.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nothing recorded yet this session.</p>
                    ) : (
                        <div className="space-y-0">
                            {mine.map((e, i) => (
                                <div key={e.id} className={cn('flex items-start justify-between gap-4 py-3', i < mine.length - 1 && 'border-b border-border-muted')}>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{e.action} · {e.targetId}</p>
                                        <p className="text-[10px] font-mono text-muted-foreground truncate">{e.reason}</p>
                                    </div>
                                    <p className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                                        {format(new Date(e.timestamp), 'MMM d · HH:mm')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="glass border-border-muted">
                <CardHeader>
                    <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Bell className="size-4" /> Alerts
                    </CardTitle>
                    <CardDescription className="text-xs">
                        High-severity anomalies and door overrides raise a toast in-app while you work.
                        Channel routing to Slack is configured in the Inbox.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
