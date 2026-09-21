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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const initials = me.fullName
    ? me.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

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
    <div className="min-h-screen lg:flex bg-surface">
      {/* Mobile & Desktop Aside Navigation Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-navy text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="SYNC Cakrawala Logo"
              className="h-8 w-auto object-contain drop-shadow"
            />
            <div>
              <div className="font-display text-sm font-bold leading-tight">SYNC Cakrawala</div>
              <div className="text-[9px] uppercase tracking-wider text-white/50">Coordination Platform</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Tutup menu navigasi"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
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
                        ? 'bg-teal text-white font-medium shadow-sm'
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

        {/* Drawer User Footer Profile */}
        <div className="border-t border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">{me.fullName}</div>
              <div className="truncate text-[10px] text-white/60">
                {me.role.name}
                {me.division ? ` · ${me.division.name}` : ''}
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-white/10 pt-2 text-xs">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md px-2 py-1.5 text-center font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              Profil
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md px-2 py-1.5 text-center font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              Setelan
            </Link>
            <button
              onClick={async () => {
                setOpen(false);
                await logout();
                router.replace('/login');
              }}
              className="flex-1 rounded-md px-2 py-1.5 text-center font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/95 px-3 sm:px-5 backdrop-blur">
          {/* Left: Mobile Navigation Trigger & Brand */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-navy hover:bg-slate-50 active:scale-95 transition"
              onClick={() => setOpen((v) => !v)}
              aria-label="Buka navigasi"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="SYNC Cakrawala Logo" className="h-7 w-auto object-contain" />
              <span className="font-display text-sm font-bold text-navy">SYNC</span>
            </Link>
          </div>

          {/* Desktop Subtitle */}
          <div className="hidden text-xs sm:text-sm text-navy/60 lg:block">
            Operational coordination · Human-in-the-loop
          </div>

          {/* Right: Desktop Actions & User info */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-navy leading-tight">{me.fullName}</div>
              <div className="text-[11px] text-navy/50">
                {me.role.name}
                {me.division ? ` · ${me.division.name}` : ''}
              </div>
            </div>
            <Link href="/profile" className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-navy hover:bg-slate-50 transition">
              Profile
            </Link>
            <Link href="/settings" className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-navy hover:bg-slate-50 transition">
              Settings
            </Link>
            <button
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              className="rounded-lg bg-navy px-2.5 py-1 text-xs font-semibold text-white hover:bg-navy/90 transition"
            >
              Sign out
            </button>
          </div>

          {/* Right: Mobile User Avatar Trigger & Popover Dropdown */}
          <div className="relative flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-teal font-display text-xs font-bold text-white shadow-sm ring-2 ring-white hover:opacity-90 active:scale-95 transition"
              aria-label="Menu Pengguna"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Tutup dropdown"
                  className="fixed inset-0 z-40 bg-black/10 cursor-default"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-border bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="border-b border-border/60 pb-2.5 px-1">
                    <div className="font-semibold text-sm text-navy truncate">{me.fullName}</div>
                    <div className="text-[11px] text-navy/50 truncate mt-0.5">{me.email}</div>
                    <div className="mt-1.5 inline-flex items-center rounded-md bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal">
                      {me.role.name}
                      {me.division ? ` · ${me.division.name}` : ''}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-navy hover:bg-surface"
                    >
                      <svg className="h-4 w-4 text-navy/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profil Akun
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-navy hover:bg-surface"
                    >
                      <svg className="h-4 w-4 text-navy/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Pengaturan
                    </Link>
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                        router.replace('/login');
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-danger hover:bg-red-50 transition"
                    >
                      <svg className="h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-3.5 sm:p-5 md:p-6">{children}</main>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {open ? (
        <button
          type="button"
          aria-label="Tutup navigasi"
          className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm lg:hidden cursor-default"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
