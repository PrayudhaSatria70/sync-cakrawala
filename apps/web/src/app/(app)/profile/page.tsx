'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge, Button, Card, Input, Label, PageHeader } from '@/components/ui';

export default function ProfilePage() {
  const { me, refresh } = useAuth();
  const [fullName, setFullName] = useState(me?.fullName || '');
  const [saved, setSaved] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    await api.patch('/users/me', { fullName });
    await refresh();
    setSaved(true);
  }

  if (!me) return null;

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Personal identity — role and division are admin-controlled" />
      <Card className="max-w-xl">
        <form className="space-y-3" onSubmit={save}>
          <div>
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={me.email} disabled />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Role (locked)</Label>
              <div className="rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-sm">{me.role.name}</div>
            </div>
            <div className="flex-1">
              <Label>Division (locked)</Label>
              <div className="rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-sm">
                {me.division?.name || '—'}
              </div>
            </div>
          </div>
          <Badge tone="info">{me.status}</Badge>
          <Button type="submit">Save profile</Button>
          {saved ? <p className="text-sm text-success">Saved</p> : null}
        </form>
      </Card>
    </div>
  );
}
