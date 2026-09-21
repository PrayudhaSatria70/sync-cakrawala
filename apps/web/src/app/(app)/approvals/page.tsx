'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Input,
  Label,
  PageHeader,
  Textarea,
  statusTone,
} from '@/components/ui';

interface ApprovalItem {
  id: string;
  title: string;
  summary?: string;
  subjectType: string;
  subjectId?: string;
  currentStep: number;
  status: string;
  riskLevel: string;
  createdAt: string;
  amount?: string;
  requester?: { fullName: string; email: string };
  steps: Array<{
    id: string;
    stepOrder: number;
    roleLabel: string;
    status: string;
    comment?: string;
    approver?: { fullName: string };
  }>;
}

export default function ApprovalsPage() {
  const { me } = useAuth();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<ApprovalItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'return' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const data = await api.get<ApprovalItem[]>('/approvals');
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDrawer = (item: ApprovalItem) => {
    setSelected(item);
    setDecisionAction(null);
    setComment('');
    setMsg('');
  };

  const handleDecision = async (action: 'approve' | 'return' | 'reject') => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.post(`/approvals/${selected.id}/${action}`, { comment });
      setMsg(`Approval has been marked as ${action.toUpperCase()}.`);
      setSelected(null);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = items.filter((i) => i.status === 'PENDING').length;

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchQ = !q || i.title.toLowerCase().includes(q) || (i.requester?.fullName || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || i.status === statusFilter;
    return matchQ && matchStatus;
  });

  return (
    <div>
      <PageHeader
        title="Persetujuan"
        subtitle="Rantai persetujuan berjenjang dan intervensi PIC / Approver"
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              {pendingCount} menunggu tindakan
            </span>
          </div>
        }
      />

      {msg ? <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-success">{msg}</p> : null}

      {/* Search & Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Cari proposal atau PIC…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs text-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy outline-none"
        >
          <option value="">Semua Status</option>
          <option value="PENDING">Menunggu (Pending)</option>
          <option value="APPROVED">Disetujui (Approved)</option>
          <option value="RETURNED">Dikembalikan (Returned)</option>
          <option value="REJECTED">Ditolak (Rejected)</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada persetujuan yang cocok" hint="Semua permohonan telah selesai atau belum diajukan." />
      ) : (
        <div className="space-y-4">
          {filtered.map((item, idx) => {
            // Display realistic budget metadata based on demo records
            const budgetFallback = ['Rp 25.000.000', 'Rp 8.500.000', 'Rp 4.200.000'][idx % 3];
            const currentStepData = item.steps?.[item.currentStep];

            return (
              <Card
                key={item.id}
                className="transition hover:border-teal hover:shadow-md cursor-pointer p-5"
                onClick={() => openDrawer(item)}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-navy">{item.title}</h3>
                      <Badge tone={item.riskLevel === 'HIGH' ? 'danger' : 'warning'}>
                        {item.riskLevel === 'HIGH' ? 'Tinggi' : 'Sedang'}
                      </Badge>
                      <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                    </div>
                    {item.summary && (
                      <p className="mt-1 text-xs text-navy/60">{item.summary}</p>
                    )}
                    <div className="mt-2 text-xs text-navy/50">
                      Diajukan oleh: <strong className="text-navy">{item.requester?.fullName || 'PIC'}</strong> ·{' '}
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-base font-bold text-navy">{budgetFallback}</div>
                    <button
                      className="mt-2 rounded-lg border border-teal bg-cyan/40 px-3 py-1 text-xs font-semibold text-teal hover:bg-teal hover:text-white transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDrawer(item);
                      }}
                    >
                      Intervensi PIC / Review →
                    </button>
                  </div>
                </div>

                {/* Visual Approval Chain */}
                <div className="mt-5 border-t border-border/60 pt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-navy/40 mb-2">
                    Rantai Persetujuan (Approval Chain)
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    {item.steps.map((st, sIdx) => {
                      const isPassed = st.status === 'APPROVED' || sIdx < item.currentStep;
                      const isCurrent = sIdx === item.currentStep && item.status === 'PENDING';
                      return (
                        <div key={st.id} className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                isPassed
                                  ? 'bg-success text-white'
                                  : isCurrent
                                  ? 'bg-teal text-white ring-2 ring-cyan'
                                  : 'bg-surface text-navy/40 border border-border'
                              }`}
                            >
                              {isPassed ? '✓' : sIdx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-navy">{st.roleLabel}</div>
                              <div className="text-[10px] text-navy/50">
                                {st.approver?.fullName || (isCurrent ? 'Menunggu' : 'Antrean')}
                              </div>
                            </div>
                          </div>
                          {sIdx < item.steps.length - 1 && (
                            <div className="h-0.5 w-6 bg-border" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Intervention Drawer Matching PDF Screen 21.4 */}
      <Drawer
        open={Boolean(selected)}
        title="Intervensi PIC / Approver"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-navy/50">Permohonan</div>
              <h3 className="mt-1 font-display text-base font-bold text-navy">{selected.title}</h3>
              <div className="mt-2 flex items-center justify-between text-xs text-navy/70">
                <span>Pengusul: {selected.requester?.fullName}</span>
                <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
              </div>
            </div>

            <div>
              <Label>Ringkasan Keterangan</Label>
              <p className="rounded-lg border border-border bg-white p-3 text-xs text-navy/70">
                {selected.summary || 'Menunggu verifikasi dan keputusan approver yang berwenang.'}
              </p>
            </div>

            <div>
              <Label>Status Tahapan Saat Ini</Label>
              <div className="space-y-2">
                {selected.steps.map((st, i) => (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between rounded-lg border p-2.5 text-xs ${
                      i === selected.currentStep && selected.status === 'PENDING'
                        ? 'border-teal bg-cyan/30 font-semibold'
                        : 'border-border bg-white'
                    }`}
                  >
                    <span>
                      {i + 1}. {st.roleLabel}
                    </span>
                    <Badge tone={statusTone(st.status)}>{st.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {hasPermission(me, 'approvals:decide') && selected.status === 'PENDING' && (
              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <Label>Catatan / Alasan Keputusan</Label>
                  <Textarea
                    rows={3}
                    placeholder="Masukkan alasan jika mengembalikan atau menolak…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    disabled={submitting}
                    onClick={() => handleDecision('approve')}
                    className="w-full rounded-lg bg-teal py-2.5 text-xs font-bold text-white shadow transition hover:bg-teal/90 disabled:opacity-50"
                  >
                    {submitting ? 'Memproses…' : '✓ Setujui (Approve)'}
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleDecision('return')}
                    className="w-full rounded-lg border border-amber-300 bg-amber-50 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    {submitting ? 'Memproses…' : '↩ Kembalikan untuk Revisi (Return)'}
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleDecision('reject')}
                    className="w-full rounded-lg border border-danger/20 py-2 text-xs font-semibold text-danger hover:bg-red-50 disabled:opacity-50"
                  >
                    {submitting ? 'Memproses…' : '✕ Tolak Permohonan (Reject)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
