/**
 * Backend API Client for Zoomeet / Infiplus
 * Connects directly to the Node.js backend (meets.infiplus.in)
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://meets.infiplus.in");

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token?: string;
  error?: string;
}

export interface MeetingData {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  passcode?: string;
  isVoiceLocked?: boolean;
  isVideoLocked?: boolean;
  isWebinar?: boolean;
  onlyShowHost?: boolean;
  fakeUserCount?: number;
  createdAt: number;
  scheduledTime?: number;
  status: "active" | "ended";
}

export const api = {
  /**
   * User login against Firebase Realtime Database
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: (err as Error).message || "Cannot reach authentication server" };
    }
  },

  /**
   * Generate LiveKit Token
   */
  async getLiveKitToken(params: {
    roomName: string;
    participantIdentity: string;
    participantName: string;
    isHost?: boolean;
    passcode?: string;
  }) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/livekit/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err) {
      return { error: (err as Error).message || "Cannot connect to LiveKit token server" };
    }
  },

  /**
   * Create Meeting and persist to Firebase RTDB
   */
  async createMeeting(data: Partial<MeetingData>): Promise<{ success: boolean; meeting?: MeetingData; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meetings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: (err as Error).message || "Failed to create meeting" };
    }
  },

  /**
   * Fetch Meetings List from Firebase RTDB
   */
  async getMeetings(hostId?: string): Promise<MeetingData[]> {
    try {
      const url = hostId ? `${BACKEND_URL}/api/meetings?hostId=${hostId}` : `${BACKEND_URL}/api/meetings`;
      const res = await fetch(url);
      const data = await res.json();
      return data.meetings || [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch Meeting Details & Webinar Settings from Firebase RTDB
   */
  async getMeeting(id: string): Promise<MeetingData | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meetings/${id}`);
      const data = await res.json();
      return data.meeting || null;
    } catch {
      return null;
    }
  },

  /**
   * Fetch Simulated Indian Attendees ("fusers" for Webinar Social Proof)
   */
  async getFUsers(meetingId: string, count: number) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meetings/${meetingId}/fusers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      return data.fusers || [];
    } catch {
      return [];
    }
  },

  /**
   * Update Live Meeting Locks & Settings (Host Moderation)
   */
  async updateMeetingLocks(meetingId: string, updates: { isVoiceLocked?: boolean; isVideoLocked?: boolean; onlyShowHost?: boolean; fakeUserCount?: number }) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meetings/${meetingId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },
};
