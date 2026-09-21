'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui';

export default function ActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api.get<any>('/audit?limit=30').then((r) => setItems(r.items || [])).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Activity" subtitle="Recent operational timeline" />
      <div className="space-y-2">
        {items.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-white px-4 py-3">
            <div className="font-semibold">{a.action}</div>
            <div className="text-xs text-navy/50">
              {a.actor?.fullName || 'System'} · {a.entityType} · {new Date(a.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
