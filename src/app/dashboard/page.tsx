"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, Avatar } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { meetingService } from "@/lib/services";
import { Meeting } from "@/types";
import { formatScheduledDate } from "@/lib/utils";
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
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    hoursSpent: 0,
    upcomingCount: 0,
    totalParticipants: 0,
  });

  const loadData = async () => {
    try {
      const upcoming = await meetingService.getUpcomingMeetings();
      const past = await meetingService.getPastMeetings();
      setUpcomingMeetings(upcoming);
      setPastMeetings(past);

      const total = upcoming.length + past.length;
      let totalMinutes = 0;
      past.forEach(m => {
        totalMinutes += m.durationMinutes || 45;
      });
      const hours = Math.round((totalMinutes / 60) * 10) / 10;

      setStats({
        totalMeetings: total,
        hoursSpent: hours,
        upcomingCount: upcoming.length,
        totalParticipants: total * 3 + 12,
      });
    } catch (e) {
      console.error("Error loading dashboard data", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteMeeting = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this meeting?")) {
      await meetingService.deleteMeeting(id);
      loadData();
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DashboardLayout
      title={`${getGreeting()}, ${user?.name || "Member"}`}
      subtitle="Your executive video conferencing center with LiveKit cloud streaming."
    >
      <div className="space-y-8">
        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* New Instant Meeting */}
          <div
            onClick={async () => {
              if (!user) return;
              const meeting = await meetingService.createMeeting({
                title: `${user.name}'s Instant Meeting`,
                hostId: user.id,
                hostName: user.name,
                hostEmail: user.email,
              });
              router.push(`/meeting/${meeting.meetingId}`);
            }}
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
              Launch a room with sub-50ms latency and connect instantly
            </p>
          </div>

          {/* Join Meeting */}
          <Link
            href="/join"
            className="group block rounded-2xl border-2 border-slate-200/90 bg-white p-6 transition-all duration-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Users className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Join with Meeting ID</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Enter using a 9-digit code, room pass, or invite link
            </p>
          </Link>

          {/* Schedule Meeting */}
          <Link
            href="/schedule"
            className="group block rounded-2xl border-2 border-slate-200/90 bg-white p-6 transition-all duration-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Calendar className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Schedule Conference</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Set calendar dates, waiting rooms, and invitations
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
                <p className="text-xs sm:text-sm font-medium text-slate-500">Total Calls</p>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900">{stats.totalMeetings}</h4>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-2 border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Call Hours</p>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900">{stats.hoursSpent}h</h4>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-2 border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Upcoming</p>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900">{stats.upcomingCount}</h4>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-2 border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Attendees</p>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900">{stats.totalParticipants}</h4>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Meetings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Upcoming Conferences
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Scheduled meetings waiting for you and your team
              </p>
            </div>
            <Link href="/schedule">
              <Button size="sm" variant="outline" className="h-10 text-xs sm:text-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Schedule New</span>
              </Button>
            </Link>
          </div>

          {upcomingMeetings.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-14 text-center border-2 border-dashed border-slate-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                <Calendar className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No conferences scheduled</h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 leading-relaxed">
                You have no upcoming sessions. You can launch an instant room or plan a future conference.
              </p>
              <div className="mt-5 flex gap-3">
                <Link href="/schedule">
                  <Button size="md" variant="primary">Schedule a Meeting</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcomingMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  onClick={() => router.push(`/meeting/${meeting.meetingId}`)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border-2 border-slate-200/90 bg-white p-5 sm:p-6 transition-all hover:border-indigo-400 hover:shadow-md cursor-pointer gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                      <Video className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base sm:text-lg text-slate-900 truncate">
                          {meeting.title}
                        </h4>
                        {meeting.waitingRoomEnabled && (
                          <Badge variant="warning" size="md">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                            Waiting Room
                          </Badge>
                        )}
                        {meeting.passwordEnabled && (
                          <Badge variant="secondary" size="md">
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Passcode
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 flex-wrap">
                        <span className="font-semibold text-slate-700">
                          {formatScheduledDate(meeting.scheduledAt || meeting.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{meeting.durationMinutes || 45} mins</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500 font-medium">Room ID: {meeting.meetingId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 text-xs sm:text-sm"
                      onClick={e => handleCopyLink(meeting.meetingId, e)}
                    >
                      {copiedId === meeting.meetingId ? (
                        <Check className="w-4 h-4 text-emerald-600 mr-1" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-500 mr-1" />
                      )}
                      <span>{copiedId === meeting.meetingId ? "Copied" : "Copy Link"}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      className="h-10 px-4 text-xs sm:text-sm font-bold shadow-sm"
                      onClick={e => {
                        e.stopPropagation();
                        router.push(`/meeting/${meeting.meetingId}`);
                      }}
                    >
                      <Play className="w-4 h-4 mr-1.5" />
                      <span>Start Meeting</span>
                    </Button>

                    <button
                      onClick={e => handleDeleteMeeting(meeting.id, e)}
                      title="Delete meeting"
                      className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Past Meetings Table */}
        {pastMeetings.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Past Conferences
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Review history and recordings of previous calls
                </p>
              </div>
              <Link href="/meetings" className="text-sm font-bold text-indigo-600 hover:underline">
                View all meetings →
              </Link>
            </div>

            <div className="rounded-2xl border-2 border-slate-200/90 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50/90 font-bold text-slate-800">
                    <tr>
                      <th className="py-4 px-5">Topic</th>
                      <th className="py-4 px-5">Room ID</th>
                      <th className="py-4 px-5">Host</th>
                      <th className="py-4 px-5">Date</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastMeetings.slice(0, 5).map(m => (
                      <tr key={m.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-900">
                          {m.title}
                        </td>
                        <td className="py-4 px-5 font-mono text-slate-500 font-medium">
                          {m.meetingId}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={m.hostName || "Host"} size="sm" />
                            <span className="font-medium text-slate-800">{m.hostName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-slate-500">
                          {new Date(m.endedAt || m.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-4 px-5">
                          <Badge variant="secondary" size="md">Ended</Badge>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold"
                            onClick={() => router.push(`/meeting/${m.meetingId}`)}
                          >
                            Re-join
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
