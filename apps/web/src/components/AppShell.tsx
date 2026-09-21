'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/api';
import { cn } from '@/components/ui';

const NAV = [
  {
    group: 'Operations',
    items: [
      { href: '/dashboard', label: 'Dashboard', perm: 'dashboard:view' },
      { href: '/programs', label: 'Programs', perm: 'dashboard:view' },
      { href: '/tasks', label: 'Tasks', perm: 'dashboard:view' },
    ],
  },
  {
    group: 'Documents',
    items: [
      { href: '/documents', label: 'Document Center', perm: 'documents:upload' },
      { href: '/reviews', label: 'Review Queue', perm: 'documents:review' },
      { href: '/documents/submissions', label: 'My Submissions', perm: 'documents:upload' },
    ],
  },
  {
    group: 'Coordination',
    items: [
      { href: '/approvals', label: 'Approvals', perm: 'approvals:decide' },
      { href: '/conflicts', label: 'Conflicts', perm: 'conflicts:resolve' },
    ],
  },
  {
    group: 'Monitoring',
    items: [
      { href: '/activity', label: 'Activity', perm: 'dashboard:view' },
      { href: '/audit', label: 'Audit Trail', perm: 'audit:view' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { href: '/admin/users', label: 'Users', perm: 'admin:users' },
      { href: '/admin/roles', label: 'Roles', perm: 'admin:roles' },
      { href: '/admin/divisions', label: 'Divisions', perm: 'admin:divisions' },
      { href: '/admin/system', label: 'System Settings', perm: 'admin:system' },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { me, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !me) router.replace('/login');
    if (!loading && me?.mustChangePassword && pathname !== '/settings/security') {
      router.replace('/settings/security');
    }
  }, [loading, me, pathname, router]);

  if (loading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-navy/60">
        Loading SYNC…
      </div>
    );
  }

  const visible = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (i.perm === 'audit:view') {
        return hasPermission(me, 'audit:view', 'audit:view_scoped');
      }
      if (i.perm === 'approvals:decide') {
        return hasPermission(me, 'approvals:decide', 'dashboard:view');
      }
      if (i.perm === 'conflicts:resolve') {
        return hasPermission(me, 'conflicts:resolve', 'dashboard:view');
      }
      if (i.perm === 'documents:upload') {
        return hasPermission(me, 'documents:upload', 'dashboard:view');
      }
      if (i.perm === 'documents:review') {
        return hasPermission(me, 'documents:review');
      }
      return hasPermission(me, i.perm);
    }),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-navy text-white transition lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center gap-3 border-b border-white/10 px-4">
          <img
            src="/logo.png"
            alt="SYNC Cakrawala Logo"
            className="h-8 w-auto object-contain drop-shadow"
          />
          <div>
            <div className="font-display text-sm font-bold leading-tight">SYNC Cakrawala</div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Synchronized Network & Coordination Platform</div>
          </div>
        </div>
        <nav className="space-y-4 overflow-y-auto p-3 pb-24">
          {visible.map((group) => (
            <div key={group.group}>
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm transition',
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-teal text-white'
                        : 'text-white/80 hover:bg-white/10',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              className="rounded-lg border border-border px-2.5 py-1 text-sm font-medium text-navy hover:bg-slate-50"
              onClick={() => setOpen((v) => !v)}
            >
              Menu
            </button>
            <div className="flex items-center gap-1.5">
              <img src="/logo.png" alt="SYNC Cakrawala Logo" className="h-6 w-auto object-contain" />
              <span className="font-display text-xs font-bold text-navy">SYNC</span>
            </div>
          </div>
          <div className="hidden text-sm text-navy/60 lg:block">
            Operational coordination · Human-in-the-loop
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-navy">{me.fullName}</div>
              <div className="text-[11px] text-navy/50">
                {me.role.name}
                {me.division ? ` · ${me.division.name}` : ''}
              </div>
            </div>
            <Link href="/profile" className="rounded-lg border border-border px-2 py-1 text-xs font-semibold">
              Profile
            </Link>
            <Link href="/settings" className="rounded-lg border border-border px-2 py-1 text-xs font-semibold">
              Settings
            </Link>
            <button
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              className="rounded-lg bg-navy px-2 py-1 text-xs font-semibold text-white"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      {open ? (
        <button className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}
    </div>
  );
}
