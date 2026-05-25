'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { useAuth } from '@/hooks/use-auth';
import { MemberPortalDashboard } from '@/components/member/portal-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

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
            <main className="flex-1 pl-64">
                <div className="max-w-[1600px] mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
