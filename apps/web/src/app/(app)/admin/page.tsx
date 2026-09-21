'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, PageHeader, Badge } from '@/components/ui';

export default function AdminIndexPage() {
  const { me } = useAuth();
  const [stats, setStats] = useState<{
    users: number;
    roles: number;
    divisions: number;
    settings: any;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<any[]>('/admin/users'),
      api.get<any[]>('/admin/roles'),
      api.get<any[]>('/admin/divisions'),
      api.get<any>('/admin/system-settings'),
    ])
      .then(([users, roles, divisions, settings]) => {
        setStats({
          users: users.length,
          roles: roles.length,
          divisions: divisions.length,
          settings,
        });
      })
      .catch(console.error);
  }, []);

  if (!hasPermission(me, 'admin:users', 'admin:roles', 'admin:divisions', 'admin:system')) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center text-navy/60">
        You do not have administrative access permissions.
      </div>
    );
  }

  const sections = [
    {
      title: 'User Management',
      href: '/admin/users',
      desc: 'Provision new accounts, assign roles, bind division scopes, and manage account lifecycles.',
      stat: stats ? `${stats.users} Users` : '…',
      badge: 'Access & Identity',
    },
    {
      title: 'Roles & Permission Matrix',
      href: '/admin/roles',
      desc: 'Configure capability boundaries across the 6 platform roles with audit-backed permission toggles.',
      stat: stats ? `${stats.roles} Roles` : '…',
      badge: 'RBAC Policy',
    },
    {
      title: 'Division Management',
      href: '/admin/divisions',
      desc: 'Define organizational scopes and manage active status with orphan-prevention impact calculation.',
      stat: stats ? `${stats.divisions} Divisions` : '…',
      badge: 'Organizational Scope',
    },
    {
      title: 'System & Security Settings',
      href: '/admin/system',
      desc: 'Govern Google OIDC enforcement, local auth policy, domain restrictions, and file upload limits.',
      stat: stats?.settings?.googleOidcEnabled ? 'OIDC Enforced' : 'Local Auth Active',
      badge: 'System Governance',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Super Admin Administration"
        subtitle="Control identity, RBAC permissions, organizational scope, and system security policies"
      />

      <div className="mb-6 rounded-xl border border-teal/20 bg-cyan/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-navy">Cakrawala System Security Authority</div>
            <div className="text-xs text-navy/70">
              Domain restriction: <strong>@{stats?.settings?.allowedEmailDomain || 'cakrawala.ac.id'}</strong> · All mutations generate immutable audit logs.
            </div>
          </div>
          <Badge tone="info">Tenant ID: Cakrawala SGA</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition hover:border-teal hover:shadow-md">
              <div className="mb-2 flex items-center justify-between">
                <Badge tone="neutral">{s.badge}</Badge>
                <span className="text-xs font-bold text-teal">{s.stat}</span>
              </div>
              <h2 className="font-display text-lg font-bold text-navy">{s.title}</h2>
              <p className="mt-1 text-sm text-navy/60">{s.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal">
                <span>Manage {s.title.split(' ')[0]}</span>
                <span>→</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
