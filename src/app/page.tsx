'use client';

import { AppShell } from "@/components/shell/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'Member') {
      router.push('/admin');
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;

  return (
    <AppShell>
      {/* If member, AppShell renders MemberPortalDashboard. 
          If staff, the useEffect above will redirect them to /admin. 
          This is a fallback or for the demo's root path. */}
      {user?.role !== 'Member' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="size-20 bg-signal-cyan rounded-2xl mx-auto flex items-center justify-center text-4xl font-bold text-canvas-black shadow-[0_0_30px_rgba(94,230,201,0.2)]">E</div>
            <h2 className="text-xl font-bold">Redirecting to Command Center...</h2>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Active ARENA Session Detected</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
