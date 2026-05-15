"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulasi proses login
    setTimeout(() => {
      setIsLoading(false);
      router.push("/admin");
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans overflow-hidden">
      {/* LEFT PANEL - Visual / Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-primary">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-30 mix-blend-multiply bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop')",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link
            href="/"
            className="flex items-center gap-3 w-fit transition-transform hover:scale-105"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">
              DeciSmart
            </span>
          </Link>
        </div>

        {/* Testimonial / Copy */}
        <div className="relative z-10 max-w-lg mt-auto mb-10">
          <blockquote className="space-y-6">
            <p className="text-3xl font-medium text-white leading-snug">
              "DeciSmart has transformed how our team evaluates complex
              proposals. The structured criteria approach brings clarity we
              never had before."
            </p>
            <footer className="text-white/80">
              <div className="font-semibold text-white text-lg">
                Sarah Jenkins
              </div>
              <div className="text-sm">Director of Procurement, TechCorp</div>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            DeciSmart
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 group">
              <Label
                htmlFor="email"
                className="text-sm font-semibold transition-colors group-focus-within:text-primary"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@decismart.com"
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus:bg-background focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold transition-colors group-focus-within:text-primary"
                >
                  Password
                </Label>
                <Link
                  href="#"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus:bg-background focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-8 rounded-xl font-semibold text-md shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center"
                >
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </motion.div>
              ) : (
                <div className="flex items-center justify-center">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-12 pt-6 border-t border-border flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="#"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Request Access
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
