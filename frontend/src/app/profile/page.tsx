'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { historyApi } from '@/lib/api';
import { 
  User, 
  Activity, 
  Moon, 
  Mail, 
  Sparkles, 
  Lock, 
  ShieldOff, 
  BookOpen, 
  MessageSquare,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [decisionsThisMonth, setDecisionsThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    aiSuggestions: true,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const statsRes = await historyApi.getStats();
        if (statsRes.success) {
          setTotalDecisions(statsRes.data.decisions_created);
          setDecisionsThisMonth(statsRes.data.decisions_created_this_month);
        }
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSettingToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="bg-[#f8fafc] min-h-screen pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Profile & Settings</h1>
            <p className="text-slate-500 mt-1">Manage your account information and preferences</p>
          </div>

          {/* Top Section: Account Info & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Account Info Card */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#1e3a8a]/10 p-2.5 rounded-lg">
                  <User className="w-5 h-5 text-[#1e3a8a]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Account Info</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Full Name</p>
                  <p className="font-medium text-slate-900">{user?.full_name || 'User'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Role</p>
                  <p className="font-medium text-slate-900">{user?.role || 'Member'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email Address</p>
                  <p className="font-medium text-slate-900">{user?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Timezone</p>
                  <p className="font-medium text-slate-900">Asia/Jakarta (WIB)</p>
                </div>
              </div>
            </div>

            {/* Total Decisions Card */}
            <Link 
              href="/history" 
              className="bg-[#a7f3d0] rounded-2xl p-6 md:p-8 shadow-sm border border-[#6ee7b7] flex flex-col items-center justify-center text-center hover:bg-[#6ee7b7] transition-colors group"
            >
              <div className="mb-4 text-[#065f46] group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-[#065f46] mb-2">Total Decisions Made</h3>
              <div className="text-6xl font-bold text-[#022c22] mb-2">
                {loading ? '-' : totalDecisions}
              </div>
              <p className="text-sm font-medium text-[#047857]">
                +{loading ? '0' : decisionsThisMonth} this month
              </p>
              <span className="text-[10px] mt-4 text-[#065f46] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider font-bold">
                View History →
              </span>
            </Link>
          </div>

          {/* Preferences Section */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Preferences</h3>
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 overflow-hidden">
              
              {/* Dark Mode */}
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className="bg-slate-100 p-2.5 rounded-lg">
                    <Moon className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Dark Mode</p>
                    <p className="text-sm text-slate-500">Adjust the interface to reduce glare.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingToggle('darkMode')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className="bg-slate-100 p-2.5 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Email Notifications</p>
                    <p className="text-sm text-slate-500">Receive weekly insights directly to your inbox.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingToggle('emailNotifications')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.emailNotifications ? 'bg-[#1e3a8a]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.emailNotifications ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* AI Suggestions */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] m-1 mt-0">
                <div className="flex gap-4 items-center">
                  <div className="bg-[#dcfce7] p-2.5 rounded-lg">
                    <Sparkles className="w-5 h-5 text-[#166534]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">AI Suggestions</p>
                    <p className="text-sm text-slate-600">Allow the system to proactively recommend actions.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingToggle('aiSuggestions')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.aiSuggestions ? 'bg-[#047857]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.aiSuggestions ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Grid: Privacy & Support */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Privacy & Security */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Privacy & Security</h3>
              <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-slate-700">Password & Authentication</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <div className="h-px bg-slate-100 mx-4" />
                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <ShieldOff className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-slate-700">Data Privacy Options</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Help & Support</h3>
              <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-slate-700">Documentation</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </button>
                <div className="h-px bg-slate-100 mx-4" />
                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-slate-700">Contact Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>
    </ProtectedRoute>
  );
}
