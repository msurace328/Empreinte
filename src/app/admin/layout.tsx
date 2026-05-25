'use client';

import { AppShell } from "@/components/shell/app-shell";
import { DataProvider } from "@/lib/providers/data-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <DataProvider><AppShell>{children}</AppShell></DataProvider>;
}
