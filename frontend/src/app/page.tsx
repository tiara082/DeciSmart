'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { FeatureCard } from '@/components/FeatureCard';
import { Button } from '@/components/ui/button';
import { Brain, Zap, TrendingUp, Clock } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-background via-background to-muted/20 py-20 md:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
              AI-Powered Decision Support
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Make Smarter Decisions,{' '}
              <span className="text-primary">Faster Than Ever</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              DeciSmart combines artificial intelligence with structured decision-making to help you evaluate alternatives objectively and find the best choice for every situation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/decide">
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base">
                  Get Started
                  <span className="ml-2">→</span>
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="w-full sm:w-auto px-8 h-12 text-base border-border hover:bg-muted">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Powerful Features for Better Decisions
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to make confident, data-driven decisions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={<Brain className="w-6 h-6" />}
                title="AI-Powered Analysis"
                description="Let artificial intelligence analyze your options intelligently and objectively."
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Fast Decisions"
                description="Get comprehensive analysis in seconds, not hours. Make confident choices quickly."
              />
              <FeatureCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Data-Driven Rankings"
                description="See clear comparative rankings based on your criteria and preferences."
              />
              <FeatureCard
                icon={<Clock className="w-6 h-6" />}
                title="Decision History"
                description="Track your decisions and learn from past choices to improve future ones."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-muted/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">
              How It Works
            </h2>

            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: 'Define Your Decision',
                  description: 'Describe the decision you need to make and what you\'re trying to achieve.',
                },
                {
                  step: 2,
                  title: 'Add Alternatives',
                  description: 'List all the options you\'re considering for this decision.',
                },
                {
                  step: 3,
                  title: 'Set Your Criteria',
                  description: 'Define the factors that matter most to you in evaluating these alternatives.',
                },
                {
                  step: 4,
                  title: 'AI Analysis',
                  description: 'Let our AI analyze each alternative against your criteria comprehensively.',
                },
                {
                  step: 5,
                  title: 'Make Your Decision',
                  description: 'Review the insights and make your final decision with confidence.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Make Better Decisions?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Start your first decision analysis now and discover how DeciSmart can help you choose with confidence.
            </p>
            <Link href="/decide">
              <Button className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary px-8 h-12 text-base">
                Start Your Decision
                <span className="ml-2">→</span>
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
