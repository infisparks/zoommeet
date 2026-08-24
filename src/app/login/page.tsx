"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Video, ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
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
      setError(res.error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F6F8] items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Video className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{branding.appName}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to manage meetings and webinars
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Administrator Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your authorized Firebase administrator email & password
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Email Address *"
                type="email"
                placeholder="Enter email (e.g. admin@firstoptionagency.com)"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <Input
                label="Password *"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl h-11 shadow-md shadow-indigo-600/20"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>

          {/* Secure Firebase Connection Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-100 py-2.5 px-3 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Connected to Firebase Database ({branding.appName} Cloud)</span>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Account creation is managed directly by your system administrator.
        </p>
      </div>
    </div>
  );
}
