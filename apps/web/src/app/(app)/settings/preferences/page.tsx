'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Label, PageHeader, Select } from '@/components/ui';

export default function PreferencesPage() {
  const { me, refresh } = useAuth();
  const [theme, setTheme] = useState(me?.theme || 'light');
  const [density, setDensity] = useState(me?.density || 'comfortable');
  const [language, setLanguage] = useState(me?.language || 'id');
  const [timezone, setTimezone] = useState(me?.timezone || 'Asia/Jakarta');

  async function save() {
    await api.patch('/users/me', { theme, density, language, timezone });
    await refresh();
  }

  return (
    <div>
      <PageHeader title="Preferences" subtitle="UI density, language, and timezone" />
      <Card className="max-w-lg space-y-3">
        <div>
          <Label>Theme</Label>
          <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark (stored preference)</option>
          </Select>
        </div>
        <div>
          <Label>Density</Label>
          <Select value={density} onChange={(e) => setDensity(e.target.value)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </Select>
        </div>
        <div>
          <Label>Language</Label>
          <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </Select>
        </div>
        <div>
          <Label>Timezone</Label>
          <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option value="Asia/Jakarta">Asia/Jakarta</option>
            <option value="UTC">UTC</option>
          </Select>
        </div>
        <Button onClick={save}>Save preferences</Button>
      </Card>
    </div>
  );
}
