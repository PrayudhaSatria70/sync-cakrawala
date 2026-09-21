'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Badge, Card, PageHeader, statusTone } from '@/components/ui';

export default function ProgramDetailPage() {
  const params = useParams();
  const [program, setProgram] = useState<any>(null);

  useEffect(() => {
    if (params.id) api.get(`/programs/${params.id}`).then(setProgram).catch(console.error);
  }, [params.id]);

  if (!program) return <p className="text-navy/50">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={program.name}
        subtitle={program.description}
        actions={<Badge tone={statusTone(program.status)}>{program.status}</Badge>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Tasks</h2>
          <div className="space-y-2">
            {(program.tasks || []).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <div className="text-sm font-semibold">{t.title}</div>
                  <div className="text-xs text-navy/50">{t.assignee?.fullName || 'Unassigned'}</div>
                </div>
                <Badge tone={statusTone(t.status)}>{t.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Documents</h2>
          <div className="space-y-2">
            {(program.documents || []).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="text-sm font-semibold">{d.title || d.fileName}</div>
                <Badge tone={statusTone(d.status)}>{d.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
