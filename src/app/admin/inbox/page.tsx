"use client";
import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/providers/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { Inbox as InboxIcon, Send, ShieldCheck, ExternalLink, Hash, Bot, Sparkles } from 'lucide-react';

type FilterKey = 'all' | 'unread' | 'Member' | 'Guest' | 'System';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'Member', label: 'Member' },
    { key: 'Guest', label: 'Guest' },
    { key: 'System', label: 'System' },
];

// Canned replies keep the ops voice consistent and the queue moving.
const QUICK_REPLIES = [
    'Looking into this now — I will confirm within the hour.',
    'Confirmed and updated on your account. Anything else?',
    'That is cleared on our side. Your access reflects it immediately.',
];

export default function InboxPage() {
    const { threads, members, replyToThread, markThreadRead } = useData();
    const { user } = useAuth();

    const [filter, setFilter] = useState<FilterKey>('all');
    const [activeId, setActiveId] = useState<string>(threads[0]?.id ?? '');
    const [draft, setDraft] = useState('');

    const operator = user ? `${user.role}.${user.name.split(' ').pop()}` : 'operator';
    const unreadCount = threads.filter(t => t.unread).length;

    const visible = useMemo(() => threads.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'unread') return t.unread;
        return t.kind === filter;
    }), [threads, filter]);

    const active = threads.find(t => t.id === activeId) ?? visible[0];
    const participant = active?.participantId ? members.find(m => m.id === active.participantId) : undefined;

    const open = (id: string) => { setActiveId(id); markThreadRead(id); };

    const send = () => {
        if (!draft.trim() || !active) return;
        replyToThread(active.id, operator, draft.trim());
        setDraft('');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
                    <p className="text-muted-foreground mt-1">Member and guest messages, tied to the identity behind them.</p>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 bg-signal-cyan/5 text-signal-cyan border-signal-cyan/20">
                    {unreadCount} UNREAD
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thread list */}
                <Card className="glass border-border-muted overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex flex-wrap gap-1.5">
                            {FILTERS.map(f => (
                                <Button key={f.key} size="sm" variant="outline"
                                    onClick={() => setFilter(f.key)}
                                    className={cn('h-7 text-[10px] font-mono uppercase tracking-wider px-2.5 border-border-muted',
                                        filter === f.key ? 'bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30' : 'text-muted-foreground')}>
                                    {f.label}
                                </Button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[520px]">
                            {visible.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-10">Nothing in this view.</p>
                            )}
                            {visible.map(t => {
                                const last = t.messages[t.messages.length - 1];
                                return (
                                    <button key={t.id} onClick={() => open(t.id)}
                                        className={cn('w-full text-left px-4 py-3 border-b border-border-muted transition-colors',
                                            active?.id === t.id ? 'bg-signal-cyan/[0.06]' : 'hover:bg-canvas-muted/40')}>
                                        <div className="flex items-start gap-3">
                                            {t.kind === 'System' ? (
                                                <div className="size-8 rounded-full bg-canvas-muted border border-border-muted flex items-center justify-center shrink-0">
                                                    <Bot className="size-4 text-signal-cyan" />
                                                </div>
                                            ) : (
                                                <Avatar className="size-8 border border-border-muted shrink-0">
                                                    <AvatarImage src={t.participantAvatar} />
                                                    <AvatarFallback className="bg-canvas-card text-[10px]">{t.participantName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={cn('text-xs truncate', t.unread ? 'font-bold' : 'font-medium')}>{t.participantName}</p>
                                                    {t.unread && <span className="size-1.5 rounded-full bg-signal-cyan shrink-0" />}
                                                </div>
                                                <p className="text-[11px] text-foreground/80 truncate mt-0.5">{t.subject}</p>
                                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{last.body}</p>
                                                <p className="text-[9px] font-mono text-muted-foreground/60 mt-1">{format(new Date(last.at), 'MMM d · HH:mm')}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Conversation */}
                <Card className="glass border-border-muted lg:col-span-2 flex flex-col">
                    {!active ? (
                        <CardContent className="flex-1 flex items-center justify-center py-20">
                            <p className="text-sm text-muted-foreground flex items-center gap-2"><InboxIcon className="size-4" /> Select a conversation.</p>
                        </CardContent>
                    ) : (
                        <>
                            <CardHeader className="border-b border-border-muted flex flex-row items-start justify-between gap-4 space-y-0">
                                <div className="min-w-0">
                                    <CardTitle className="text-base">{active.subject}</CardTitle>
                                    <div className="text-muted-foreground text-xs mt-1 flex items-center gap-2 flex-wrap">
                                        <span>{active.participantName}</span>
                                        <Badge variant="outline" className="font-mono text-[9px]">{active.kind}</Badge>
                                        {participant && (
                                            <>
                                                <span className="text-muted-foreground/50">·</span>
                                                <span className={cn('font-mono', participant.trustScore >= 70 ? 'text-emerald-500' : participant.trustScore >= 40 ? 'text-signal-amber' : 'text-signal-red')}>
                                                    trust {participant.trustScore}
                                                </span>
                                                <Badge variant="outline" className={cn('font-mono text-[9px]',
                                                    participant.status === 'Active' ? 'border-signal-cyan/20 text-signal-cyan' :
                                                    participant.status === 'Watch' ? 'border-signal-amber/20 text-signal-amber' :
                                                    'border-signal-red/20 text-signal-red')}>
                                                    {participant.status}
                                                </Badge>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {participant && (
                                    <Button asChild variant="outline" size="sm" className="h-8 text-[10px] font-mono uppercase tracking-widest shrink-0">
                                        <Link href={`/admin/members/${participant.id}`}>Dossier <ExternalLink className="ml-1.5 size-3" /></Link>
                                    </Button>
                                )}
                            </CardHeader>

                            <CardContent className="flex-1 p-0">
                                <ScrollArea className="h-[360px] px-6 py-5">
                                    <div className="space-y-4">
                                        {active.messages.map(m => (
                                            <div key={m.id} className={cn('flex', m.from === 'ops' ? 'justify-end' : 'justify-start')}>
                                                <div className={cn('max-w-[78%] rounded-xl px-4 py-3',
                                                    m.from === 'ops'
                                                        ? 'bg-signal-cyan/10 border border-signal-cyan/20'
                                                        : 'bg-canvas-muted/50 border border-border-muted')}>
                                                    <p className="text-sm leading-relaxed">{m.body}</p>
                                                    <p className="text-[9px] font-mono text-muted-foreground/70 mt-2">
                                                        {m.authorName} · {format(new Date(m.at), 'MMM d · HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            {active.kind !== 'System' && (
                                <div className="border-t border-border-muted p-4 space-y-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {QUICK_REPLIES.map(q => (
                                            <button key={q} onClick={() => setDraft(q)}
                                                className="text-[10px] rounded-full border border-border-muted px-2.5 py-1 text-muted-foreground hover:border-signal-cyan/40 hover:text-signal-cyan transition-colors flex items-center gap-1">
                                                <Sparkles className="size-2.5" /> {q.length > 38 ? `${q.slice(0, 38)}…` : q}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input value={draft} onChange={e => setDraft(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                            placeholder={`Reply as ${operator}…`} className="bg-canvas-muted" />
                                        <Button onClick={send} disabled={!draft.trim()} className="bg-signal-cyan text-canvas-black hover:bg-signal-cyan/90 shrink-0">
                                            <Send className="size-4" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] font-mono text-muted-foreground/60 flex items-center gap-1.5">
                                        <ShieldCheck className="size-3" /> Every reply is written to the audit log under your name.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>

            {/* Slack seam — right-sized: forward, do not rebuild Slack in here. */}
            <Card className="glass border-border-muted">
                <CardHeader>
                    <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Hash className="size-4" /> Slack Relay
                    </CardTitle>
                    <CardDescription className="text-xs">Push high-signal events to the staff workspace instead of asking people to watch two inboxes.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { ch: '#arena-escalations', desc: 'High-severity anomalies and trust exceptions the moment they fire.' },
                        { ch: '#arena-front-desk', desc: 'Guest passes awaiting a decision before doors open.' },
                        { ch: '#arena-revenue', desc: 'Approved revenue plays and weekly upside digest.' },
                    ].map(x => (
                        <div key={x.ch} className="rounded-lg border border-border-muted bg-canvas-muted/30 p-4">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-signal-cyan">{x.ch}</span>
                                <Badge variant="outline" className="font-mono text-[9px] border-signal-amber/20 text-signal-amber">SET UP</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2 leading-snug">{x.desc}</p>
                        </div>
                    ))}
                </CardContent>
                <CardContent className="pt-0">
                    <p className="text-[10px] font-mono text-muted-foreground/60">
                        Add SLACK_WEBHOOK_URL to the environment to activate. Outbound only — no Slack data is stored here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
