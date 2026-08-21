"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { meetingService } from "@/lib/services";
import { Meeting } from "@/types";
import { formatScheduledDate } from "@/lib/utils";
import {
  Video,
  Calendar,
  Clock,
  Copy,
  Check,
  Search,
  Plus,
  Play,
  Trash2,
  Lock,
  ShieldCheck,
  Edit2,
} from "lucide-react";

export default function MeetingsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const router = useRouter();

  const loadMeetings = async () => {
    const upcoming = await meetingService.getUpcomingMeetings();
    const past = await meetingService.getPastMeetings();
    setUpcomingMeetings(upcoming);
    setPastMeetings(past);
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleCopy = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this meeting?")) {
      await meetingService.deleteMeeting(id);
      loadMeetings();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMeeting) return;
    await meetingService.updateMeeting(editingMeeting.id, {
      title: editTitle,
    });
    setEditingMeeting(null);
    loadMeetings();
  };

  const currentList = activeTab === "upcoming" ? upcomingMeetings : pastMeetings;
  const filteredList = currentList.filter(
    m =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.meetingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Meetings Directory"
      subtitle="Manage, start, and organize all your upcoming and archived video conferences."
    >
      <div className="space-y-6">
        {/* Controls & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search meetings by topic or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/schedule")}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: "upcoming", label: "Upcoming Meetings", count: upcomingMeetings.length },
            { id: "past", label: "Past / Recorded History", count: pastMeetings.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Meeting Cards List */}
        {filteredList.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Video className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">
              No {activeTab} meetings found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchQuery
                ? "Try searching with a different term."
                : activeTab === "upcoming"
                ? "Schedule your next meeting to see it appear here."
                : "Meetings you host or complete will be archived here."}
            </p>
            {activeTab === "upcoming" && (
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => router.push("/schedule")}
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Meeting</span>
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredList.map(meeting => (
              <div
                key={meeting.id}
                onClick={() => router.push(`/meeting/${meeting.meetingId}`)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-4.5 transition-all hover:border-blue-300 hover:shadow-xs cursor-pointer gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Video className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-slate-900 truncate">
                        {meeting.title}
                      </h4>
                      {meeting.status === "live" && (
                        <Badge variant="success" size="sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Live Now
                        </Badge>
                      )}
                      {meeting.waitingRoomEnabled && (
                        <Badge variant="warning" size="sm">
                          <ShieldCheck className="w-3 h-3" />
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
                    {meeting.description && (
                      <p className="text-xs text-slate-500 truncate max-w-xl mt-0.5">
                        {meeting.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatScheduledDate(meeting.scheduledAt || meeting.createdAt)}
                      </span>
                      <span>•</span>
                      <span>{meeting.durationMinutes || 45} mins</span>
                      <span>•</span>
                      <span>Host: {meeting.hostName}</span>
                      <span>•</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">
                        {meeting.meetingId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={e => handleCopy(meeting.meetingId, e)}
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
                    <span>{activeTab === "upcoming" ? "Start / Join" : "Re-open"}</span>
                  </Button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingMeeting(meeting);
                      setEditTitle(meeting.title);
                    }}
                    title="Edit Meeting"
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={e => handleDelete(meeting.id, e)}
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

        {/* Edit Modal */}
        {editingMeeting && (
          <Modal
            isOpen={!!editingMeeting}
            onClose={() => setEditingMeeting(null)}
            title="Edit Meeting Topic"
            description={`Meeting ID: ${editingMeeting.meetingId}`}
          >
            <div className="space-y-4 pt-1">
              <Input
                label="Meeting Title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingMeeting(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
