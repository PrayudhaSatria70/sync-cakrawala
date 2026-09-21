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
  Label,
  PageHeader,
  Textarea,
  statusTone,
} from '@/components/ui';

interface ConflictItem {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  description?: string;
  sourceRefs: string;
  recommendation?: string;
  createdAt: string;
  owner?: { fullName: string };
  resolutions?: Array<{ decision: string; notes?: string }>;
}

export default function ConflictsPage() {
  const { me } = useAuth();
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [selected, setSelected] = useState<ConflictItem | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const data = await api.get<ConflictItem[]>('/conflicts');
      setConflicts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDrawer = (item: ConflictItem) => {
    setSelected(item);
    setNotes('');
    setMsg('');
  };

  const handleResolve = async (decision: 'MERGE' | 'KEEP_SEPARATE' | 'DISMISS') => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.post(`/conflicts/${selected.id}/resolve`, {
        decision,
        notes: notes || `Penyelesaian: ${decision}`,
      });
      setMsg(`Konflik berhasil diselesaikan dengan keputusan: ${decision}.`);
      setSelected(null);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = conflicts.filter((c) => ['DETECTED', 'ACKNOWLEDGED', 'IN_REVIEW'].includes(c.status)).length;

  return (
    <div>
      <PageHeader
        title="Konflik Operasional"
        subtitle="Sistem menemukan potensi konflik dan ketidaksinkronan koordinasi lintas divisi"
        actions={
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-danger">
            {openCount} perlu perhatian
          </span>
        }
      />

      {msg ? <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-success">{msg}</p> : null}

      {conflicts.length === 0 ? (
        <EmptyState title="Tidak ada konflik aktif" hint="Koordinasi antar divisi berjalan harmonis tanpa tumpang tindih." />
      ) : (
        <div className="space-y-3">
          {conflicts.map((c) => {
            const isResolved = c.status === 'RESOLVED' || c.status === 'DISMISSED';
            const dotColor =
              c.severity === 'CRITICAL' || c.severity === 'HIGH'
                ? 'bg-danger'
                : c.severity === 'MEDIUM'
                ? 'bg-warning'
                : 'bg-teal';

            return (
              <Card
                key={c.id}
                className="flex flex-col justify-between gap-4 p-5 transition hover:border-teal hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`mt-1.5 h-3 w-3 rounded-full ${dotColor} flex-shrink-0 ring-4 ${dotColor}/20`} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-navy">{c.title}</h3>
                      <Badge tone={statusTone(c.severity)}>{c.severity}</Badge>
                      <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-navy/60">{c.description}</p>
                    <div className="mt-2 text-xs text-navy/50">
                      Penanggung jawab: <strong className="text-navy">{c.owner?.fullName || 'Belum ditugaskan'}</strong> · Tipe: {c.type}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button
                    variant={isResolved ? 'secondary' : 'primary'}
                    onClick={() => openDrawer(c)}
                    className="w-full sm:w-auto"
                  >
                    {isResolved ? 'Lihat Detail' : 'Tinjau →'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Conflict Detail Drawer Matching PDF Page 12 */}
      <Drawer
        open={Boolean(selected)}
        title="Detail Konflik"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-navy/50">{selected.type}</span>
                <Badge tone={statusTone(selected.severity)}>{selected.severity}</Badge>
              </div>
              <h3 className="mt-1 font-display text-base font-bold text-navy">{selected.title}</h3>
              <p className="mt-2 text-xs text-navy/70">{selected.description}</p>
            </div>

            {/* Side-by-Side Comparison Box Matching Mockup */}
            <div>
              <Label>Komparasi Kebutuhan / Rekaman Sumber</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-border bg-white p-3 text-xs">
                <div className="rounded-lg bg-surface p-2.5">
                  <div className="font-bold text-navy">Divisi Logistik</div>
                  <div className="mt-1 text-base font-bold text-teal">100 unit</div>
                  <div className="text-[10px] text-navy/50">PO Draft Terjadwal</div>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <div className="font-bold text-navy">Divisi Acara</div>
                  <div className="mt-1 text-base font-bold text-amber-600">150 unit</div>
                  <div className="text-[10px] text-navy/50">Pesanan Cadangan</div>
                </div>
              </div>
            </div>

            {/* Recommendation Box */}
            <div>
              <Label>Rekomendasi Sistem</Label>
              <div className="rounded-lg border border-teal/20 bg-cyan/40 p-3 text-xs text-navy/80">
                💡 <strong>{selected.recommendation || 'Gabungkan pesanan menjadi satu purchase order resmi untuk menghemat biaya dan mencegah duplikasi.'}</strong>
              </div>
            </div>

            {/* Intervention Decision Buttons */}
            {hasPermission(me, 'conflicts:resolve') && !['RESOLVED', 'DISMISSED'].includes(selected.status) && (
              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <Label>Catatan Keputusan</Label>
                  <Textarea
                    rows={2}
                    placeholder="Catatan klarifikasi antar divisi…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <button
                    disabled={submitting}
                    onClick={() => handleResolve('MERGE')}
                    className="w-full rounded-lg bg-teal py-2.5 text-xs font-bold text-white shadow transition hover:bg-teal/90 disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan…' : 'Gabungkan Pesanan (Merge)'}
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleResolve('KEEP_SEPARATE')}
                    className="w-full rounded-lg border border-border bg-white py-2 text-xs font-semibold text-navy hover:bg-surface disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan…' : 'Tetap Terpisah (Keep Both)'}
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleResolve('DISMISS')}
                    className="w-full py-1 text-xs text-navy/50 hover:text-danger hover:underline disabled:opacity-50"
                  >
                    Abaikan Konflik (Dismiss)
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
