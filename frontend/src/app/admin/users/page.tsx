'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { adminApi, type AdminUserRow } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Users, UserCheck, Shield, X, Search, CheckCircle2
} from 'lucide-react';

// ── Modal helper ─────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [filtered, setFiltered] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // ── Load ────────────────────────────────────────────────────────
  async function load() {
    try {
      const res = await adminApi.getUsers({ limit: 200 });
      setUsers(res.data);
      setFiltered(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Search filter ───────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      (u.full_name || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    ));
  }, [search, users]);

  // ── Toast helper ────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // ── Handlers ────────────────────────────────────────────────────
  function openCreate() {
    setForm({ full_name: '', email: '', password: '' });
    setFormError('');
    setShowCreate(true);
  }

  function openEdit(user: AdminUserRow) {
    setForm({ full_name: user.full_name || '', email: user.email, password: '' });
    setFormError('');
    setEditUser(user);
  }

  async function handleCreate() {
    if (!form.full_name || !form.email || !form.password) {
      setFormError('All fields are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const res = await adminApi.createUser(form.full_name, form.email, form.password);
      setUsers(prev => [res.data, ...prev]);
      setShowCreate(false);
      showToast('✅ User created successfully');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEdit() {
    if (!editUser) return;
    if (!form.full_name && !form.email) {
      setFormError('Provide at least a name or email to update.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const res = await adminApi.updateUser(editUser.id, {
        full_name: form.full_name || undefined,
        email: form.email || undefined,
      });
      setUsers(prev => prev.map(u => u.id === editUser.id ? res.data : u));
      setEditUser(null);
      showToast('✅ User updated successfully');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(user: AdminUserRow) {
    try {
      const res = await adminApi.toggleUserStatus(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: res.data.is_active } : u));
      showToast(`User ${res.data.is_active ? 'activated' : 'deactivated'}`);
    } catch (err: unknown) {
      showToast('❌ ' + (err instanceof Error ? err.message : 'Failed'));
    }
  }

  async function handleDelete() {
    if (!deleteUserId) return;
    try {
      await adminApi.deleteUser(deleteUserId);
      setUsers(prev => prev.filter(u => u.id !== deleteUserId));
      setDeleteUserId(null);
      showToast('🗑️ User deleted');
    } catch (err: unknown) {
      showToast('❌ ' + (err instanceof Error ? err.message : 'Failed to delete'));
    }
  }

  // ── Derived stats ───────────────────────────────────────────────
  const total = users.length;
  const active = users.filter(u => u.is_active).length;
  const admins = users.filter(u => u.role === 'admin').length;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div>
      <AdminHeader title="Users Management" subtitle="Create, edit, and manage all application users" />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-red-700">⚠️ {error}</div>
        )}

        {/* KPI Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{total}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg"><UserCheck className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="text-2xl font-bold text-slate-900">{active}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-lg"><Shield className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Admins</p>
              <p className="text-2xl font-bold text-slate-900">{admins}</p>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">No users found</td>
                  </tr>
                ) : filtered.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.full_name || '—'}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Toggle on={user.is_active} onChange={() => handleToggle(user)} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteUserId(user.id)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-200 text-xs text-slate-400">
            Showing {filtered.length} of {total} users
          </div>
        </div>
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <Modal title="Add New User" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{formError}</div>}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Full Name</label>
              <Input placeholder="John Doe" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email Address</label>
              <Input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Password</label>
              <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <p className="text-xs text-slate-500">Role will be set to <strong>User</strong> by default.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleCreate} disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <div className="space-y-4">
            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{formError}</div>}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Full Name</label>
              <Input placeholder="Full name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email Address</label>
              <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
              Current role: <span className={`font-semibold ${editUser.role === 'admin' ? 'text-purple-700' : 'text-blue-700'}`}>{editUser.role}</span>
              <span className="text-slate-400 ml-1">(cannot be changed here)</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleEdit} disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {deleteUserId && (
        <Modal title="Delete User?" onClose={() => setDeleteUserId(null)}>
          <div className="space-y-4">
            <p className="text-slate-600">This will permanently remove the user and all their data. This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteUserId(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
