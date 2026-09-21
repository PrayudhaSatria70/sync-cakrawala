'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge, Button, Card, Label, PageHeader, Textarea, statusTone } from '@/components/ui';

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { me } = useAuth();
  const [approval, setApproval] = useState<any>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (params.id) api.get(`/approvals/${params.id}`).then(setApproval).catch(console.error);
  }, [params.id]);

  async function decide(action: 'approve' | 'return' | 'reject') {
    if (!confirm(`Confirm ${action}?`)) return;
    await api.post(`/approvals/${params.id}/${action}`, { comment });
    router.push('/approvals');
  }

  if (!approval) return <p className="text-navy/50">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={approval.title}
        subtitle={approval.summary}
        actions={<Badge tone={statusTone(approval.status)}>{approval.status}</Badge>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Approval chain</h2>
          <ol className="space-y-2">
            {(approval.steps || []).map((s: any) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <div>
                  <div className="font-semibold">{s.roleLabel}</div>
                  <div className="text-xs text-navy/50">{s.approver?.fullName || 'Unassigned'}</div>
                </div>
                <Badge tone={statusTone(s.status)}>{s.status}</Badge>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Request</h2>
          <p className="text-sm">Requester: {approval.requester?.fullName}</p>
          <p className="text-sm">Risk: {approval.riskLevel}</p>
          {approval.status === 'PENDING' && hasPermission(me, 'approvals:decide') ? (
            <div className="mt-4 space-y-3">
              <div>
                <Label>Comment</Label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => decide('approve')}>Approve</Button>
                <Button variant="secondary" onClick={() => decide('return')}>
                  Return
                </Button>
                <Button variant="danger" onClick={() => decide('reject')}>
                  Reject
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
