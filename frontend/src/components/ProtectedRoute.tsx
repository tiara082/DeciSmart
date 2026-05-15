'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
  // BUG FIX: Support allowedRoles array used by dashboard/page.tsx
  allowedRoles?: ('user' | 'admin')[];
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Resolve the effective allowed roles
  const effectiveAllowedRoles = allowedRoles ?? (requiredRole ? [requiredRole] : null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (effectiveAllowedRoles && user?.role && !effectiveAllowedRoles.includes(user.role)) {
      // Redirect to the correct dashboard based on their actual role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router, effectiveAllowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block w-10 h-10 rounded-full border-4 border-muted border-t-primary animate-spin mb-3"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (effectiveAllowedRoles && user?.role && !effectiveAllowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

// BUG FIX: Also export as default for legacy imports
export default ProtectedRoute;
