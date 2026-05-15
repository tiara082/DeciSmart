'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, TrendingUp, Zap, Loader2 } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import { adminApi, type AdminDecisionRow } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  users: { total: number; active: number; admins: number };
  decisions: { total: number; completed: number };
  recommendations: { total: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<AdminDecisionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, decisionsRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getDecisions({ limit: 5 }),
        ]);
        setStats(statsRes.data);
        setRecentDecisions(decisionsRes.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const statCards = stats
    ? [
        { title: 'Total Users', value: stats.users.total, change: 12, changeType: 'increase' as const, icon: Users, color: 'bg-blue-500' },
        { title: 'Active Users', value: stats.users.active, change: 8, changeType: 'increase' as const, icon: TrendingUp, color: 'bg-green-500' },
        { title: 'Total Decisions', value: stats.decisions.total, change: 15, changeType: 'increase' as const, icon: FileText, color: 'bg-purple-500' },
        { title: 'Completed', value: stats.decisions.completed, change: 5, changeType: 'increase' as const, icon: Zap, color: 'bg-orange-500' },
      ]
    : [];

  const decisionStatusData = stats
    ? [
        { name: 'Completed', value: stats.decisions.completed },
        { name: 'Pending', value: Math.max(0, stats.decisions.total - stats.decisions.completed) },
      ]
    : [];

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

  const decisionColumns = [
    { key: 'title' as const, label: 'Decision', sortable: true, width: '30%' },
    {
      key: 'users' as const,
      label: 'User',
      render: (value: AdminDecisionRow['users']) =>
        value ? <span className="font-medium">{value.full_name}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'status' as const,
      label: 'Status',
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
    { key: 'created_at' as const, label: 'Created', sortable: true, render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <AdminHeader title="Dashboard" subtitle="Welcome back!" />
        <div className="mt-6 rounded-lg bg-destructive/10 border border-destructive/30 px-6 py-4 text-destructive font-medium">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your application."
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Placeholder bar - no time series from backend yet */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Decisions Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { date: 'Total', count: stats?.decisions.total ?? 0 },
                { date: 'Completed', count: stats?.decisions.completed ?? 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Decision Status Pie */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Decision Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={decisionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {decisionStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Decisions Table */}
        <DataTable
          title="Recent Decisions"
          columns={decisionColumns as never}
          data={recentDecisions}
          searchKey="title"
        />
      </div>
    </div>
  );
}
