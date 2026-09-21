'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, hasPermission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Badge,
  Button,
  Card,
  Drawer,
  Input,
  Label,
  PageHeader,
  Select,
  statusTone,
} from '@/components/ui';

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  roleId: string;
  divisionId?: string;
  status: string;
  authProvider: string;
  mustChangePassword: boolean;
  role: { id: string; code: string; name: string };
  division?: { id: string; code: string; name: string };
}

export default function AdminUsersPage() {
  const { me } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [divFilter, setDivFilter] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<{ user: UserItem; password: string } | null>(null);

  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    username: '',
    roleId: '',
    divisionId: '',
    authProvider: 'LOCAL',
    password: 'Demo123!',
    mustChangePassword: true,
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    roleId: '',
    divisionId: '',
    authProvider: 'LOCAL',
    status: 'ACTIVE',
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [u, r, d] = await Promise.all([
        api.get<UserItem[]>('/admin/users'),
        api.get<any[]>('/admin/roles'),
        api.get<any[]>('/admin/divisions'),
      ]);
      setUsers(u);
      setRoles(r);
      setDivisions(d);
      if (!createForm.roleId && r[0]) {
        setCreateForm((f) => ({ ...f, roleId: r[0].id }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load user management data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMsg('');
    try {
      const res = await api.post<UserItem>('/admin/users', {
        ...createForm,
        email: createForm.email.toLowerCase().trim(),
        divisionId: createForm.divisionId || undefined,
        username: createForm.username || undefined,
      });
      setOpenCreate(false);
      setCreateForm({
        fullName: '',
        email: '',
        username: '',
        roleId: roles[0]?.id || '',
        divisionId: '',
        authProvider: 'LOCAL',
        password: 'Demo123!',
        mustChangePassword: true,
      });
      setMsg(`User ${res.fullName} created. Credentials provisioned.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDrawer = (user: UserItem) => {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName,
      username: user.username || '',
      roleId: user.roleId,
      divisionId: user.divisionId || '',
      authProvider: user.authProvider,
      status: user.status,
    });
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    setError('');
    setMsg('');
    try {
      await api.patch(`/admin/users/${editUser.id}`, {
        ...editForm,
        divisionId: editForm.divisionId || null,
        username: editForm.username || null,
      });
      setEditUser(null);
      setMsg(`Account for ${editForm.fullName} updated.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await api.post(`/admin/users/${id}/status`, { status });
      setMsg(`User status changed to ${status}.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    }
  };

  const resetPassword = async (user: UserItem) => {
    try {
      const res = await api.post<{ temporaryPassword: string }>(`/admin/users/${user.id}/reset-password`, {});
      setTempPasswordModal({ user, password: res.temporaryPassword });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    }
  };

  if (!hasPermission(me, 'admin:users')) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center text-navy/60">
        You do not have administrative permissions to manage platform accounts.
      </div>
    );
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchQ = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.roleId === roleFilter;
    const matchDiv = !divFilter || u.divisionId === divFilter;
    return matchQ && matchRole && matchDiv;
  });

  return (
    <div>
      <PageHeader
        title="Admin · User Management"
        subtitle="Provision accounts, bind role-based capability scopes, and manage user lifecycles"
        actions={
          <Button onClick={() => setOpenCreate(true)}>
            + Create User
          </Button>
        }
      />

      {msg ? <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-success">{msg}</p> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

      {/* Filters Bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="max-w-[200px]"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <Select
          value={divFilter}
          onChange={(e) => setDivFilter(e.target.value)}
          className="max-w-[200px]"
        >
          <option value="">All Divisions</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        {(search || roleFilter || divFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setDivFilter('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase text-navy/60">
            <tr>
              <th className="px-4 py-3">Identity & Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Division Scope</th>
              <th className="px-4 py-3">Auth Provider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-cyan/20">
                <td className="px-4 py-3">
                  <div className="font-semibold text-navy">{u.fullName}</div>
                  <div className="text-xs text-navy/50">{u.email}</div>
                  {u.mustChangePassword && (
                    <span className="mt-0.5 inline-block text-[10px] font-bold text-amber-600">
                      ⚡ Password change required
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone="info">{u.role?.name}</Badge>
                </td>
                <td className="px-4 py-3 text-navy/80">
                  {u.division?.name || <span className="text-navy/40">Global (No division)</span>}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-navy/60">{u.authProvider}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => openEditDrawer(u)}
                    >
                      Edit
                    </Button>
                    {u.status !== 'ACTIVE' && (
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs text-success hover:!bg-green-50"
                        onClick={() => setStatus(u.id, 'ACTIVE')}
                      >
                        Activate
                      </Button>
                    )}
                    {u.status === 'ACTIVE' && (
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs text-amber-600 hover:!bg-amber-50"
                        onClick={() => setStatus(u.id, 'SUSPENDED')}
                      >
                        Suspend
                      </Button>
                    )}
                    {u.status !== 'INACTIVE' && (
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs text-danger hover:!bg-red-50"
                        onClick={() => setStatus(u.id, 'INACTIVE')}
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs text-teal hover:!bg-cyan/40"
                      onClick={() => resetPassword(u)}
                    >
                      Reset PW
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Drawer */}
      <Drawer open={openCreate} title="Provision User Account" onClose={() => setOpenCreate(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              required
              placeholder="e.g. Raden Cakrawala"
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            />
          </div>
          <div>
            <Label>Institutional Email</Label>
            <Input
              type="email"
              required
              placeholder="user@cakrawala.ac.id"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Username (Optional)</Label>
            <Input
              placeholder="raden_c"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            />
          </div>
          <div>
            <Label>Platform Role</Label>
            <Select
              value={createForm.roleId}
              onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Division Scope</Label>
            <Select
              value={createForm.divisionId}
              onChange={(e) => setCreateForm({ ...createForm, divisionId: e.target.value })}
            >
              <option value="">None (Global / Admin / Viewer)</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Authentication Method</Label>
            <Select
              value={createForm.authProvider}
              onChange={(e) => setCreateForm({ ...createForm, authProvider: e.target.value })}
            >
              <option value="LOCAL">Local Email/Password</option>
              <option value="GOOGLE">Google Workspace OIDC</option>
              <option value="BOTH">Both (Hybrid)</option>
            </Select>
          </div>
          <div>
            <Label>Initial Temporary Password</Label>
            <Input
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-navy/70">
            <input
              type="checkbox"
              checked={createForm.mustChangePassword}
              onChange={(e) => setCreateForm({ ...createForm, mustChangePassword: e.target.checked })}
              className="rounded border-border text-teal"
            />
            Require password change on first login
          </label>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Provisioning…' : 'Provision User'}
          </Button>
        </form>
      </Drawer>

      {/* Edit User Drawer */}
      <Drawer open={Boolean(editUser)} title="Edit User Account" onClose={() => setEditUser(null)}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <Label>Email (Locked)</Label>
            <Input disabled value={editUser?.email || ''} />
          </div>
          <div>
            <Label>Full Name</Label>
            <Input
              required
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={editForm.roleId}
              onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Division</Label>
            <Select
              value={editForm.divisionId}
              onChange={(e) => setEditForm({ ...editForm, divisionId: e.target.value })}
            >
              <option value="">None</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="INACTIVE">INACTIVE</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Drawer>

      {/* Password Reset Modal */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm bg-white p-6 shadow-2xl">
            <h3 className="font-display text-base font-bold text-navy">Credentials Reset</h3>
            <p className="mt-1 text-xs text-navy/60">
              Temporary password provisioned for <strong>{tempPasswordModal.user.fullName}</strong>:
            </p>
            <div className="my-4 rounded-lg border border-border bg-cyan/60 p-3 text-center font-mono text-base font-bold text-navy">
              {tempPasswordModal.password}
            </div>
            <p className="text-[11px] text-navy/50">
              The user will be required to configure a new personal password upon next login.
            </p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setTempPasswordModal(null)}>Dismiss</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
