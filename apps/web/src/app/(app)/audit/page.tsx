'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Input, PageHeader, Select } from '@/components/ui';

export default function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  useEffect(() => {
    const q = new URLSearchParams();
    if (action) q.set('action', action);
    if (entityType) q.set('entityType', entityType);
    api.get<any>(`/audit?${q.toString()}`).then((r) => setItems(r.items || [])).catch(console.error);
  }, [action, entityType]);

  return (
    <div>
      <PageHeader title="Audit Trail" subtitle="Material workflow and access changes" />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Filter action" value={action} onChange={(e) => setAction(e.target.value)} className="max-w-xs" />
        <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="max-w-xs">
          <option value="">All entities</option>
          {['User', 'Document', 'Task', 'Approval', 'Conflict', 'Review', 'Role', 'Division'].map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </Select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase text-navy/50">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Entity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b border-border/70">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">{a.actor?.fullName || 'System'}</td>
                <td className="px-3 py-2 font-semibold">{a.action}</td>
                <td className="px-3 py-2">{a.entityType}{a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
