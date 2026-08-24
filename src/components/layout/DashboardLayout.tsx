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
import { api } from "@/lib/api";
import {
  Video,
  ShieldCheck,
  Lock,
  MicOff,
  VideoOff,
  Users,
  Sparkles,
  Crown,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isVoiceLocked, setIsVoiceLocked] = useState(false);
  const [isVideoLocked, setIsVideoLocked] = useState(false);
  const [onlyShowHost, setOnlyShowHost] = useState(true);
  const [showCommentPopup, setShowCommentPopup] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [fakeUserCount, setFakeUserCount] = useState(200);
  const [enableBooster, setEnableBooster] = useState(true);
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
      const res = await api.createMeeting({
        title: meetingTitle || `${user.name}'s Meeting`,
        hostId: user.id,
        hostName: user.name,
        passcode: hasPassword ? password : "",
        isVoiceLocked,
        isVideoLocked,
        onlyShowHost,
        showCommentPopup,
        isChatLocked,
        isWebinar: isVoiceLocked && isVideoLocked,
        fakeUserCount: enableBooster ? fakeUserCount : 0,
      });

      if (res.success && res.meeting) {
        const url = `${window.location.origin}/meeting/${res.meeting.id}`;
        setCreatedMeetingUrl(url);
        // Navigate immediately
        router.push(`/meeting/${res.meeting.id}`);
      }
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
      <div className="min-h-screen bg-[#F5F6F8]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-72 flex flex-col min-h-screen">
          <Header
            title={title}
            subtitle={subtitle}
            onMenuClick={() => setSidebarOpen(true)}
            onNewMeeting={handleOpenInstantMeetingModal}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Quick Instant Meeting Modal */}
        <Modal
          isOpen={isInstantModalOpen}
          onClose={() => setIsInstantModalOpen(false)}
          title="Create Meeting or Webinar"
          description="Configure webinar locks and simulated social proof before launching."
          maxWidth="lg"
        >
          <div className="space-y-4 pt-1">
            <Input
              label="Meeting / Webinar Title"
              value={meetingTitle}
              onChange={e => setMeetingTitle(e.target.value)}
              placeholder="e.g. Executive Product Launch Webinar"
            />

            {/* Webinar & Security Controls */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3.5">
              {/* Voice Lock */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                    <MicOff className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">Voice Lock (Mute Attendees)</p>
                    <p className="text-[11px] text-slate-500">Only host & co-hosts can speak. Attendees cannot unmute.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isVoiceLocked}
                  onChange={e => setIsVoiceLocked(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Video Lock */}
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <VideoOff className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">Video Lock (Disable Cameras)</p>
                    <p className="text-[11px] text-slate-500">Attendees cannot broadcast video. Preserves bandwidth.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isVideoLocked}
                  onChange={e => setIsVideoLocked(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Show Only Admin Screen Stage Mode (Default: Checked) */}
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">Show Only Admin Screen (Default)</p>
                    <p className="text-[11px] text-slate-500">Only Admin screen fills the stage for everyone (like screen share). Uncheck to show all cameras.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={onlyShowHost}
                  onChange={e => setOnlyShowHost(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Show Comment Popups on Screen (Default: Hidden) */}
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">Show Comment Popups on Screen</p>
                    <p className="text-[11px] text-slate-500">Incoming comments appear for 2 seconds on screen. Default: Hidden.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showCommentPopup}
                  onChange={e => setShowCommentPopup(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Chat / Comment Lock */}
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">Chat / Comment Lock</p>
                    <p className="text-[11px] text-slate-500">Mute comments for attendees. Only host can send messages.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isChatLocked}
                  onChange={e => setIsChatLocked(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Webinar Social Proof Booster (fuser) */}
              <div className="border-t border-slate-200/60 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">Webinar Social Proof Booster (fuser)</p>
                      <p className="text-[11px] text-slate-500">Simulates active Indian attendees to build enterprise authority</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableBooster}
                    onChange={e => setEnableBooster(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {enableBooster && (
                  <div className="mt-2.5 pl-11 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={fakeUserCount}
                        onChange={e => setFakeUserCount(parseInt(e.target.value, 10) || 0)}
                        className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                      <div className="flex gap-1.5">
                        {[50, 100, 200, 500].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setFakeUserCount(cnt)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                              fakeUserCount === cnt
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            +{cnt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-indigo-600 font-medium">
                      💡 {fakeUserCount} authentic Indian names will automatically populate attendees list & total count
                    </p>
                  </div>
                )}
              </div>

              {/* Passcode Protection */}
              <div className="border-t border-slate-200/60 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">Passcode Protection</p>
                      <p className="text-[11px] text-slate-500">Require participants to enter a password</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasPassword}
                    onChange={e => setHasPassword(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs sm:text-sm">
                  <span className="truncate flex-1 font-mono text-indigo-900">{createdMeetingUrl}</span>
                  <Button size="sm" variant="secondary" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <Button
                  variant="primary"
                  className="w-full h-11 text-sm font-bold bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => router.push(createdMeetingUrl)}
                >
                  Enter Room
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsInstantModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isCreating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  onClick={handleCreateAndStartMeeting}
                >
                  <Video className="w-4 h-4 mr-1.5" />
                  <span>Launch Meeting</span>
                </Button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AuthGuard>
  );
}
