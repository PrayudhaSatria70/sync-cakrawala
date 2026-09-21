'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge, EmptyState, PageHeader, statusTone } from '@/components/ui';

export default function ReviewsPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api.get<any[]>('/reviews?status=PENDING').then(setItems).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Review Queue" subtitle="Human judgment on proposed operational information" />
      {!items.length ? (
        <EmptyState title="Queue empty" hint="Submit a document to generate proposed items." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase text-navy/50">
              <tr>
                <th className="px-3 py-2">Document</th>
                <th className="px-3 py-2">Submitted by</th>
                <th className="px-3 py-2">Division</th>
                <th className="px-3 py-2">Proposed</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-border/70">
                  <td className="px-3 py-2">
                    <Link href={`/reviews/${r.id}`} className="font-semibold text-teal hover:underline">
                      {r.document?.title || r.document?.fileName}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.document?.uploadedBy?.fullName}</td>
                  <td className="px-3 py-2">{r.document?.division?.name || '—'}</td>
                  <td className="px-3 py-2">{r.document?.proposals?.length ?? 0}</td>
                  <td className="px-3 py-2"><Badge tone="warning">{r.riskLevel}</Badge></td>
                  <td className="px-3 py-2"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
