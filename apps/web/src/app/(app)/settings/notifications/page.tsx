'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, PageHeader } from '@/components/ui';

export default function NotificationSettingsPage() {
  const { me, refresh } = useAuth();
  const [state, setState] = useState({
    notifyApprovals: me?.notifyApprovals ?? true,
    notifyConflicts: me?.notifyConflicts ?? true,
    notifyReviews: me?.notifyReviews ?? true,
    notifyTasks: me?.notifyTasks ?? true,
  });

  async function save() {
    await api.patch('/users/me', state);
    await refresh();
  }

  const toggles: Array<{ key: keyof typeof state; label: string }> = [
    { key: 'notifyApprovals', label: 'Approvals' },
    { key: 'notifyConflicts', label: 'Conflicts' },
    { key: 'notifyReviews', label: 'Reviews' },
    { key: 'notifyTasks', label: 'Tasks' },
  ];

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Control personal operational alerts" />
      <Card className="max-w-lg space-y-3">
        {toggles.map((t) => (
          <label key={t.key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span>{t.label}</span>
            <input
              type="checkbox"
              checked={state[t.key]}
              onChange={(e) => setState({ ...state, [t.key]: e.target.checked })}
            />
          </label>
        ))}
        <Button onClick={save}>Save</Button>
      </Card>
    </div>
  );
}
