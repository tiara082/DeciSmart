'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const adminMenuItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Decisions',
    href: '/admin/decisions',
    icon: FileText,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-lg transition-transform duration-300 z-40 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-6 border-b border-slate-700">
            <Link href="/admin" className="flex flex-col gap-2">
              <img 
                src="/logo_baru.png" 
                alt="DeciSmart Logo" 
                className="h-16 w-auto object-contain"
              />
              <p className="text-xs text-slate-400 font-medium ml-1">Admin Panel</p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-6 border-t border-slate-700 space-y-3">
            <div className="px-4 py-3 rounded-lg bg-slate-700 bg-opacity-50">
              <p className="text-xs text-slate-400 mb-1">Admin Account</p>
              <p className="text-sm font-medium text-white">{user?.full_name || 'Admin User'}</p>
              <p className="text-xs text-slate-400">{user?.email || 'admin@example.com'}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
