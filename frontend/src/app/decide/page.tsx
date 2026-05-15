'use client';

import { Navbar } from '@/components/Navbar';
import { DecisionForm } from '@/components/DecisionForm';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DecidePage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="flex-1 bg-background min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Make a Decision</h1>
            <p className="text-muted-foreground">
              Let&apos;s walk through your decision step by step
            </p>
          </div>

          <DecisionForm />
        </div>
      </main>
    </ProtectedRoute>
  );
}
