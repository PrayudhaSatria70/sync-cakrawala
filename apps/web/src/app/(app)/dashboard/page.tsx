'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge, Card, PageHeader } from '@/components/ui';

interface DashboardData {
  kpis: {
    activePrograms: number;
    pendingApprovals: number;
    openConflicts: number;
    overdueTasks: number;
    reviewRequired: number;
  };
  programs: Array<{
    id: string;
    name: string;
    description: string;
    division: string;
    progress: number;
    endDate: string | null;
    taskCount: number;
  }>;
  attentionItems: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    tone: 'danger' | 'warning' | 'info';
    href: string;
  }>;
  recentAudit: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor?: { fullName: string };
  }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    fileName: string;
    status: string;
    division?: { name: string };
    uploadedBy?: { fullName: string };
  }>;
}

export default function DashboardPage() {
  const { me } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>('/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis || {
    activePrograms: 0,
    pendingApprovals: 0,
    openConflicts: 0,
    overdueTasks: 0,
    reviewRequired: 0,
  };

  const programs = data?.programs || [];
  const attention = data?.attentionItems || [];
  const activities = data?.recentAudit || [];

  return (
    <div className="space-y-6">
      {/* Top Banner Matching PDF Reference */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#16324F] via-[#1c446c] to-[#087EA4] p-4 sm:p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan/20 blur-2xl" />
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              Hai, {me?.fullName || 'Sandhy'}.
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-cyan/90">
              Berikut ringkasan operasional Cakrawala hari ini.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-sm">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-white/90 p-1 shadow-sm">
                <img src="/logo.png" alt="SYNC Cakrawala Logo" className="h-full w-auto object-contain" />
              </div>
              <div className="text-right">
                <div className="font-display text-xs sm:text-sm font-bold tracking-wider text-white">SYNC</div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-cyan">Operational Control</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Link href="/programs">
          <Card className="p-3.5 sm:p-4 transition hover:border-teal hover:shadow-md">
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-navy/50 truncate">Program Aktif</div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-navy">{kpis.activePrograms}</span>
              <span className="text-[10px] sm:text-xs text-navy/50">2 mgg ini</span>
            </div>
          </Card>
        </Link>

        <Link href="/approvals">
          <Card className="p-3.5 sm:p-4 transition hover:border-teal hover:shadow-md">
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-navy/50 truncate">Persetujuan</div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-navy">{kpis.pendingApprovals}</span>
              <span className="text-[10px] sm:text-xs text-amber-600 font-semibold truncate">{kpis.pendingApprovals > 0 ? `${kpis.pendingApprovals} perlu tindakan` : 'semua selesai'}</span>
            </div>
          </Card>
        </Link>

        <Link href="/conflicts">
          <Card className="p-3.5 sm:p-4 transition hover:border-teal hover:shadow-md">
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-navy/50 truncate">Konflik</div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-navy">{kpis.openConflicts}</span>
              <span className="text-[10px] sm:text-xs text-danger font-semibold truncate">{kpis.openConflicts > 0 ? `${kpis.openConflicts} perhatian` : 'tidak ada'}</span>
            </div>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="p-3.5 sm:p-4 transition hover:border-teal hover:shadow-md">
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-navy/50 truncate">Terlambat</div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-danger">{kpis.overdueTasks}</span>
              <span className="text-[10px] sm:text-xs text-navy/50 truncate">tugas lewat</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Workspace Layout: Operational Programs & Recent Activity vs Perlu Perhatian */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Program Operasional Card */}
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-navy">Program Operasional</h2>
                <p className="text-xs text-navy/50">Progres eksekusi semester berjalan</p>
              </div>
              <Link href="/programs" className="text-xs font-semibold text-teal hover:underline">
                Lihat semua →
              </Link>
            </div>

            <div className="space-y-5">
              {programs.length === 0 ? (
                <div className="py-6 text-center text-xs text-navy/40">Belum ada program terdaftar.</div>
              ) : (
                programs.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <Link href={`/programs/${p.id}`} className="font-semibold text-navy hover:text-teal block truncate">
                          {p.name}
                        </Link>
                        <div className="text-[11px] text-navy/50">
                          {p.division} {p.endDate ? `• Deadline: ${new Date(p.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                        </div>
                      </div>
                      <span className="font-display text-xs font-bold text-navy flex-shrink-0">{p.progress}%</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-teal transition-all duration-500"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Aktivitas Terbaru Card */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-base font-bold text-navy">Aktivitas Terbaru</h2>
              <Link href="/audit" className="text-xs font-semibold text-teal hover:underline">
                Log Audit Lengkap →
              </Link>
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="py-6 text-center text-xs text-navy/40">Belum ada rekaman aktivitas.</div>
              ) : (
                activities.map((act, idx) => {
                  const colors = ['bg-teal', 'bg-success', 'bg-warning', 'bg-navy'];
                  const dotColor = colors[idx % colors.length];
                  return (
                    <div key={act.id} className="flex items-start gap-3 text-sm">
                      <div className={`mt-1.5 h-2 w-2 rounded-full ${dotColor} flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-navy">
                          {act.actor?.fullName || 'Sistem'} {act.action.replace(/_/g, ' ').toLowerCase()}
                        </div>
                        <div className="text-[11px] text-navy/40">
                          {new Date(act.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB · {new Date(act.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Perlu Perhatian & Recent Documents */}
        <div className="space-y-6">
          {/* Perlu Perhatian Box Matching PDF */}
          <Card className="border-red-100 bg-white p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-navy">Perlu Perhatian</h2>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {attention.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {attention.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-navy/50">
                  Tidak ada anomali atau penundaan saat ini.
                </div>
              ) : (
                attention.map((item) => {
                  const borderTone =
                    item.tone === 'danger'
                      ? 'border-l-4 border-l-danger bg-red-50/40 hover:bg-red-50'
                      : item.tone === 'warning'
                      ? 'border-l-4 border-l-warning bg-amber-50/40 hover:bg-amber-50'
                      : 'border-l-4 border-l-teal bg-cyan/30 hover:bg-cyan/50';

                  return (
                    <Link key={item.id} href={item.href} className="block">
                      <div className={`rounded-lg border border-border p-3 transition ${borderTone}`}>
                        <div className="text-xs font-bold text-navy">{item.title}</div>
                        <div className="mt-0.5 text-[11px] text-navy/60">{item.subtitle}</div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </Card>

          {/* Quick Review / Document Upload Box */}
          <Card className="p-5">
            <h2 className="mb-2 font-display text-base font-bold text-navy">Dokumen Operasional</h2>
            <p className="mb-4 text-xs text-navy/60">
              Unggah notulensi, proposal, atau PO untuk ekstraksi kerja otomatis melalui Human-in-the-loop.
            </p>
            <div className="space-y-2">
              <Link href="/documents" className="block">
                <button className="w-full rounded-lg bg-teal py-2 text-xs font-semibold text-white transition hover:bg-teal/90">
                  Buka Document Center
                </button>
              </Link>
              <Link href="/reviews" className="block">
                <button className="w-full rounded-lg border border-border bg-white py-2 text-xs font-semibold text-navy transition hover:bg-cyan/40">
                  Review Queue ({kpis.reviewRequired} menunggu)
                </button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
