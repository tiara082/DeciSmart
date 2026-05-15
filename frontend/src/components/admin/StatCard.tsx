import { ArrowUp, ArrowDown } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: LucideIcon;
  color: string;
}

export default function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          <div className="flex items-center gap-2 mt-3">
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {changeType === 'increase' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              {Math.abs(change)}%
            </div>
            <span className="text-xs text-slate-500">vs last month</span>
          </div>
        </div>

        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
