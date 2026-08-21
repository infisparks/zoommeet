"use client";

import React, { useState } from "react";
import Link from "next/link";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Video, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Video className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">{branding.appName}</span>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Reset instructions sent</h2>
            <p className="text-xs text-slate-600">
              If an account exists for <span className="font-semibold text-slate-800">{email}</span>, you will receive password reset instructions.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-slate-900">Reset your password</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Enter your email address and we&apos;ll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Work Email"
                type="email"
                placeholder="alex@infiplus.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" className="w-full">
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
