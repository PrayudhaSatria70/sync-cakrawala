'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { api, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Input,
  Label,
  PageHeader,
  statusTone,
} from '@/components/ui';

export default function DocumentsPage() {
  const { me } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get<any[]>('/documents').then(setItems).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    await api.upload('/documents/upload', form);
    setOpen(false);
    setFile(null);
    setTitle('');
    setMsg('Uploaded as DRAFT — open detail to submit for review.');
    load();
  }

  return (
    <div>
      <PageHeader
        title="Document Center"
        subtitle="Operational files with ownership, status, and review history"
        actions={
          hasPermission(me, 'documents:upload') ? (
            <Button onClick={() => setOpen(true)}>Upload</Button>
          ) : null
        }
      />
      {msg ? <p className="mb-3 text-sm text-teal">{msg}</p> : null}
      {!items.length ? (
        <EmptyState title="No documents" hint="Upload a meeting note to start the golden demo." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase text-navy/50">
              <tr>
                <th className="px-3 py-2">Document</th>
                <th className="px-3 py-2">Division</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b border-border/70 hover:bg-cyan/30">
                  <td className="px-3 py-2">
                    <Link href={`/documents/${d.id}`} className="font-semibold text-teal hover:underline">
                      {d.title || d.fileName}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{d.division?.name || '—'}</td>
                  <td className="px-3 py-2">{d.uploadedBy?.fullName}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={open} title="Upload document" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={upload}>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional title" />
          </div>
          <div>
            <Label>File</Label>
            <Input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.webp"
            />
          </div>
          <p className="text-xs text-navy/50">Executables and scripts are rejected server-side.</p>
          <Button type="submit" className="w-full">
            Upload
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
