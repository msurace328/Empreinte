'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, UserRoundSearch, Key, Database, Globe, Zap, Bell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Security & Settings</h1>
                <p className="text-muted-foreground mt-1">Platform governance, access control, and integration seams.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="glass border-border-muted overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <UserRoundSearch className="size-4" /> Role-Based Access Control
                            </CardTitle>
                            <CardDescription>Configure least-privilege roles for ARENA staff.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { role: 'Admin', desc: 'Full system access, settings, and financial data.', active: 1 },
                                { role: 'Membership Director', desc: 'Vetting, member management, and audit log read.', active: 2 },
                                { role: 'Front-desk Operator', desc: 'Check-ins, guest management, and basic member profiles.', active: 4 },
                                { role: 'Auditor', desc: 'Global read-only access to records and immutable audit log.', active: 1 },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-canvas-muted/30 border border-border-muted">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">{item.role}</span>
                                            <Badge variant="outline" className="text-[10px] font-mono text-signal-cyan">{item.active} ACCOUNTS</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Edit</Button>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full glass border-dashed border-border-muted text-xs font-mono uppercase tracking-widest text-muted-foreground">
                                + Define New Custom Role
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="glass border-border-muted">
                        <CardHeader>
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Zap className="size-4" /> Integration Seams
                            </CardTitle>
                            <CardDescription>External vendors providing security and financial signals.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: 'Persona', type: 'KYC / Identity', status: 'Connected', icon: ShieldCheck },
                                { name: 'DeepfakeScan', type: 'AI Media Detection', status: 'Connected', icon: Globe },
                                { name: 'Stripe', type: 'Payments & Revenue', status: 'Connected', icon: Database },
                                { name: 'AuthArmor', type: 'Behavioral Biometrics', status: 'Provisioning', icon: Lock },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border-b border-border-muted last:border-0">
                                    <div className="flex items-center gap-3">
                                        <item.icon className="size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{item.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{item.type}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "text-[9px] font-mono",
                                        item.status === 'Connected' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-amber-500/20 text-amber-500 bg-amber-500/5"
                                    )}>
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="glass border-signal-cyan/20 bg-signal-cyan/5">
                        <CardHeader>
                            <CardTitle className="text-sm font-mono uppercase tracking-widest text-signal-cyan flex items-center gap-2">
                                <Lock className="size-4" /> Security Posture
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Encryption at rest</p>
                                <p className="text-sm font-bold font-mono">AES-256-GCM</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Audit Hashing</p>
                                <p className="text-sm font-bold font-mono">SHA-256 Chain</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Session Expiry</p>
                                <p className="text-sm font-bold font-mono">15 Minutes Idle</p>
                            </div>
                            <Separator className="bg-signal-cyan/10" />
                            <div className="pt-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bell className="size-3 text-signal-cyan" />
                                    <span className="text-[10px] font-mono uppercase tracking-widest">Alert Routing</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed italic">High-severity risk flags are automatically routed to Admin via Signal/Slack.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-border-muted p-6">
                        <h3 className="text-sm font-bold mb-4">Data Minimization</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                            Empreinte automatically redacts PII for users below the "Director" role level.
                            Document images are purged 30 days after verification by default.
                        </p>
                        <Button variant="outline" className="w-full glass border-border-muted text-[10px] font-mono uppercase tracking-widest">
                            Privacy Audit
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}

import { cn } from '@/lib/utils';
