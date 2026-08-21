"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Video, Shield, Lock, ArrowRight, UserCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("alex@infiplus.in");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginAsDemo } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Login failed");
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    await loginAsDemo(demoEmail);
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side hero branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_50%)]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Video className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">{branding.appName}</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            <Shield className="w-3.5 h-3.5" />
            <span>High Fidelity Video & Screen Sharing</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Connect seamlessly with high-performance real-time WebRTC.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Engineered with LiveKit SFU media routing, instant meeting scheduling, in-meeting chat, waiting rooms, and active speaker spotlighting.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <div className="text-2xl font-bold text-blue-400">99.99%</div>
              <div className="text-xs text-slate-400">Stream Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-400">&lt;50ms</div>
              <div className="text-xs text-slate-400">Global Latency</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} {branding.appName}. All rights reserved.
        </div>
      </div>

      {/* Right side form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Video className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">{branding.appName}</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials or click a pre-filled demo account below.
            </p>
          </div>

          {/* Demo account quick login helper */}
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Demo Credentials (Pre-seeded)
              </span>
              <span className="text-[10px] text-blue-600 font-medium">Click to use</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("alex@infiplus.in");
                  setPassword("password123");
                }}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-left text-xs hover:border-blue-400 transition-colors"
              >
                <div className="font-medium text-slate-800">Alex Morgan</div>
                <div className="text-[10px] text-slate-500">alex@infiplus.in</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("david@infiplus.in");
                  setPassword("password123");
                }}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-left text-xs hover:border-blue-400 transition-colors"
              >
                <div className="font-medium text-slate-800">David Chen</div>
                <div className="text-[10px] text-slate-500">david@infiplus.in</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="alex@infiplus.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Forgot?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Create an account
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-400">
            <Link href="/join" className="hover:text-slate-700 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Join meeting without login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
