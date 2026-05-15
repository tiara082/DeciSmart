'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';
import { adminApi, type AdminDecisionRow } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Filter, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<AdminDecisionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'archived'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminApi.getDecisions({ limit: 100 });
        setDecisions(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load decisions');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const confirmDelete = async (decisionId: string) => {
    try {
      await adminApi.deleteDecision(decisionId);
      setDecisions((prev) => prev.filter((d) => d.id !== decisionId));
      setShowDeleteConfirm(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete decision');
    }
  };

  const filteredDecisions =
    filterStatus === 'all' ? decisions : decisions.filter((d) => d.status === filterStatus);

  const decisionColumns = [
    {
      key: 'title' as const,
      label: 'Decision Title',
      sortable: true,
      width: '30%',
      render: (value: string) => <span className="font-medium text-slate-900">{value}</span>,
    },
    {
      key: 'users' as const,
      label: 'User',
      sortable: false,
      render: (value: AdminDecisionRow['users']) =>
        value ? <span className="text-slate-700">{value.full_name}</span> : <span className="text-slate-400">—</span>,
    },
    {
      key: 'status' as const,
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            value === 'completed'
              ? 'bg-green-100 text-green-800'
              : value === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'created_at' as const,
      label: 'Created',
      sortable: true,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id' as const,
      label: 'View',
      sortable: false,
      render: (id: string) => (
        <Link href={`/analysis/${id}`} target="_blank">
          <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            View
          </Button>
        </Link>
      ),
    },
  ];

  const stats = [
    { label: 'Total', value: decisions.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Completed', value: decisions.filter((d) => d.status === 'completed').length, color: 'bg-green-50 text-green-700' },
    { label: 'Pending', value: decisions.filter((d) => d.status === 'pending').length, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Archived', value: decisions.filter((d) => d.status === 'archived').length, color: 'bg-gray-50 text-gray-700' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Decisions Management" subtitle="Monitor and manage all user decisions" />

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-6 py-4 text-destructive font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className={`rounded-lg border border-slate-200 p-4 ${stat.color}`}>
              <p className="text-sm font-medium opacity-75">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Filter by Status:</span>
          <div className="flex gap-2">
            {(['all', 'completed', 'pending', 'archived'] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={filterStatus === status ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <DataTable
          title={`${filterStatus === 'all' ? 'All Decisions' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Decisions`} (${filteredDecisions.length})`}
          columns={decisionColumns as never}
          data={filteredDecisions}
          searchKey="title"
          onDelete={(d) => setShowDeleteConfirm((d as AdminDecisionRow).id)}
        />
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Decision?</h3>
            <p className="text-slate-600 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => confirmDelete(showDeleteConfirm)} className="flex-1">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
