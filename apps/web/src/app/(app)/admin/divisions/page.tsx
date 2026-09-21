'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Badge,
  Button,
  Card,
  Drawer,
  Input,
  Label,
  PageHeader,
  statusTone,
} from '@/components/ui';

interface DivisionItem {
  id: string;
  code: string;
  name: string;
  status: string;
  _count?: {
    users: number;
    programs: number;
    tasks: number;
    documents: number;
  };
}

export default function AdminDivisionsPage() {
  const { me } = useAuth();
  const [divisions, setDivisions] = useState<DivisionItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [impactModal, setImpactModal] = useState<{
    division: DivisionItem;
    impact: { users: number; programs: number; tasks: number; documents: number };
  } | null>(null);
  const [editItem, setEditItem] = useState<DivisionItem | null>(null);
  const [editName, setEditName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await api.get<DivisionItem[]>('/admin/divisions');
      setDivisions(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load divisions');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMsg('');
    try {
      await api.post('/admin/divisions', {
        code: newCode.toUpperCase().trim(),
        name: newName.trim(),
      });
      setCreateOpen(false);
      setNewCode('');
      setNewName('');
      setMsg(`Division ${newName} created successfully.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to create division');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSubmitting(true);
    setError('');
    setMsg('');
    try {
      await api.patch(`/admin/divisions/${editItem.id}`, {
        name: editName.trim(),
      });
      setEditItem(null);
      setMsg('Division name updated.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to update division');
    } finally {
      setSubmitting(false);
    }
  };

  const promptDeactivate = async (div: DivisionItem) => {
    try {
      const res = await api.get<{
        id: string;
        name: string;
        impact: { users: number; programs: number; tasks: number; documents: number };
      }>(`/admin/divisions/${div.id}/impact`);
      setImpactModal({ division: div, impact: res.impact });
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve division impact analysis');
    }
  };

  const confirmDeactivate = async () => {
    if (!impactModal) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/divisions/${impactModal.division.id}`, {
        status: 'INACTIVE',
      });
      setImpactModal(null);
      setMsg(`Division ${impactModal.division.name} has been set to INACTIVE.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to deactivate division');
    } finally {
      setSubmitting(false);
    }
  };

  const activateDivision = async (id: string) => {
    try {
      await api.patch(`/admin/divisions/${id}`, { status: 'ACTIVE' });
      setMsg('Division activated.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to activate division');
    }
  };

  if (!hasPermission(me, 'admin:divisions')) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center text-navy/60">
        You do not have permission to administer organizational divisions.
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin · Division Management"
        subtitle="Manage organizational scope and enforce non-destructive lifecycle protections"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            + Tambah Divisi
          </Button>
        }
      />

      {msg ? <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-success">{msg}</p> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase text-navy/60">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Division Name</th>
              <th className="px-4 py-3 text-center">Users</th>
              <th className="px-4 py-3 text-center">Programs</th>
              <th className="px-4 py-3 text-center">Tasks</th>
              <th className="px-4 py-3 text-center">Documents</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {divisions.map((d) => (
              <tr key={d.id} className="hover:bg-cyan/20">
                <td className="px-4 py-3 font-mono font-semibold text-navy">{d.code}</td>
                <td className="px-4 py-3 font-semibold text-navy">{d.name}</td>
                <td className="px-4 py-3 text-center text-xs text-navy/70">{d._count?.users ?? 0}</td>
                <td className="px-4 py-3 text-center text-xs text-navy/70">{d._count?.programs ?? 0}</td>
                <td className="px-4 py-3 text-center text-xs text-navy/70">{d._count?.tasks ?? 0}</td>
                <td className="px-4 py-3 text-center text-xs text-navy/70">{d._count?.documents ?? 0}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => {
                        setEditItem(d);
                        setEditName(d.name);
                      }}
                    >
                      Edit
                    </Button>
                    {d.status === 'ACTIVE' ? (
                      <Button
                        variant="secondary"
                        className="!border-danger/30 !px-2 !py-1 text-xs !text-danger hover:!bg-danger/10"
                        onClick={() => promptDeactivate(d)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs font-semibold !text-success hover:!bg-green-50"
                        onClick={() => activateDivision(d.id)}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Division Drawer */}
      <Drawer open={createOpen} title="Tambah Divisi Baru" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label>Division Code</Label>
            <Input
              required
              placeholder="e.g. HUMAS, SPONSORSHIP"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-navy/50">Unique uppercase identifier used for scoping.</p>
          </div>
          <div>
            <Label>Division Name</Label>
            <Input
              required
              placeholder="e.g. Hubungan Masyarakat"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Division'}
          </Button>
        </form>
      </Drawer>

      {/* Edit Division Drawer */}
      <Drawer open={Boolean(editItem)} title="Edit Nama Divisi" onClose={() => setEditItem(null)}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <Label>Division Code (Locked)</Label>
            <Input disabled value={editItem?.code || ''} />
          </div>
          <div>
            <Label>Division Name</Label>
            <Input
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Drawer>

      {/* Impact Warning Modal */}
      {impactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-amber-300 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-warning">
                ⚠️
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-navy">
                  Impact Analysis: {impactModal.division.name}
                </h3>
                <p className="text-xs text-navy/60">Non-destructive orphan prevention check</p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-border bg-surface p-3 text-xs text-navy/80">
              <p className="font-semibold text-danger">
                Perhatian: Menonaktifkan divisi ini berpotensi mengisolasi catatan operasional berikut:
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                <li>• {impactModal.impact.users} Pengguna terhubung</li>
                <li>• {impactModal.impact.programs} Program operasional</li>
                <li>• {impactModal.impact.tasks} Tugas aktif/terjadwal</li>
                <li>• {impactModal.impact.documents} Dokumen operasional</li>
              </ul>
            </div>

            <p className="mb-4 text-xs text-navy/60">
              Status divisi akan diubah menjadi INACTIVE. Akses anggota divisi akan dibatasi hingga diaktifkan kembali.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setImpactModal(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                disabled={submitting}
                onClick={confirmDeactivate}
              >
                {submitting ? 'Menonaktifkan…' : 'Konfirmasi Nonaktifkan'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
