"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { meetingService } from "@/lib/services";
import { Meeting } from "@/types";
import {
  Calendar,
  Clock,
  ShieldCheck,
  Lock,
  Radio,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function SchedulePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(45);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  const [waitingRoom, setWaitingRoom] = useState(true);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [allowBeforeHost, setAllowBeforeHost] = useState(true);
  const [autoRecord, setAutoRecord] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [scheduledMeeting, setScheduledMeeting] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      const scheduledDateTime = new Date(`${date}T${time}:00`).toISOString();

      const created = await meetingService.createMeeting({
        title: title || `${user.name}'s Scheduled Conference`,
        description,
        hostId: user.id,
        hostName: user.name,
        hostEmail: user.email,
        scheduledAt: scheduledDateTime,
        durationMinutes: duration,
        waitingRoomEnabled: waitingRoom,
        passwordEnabled: passwordEnabled,
        password: passwordEnabled ? password : undefined,
        allowBeforeHost,
        autoRecord,
      });

      setScheduledMeeting(created);
    } catch (err) {
      console.error("Failed to schedule meeting", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMeetingUrl = () => {
    if (!scheduledMeeting) return "";
    return `${window.location.origin}/meeting/${scheduledMeeting.meetingId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getMeetingUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout
      title="Schedule a Meeting"
      subtitle="Plan conferences in advance, configure participant controls, and share invitations."
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
            <CardDescription>
              Set the topic, schedule date/time, and customize conference options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input
                  label="Topic / Title"
                  placeholder="e.g. Q4 Executive Planning Sync"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add an agenda, meeting notes, or pre-read materials for attendees..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              {/* Date, Time, Duration Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2 border-t border-slate-100">
                <Input
                  label="Date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />

                <Input
                  label="Start Time"
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              {/* Security & Access Controls */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Security & Access Options
                </h4>

                <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                  {/* Waiting Room */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/60 text-blue-700">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Waiting Room</p>
                        <p className="text-[11px] text-slate-500">
                          Participants are placed in a waiting lobby until admitted by host
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={waitingRoom}
                      onChange={e => setWaitingRoom(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  {/* Passcode Protection */}
                  <div className="border-t border-slate-200/70 pt-3">
                    <label className="flex items-center justify-between cursor-pointer mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100/60 text-indigo-700">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Passcode Protection</p>
                          <p className="text-[11px] text-slate-500">
                            Only users with the passcode can enter
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={passwordEnabled}
                        onChange={e => setPasswordEnabled(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    {passwordEnabled && (
                      <div className="pl-11 pt-1">
                        <Input
                          placeholder="e.g. infi-secure-99"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="text-xs"
                          required={passwordEnabled}
                        />
                      </div>
                    )}
                  </div>

                  {/* Allow Before Host */}
                  <div className="border-t border-slate-200/70 pt-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100/60 text-amber-700">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Allow join before host</p>
                          <p className="text-[11px] text-slate-500">
                            Allow guests to join audio/video before the meeting creator arrives
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowBeforeHost}
                        onChange={e => setAllowBeforeHost(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>

                  {/* Auto Record */}
                  <div className="border-t border-slate-200/70 pt-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100/60 text-rose-700">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Automatic Recording UI</p>
                          <p className="text-[11px] text-slate-500">
                            Automatically initiate cloud recording session when meeting starts
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoRecord}
                        onChange={e => setAutoRecord(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  <Calendar className="w-4 h-4" />
                  <span>Save & Schedule</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Success Modal */}
        {scheduledMeeting && (
          <Modal
            isOpen={!!scheduledMeeting}
            onClose={() => {
              setScheduledMeeting(null);
              router.push("/meetings");
            }}
            title="Meeting Successfully Scheduled!"
            description="Your meeting has been created. Share the invitation details with your attendees."
            maxWidth="md"
          >
            <div className="space-y-4 pt-1">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Topic: </span>
                  <span className="text-slate-900 font-bold">{scheduledMeeting.title}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Date & Time: </span>
                  <span className="text-slate-900">{new Date(scheduledMeeting.scheduledAt || "").toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Meeting ID: </span>
                  <span className="font-mono text-blue-700 font-bold">{scheduledMeeting.meetingId}</span>
                </div>
                {scheduledMeeting.password && (
                  <div>
                    <span className="font-semibold text-slate-700">Passcode: </span>
                    <span className="font-mono text-slate-900">{scheduledMeeting.password}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                <span className="truncate flex-1 font-mono text-blue-900">{getMeetingUrl()}</span>
                <Button size="sm" variant="secondary" onClick={handleCopyLink}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Link"}
                </Button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/meetings")}
                >
                  View All Meetings
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push(`/meeting/${scheduledMeeting.meetingId}`)}
                >
                  <span>Start Now</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
