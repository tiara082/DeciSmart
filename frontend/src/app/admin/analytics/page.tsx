'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { adminApi } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, FileText, Layers, CheckCircle2, Loader2, Users } from 'lucide-react';

interface AnalyticsData {
  totalDecisions: number;
  completedDecisions: number;
  totalAlternatives: number;
  totalCriteria: number;
  decisionTrend: Array<{ date: string; count: number }>;
  decisionsByStatus: Array<{ name: string; value: number }>;
  dayOfWeekStats: Array<{ day: string; decisions: number }>;
  topUsers: Array<{ name: string; decisions: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  draft: '#64748b',
  pending: '#f59e0b',
  archived: '#ef4444',
};

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await adminApi.getAnalytics();
        setData(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-red-700">⚠️ {error || 'No data'}</div>
      </div>
    );
  }

  const completionRate = data.totalDecisions > 0
    ? ((data.completedDecisions / data.totalDecisions) * 100).toFixed(1)
    : '0.0';

  const avgAltsPerDecision = data.totalDecisions > 0
    ? (data.totalAlternatives / data.totalDecisions).toFixed(1)
    : '0';

  const overviewCards = [
    { label: 'Total Decisions', value: data.totalDecisions, icon: FileText, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle2, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Total Alternatives', value: data.totalAlternatives, icon: Layers, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: 'Total Criteria', value: data.totalCriteria, icon: TrendingUp, color: 'bg-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div>
      <AdminHeader
        title="Analytics"
        subtitle="Real-time insights from your platform data"
      />

      <div className="p-6 space-y-6">
        {/* Overview KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewCards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className={`inline-flex p-2.5 rounded-lg ${card.bg} mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} />
              </div>
              <p className="text-sm text-slate-500 font-medium">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Decision Trend (30 days) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-1">Decision Activity — Last 30 Days</h3>
          <p className="text-sm text-slate-500 mb-5">Number of decisions created per day</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.decisionTrend}>
              <defs>
                <linearGradient id="colorDec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }}
                tickFormatter={(v) => {
                  const parts = v.split(' ');
                  return parts.length === 2 ? `${parts[0]} ${parts[1]}` : v;
                }}
                interval={Math.floor(data.decisionTrend.length / 6)}
              />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" name="Decisions" stroke="#3b82f6" fill="url(#colorDec)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Row: Status Pie + Day of Week Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-1">Decision Status Distribution</h3>
            <p className="text-sm text-slate-500 mb-4">Breakdown of all decisions by current status</p>
            {data.decisionsByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400">No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.decisionsByStatus}
                      cx="50%" cy="50%"
                      outerRadius={85}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.decisionsByStatus.map((entry, index) => (
                        <Cell key={index} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {data.decisionsByStatus.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm text-slate-700">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] || COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{entry.name}</span>
                      <span className="font-semibold text-slate-900">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Decisions by Day of Week */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-1">Decisions by Day of Week</h3>
            <p className="text-sm text-slate-500 mb-4">When are users most active?</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.dayOfWeekStats} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="decisions" name="Decisions" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-900">Most Active Users</h3>
          </div>
          {data.topUsers.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No user data yet</p>
          ) : (
            <div className="space-y-4">
              {data.topUsers.map((u, i) => {
                const max = data.topUsers[0].decisions;
                const pct = max > 0 ? (u.decisions / max) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-800">{u.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {u.decisions} decision{u.decisions !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Key Metrics Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Key Metrics Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{completionRate}%</p>
              <p className="text-sm text-slate-500 mt-1">Completion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{avgAltsPerDecision}</p>
              <p className="text-sm text-slate-500 mt-1">Avg Alternatives / Decision</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{data.completedDecisions}</p>
              <p className="text-sm text-slate-500 mt-1">Completed Decisions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{data.topUsers[0]?.name?.split(' ')[0] || '—'}</p>
              <p className="text-sm text-slate-500 mt-1">Most Active User</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
