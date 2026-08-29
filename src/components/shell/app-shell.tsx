'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { GuidedTour } from './guided-tour';
import { CommandPalette } from './command-palette';
import { AlertCenter } from './alert-center';
import { useAuth } from '@/hooks/use-auth';
import { MemberPortalDashboard } from '@/components/member/portal-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    // A front-desk operator's home is the door, not the analytics dashboard.
    React.useEffect(() => {
        if (!isLoading && user?.role === 'FrontDesk' && pathname === '/admin') {
            router.replace('/admin/door');
        }
    }, [isLoading, user?.role, pathname, router]);

    if (isLoading) {
        return (
            <div className="flex bg-canvas-black min-h-screen">
                <div className="w-64 border-r border-border-muted p-6 space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex-1 p-8 space-y-6">
                    <Skeleton className="h-12 w-1/4" />
                    <div className="grid grid-cols-4 gap-6">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        );
    }

    if (user?.role === 'Member') {
        return <MemberPortalDashboard />;
    }

    return (
        <div className="flex bg-canvas-black min-h-screen">
            <Sidebar />
            <GuidedTour />
            <CommandPalette />
            <AlertCenter />
            {/* min-w-0: a flex item defaults to min-width:auto and will not shrink
                below its content, so a wide table pushed the whole page sideways. */}
            <main className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
                <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
