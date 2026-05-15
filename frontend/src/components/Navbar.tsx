'use client';

import Link from 'next/link';
import { Brain, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 transition-colors">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:inline">DeciSmart</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" className="text-foreground">Home</Button>
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard">
                <Button variant="ghost" className="text-foreground">Dashboard</Button>
              </Link>
            )}
            <Link href="/decide">
              <Button variant="ghost" className="text-foreground">New Decision</Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" className="text-foreground">History</Button>
            </Link>
          </div>

          {/* Desktop CTA & Auth */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="text-sm text-muted-foreground mr-2 font-medium hover:text-primary transition-colors flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline">{user?.full_name || 'User'}</span>
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Logout
                </Button>
                <Link href="/decide">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Start Now
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/auth/login">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            <Link href="/" className="block px-3 py-2">
              <Button variant="ghost" className="w-full justify-start text-foreground">
                Home
              </Button>
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="block px-3 py-2">
                <Button variant="ghost" className="w-full justify-start text-foreground">
                  Dashboard
                </Button>
              </Link>
            )}
            <Link href="/decide" className="block px-3 py-2">
              <Button variant="ghost" className="w-full justify-start text-foreground">
                New Decision
              </Button>
            </Link>
            <Link href="/history" className="block px-3 py-2">
              <Button variant="ghost" className="w-full justify-start text-foreground">
                History
              </Button>
            </Link>
            <div className="px-3 py-2 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-sm text-muted-foreground font-medium border-b border-border mb-2">
                    Signed in as {user?.full_name}
                  </div>
                  <Link href="/decide">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-2">
                      Start Now
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleLogout}
                    variant="outline" 
                    className="w-full border-border hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/auth/login">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
