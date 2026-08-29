'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, UserRoundSearch, Key, Database, Globe, Zap, Bell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserRole } from '@/hooks/use-auth';
import { NAV_ITEMS, ROLE_LABELS, ROLE_CAPABILITIES, permissionsFor } from '@/lib/nav';
import { useData } from '@/lib/providers/data-provider';
import { Check, X } from 'lucide-react';

export default function SettingsPage() {
    const { members, applications, guests } = useData();
    const [inspecting, setInspecting] = useState<UserRole | null>(null);
    const [privacyOpen, setPrivacyOpen] = useState(false);

    // Counted from what is actually held, not asserted.
    const inventory = [
        { record: 'Members', count: members.length, fields: 'Name, email, photo, tier, access history', retention: 'For the life of the membership' },
        { record: 'Applications', count: applications.length, fields: 'Name, email, photo, submitted documents', retention: 'Documents purged 30 days after a decision' },
        { record: 'Guests', count: guests.length, fields: 'Name, sponsor, vetting outcomes', retention: 'Purged 90 days after the fixture' },
    ];

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
                            {(['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'] as UserRole[]).map((role) => {
                                const { allowed } = permissionsFor(role);
                                return (
                                    <div key={role} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-canvas-muted/30 border border-border-muted">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold">{ROLE_LABELS[role]}</span>
                                                <Badge variant="outline" className="text-[10px] font-mono text-signal-cyan">
                                                    {allowed.length} OF {NAV_ITEMS.length} AREAS
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                {allowed.map(a => a.title).join(' · ')}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setInspecting(role)}
                                            className="text-muted-foreground hover:text-foreground shrink-0">
                                            Inspect
                                        </Button>
                                    </div>
                                );
                            })}
                            <p className="text-[10px] font-mono text-muted-foreground/70 pt-1">
                                Roles are enforced from a single config; this page reads the same source the app does.
                            </p>
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
                            Empreinte automatically redacts PII for users below the &ldquo;Director&rdquo; role level.
                            Document images are purged 30 days after verification by default.
                        </p>
                        <Button variant="outline" onClick={() => setPrivacyOpen(true)}
                            className="w-full glass border-border-muted text-[10px] font-mono uppercase tracking-widest">
                            Privacy Audit
                        </Button>
                    </Card>
                </div>
            </div>
            {/* What a role can actually reach */}
            <Dialog open={!!inspecting} onOpenChange={(o) => !o && setInspecting(null)}>
                <DialogContent className="glass border-border-muted bg-canvas-card max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{inspecting && ROLE_LABELS[inspecting]}</DialogTitle>
                        <DialogDescription className="text-xs">
                            Read from the same configuration the app enforces, so this cannot drift from reality.
                        </DialogDescription>
                    </DialogHeader>
                    {inspecting && (
                        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Can do</p>
                                <div className="space-y-1.5">
                                    {ROLE_CAPABILITIES[inspecting].map(c => (
                                        <div key={c} className="flex items-start gap-2 text-xs">
                                            <Check className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground">{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Separator className="bg-border-muted" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 mb-2">Can open</p>
                                    {permissionsFor(inspecting).allowed.map(i => (
                                        <p key={i.href} className="text-xs text-muted-foreground py-0.5">{i.title}</p>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-signal-red mb-2">Blocked</p>
                                    {permissionsFor(inspecting).denied.length === 0
                                        ? <p className="text-xs text-muted-foreground py-0.5">Nothing — full access</p>
                                        : permissionsFor(inspecting).denied.map(i => (
                                            <p key={i.href} className="text-xs text-muted-foreground/60 py-0.5 line-through">{i.title}</p>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Data inventory */}
            <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
                <DialogContent className="glass border-border-muted bg-canvas-card max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Privacy audit</DialogTitle>
                        <DialogDescription className="text-xs">
                            Personal data currently held, counted live from the record store.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {inventory.map(r => (
                            <div key={r.record} className="rounded-lg border border-border-muted bg-canvas-muted/30 p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{r.record}</p>
                                    <Badge variant="outline" className="font-mono text-[10px]">{r.count} records</Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1.5">{r.fields}</p>
                                <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">Retention: {r.retention}</p>
                            </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1">
                            Prototype note: this reports what the demo holds. A production deployment would also cover
                            payment records, document images, and any data held by the vendors listed under Integration Seams.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { cn } from '@/lib/utils';
