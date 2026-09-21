'use client';

import { useEffect, useState } from 'react';
import { api, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, PageHeader, Badge } from '@/components/ui';

interface PermissionItem {
  id: string;
  code: string;
  description?: string;
}

interface RoleItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Array<{ permission: PermissionItem }>;
  _count?: { users: number };
}

export default function AdminRolesPage() {
  const { me } = useAuth();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [rolePermMap, setRolePermMap] = useState<Record<string, string[]>>({});
  const [dirtyRoles, setDirtyRoles] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [r, p] = await Promise.all([
        api.get<RoleItem[]>('/admin/roles'),
        api.get<PermissionItem[]>('/admin/permissions'),
      ]);
      setRoles(r);
      setPermissions(p);
      const map: Record<string, string[]> = {};
      r.forEach((role) => {
        map[role.id] = role.permissions.map((rp) => rp.permission.code);
      });
      setRolePermMap(map);
      setDirtyRoles({});
    } catch (err: any) {
      setError(err?.message || 'Failed to load roles and permissions');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const togglePermission = (roleId: string, permCode: string) => {
    const current = rolePermMap[roleId] || [];
    const exists = current.includes(permCode);
    const updated = exists ? current.filter((c) => c !== permCode) : [...current, permCode];

    setRolePermMap((prev) => ({
      ...prev,
      [roleId]: updated,
    }));

    setDirtyRoles((prev) => ({
      ...prev,
      [roleId]: true,
    }));
  };

  const saveRole = async (roleId: string) => {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await api.patch(`/admin/roles/${roleId}`, {
        permissionCodes: rolePermMap[roleId] || [],
      });
      setDirtyRoles((prev) => ({ ...prev, [roleId]: false }));
      setMsg(`Permissions updated for role successfully.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const saveAllDirty = async () => {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const dirtyIds = Object.keys(dirtyRoles).filter((id) => dirtyRoles[id]);
      for (const id of dirtyIds) {
        await api.patch(`/admin/roles/${id}`, {
          permissionCodes: rolePermMap[id] || [],
        });
      }
      setDirtyRoles({});
      setMsg('All modified roles have been saved and audited.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to save role permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission(me, 'admin:roles')) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center text-navy/60">
        You do not have permission to administer roles and capability scopes.
      </div>
    );
  }

  const hasDirty = Object.values(dirtyRoles).some(Boolean);

  return (
    <div>
      <PageHeader
        title="Admin · Role & Permission Matrix"
        subtitle="Enforce the Principle of Least Privilege across the 6 platform personas"
        actions={
          hasDirty ? (
            <Button onClick={saveAllDirty} disabled={saving}>
              {saving ? 'Saving…' : 'Save Modified Roles'}
            </Button>
          ) : (
            <Badge tone="success">Matrix Synchronized</Badge>
          )
        }
      />

      {msg ? <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-success">{msg}</p> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

      <div className="mb-4 rounded-xl border border-border bg-cyan/40 p-4 text-xs text-navy/70">
        <strong>Protected System Roles</strong>: The six baseline personas (Super Admin, Operations Coordinator, Division PIC, Reviewer, Approver, Viewer) are protected against deletion. Super Admin can fine-tune capability assignments. Every change is permanently audited.
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase text-navy/60">
            <tr>
              <th className="sticky left-0 z-10 bg-surface px-4 py-3 font-semibold">Capability / Permission</th>
              {roles.map((r) => (
                <th key={r.id} className="px-3 py-3 text-center font-semibold">
                  <div>{r.name}</div>
                  <div className="text-[10px] font-normal normal-case text-navy/50">
                    {r._count?.users ?? 0} users
                  </div>
                  {dirtyRoles[r.id] && (
                    <button
                      onClick={() => saveRole(r.id)}
                      className="mt-1 rounded bg-teal px-2 py-0.5 text-[10px] font-bold text-white hover:bg-teal/80"
                    >
                      Save
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {permissions.map((p) => (
              <tr key={p.id} className="hover:bg-cyan/20">
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-navy hover:bg-cyan/20">
                  <div className="font-mono text-xs font-semibold text-navy">{p.code}</div>
                  {p.description && <div className="text-[11px] text-navy/50">{p.description}</div>}
                </td>
                {roles.map((r) => {
                  const isChecked = (rolePermMap[r.id] || []).includes(p.code);
                  const isSuperAdminAll = r.code === 'SUPER_ADMIN' && p.code.startsWith('admin:');
                  return (
                    <td key={r.id} className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isSuperAdminAll}
                        onChange={() => togglePermission(r.id, p.code)}
                        className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
                        title={isSuperAdminAll ? 'Super Admin requires full admin capability' : undefined}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
