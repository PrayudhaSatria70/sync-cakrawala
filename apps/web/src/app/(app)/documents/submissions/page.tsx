'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Badge, EmptyState, PageHeader, statusTone } from '@/components/ui';

export default function SubmissionsPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api.get<any[]>('/documents/my-submissions').then(setItems).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="My Submissions" subtitle="Track documents you submitted for processing" />
      {!items.length ? (
        <EmptyState title="No submissions yet" />
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Link
              key={s.id}
              href={`/documents/${s.documentId}`}
              className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3"
            >
              <div>
                <div className="font-semibold">{s.document?.title || s.document?.fileName}</div>
                <div className="text-xs text-navy/50">{new Date(s.submittedAt).toLocaleString()}</div>
              </div>
              <Badge tone={statusTone(s.document?.status || s.status)}>{s.document?.status || s.status}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
