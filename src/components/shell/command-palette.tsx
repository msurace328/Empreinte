'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/providers/data-provider';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Search, LayoutDashboard, DoorOpen, UserPlus, Users, Inbox, Lock, Ticket,
    Network, DollarSign, History, ShieldAlert, CornerDownLeft,
} from 'lucide-react';

interface Item {
    id: string;
    label: string;
    hint?: string;
    group: 'Go to' | 'Members' | 'Applications';
    href: string;
    icon: React.ElementType;
    roles: UserRole[];
}

const ALL: UserRole[] = ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'];

const PAGES: Item[] = [
    { id: 'p-dash', label: 'Command Center', href: '/admin', icon: LayoutDashboard, group: 'Go to', roles: ALL },
    { id: 'p-door', label: 'Door Console', href: '/admin/door', icon: DoorOpen, group: 'Go to', roles: ['Admin', 'MembershipDirector', 'FrontDesk'] },
    { id: 'p-apps', label: 'Review Queue', href: '/admin/applications', icon: UserPlus, group: 'Go to', roles: ['Admin', 'MembershipDirector'] },
    { id: 'p-mem', label: 'Members', href: '/admin/members', icon: Users, group: 'Go to', roles: ALL },
    { id: 'p-inbox', label: 'Inbox', href: '/admin/inbox', icon: Inbox, group: 'Go to', roles: ['Admin', 'MembershipDirector', 'FrontDesk'] },
    { id: 'p-access', label: 'Access & Guests', href: '/admin/access', icon: Lock, group: 'Go to', roles: ALL },
    { id: 'p-suites', label: 'Suites & Game-Day', href: '/admin/suites', icon: Ticket, group: 'Go to', roles: ALL },
    { id: 'p-graph', label: 'Member Graph', href: '/admin/graph', icon: Network, group: 'Go to', roles: ['Admin', 'MembershipDirector', 'Auditor'] },
    { id: 'p-rev', label: 'Revenue Intel', href: '/admin/revenue', icon: DollarSign, group: 'Go to', roles: ['Admin', 'MembershipDirector'] },
    { id: 'p-audit', label: 'Audit Log', href: '/admin/audit', icon: History, group: 'Go to', roles: ['Admin', 'Auditor'] },
    { id: 'p-sec', label: 'Security', href: '/admin/settings', icon: ShieldAlert, group: 'Go to', roles: ['Admin'] },
];

export function CommandPalette() {
    const router = useRouter();
    const { members, applications } = useData();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [cursor, setCursor] = useState(0);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen(v => !v);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const items = useMemo<Item[]>(() => {
        if (!user) return [];
        const role = user.role as UserRole;
        const pages = PAGES.filter(p => p.roles.includes(role));
        const people: Item[] = members.map(m => ({
            id: `m-${m.id}`, label: m.name, hint: `${m.id} · ${m.tier} · trust ${m.trustScore}`,
            href: `/admin/members/${m.id}`, icon: Users, group: 'Members', roles: ALL,
        }));
        const apps: Item[] = ['Admin', 'MembershipDirector'].includes(role)
            ? applications.filter(a => !['Approved', 'Rejected'].includes(a.status)).map(a => ({
                id: `a-${a.id}`, label: a.name, hint: `${a.id} · ${a.tier} · risk ${a.riskScore}`,
                href: `/admin/members/${a.id}`, icon: UserPlus, group: 'Applications', roles: ALL,
            }))
            : [];
        return [...pages, ...people, ...apps];
    }, [members, applications, user]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q
            ? items.filter(i => i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q))
            : items.filter(i => i.group === 'Go to');
        return base.slice(0, 9);
    }, [items, query]);

    useEffect(() => { setCursor(0); }, [query, open]);

    const run = (item: Item) => {
        setOpen(false);
        setQuery('');
        router.push(item.href);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
        else if (e.key === 'Enter' && filtered[cursor]) { e.preventDefault(); run(filtered[cursor]); }
    };

    if (!user || user.role === 'Member') return null;

    let lastGroup = '';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="glass border-border-muted bg-canvas-card max-w-xl p-0 gap-0 top-[20%] translate-y-0">
                <DialogTitle className="sr-only">Command palette</DialogTitle>
                <div className="flex items-center gap-3 border-b border-border-muted px-4">
                    <Search className="size-4 text-muted-foreground shrink-0" />
                    <Input
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Jump to a page, member, or applicant…"
                        className="border-0 bg-transparent h-12 focus-visible:ring-0 px-0"
                    />
                </div>
                <div className="max-h-[340px] overflow-y-auto py-2">
                    {filtered.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">No matches.</p>
                    )}
                    {filtered.map((item, i) => {
                        const header = item.group !== lastGroup ? item.group : null;
                        lastGroup = item.group;
                        return (
                            <div key={item.id}>
                                {header && (
                                    <div className="px-4 pt-3 pb-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70">{header}</div>
                                )}
                                <button
                                    onMouseEnter={() => setCursor(i)}
                                    onClick={() => run(item)}
                                    className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                        i === cursor ? 'bg-signal-cyan/10' : 'hover:bg-canvas-muted/40')}
                                >
                                    <item.icon className={cn('size-4 shrink-0', i === cursor ? 'text-signal-cyan' : 'text-muted-foreground')} />
                                    <span className="text-sm flex-1 truncate">{item.label}</span>
                                    {item.hint && <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[45%]">{item.hint}</span>}
                                    {i === cursor && <CornerDownLeft className="size-3 text-signal-cyan shrink-0" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="border-t border-border-muted px-4 py-2.5 flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-[9px]">↑↓ navigate</Badge>
                    <Badge variant="outline" className="font-mono text-[9px]">↵ open</Badge>
                    <Badge variant="outline" className="font-mono text-[9px]">esc close</Badge>
                </div>
            </DialogContent>
        </Dialog>
    );
}
