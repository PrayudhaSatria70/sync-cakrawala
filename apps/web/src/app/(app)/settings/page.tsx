'use client';

import Link from 'next/link';
import { Card, PageHeader } from '@/components/ui';

const LINKS = [
  { href: '/settings', title: 'Overview', desc: 'Personal configuration hub' },
  { href: '/settings/security', title: 'Security', desc: 'Password and login methods' },
  { href: '/settings/notifications', title: 'Notifications', desc: 'Operational alert categories' },
  { href: '/settings/preferences', title: 'Preferences', desc: 'Theme, density, language, timezone' },
];

export default function SettingsIndexPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Account, security, notifications, and preferences" />
      <div className="grid gap-3 md:grid-cols-2">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition hover:border-teal">
              <h2 className="font-display text-lg font-bold">{l.title}</h2>
              <p className="text-sm text-navy/60">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
