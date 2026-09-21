'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Badge, Button, Card, Input, Label, PageHeader, Textarea, statusTone } from '@/components/ui';

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [review, setReview] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);

  const load = async () => {
    const r = await api.get<any>(`/reviews/${params.id}`);
    setReview(r);
    setProposals(r.document?.proposals || []);
  };

  useEffect(() => {
    if (params.id) load().catch(console.error);
  }, [params.id]);

  async function saveProposals() {
    await api.patch(`/reviews/${params.id}/proposals`, {
      proposals: proposals.map((p) => ({ id: p.id, value: p.value })),
    });
    await load();
  }

  async function decide(action: 'approve' | 'return' | 'reject') {
    await api.post(`/reviews/${params.id}/${action}`, { comment });
    router.push('/reviews');
  }

  if (!review) return <p className="text-navy/50">Loading…</p>;

  return (
    <div>
      <PageHeader
        title="Review detail"
        subtitle={review.document?.title || review.document?.fileName}
        actions={<Badge tone={statusTone(review.status)}>{review.status}</Badge>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Source document</h2>
          <p className="text-sm text-navy/70">{review.document?.description || 'No description'}</p>
          <p className="mt-2 text-xs text-navy/50">
            Uploaded by {review.document?.uploadedBy?.fullName} · {review.document?.division?.name}
          </p>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Proposed information</h2>
          <div className="space-y-3">
            {proposals.map((p, idx) => (
              <div key={p.id}>
                <Label>{p.fieldLabel}</Label>
                <Input
                  value={p.value}
                  onChange={(e) => {
                    const next = [...proposals];
                    next[idx] = { ...p, value: e.target.value };
                    setProposals(next);
                  }}
                />
                <p className="mt-1 text-xs text-navy/50">{p.evidence}</p>
              </div>
            ))}
            <Button variant="secondary" onClick={saveProposals}>
              Save edits
            </Button>
          </div>
        </Card>
      </div>
      {review.status === 'PENDING' ? (
        <Card className="mt-4">
          <Label>Decision comment</Label>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} className="mb-3" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => decide('approve')}>Approve</Button>
            <Button variant="secondary" onClick={() => decide('return')}>
              Return
            </Button>
            <Button variant="danger" onClick={() => decide('reject')}>
              Reject
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
