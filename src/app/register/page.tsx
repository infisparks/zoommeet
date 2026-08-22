"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/Button";
import { Video, ShieldAlert, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically direct to login after 3 seconds
    const timer = setTimeout(() => {
      router.push("/login");
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[#F5F6F8] items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Administrator Access Only
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Public user registration is disabled for this organization. Account creation is managed directly by your administrator via the Firebase Dashboard.
          </p>

          <div className="space-y-3">
            <Link href="/login" className="block w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span>Go to Sign In</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
