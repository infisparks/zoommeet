import { Meeting, MeetingStatus } from "@/types";
import { CreateMeetingInput, MeetingRepository } from "./MeetingRepository";

const STORAGE_KEY = "infiplus_meetings_v1";

function generateFriendlyMeetingId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const part = (len: number) => {
    let res = "";
    for (let i = 0; i < len; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  };
  return `${part(3)}-${part(4)}-${part(3)}`;
}

const DEFAULT_MEETINGS: Meeting[] = [
  {
    id: "meet-demo-1",
    meetingId: "prd-sync-eng",
    roomName: "prd-sync-eng",
    title: "Weekly Product & Engineering Sync",
    description: "Review sprint goals, architectural updates, and release pipeline.",
    hostId: "user-demo-1",
    hostName: "Alex Morgan",
    hostEmail: "alex@infiplus.in",
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 45,
    waitingRoomEnabled: true,
    passwordEnabled: false,
    allowBeforeHost: true,
    autoRecord: false,
    maxParticipants: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: "meet-demo-2",
    meetingId: "des-rev-ui",
    roomName: "des-rev-ui",
    title: "Infiplus Design System Critique",
    description: "Figma walkthrough for the meeting room floating control bar and layout grids.",
    hostId: "user-demo-1",
    hostName: "Alex Morgan",
    hostEmail: "alex@infiplus.in",
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    waitingRoomEnabled: false,
    passwordEnabled: true,
    password: "design-secret",
    allowBeforeHost: false,
    autoRecord: true,
    maxParticipants: 25,
    createdAt: new Date().toISOString(),
  },
  {
    id: "meet-demo-3",
    meetingId: "arch-perf-qa",
    roomName: "arch-perf-qa",
    title: "WebRTC Load Testing Retrospective",
    description: "Post-incident analysis and real-time livekit stream benchmark results.",
    hostId: "user-demo-1",
    hostName: "Alex Morgan",
    hostEmail: "alex@infiplus.in",
    status: "ended",
    scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    waitingRoomEnabled: false,
    passwordEnabled: false,
    allowBeforeHost: true,
    autoRecord: true,
    maxParticipants: 100,
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
  }
];

export class LocalMeetingRepository implements MeetingRepository {
  private getStorage(): Meeting[] {
    if (typeof window === "undefined") return DEFAULT_MEETINGS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEETINGS));
      return DEFAULT_MEETINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_MEETINGS;
    }
  }

  private saveStorage(meetings: Meeting[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  }

  async createMeeting(input: CreateMeetingInput): Promise<Meeting> {
    const meetings = this.getStorage();
    const meetingId = generateFriendlyMeetingId();
    const newMeeting: Meeting = {
      id: "meet-" + Math.random().toString(36).substring(2, 9),
      meetingId,
      roomName: meetingId,
      title: input.title || `${input.hostName}'s Meeting`,
      description: input.description || "",
      hostId: input.hostId,
      hostName: input.hostName,
      hostEmail: input.hostEmail,
      status: input.scheduledAt ? "scheduled" : "live",
      scheduledAt: input.scheduledAt || new Date().toISOString(),
      startedAt: input.scheduledAt ? undefined : new Date().toISOString(),
      durationMinutes: input.durationMinutes || 45,
      waitingRoomEnabled: input.waitingRoomEnabled ?? false,
      passwordEnabled: input.passwordEnabled ?? false,
      password: input.password || "",
      allowBeforeHost: input.allowBeforeHost ?? true,
      autoRecord: input.autoRecord ?? false,
      maxParticipants: input.maxParticipants || 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    meetings.unshift(newMeeting);
    this.saveStorage(meetings);
    return newMeeting;
  }

  async getMeeting(idOrMeetingId: string): Promise<Meeting | null> {
    const meetings = this.getStorage();
    return meetings.find(m => m.id === idOrMeetingId || m.meetingId.toLowerCase() === idOrMeetingId.toLowerCase() || m.roomName === idOrMeetingId) || null;
  }

  async getMeetingByRoomName(roomName: string): Promise<Meeting | null> {
    const meetings = this.getStorage();
    return meetings.find(m => m.roomName.toLowerCase() === roomName.toLowerCase() || m.meetingId.toLowerCase() === roomName.toLowerCase()) || null;
  }

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
    const meetings = this.getStorage();
    const index = meetings.findIndex(m => m.id === id || m.meetingId === id);
    if (index === -1) throw new Error("Meeting not found");
    meetings[index] = { ...meetings[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveStorage(meetings);
    return meetings[index];
  }

  async updateStatus(id: string, status: MeetingStatus): Promise<Meeting> {
    const updates: Partial<Meeting> = { status };
    if (status === "live") updates.startedAt = new Date().toISOString();
    if (status === "ended") updates.endedAt = new Date().toISOString();
    return this.updateMeeting(id, updates);
  }

  async deleteMeeting(id: string): Promise<boolean> {
    const meetings = this.getStorage();
    const filtered = meetings.filter(m => m.id !== id && m.meetingId !== id);
    this.saveStorage(filtered);
    return filtered.length !== meetings.length;
  }

  async getMeetings(hostId?: string): Promise<Meeting[]> {
    const meetings = this.getStorage();
    if (!hostId) return meetings;
    return meetings.filter(m => m.hostId === hostId);
  }

  async getUpcomingMeetings(hostId?: string): Promise<Meeting[]> {
    const meetings = await this.getMeetings(hostId);
    return meetings
      .filter(m => m.status === "scheduled" || m.status === "live")
      .sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime());
  }

  async getPastMeetings(hostId?: string): Promise<Meeting[]> {
    const meetings = await this.getMeetings(hostId);
    return meetings
      .filter(m => m.status === "ended" || m.status === "cancelled")
      .sort((a, b) => new Date(b.endedAt || b.createdAt).getTime() - new Date(a.endedAt || a.createdAt).getTime());
  }
}
