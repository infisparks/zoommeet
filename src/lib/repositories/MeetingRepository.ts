import { Meeting, MeetingStatus } from "@/types";

export interface CreateMeetingInput {
  title?: string;
  description?: string;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  waitingRoomEnabled?: boolean;
  passwordEnabled?: boolean;
  password?: string;
  allowBeforeHost?: boolean;
  autoRecord?: boolean;
  maxParticipants?: number;
  onlyShowHost?: boolean;
  showCommentPopup?: boolean;
  fakeUserCount?: number;
  isVoiceLocked?: boolean;
  isVideoLocked?: boolean;
}

export interface MeetingRepository {
  createMeeting(input: CreateMeetingInput): Promise<Meeting>;
  getMeeting(idOrMeetingId: string): Promise<Meeting | null>;
  getMeetingByRoomName(roomName: string): Promise<Meeting | null>;
  updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting>;
  updateStatus(id: string, status: MeetingStatus): Promise<Meeting>;
  deleteMeeting(id: string): Promise<boolean>;
  getMeetings(hostId?: string): Promise<Meeting[]>;
  getUpcomingMeetings(hostId?: string): Promise<Meeting[]>;
  getPastMeetings(hostId?: string): Promise<Meeting[]>;
}
