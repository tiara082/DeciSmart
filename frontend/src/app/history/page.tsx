'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Trash2, Eye, Calendar, Filter } from 'lucide-react';
import type { Decision } from '@/lib/analysis';

export default function HistoryPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent' | 'oldest'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/api').then(({ decisionsApi }) => {
      decisionsApi.getDecisions({ limit: 100 })
        .then((res) => {
          setDecisions(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    });
  }, []);

  const getFilteredDecisions = () => {
    let filtered = [...decisions];

    if (filter === 'recent') {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (filter === 'oldest') {
      filtered.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return filtered;
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this decision?')) {
      import('@/lib/api').then(({ decisionsApi }) => {
        decisionsApi.deleteDecision(id).then(() => {
          const updated = decisions.filter((d) => d.id !== id);
          setDecisions(updated);
        });
      });
    }
  };

  const filteredDecisions = getFilteredDecisions();

  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Decision History</h1>
              <p className="text-muted-foreground">
                Review and track all your decisions
              </p>
            </div>
            <Link href="/decide">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                New Decision
              </Button>
            </Link>
          </div>

          {/* Filter Bar */}
          {filteredDecisions.length > 0 && (
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Filter className="w-4 h-4 inline mr-2" />
                All
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'recent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Recent
              </button>
              <button
                onClick={() => setFilter('oldest')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'oldest'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Oldest
              </button>
            </div>
          )}

          {/* Decisions List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
            </div>
          ) : filteredDecisions.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No Decisions Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t made any decisions yet. Start your first decision now!
              </p>
              <Link href="/decide">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Make Your First Decision
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDecisions.map((decision) => (
                <div
                  key={decision.id}
                  className="bg-card border border-border rounded-xl p-6 hover:border-accent/30 transition-colors hover:shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {decision.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        {decision.description
                          ? decision.description.substring(0, 100) + '...'
                          : 'No description provided'}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {decision.alternatives?.[0]?.count || 0} alternatives
                        </span>
                        <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                          {decision.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(decision.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex gap-3 md:justify-end">
                      <Link href={`/analysis/${decision.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border text-primary hover:bg-primary/5"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Analysis
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                      <button
                        onClick={() => handleDelete(decision.id)}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
