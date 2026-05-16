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
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const u = await register(name, email, password);
      if (u?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
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

        {/* Logo - Absolute Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <Link href="/" className="flex items-center gap-6 pointer-events-auto transition-transform hover:scale-105">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
              <Brain className="w-12 h-12 text-primary" />
            </div>
            <span className="text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">DeciSmart</span>
          </Link>
        </div>
      </div>

      {/* RIGHT PANEL - Register Form */}
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
              Create an account
            </h2>
            <p className="text-muted-foreground">
              Enter your details to get started
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2 group">
              <Label
                htmlFor="name"
                className="text-sm font-semibold transition-colors group-focus-within:text-primary"
              >
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus:bg-background focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
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
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus:bg-background focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold transition-colors group-focus-within:text-primary"
                >
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus:bg-background focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Password minimal 8 karakter dan harus mengandung huruf serta angka.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

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
                  Creating account...
                </motion.div>
              ) : (
                <div className="flex items-center justify-center">
                  Sign Up
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-12 pt-6 border-t border-border flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
