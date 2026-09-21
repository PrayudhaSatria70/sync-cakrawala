'use client';

import { FormEvent, useEffect, useState } from 'react';
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
  Select,
  Textarea,
  statusTone,
} from '@/components/ui';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  programId?: string;
  divisionId?: string;
  assigneeId?: string;
  division?: { name: string; code: string };
  assignee?: { fullName: string };
  program?: { name: string };
}

const KANBAN_COLS = [
  { key: 'BELUM_MULAI', label: 'BELUM MULAI', statuses: ['BACKLOG', 'ASSIGNED'] },
  { key: 'DIKERJAKAN', label: 'DIKERJAKAN', statuses: ['IN_PROGRESS'] },
  { key: 'MENUNGGU', label: 'MENUNGGU PERSETUJUAN', statuses: ['BLOCKED'] },
  { key: 'SELESAI', label: 'SELESAI', statuses: ['DONE'] },
];

export default function TasksPage() {
  const { me } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [divFilter, setDivFilter] = useState('');
  const [prioFilter, setPrioFilter] = useState('');

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    programId: '',
    divisionId: '',
    assigneeId: '',
    status: 'BACKLOG',
  });

  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [t, d, p] = await Promise.all([
        api.get<TaskItem[]>('/tasks'),
        api.get<any[]>('/admin/divisions').catch(() => []),
        api.get<any[]>('/programs').catch(() => []),
      ]);
      setTasks(t);
      setDivisions(d);
      setPrograms(p);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tasks', {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        programId: form.programId || undefined,
        divisionId: form.divisionId || me?.division?.id || undefined,
        assigneeId: form.assigneeId || undefined,
      });
      setOpenCreate(false);
      setForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        programId: '',
        divisionId: '',
        assigneeId: '',
        status: 'BACKLOG',
      });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const moveStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/tasks/${id}`, { status: newStatus });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    const matchDiv = !divFilter || t.divisionId === divFilter;
    const matchPrio = !prioFilter || t.priority === prioFilter;
    return matchQ && matchDiv && matchPrio;
  });

  return (
    <div>
      <PageHeader
        title="Tugas Operasional"
        subtitle="Papan koordinasi kerja lintas divisi SGA Cakrawala"
        actions={
          hasPermission(me, 'tasks:create') ? (
            <Button onClick={() => setOpenCreate(true)}>
              + Buat Tugas
            </Button>
          ) : null
        }
      />

      {/* Filter and Search Bar Matching Mockup */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Cari tugas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 text-xs"
          />
          <div className="flex items-center gap-2">
            <Select
              value={divFilter}
              onChange={(e) => setDivFilter(e.target.value)}
              className="w-full sm:w-40 text-xs"
            >
              <option value="">Semua divisi</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select
              value={prioFilter}
              onChange={(e) => setPrioFilter(e.target.value)}
              className="w-full sm:w-36 text-xs"
            >
              <option value="">Semua prioritas</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>
          {(search || divFilter || prioFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setDivFilter('');
                setPrioFilter('');
              }}
              className="text-xs font-semibold text-teal hover:underline self-start sm:self-auto py-1"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* 4-Column Kanban Board */}
      <div className="flex xl:grid xl:grid-cols-4 gap-4 overflow-x-auto pb-4 snap-x snap-mandatory xl:snap-none">
        {KANBAN_COLS.map((col) => {
          const colTasks = filtered.filter((t) => col.statuses.includes(t.status));
          return (
            <div key={col.key} className="flex min-w-[280px] sm:min-w-[300px] xl:min-w-0 flex-1 flex-col rounded-2xl bg-[#EDF3F8] p-3 snap-start">
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between px-2">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-navy/70">
                  {col.label}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-navy/70 shadow-sm">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3">
                {colTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 py-8 text-center text-xs text-navy/40">
                    Kosong
                  </div>
                ) : (
                  colTasks.map((t) => {
                    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE';
                    return (
                      <Card key={t.id} className="p-4 transition hover:border-teal hover:shadow-md">
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-navy">{t.title}</h3>
                        </div>

                        {t.description && (
                          <p className="mb-3 text-xs line-clamp-2 text-navy/60">
                            {t.description}
                          </p>
                        )}

                        <div className="mb-3 flex flex-wrap items-center gap-1.5">
                          {t.division && (
                            <Badge tone="info">{t.division.name}</Badge>
                          )}
                          <Badge tone={statusTone(t.priority)}>{t.priority}</Badge>
                          {t.dueDate && (
                            <span
                              className={`text-[10px] font-semibold ${
                                isOverdue ? 'text-danger font-bold' : 'text-navy/50'
                              }`}
                            >
                              {isOverdue ? '⚠️ ' : ''}
                              {new Date(t.dueDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-navy/60">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal/20 text-[10px] font-bold text-teal">
                              {(t.assignee?.fullName || 'U')[0]}
                            </div>
                            <span className="text-[11px] font-medium">
                              {t.assignee?.fullName || 'Belum ditugaskan'}
                            </span>
                          </div>

                          {/* Quick Move Status */}
                          {hasPermission(me, 'tasks:update') && (
                            <select
                              value={t.status}
                              onChange={(e) => moveStatus(t.id, e.target.value)}
                              className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-navy outline-none focus:border-teal"
                            >
                              <option value="BACKLOG">Belum Mulai</option>
                              <option value="IN_PROGRESS">Dikerjakan</option>
                              <option value="BLOCKED">Menunggu</option>
                              <option value="DONE">Selesai</option>
                              <option value="CANCELLED">Batal</option>
                            </select>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Drawer */}
      <Drawer open={openCreate} title="Buat Tugas Baru" onClose={() => setOpenCreate(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label>Judul Tugas</Label>
            <Input
              required
              placeholder="e.g. Konfirmasi vendor panggung"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <Label>Deskripsi</Label>
            <Textarea
              rows={3}
              placeholder="Detail instruksi kerja atau hasil rapat…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <Label>Program Terkait</Label>
            <Select
              value={form.programId}
              onChange={(e) => setForm({ ...form, programId: e.target.value })}
            >
              <option value="">Pilih Program (Opsional)</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Divisi Pelaksana</Label>
            <Select
              value={form.divisionId}
              onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
            >
              <option value="">Pilih Divisi</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioritas</Label>
              <Select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </div>

            <div>
              <Label>Tenggat Waktu</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Simpan Tugas'}
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
