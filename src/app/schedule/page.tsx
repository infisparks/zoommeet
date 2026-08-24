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
  const [timezone, setTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC"
  );

  const [waitingRoom, setWaitingRoom] = useState(true);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [allowBeforeHost, setAllowBeforeHost] = useState(true);
  const [onlyShowHost, setOnlyShowHost] = useState(true);
  const [showCommentPopup, setShowCommentPopup] = useState(false);
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
        onlyShowHost,
        showCommentPopup,
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
      title="Schedule a Conference"
      subtitle="Plan meetings in advance, configure participant moderation, and copy invitations."
    >
      <div className="max-w-3xl mx-auto space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Basic Info */}
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Basic Information</h3>
              <p className="text-xs text-slate-500">Provide the title and schedule for this conference.</p>
            </div>

            <Input
              label="Meeting Topic *"
              placeholder="e.g. Weekly Product Strategy Sync"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Agenda / Description
              </label>
              <textarea
                placeholder="Add meeting agenda, discussion topics, or notes..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Date *"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />

              <Input
                label="Start Time *"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Duration (Minutes)
                </label>
                <select
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Timezone
                </label>
                <input
                  type="text"
                  readOnly
                  value={timezone}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 font-mono"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Security & Permissions */}
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security & Host Moderation</h3>
              <p className="text-xs text-slate-500">Configure participant admission controls and room security.</p>
            </div>

            <div className="space-y-3">
              {/* Waiting Room */}
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waitingRoom}
                  onChange={e => setWaitingRoom(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Enable Waiting Room</p>
                  <p className="text-[11px] text-slate-500">
                    Host must manually admit participants before they enter the meeting stream.
                  </p>
                </div>
              </label>

              {/* Passcode Protection */}
              <div className="rounded-lg border border-slate-200 p-3 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passwordEnabled}
                    onChange={e => setPasswordEnabled(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Require Meeting Passcode</p>
                    <p className="text-[11px] text-slate-500">
                      Attendees will be prompted for this secret password before joining.
                    </p>
                  </div>
                </label>

                {passwordEnabled && (
                  <div className="pt-1 pl-7">
                    <Input
                      placeholder="Enter 4-8 character passcode..."
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required={passwordEnabled}
                    />
                  </div>
                )}
              </div>

              {/* Allow Join Before Host */}
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBeforeHost}
                  onChange={e => setAllowBeforeHost(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Allow Attendees to Join Before Host</p>
                  <p className="text-[11px] text-slate-500">
                    Participants can enter the room and talk before the scheduled host arrives.
                  </p>
                </div>
              </label>

              {/* Show Only Admin Screen Stage Mode (Default: Checked) */}
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyShowHost}
                  onChange={e => setOnlyShowHost(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Show Only Admin Screen (Default: Checked)</p>
                  <p className="text-[11px] text-slate-500">
                    When checked, only Admin screen fills the stage for everyone (like screen share). Uncheck to allow all participants to see all screens in a grid.
                  </p>
                </div>
              </label>

              {/* Show Comment Popups on Screen (Default: Hidden) */}
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCommentPopup}
                  onChange={e => setShowCommentPopup(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Show Comment Popups on Screen (Default: Hidden)</p>
                  <p className="text-[11px] text-slate-500">
                    When enabled (unhidden), incoming chat comments appear as a 2-second popup on screen. Default: Hidden.
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              <span>Schedule Meeting</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {scheduledMeeting && (
        <Modal
          isOpen={true}
          onClose={() => {
            setScheduledMeeting(null);
            router.push("/meetings");
          }}
          title="Meeting Successfully Scheduled"
        >
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-indigo-50/80 border border-indigo-100 p-4">
              <h4 className="font-bold text-sm text-indigo-950">
                {scheduledMeeting.title}
              </h4>
              <p className="text-xs text-indigo-700 mt-1 font-mono">
                Meeting ID: {scheduledMeeting.meetingId}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Shareable Meeting URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getMeetingUrl()}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 select-all"
                />
                <Button size="sm" variant="primary" onClick={handleCopyLink}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setScheduledMeeting(null);
                  router.push("/meetings");
                }}
              >
                Go to Meetings
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/meeting/${scheduledMeeting.meetingId}`)}
              >
                <span>Enter Room Now</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
