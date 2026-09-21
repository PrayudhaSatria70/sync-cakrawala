'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Badge, Card, PageHeader, statusTone, EmptyState } from '@/components/ui';

export default function ProgramsPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/programs').then(setItems).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Programs" subtitle="Cross-division program portfolio" />
      {!items.length ? (
        <EmptyState title="No programs" hint="Seed data should include Grand Summit and related programs." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((p) => (
            <Link key={p.id} href={`/programs/${p.id}`}>
              <Card className="h-full transition hover:border-teal">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg font-bold">{p.name}</h2>
                  <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                </div>
                <p className="text-sm text-navy/60">{p.description}</p>
                <div className="mt-3 flex gap-3 text-xs text-navy/50">
                  <span>{p.ownerDivision?.name || 'Unassigned'}</span>
                  <span>{p._count?.tasks ?? 0} tasks</span>
                  <span>{p._count?.documents ?? 0} docs</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
