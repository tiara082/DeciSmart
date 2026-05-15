'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Download, Share2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { decisionsApi } from '@/lib/api';

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const [decision, setDecision] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      decisionsApi.get(id),
      decisionsApi.getAnalysis(id).catch(() => null), // If no analysis yet, don't crash
    ])
      .then(([decRes, analysisRes]) => {
        setDecision(decRes.data);
        if (analysisRes && analysisRes.data) {
          setAnalysis(analysisRes.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading analysis...</p>
          </div>
        </div>
      </>
    );
  }

  if (!decision) {
    return (
      <>
        <Navbar />
        <main className="bg-background min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-foreground mb-4">Decision Not Found</h1>
              <p className="text-muted-foreground mb-6">The decision you&apos;re looking for doesn&apos;t exist.</p>
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const ranks = analysis?.recommendation?.ranked_alternatives || [];
  const topChoice = ranks.length > 0 ? ranks[0] : null;

  const chartData = ranks.map((r: any) => ({
    name: r.alternative_name,
    score: (r.final_score * 100).toFixed(1),
  }));

  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link href="/history">
              <Button variant="ghost" className="text-muted-foreground mb-4">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Decisions
              </Button>
            </Link>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Analysis Results
                </h1>
                <p className="text-muted-foreground">{decision.title}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-border hidden print:hidden" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border hidden print:hidden md:flex" 
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>

          {!analysis ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Analysis Not Available</h2>
              <p className="text-muted-foreground mb-6">
                This decision is currently a draft and its analysis hasn't been completed yet.
              </p>
              <Button 
                onClick={() => {
                  import('@/lib/api').then(({ decisionsApi }) => {
                    setLoading(true);
                    decisionsApi.runAnalysis(decision.id, 'SAW')
                      .then(() => {
                        window.location.reload();
                      })
                      .catch((err) => {
                        console.error('Failed to run analysis:', err);
                        alert('Failed to run analysis. Please make sure you have filled in the scores properly.');
                        setLoading(false);
                      });
                  });
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Run Analysis Now
              </Button>
            </div>
          ) : (
            <>
              {/* Recommendation Card */}
              {topChoice && (
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-8 mb-8">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div className="w-full">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Recommended: {topChoice.alternative_name}</h2>
                      <div className="mt-4">
                        <p className="text-sm font-medium text-foreground mb-2">Overall Match Score</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, topChoice.final_score * 100))}%` }}
                            />
                          </div>
                          <span className="text-lg font-bold text-primary">
                            {(topChoice.final_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scores Comparison */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="text-xl font-bold text-foreground mb-6">Overall Scores</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'var(--color-foreground)' }}
                        formatter={(value) => `${value}%`}
                      />
                      <Bar dataKey="score" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Scores List */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-xl font-bold text-foreground mb-6">Rankings</h3>
                  <div className="space-y-4">
                    {ranks.map((r: any, index: number) => (
                      <div key={r.alternative_id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-sm">
                            {r.rank}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{r.alternative_name}</p>
                            <p className="text-xs text-muted-foreground">{(r.final_score * 100).toFixed(1)}% match</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{(r.final_score * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-card border border-border rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-accent" />
                  AI Analysis & Reasoning
                </h3>
                <div className="bg-background rounded-lg p-6 border border-border/50 text-foreground whitespace-pre-wrap">
                  {analysis.recommendation?.ai_reasoning || "No reasoning available from AI."}
                </div>
              </div>
            </>
          )}

          {/* Decision Details */}
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-foreground">Decision Details</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Decision Summary</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Decision</p>
                    <p className="text-foreground">{decision.title}</p>
                  </div>
                  {decision.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Context</p>
                      <p className="text-foreground text-sm">{decision.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Analysis Date</p>
                    <p className="text-foreground text-sm">
                      {new Date(decision.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Criteria</h3>
                <ul className="space-y-2">
                  {decision.criteria?.map((c: any) => (
                    <li key={c.id} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{c.name}</span>
                      <span className="font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                        {c.weight}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {decision.alternatives && decision.criteria && decision.scores && (
              <div className="bg-card border border-border rounded-xl p-6 overflow-x-auto">
                <h3 className="text-lg font-bold text-foreground mb-4">Scores Matrix</h3>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium">Alternative / Criteria</th>
                      {decision.criteria.map((c: any) => (
                        <th key={c.id} className="px-4 py-3 font-medium text-center">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {decision.alternatives.map((alt: any) => (
                      <tr key={alt.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{alt.name}</td>
                        {decision.criteria.map((cri: any) => {
                          const score = decision.scores.find(
                            (s: any) => s.alternative_id === alt.id && s.criteria_id === cri.id
                          );
                          return (
                            <td key={cri.id} className="px-4 py-3 text-center text-muted-foreground">
                              {score ? score.raw_value : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
            <Link href="/decide">
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                Make Another Decision
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" className="w-full sm:w-auto border-border">
                View History
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
