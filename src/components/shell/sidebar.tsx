'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    DoorOpen,
    RotateCcw,
    Inbox,
    LayoutDashboard,
    Users,
    UserPlus,
    ShieldAlert,
    Activity,
    DollarSign,
    Lock,
    History,
    Network,
    Ticket,
    LogOut,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { useData } from '@/lib/providers/data-provider';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    { title: 'Command Center', href: '/admin', icon: LayoutDashboard, roles: ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'] },
    { title: 'Door Console', href: '/admin/door', icon: DoorOpen, roles: ['Admin', 'MembershipDirector', 'FrontDesk'] },
    { title: 'Review Queue', href: '/admin/applications', icon: UserPlus, roles: ['Admin', 'MembershipDirector'] },
    { title: 'Members', href: '/admin/members', icon: Users, roles: ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'] },
    { title: 'Inbox', href: '/admin/inbox', icon: Inbox, roles: ['Admin', 'MembershipDirector', 'FrontDesk'] },
    { title: 'Access & Guests', href: '/admin/access', icon: Lock, roles: ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'] },
    { title: 'Suites & Game-Day', href: '/admin/suites', icon: Ticket, roles: ['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor'] },
    { title: 'Member Graph', href: '/admin/graph', icon: Network, roles: ['Admin', 'MembershipDirector', 'Auditor'] },
    { title: 'Revenue Intel', href: '/admin/revenue', icon: DollarSign, roles: ['Admin', 'MembershipDirector'] },
    { title: 'Audit Log', href: '/admin/audit', icon: History, roles: ['Admin', 'Auditor'] },
    { title: 'Security', href: '/admin/settings', icon: ShieldAlert, roles: ['Admin'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, setRole } = useAuth();
    const { resetDemoData } = useData();

    if (!user || user.role === 'Member') return null;

    const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <aside className="w-64 border-r border-border-muted bg-canvas-muted flex flex-col h-screen fixed left-0 top-0 z-50">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <img src="/logo.svg" alt="Empreinte" className="size-8 rounded" />
                    <span className="font-bold text-xl tracking-tight">Empreinte</span>
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Arena Operations</div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            data-tour-id={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group",
                                isActive
                                    ? "bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/20"
                                    : "text-muted-foreground hover:bg-canvas-card hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("size-4 transition-colors", isActive ? "text-signal-cyan" : "group-hover:text-foreground")} />
                            <span className="font-medium">{item.title}</span>
                            {isActive && (
                                <div className="ml-auto w-1 h-3 bg-signal-cyan rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border-muted">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button data-tour-id="role-switcher" className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-canvas-card transition-colors text-left group">
                            <Avatar className="size-8 border border-border-muted">
                                <AvatarImage src={user.role === 'Admin' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' : ''} />
                                <AvatarFallback className="bg-canvas-card text-xs">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono mt-1 uppercase tracking-wider">{user.title ?? user.role}</p>
                            </div>
                            <Activity className="size-3 text-muted-foreground group-hover:text-signal-cyan transition-colors" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 glass border-border-muted">
                        <DropdownMenuLabel>Switch Demo Role</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border-muted" />
                        {(['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor', 'Member'] as UserRole[]).map((role) => (
                            <DropdownMenuItem
                                key={role}
                                onClick={() => {
                                    setRole(role);
                                    if (role === 'Member') router.push('/');
                                    else if (pathname === '/') router.push('/admin');
                                }}
                                className={cn(
                                    "cursor-pointer",
                                    user.role === role && "text-signal-cyan font-bold"
                                )}
                            >
                                {role}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-border-muted" />
                        <DropdownMenuItem className="cursor-pointer" onClick={resetDemoData}>
                            <RotateCcw className="mr-2 size-4" />
                            Reset demo data
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 size-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="mt-4 flex items-center justify-between px-2 pt-2 border-t border-border-muted/50">
                    <div className="flex items-center gap-2">
                        <div className="size-2 bg-signal-cyan rounded-full animate-pulse" />
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">System Live</span>
                    </div>
                    <Zap className="size-3 text-signal-cyan opacity-50" />
                </div>
            </div>
        </aside>
    );
}
