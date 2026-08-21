"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { meetingService } from "@/lib/services";
import { Video, ShieldCheck, Lock, Copy, Check } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdMeetingUrl, setCreatedMeetingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  const handleOpenInstantMeetingModal = () => {
    setMeetingTitle(user ? `${user.name}'s Meeting` : "Instant Meeting");
    setCreatedMeetingUrl(null);
    setCopied(false);
    setIsInstantModalOpen(true);
  };

  const handleCreateAndStartMeeting = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const meeting = await meetingService.createMeeting({
        title: meetingTitle || `${user.name}'s Meeting`,
        hostId: user.id,
        hostName: user.name,
        hostEmail: user.email,
        waitingRoomEnabled: waitingRoom,
        passwordEnabled: hasPassword,
        password: hasPassword ? password : undefined,
      });

      const url = `${window.location.origin}/meeting/${meeting.meetingId}`;
      setCreatedMeetingUrl(url);

      // Navigate immediately to meeting room
      router.push(`/meeting/${meeting.meetingId}`);
    } catch (err) {
      console.error("Failed to start instant meeting:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    if (createdMeetingUrl) {
      navigator.clipboard.writeText(createdMeetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-64 flex flex-col min-h-screen">
          <Header
            title={title}
            subtitle={subtitle}
            onMenuClick={() => setSidebarOpen(true)}
            onNewMeeting={handleOpenInstantMeetingModal}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Quick Instant Meeting Modal */}
        <Modal
          isOpen={isInstantModalOpen}
          onClose={() => setIsInstantModalOpen(false)}
          title="Start an Instant Meeting"
          description="Create a secure LiveKit room and invite your team members."
          maxWidth="md"
        >
          <div className="space-y-4 pt-1">
            <Input
              label="Meeting Topic"
              value={meetingTitle}
              onChange={e => setMeetingTitle(e.target.value)}
              placeholder="e.g. Design critique or Sprint planning"
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Waiting Room</p>
                    <p className="text-[11px] text-slate-500">Host must approve guests before they enter</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={waitingRoom}
                  onChange={e => setWaitingRoom(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="border-t border-slate-200/60 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Passcode Protection</p>
                      <p className="text-[11px] text-slate-500">Require participants to enter a password</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasPassword}
                    onChange={e => setHasPassword(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                {hasPassword && (
                  <Input
                    placeholder="Enter meeting passcode"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="mt-2 text-xs"
                  />
                )}
              </div>
            </div>

            {createdMeetingUrl ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                  <span className="truncate flex-1 font-mono text-blue-900">{createdMeetingUrl}</span>
                  <Button size="sm" variant="secondary" onClick={handleCopy}>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => router.push(createdMeetingUrl)}
                >
                  Enter Room
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsInstantModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isLoading={isCreating}
                  onClick={handleCreateAndStartMeeting}
                >
                  <Video className="w-4 h-4" />
                  <span>Start Meeting</span>
                </Button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AuthGuard>
  );
}
