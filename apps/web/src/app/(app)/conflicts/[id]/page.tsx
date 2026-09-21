'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge, Button, Card, Drawer, Label, PageHeader, Textarea, statusTone } from '@/components/ui';

export default function ConflictDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { me } = useAuth();
  const [conflict, setConflict] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState('MERGE');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (params.id) api.get(`/conflicts/${params.id}`).then(setConflict).catch(console.error);
  }, [params.id]);

  async function resolve() {
    await api.post(`/conflicts/${params.id}/resolve`, { decision, notes });
    setOpen(false);
    router.push('/conflicts');
  }

  if (!conflict) return <p className="text-navy/50">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={conflict.title}
        subtitle={conflict.type}
        actions={
          <>
            <Badge tone={statusTone(conflict.severity)}>{conflict.severity}</Badge>
            <Badge tone={statusTone(conflict.status)}>{conflict.status}</Badge>
            {hasPermission(me, 'conflicts:resolve') && !['RESOLVED', 'DISMISSED'].includes(conflict.status) ? (
              <Button onClick={() => setOpen(true)}>Resolve</Button>
            ) : null}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Why detected</h2>
          <p className="text-sm">{conflict.description}</p>
          <h3 className="mb-1 mt-4 text-sm font-semibold">Recommendation</h3>
          <p className="text-sm text-navy/70">{conflict.recommendation}</p>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Source records</h2>
          <ul className="space-y-2 text-sm">
            {(conflict.sourceRefs || []).map((s: any, i: number) => (
              <li key={i} className="rounded-lg border border-border px-3 py-2">
                {s.label || s.type} ({s.type})
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Drawer open={open} title="Resolve conflict" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <div>
            <Label>Decision</Label>
            <select
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="MERGE">Merge / consolidate</option>
              <option value="ESCALATE">Escalate</option>
              <option value="KEEP_BOTH">Keep both with notes</option>
              <option value="DISMISS">Dismiss</option>
            </select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button className="w-full" onClick={resolve}>
            Confirm resolution
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
