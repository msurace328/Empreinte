'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Calculator,
    DoorOpen,
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
    RotateCcw,
    UserCog,
    Compass,
    Command,
    Menu,
    X,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { useData } from '@/lib/providers/data-provider';
import { NAV_ITEMS } from '@/lib/nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
    DropdownMenuSubContent, DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

const ICONS: Record<string, React.ElementType> = {
    '/admin': LayoutDashboard,
    '/admin/door': DoorOpen,
    '/admin/applications': UserPlus,
    '/admin/members': Users,
    '/admin/inbox': Inbox,
    '/admin/access': Lock,
    '/admin/suites': Ticket,
    '/admin/graph': Network,
    '/admin/revenue': DollarSign,
    '/admin/books': Calculator,
    '/admin/audit': History,
    '/admin/settings': ShieldAlert,
};

const ROLE_LABEL: Record<UserRole, string> = {
    Admin: 'Admin · CEO',
    MembershipDirector: 'Membership Director',
    FrontDesk: 'Front Desk',
    Auditor: 'Auditor',
    Member: 'Member (portal)',
};

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, setRole } = useAuth();
    const { resetDemoData } = useData();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close the drawer whenever navigation happens.
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    // Lock body scroll while the drawer is open.
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    if (!user || user.role === 'Member') return null;

    const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));

    const openTour = () => {
        setMobileOpen(false);
        window.dispatchEvent(new CustomEvent('empreinte:open-tour'));
    };

    const openPalette = () => {
        setMobileOpen(false);
        window.dispatchEvent(new CustomEvent('empreinte:open-palette'));
    };

    const userMenu = (
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
            <DropdownMenuContent align="end" side="top" className="w-60 glass border-border-muted">
                <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border-muted" />

                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin/account')}>
                    <UserCog className="mr-2 size-4" /> Your account
                </DropdownMenuItem>
                {user.role === 'Admin' && (
                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin/settings')}>
                        <ShieldAlert className="mr-2 size-4" /> Security &amp; settings
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer" onClick={openPalette}>
                    <Command className="mr-2 size-4" /> Command palette
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">⌘K</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={openTour}>
                    <Compass className="mr-2 size-4" /> Replay guided tour
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border-muted" />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                        <Users className="mr-2 size-4" /> Switch desk
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="glass border-border-muted w-52">
                        {(['Admin', 'MembershipDirector', 'FrontDesk', 'Auditor', 'Member'] as UserRole[]).map((role) => (
                            <DropdownMenuItem
                                key={role}
                                onClick={() => {
                                    setRole(role);
                                    if (role === 'Member') router.push('/');
                                    else if (role === 'FrontDesk') router.push('/admin/door');
                                    else router.push('/admin');
                                }}
                                className={cn('cursor-pointer', user.role === role && 'text-signal-cyan font-bold')}
                            >
                                {ROLE_LABEL[role]}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="bg-border-muted" />
                <DropdownMenuItem className="cursor-pointer" onClick={resetDemoData}>
                    <RotateCcw className="mr-2 size-4" /> Reset demo data
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => { setRole('Member'); router.push('/'); }}
                >
                    <LogOut className="mr-2 size-4" /> Leave the console
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const navList = (
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        data-tour-id={item.href}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group',
                            isActive
                                ? 'bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/20'
                                : 'text-muted-foreground hover:bg-canvas-card hover:text-foreground'
                        )}
                    >
                        {React.createElement(ICONS[item.href] ?? LayoutDashboard, {
                            className: cn('size-4 transition-colors', isActive ? 'text-signal-cyan' : 'group-hover:text-foreground'),
                        })}
                        <span className="font-medium">{item.title}</span>
                        {isActive && <div className="ml-auto w-1 h-3 bg-signal-cyan rounded-full" />}
                    </Link>
                );
            })}
        </nav>
    );

    const brand = (
        <div className="p-6">
            <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Empreinte" className="size-8 rounded" />
                <span className="font-bold text-xl tracking-tight">Empreinte</span>
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Arena Operations</div>
        </div>
    );

    const footer = (
        <div className="p-4 border-t border-border-muted">
            {userMenu}
            <div className="mt-4 flex items-center justify-between px-2 pt-2 border-t border-border-muted/50">
                <div className="flex items-center gap-2">
                    <div className="size-2 bg-signal-cyan rounded-full animate-pulse" />
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">System Live</span>
                </div>
                <Zap className="size-3 text-signal-cyan opacity-50" />
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile top bar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 border-b border-border-muted bg-canvas-muted/95 backdrop-blur px-4 h-14">
                <button
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                    className="p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-canvas-card transition-colors"
                >
                    <Menu className="size-5" />
                </button>
                <img src="/logo.svg" alt="" className="size-6 rounded" />
                <span className="font-bold tracking-tight">Empreinte</span>
                <button
                    onClick={openPalette}
                    aria-label="Search"
                    className="ml-auto p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-canvas-card transition-colors"
                >
                    <Command className="size-4" />
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button aria-label="Account" className="rounded-full p-1.5 -m-1.5 flex items-center justify-center">
                            <Avatar className="size-8 border border-border-muted">
                                <AvatarImage src={user.role === 'Admin' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' : ''} />
                                <AvatarFallback className="bg-canvas-card text-[10px]">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 glass border-border-muted">
                        <DropdownMenuLabel className="text-xs">{user.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border-muted" />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin/account')}>
                            <UserCog className="mr-2 size-4" /> Your account
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={openTour}>
                            <Compass className="mr-2 size-4" /> Guided tour
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={resetDemoData}>
                            <RotateCcw className="mr-2 size-4" /> Reset demo data
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-canvas-black/70 backdrop-blur-sm animate-in fade-in" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-canvas-muted border-r border-border-muted flex flex-col animate-in slide-in-from-left duration-200">
                        <div className="flex items-start justify-between">
                            {brand}
                            <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                                className="m-4 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-canvas-card transition-colors">
                                <X className="size-5" />
                            </button>
                        </div>
                        {navList}
                        {footer}
                    </aside>
                </div>
            )}

            {/* Desktop rail */}
            <aside className="hidden lg:flex w-64 border-r border-border-muted bg-canvas-muted flex-col h-screen fixed left-0 top-0 z-50">
                {brand}
                {navList}
                {footer}
            </aside>
        </>
    );
}
