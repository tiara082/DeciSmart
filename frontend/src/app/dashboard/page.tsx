'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { decisionsApi } from '@/lib/api';
import { FileText, Plus, Clock, Brain, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function UserDashboard() {
  const { user } = useAuth();
  const [recentDecisions, setRecentDecisions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    decisionsApi.getDecisions({ limit: 5 })
      .then((res) => {
        const decisions = res.data;
        setRecentDecisions(decisions);
        
        // Calculate basic stats from recent decisions (for demo purposes)
        const completed = decisions.filter((d: any) => d.status === 'completed').length;
        setStats({
          total: decisions.length,
          completed: completed,
          inProgress: decisions.length - completed
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <ProtectedRoute allowedRoles={['user']}>
      <Navbar />
      <main className="bg-background min-h-screen pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.full_name}!</h1>
              <p className="text-muted-foreground mt-1">Here is a summary of your decision-making activity.</p>
            </div>
            <Link href="/decide">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-5 h-5 mr-2" />
                Make a Decision
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Activity Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Decisions</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Recent Decisions */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-foreground">Recent Decisions</h2>
                    <Link href="/history" className="text-sm font-medium text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                  
                  {recentDecisions.length === 0 ? (
                    <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No decisions yet</h3>
                      <p className="text-muted-foreground mb-4">Start making better choices with AI assistance.</p>
                      <Link href="/decide">
                        <Button variant="outline" className="border-primary text-primary">
                          Create Your First Decision
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                      <div className="divide-y divide-border">
                        {recentDecisions.map((decision) => (
                          <div key={decision.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{decision.title}</h3>
                              <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                <span>{new Date(decision.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className={decision.status === 'completed' ? 'text-green-500' : 'text-orange-500'}>
                                  {decision.status.charAt(0).toUpperCase() + decision.status.slice(1)}
                                </span>
                              </div>
                            </div>
                            <Link href={`/analysis/${decision.id}`}>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                View <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Insight Panel */}
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">Insights</h2>
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
                    <Brain className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Decision Pattern</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Based on your recent activity, you tend to prioritize <strong className="text-foreground">Price</strong> and <strong className="text-foreground">Performance</strong> in your evaluations.
                    </p>
                    <div className="bg-background/50 rounded-lg p-3 border border-border/50 text-xs text-muted-foreground">
                      * More insights will unlock as you make more decisions using DeciSmart.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
