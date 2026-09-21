'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Badge,
} from '@/components/ui';

interface SystemSettingsState {
  googleOidcEnabled: boolean;
  localAuthEnabled: boolean;
  allowedEmailDomain: string;
  maxUploadBytes: number;
  sessionTimeoutMinutes: number;
  requireFirstLoginChange: boolean;
}

export default function AdminSystemSettingsPage() {
  const { me } = useAuth();
  const [settings, setSettings] = useState<SystemSettingsState>({
    googleOidcEnabled: false,
    localAuthEnabled: true,
    allowedEmailDomain: 'cakrawala.ac.id',
    maxUploadBytes: 10485760,
    sessionTimeoutMinutes: 480,
    requireFirstLoginChange: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await api.get<SystemSettingsState>('/admin/system-settings');
      setSettings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const payload = {
        googleOidcEnabled: settings.googleOidcEnabled,
        localAuthEnabled: settings.localAuthEnabled,
        allowedEmailDomain: settings.allowedEmailDomain.trim(),
        maxUploadBytes: Number(settings.maxUploadBytes),
        sessionTimeoutMinutes: Number(settings.sessionTimeoutMinutes),
        requireFirstLoginChange: settings.requireFirstLoginChange,
      };
      await api.patch('/admin/system-settings', payload);
      setMsg('System policies updated successfully. Audit trail recorded.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission(me, 'admin:system')) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center text-navy/60">
        You do not have permission to view or modify global system security settings.
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-navy/60">Loading system policies…</div>;
  }

  return (
    <div>
      <PageHeader
        title="Admin · System & Security Settings"
        subtitle="Configure enterprise authentication, domain restrictions, and operational safeguards"
      />

      {msg ? <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-success">{msg}</p> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Authentication Policy */}
        <Card className="max-w-2xl space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-base font-bold text-navy">Identity & Authentication Policy</h2>
            <p className="text-xs text-navy/60">Enforce verified domain credentials and multi-provider options</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-semibold text-navy">Google OIDC Authentication</div>
                <div className="text-xs text-navy/50">Allow Cakrawala Google Workspace OAuth2 single sign-on</div>
              </div>
              <input
                type="checkbox"
                checked={settings.googleOidcEnabled}
                onChange={(e) => setSettings({ ...settings, googleOidcEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-semibold text-navy">Local Email/Password Authentication</div>
                <div className="text-xs text-navy/50">
                  Allow administrator-provisioned local accounts (required for demo evaluators)
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.localAuthEnabled}
                onChange={(e) => setSettings({ ...settings, localAuthEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
              />
            </label>

            <div>
              <Label>Authorized Email Domain Restriction</Label>
              <Input
                required
                value={settings.allowedEmailDomain}
                onChange={(e) => setSettings({ ...settings, allowedEmailDomain: e.target.value })}
                placeholder="e.g. cakrawala.ac.id"
              />
              <p className="mt-1 text-[11px] text-navy/50">
                OIDC tokens and new account emails outside this domain are rejected by the server authority.
              </p>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-semibold text-navy">Enforce Password Change on First Login</div>
                <div className="text-xs text-navy/50">
                  Temporary credentials provisioned by admin must be changed before navigating protected routes
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.requireFirstLoginChange}
                onChange={(e) => setSettings({ ...settings, requireFirstLoginChange: e.target.checked })}
                className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
              />
            </label>
          </div>
        </Card>

        {/* Operational Limits & Session Safeguards */}
        <Card className="max-w-2xl space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-base font-bold text-navy">Operational Limits & Session Safeguards</h2>
            <p className="text-xs text-navy/60">Storage thresholds and timeout configurations</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Max Upload Size (Bytes)</Label>
              <Input
                type="number"
                required
                min={1048576}
                value={settings.maxUploadBytes}
                onChange={(e) => setSettings({ ...settings, maxUploadBytes: Number(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-navy/50">
                {(settings.maxUploadBytes / (1024 * 1024)).toFixed(1)} MB limit per operational document
              </p>
            </div>

            <div>
              <Label>Session Timeout (Minutes)</Label>
              <Input
                type="number"
                required
                min={15}
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-navy/50">
                {(settings.sessionTimeoutMinutes / 60).toFixed(1)} hours before requiring re-authentication
              </p>
            </div>
          </div>
        </Card>

        <div className="max-w-2xl">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving Changes…' : 'Save System Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
