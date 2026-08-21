"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
      subtitle="Welcome back to your workspace. Here is a snapshot of your video conferencing activity."
    >
      <div className="space-y-8">
        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
                <Video className="h-6 w-6 text-white" />
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <Plus className="h-4 w-4" />
              </span>
            </div>
            <h3 className="text-lg font-bold">New Instant Meeting</h3>
            <p className="mt-1 text-xs text-blue-100/90 leading-relaxed">
              Generate a secure LiveKit room and enter immediately
            </p>
          </div>

          {/* Join Meeting */}
          <Link
            href="/join"
            className="group relative block overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Join a Meeting</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Enter with a Meeting ID, room code, or direct invite link
            </p>
          </Link>

          {/* Schedule Meeting */}
          <Link
            href="/schedule"
            className="group relative block overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Calendar className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Schedule Ahead</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Set calendar dates, waiting rooms, and meeting passcodes
            </p>
          </Link>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Meetings</p>
                <h4 className="text-xl font-bold text-slate-900">{stats.totalMeetings}</h4>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Hours Spent</p>
                <h4 className="text-xl font-bold text-slate-900">{stats.hoursSpent}h</h4>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Upcoming</p>
                <h4 className="text-xl font-bold text-slate-900">{stats.upcomingCount}</h4>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Collaborators</p>
                <h4 className="text-xl font-bold text-slate-900">{stats.totalParticipants}</h4>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Meetings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Meetings</h2>
              <p className="text-xs text-slate-500">Scheduled conferences waiting for your team</p>
            </div>
            <Link href="/schedule">
              <Button size="sm" variant="outline">
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule New</span>
              </Button>
            </Link>
          </div>

          {upcomingMeetings.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No upcoming meetings</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                You don&apos;t have any meetings scheduled. Click below to start an instant meeting or schedule one.
              </p>
              <div className="mt-4 flex gap-2">
                <Link href="/schedule">
                  <Button size="sm" variant="primary">Schedule a Meeting</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {upcomingMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  onClick={() => router.push(`/meeting/${meeting.meetingId}`)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-xs cursor-pointer gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Video className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-slate-900 truncate">
                          {meeting.title}
                        </h4>
                        {meeting.waitingRoomEnabled && (
                          <Badge variant="warning" size="sm">
                            <ShieldAlert className="w-3 h-3" />
                            Waiting Room
                          </Badge>
                        )}
                        {meeting.passwordEnabled && (
                          <Badge variant="secondary" size="sm">
                            <Lock className="w-3 h-3" />
                            Passcode
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="font-medium text-slate-700">
                          {formatScheduledDate(meeting.scheduledAt || meeting.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{meeting.durationMinutes || 45} mins</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">ID: {meeting.meetingId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={e => handleCopyLink(meeting.meetingId, e)}
                    >
                      {copiedId === meeting.meetingId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{copiedId === meeting.meetingId ? "Copied" : "Copy Link"}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={e => {
                        e.stopPropagation();
                        router.push(`/meeting/${meeting.meetingId}`);
                      }}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start</span>
                    </Button>

                    <button
                      onClick={e => handleDeleteMeeting(meeting.id, e)}
                      title="Delete meeting"
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Past Meetings Table / List */}
        {pastMeetings.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Completed Meetings</h2>
                <p className="text-xs text-slate-500">History of your previous calls</p>
              </div>
              <Link href="/meetings" className="text-xs font-semibold text-blue-600 hover:underline">
                View all history →
              </Link>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-100 bg-slate-50/70 font-semibold text-slate-700">
                    <tr>
                      <th className="py-3 px-4">Meeting Topic</th>
                      <th className="py-3 px-4">Meeting ID</th>
                      <th className="py-3 px-4">Host</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastMeetings.slice(0, 5).map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {m.title}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {m.meetingId}
                        </td>
                        <td className="py-3.5 px-4">{m.hostName}</td>
                        <td className="py-3.5 px-4">
                          {new Date(m.endedAt || m.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="secondary">Ended</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
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
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
