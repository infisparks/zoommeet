"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { api, MeetingData } from "@/lib/api";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
  Play,
  Lock,
  Trash2,
  Sparkles,
  MicOff,
  VideoOff,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await api.getMeetings(user.id);
      setMeetings(data);
    } catch (e) {
      console.error("Error loading dashboard meetings from Firebase:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleStartInstant = async (isWebinar = false) => {
    if (!user || isCreatingInstant) return;
    setIsCreatingInstant(true);
    try {
      const res = await api.createMeeting({
        title: isWebinar ? `${user.name}'s Live Webinar` : `${user.name}'s Meeting`,
        hostId: user.id,
        hostName: user.name,
        isVoiceLocked: isWebinar,
        isVideoLocked: isWebinar,
        isWebinar,
        fakeUserCount: 200, // 200 simulated Indian attendees by default
      });

      if (res.success && res.meeting) {
        router.push(`/meeting/${res.meeting.id}`);
      }
    } catch (err) {
      console.error("Failed to start instant room:", err);
    } finally {
      setIsCreatingInstant(false);
    }
  };

  const handleCopyLink = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DashboardLayout
      title={`${getGreeting()}, ${user?.name || "Administrator"}`}
      subtitle="Executive video conferencing & webinar management powered by Firebase & LiveKit."
    >
      <div className="space-y-8">
        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* New Instant Meeting */}
          <div
            onClick={() => handleStartInstant(false)}
            className="group cursor-pointer rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white transition-all duration-200 hover:shadow-xl hover:shadow-indigo-600/25 hover:scale-[1.01] active:scale-[0.99] shadow-md border border-white/15"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
                <Video className="h-6 w-6 text-white" />
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 group-hover:bg-white/30 transition-colors">
                <Plus className="h-5 w-5" />
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">New Instant Meeting</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-normal">
              Launch an interactive room with 200 simulated attendees & sub-50ms latency
            </p>
          </div>

          {/* Start Live Webinar (Voice & Video Locked) */}
          <div
            onClick={() => handleStartInstant(true)}
            className="group cursor-pointer rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white transition-all duration-200 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-[1.01] active:scale-[0.99] shadow-md border border-indigo-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                <Lock className="w-3 h-3" /> Voice & Video Locked
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">Start Live Webinar</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Attendees are muted with cameras locked. Perfect for presentations & broadcasts
            </p>
          </div>

          {/* Schedule Meeting */}
          <Link
            href="/schedule"
            className="group block rounded-2xl border-2 border-slate-200/90 bg-white p-6 transition-all duration-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Calendar className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Schedule Conference</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Plan dates, configure security passcode, and setup social proof
            </p>
          </Link>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 border-2 border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Total Rooms</p>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900">{meetings.length}</h4>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-2 border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Status</p>
                <h4 className="text-xl sm:text-2xl font-bold text-emerald-600">Firebase Live</h4>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-2 border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Booster Active</p>
                <h4 className="text-xl sm:text-2xl font-bold text-amber-600">1,000+ FUsers</h4>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-2 border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Engine</p>
                <h4 className="text-xl sm:text-2xl font-bold text-purple-600">LiveKit SFU</h4>
              </div>
            </div>
          </Card>
        </div>

        {/* Meetings List Section from Firebase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Firebase Realtime Database Meetings
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Active & scheduled meetings saved on meets.infiplus.in
              </p>
            </div>
          </div>

          {meetings.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-14 text-center border-2 border-dashed border-slate-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                <Calendar className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No meetings recorded in Firebase</h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 leading-relaxed">
                Click &quot;New Instant Meeting&quot; or &quot;Start Live Webinar&quot; to launch your first session.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.map(m => (
                <Card
                  key={m.id}
                  className="p-5 hover:border-indigo-400 transition-all border-2 border-slate-200/80 cursor-pointer group"
                  onClick={() => router.push(`/meeting/${m.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {m.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        Room ID: <span className="text-indigo-600 font-semibold">{m.id}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {m.isVoiceLocked && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100" title="Voice Locked">
                          <MicOff className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {m.isVideoLocked && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100" title="Video Locked">
                          <VideoOff className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {m.fakeUserCount ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200">
                          <Sparkles className="w-3 h-3" /> +{m.fakeUserCount}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={e => handleCopyLink(m.id, e)}
                      className="text-xs h-8"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                      <span>Join Room</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
