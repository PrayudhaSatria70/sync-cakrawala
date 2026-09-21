'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Badge, Button, Card, PageHeader, statusTone } from '@/components/ui';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/documents/${params.id}`).then(setDoc);
  useEffect(() => {
    if (params.id) load().catch(console.error);
  }, [params.id]);

  async function submit() {
    setBusy(true);
    try {
      await api.post(`/documents/${params.id}/submit`);
      await load();
      router.push('/reviews');
    } finally {
      setBusy(false);
    }
  }

  if (!doc) return <p className="text-navy/50">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={doc.title || doc.fileName}
        subtitle={`${doc.mimeType} · ${(doc.fileSize / 1024).toFixed(1)} KB`}
        actions={
          <>
            <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>
            {['DRAFT', 'RETURNED'].includes(doc.status) ? (
              <Button onClick={submit} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit for review'}
              </Button>
            ) : null}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Metadata</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-navy/50">Owner</dt><dd>{doc.uploadedBy?.fullName}</dd></div>
            <div className="flex justify-between"><dt className="text-navy/50">Division</dt><dd>{doc.division?.name || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-navy/50">Program</dt><dd>{doc.program?.name || '—'}</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Versions</h2>
          {(doc.versions || []).map((v: any) => (
            <div key={v.id} className="text-sm">v{v.version} · {v.fileName}</div>
          ))}
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Proposed information</h2>
          {(doc.proposals || []).length ? (
            <ul className="space-y-2">
              {doc.proposals.map((p: any) => (
                <li key={p.id} className="rounded-lg border border-border p-2 text-sm">
                  <div className="font-semibold">{p.fieldLabel}</div>
                  <div>{p.value}</div>
                  <div className="text-xs text-navy/50">{p.evidence}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-navy/50">Submit to run stub extraction.</p>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Review activity</h2>
          {(doc.reviews || []).map((r: any) => (
            <div key={r.id} className="mb-2 flex items-center justify-between text-sm">
              <span>{r.reviewer?.fullName || 'Unassigned'} · {r.comment || '—'}</span>
              <Badge tone={statusTone(r.status)}>{r.status}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
