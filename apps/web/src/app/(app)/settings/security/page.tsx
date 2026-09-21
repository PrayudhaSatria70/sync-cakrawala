'use client';

import { FormEvent, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Input, Label, PageHeader } from '@/components/ui';

export default function SecuritySettingsPage() {
  const { me, refresh } = useAuth();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setMsg('Password updated');
      setCurrent('');
      setNew('');
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed');
    }
  }

  return (
    <div>
      <PageHeader
        title="Security"
        subtitle={me?.mustChangePassword ? 'You must change your password before continuing' : 'Local credential management'}
      />
      <Card className="max-w-lg">
        {me?.authProvider === 'GOOGLE' ? (
          <p className="text-sm text-navy/60">Google-only account — local password form is hidden.</p>
        ) : (
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <Label>Current password</Label>
              <Input type="password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" required minLength={8} value={newPassword} onChange={(e) => setNew(e.target.value)} />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {msg ? <p className="text-sm text-success">{msg}</p> : null}
            <Button type="submit">Change password</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
