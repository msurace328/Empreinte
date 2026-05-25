"use client";
import React from 'react';
import { useData } from '@/lib/providers/data-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function AuditPage() {
    const { auditLog } = useData();

    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <h1 className="text-3xl font-bold">Audit Trail</h1>
                <Button variant="outline" onClick={() => alert('Exporting audit log...')}>Export PDF</Button>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Operator</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
                <TableBody>
                    {auditLog.map(entry => (
                        <TableRow key={entry.id}>
                            <TableCell className="text-xs font-mono">{format(new Date(entry.timestamp), 'HH:mm:ss')}</TableCell>
                            <TableCell><Badge>{entry.action}</Badge></TableCell>
                            <TableCell className="text-xs font-mono">{entry.targetId}</TableCell>
                            <TableCell className="text-xs">{entry.operator}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{entry.reason}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}