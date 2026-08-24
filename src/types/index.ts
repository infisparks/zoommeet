export type UserRole = "host" | "co-host" | "participant" | "waiting";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  company?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled";

export interface Meeting {
  id: string;
  meetingId: string; // e.g. "abc-defg-hij"
  roomName: string;  // LiveKit room name
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  status: MeetingStatus;
  scheduledAt?: string; // ISO date string
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  waitingRoomEnabled: boolean;
  passwordEnabled: boolean;
  password?: string;
  allowBeforeHost?: boolean;
  autoRecord?: boolean;
  maxParticipants?: number;
  onlyShowHost?: boolean;
  showCommentPopup?: boolean;
  fakeUserCount?: number;
  isVoiceLocked?: boolean;
  isVideoLocked?: boolean;
  isChatLocked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatInteractiveCard {
  title?: string;
  priceTag?: string;
  buttonText: string;
  buttonUrl: string;
  badge?: string;
}

export interface ChatMessage {
  id: string;
  meetingId: string;
  participantId: string;
  participantName: string;
  message: string;
  timestamp: number;
  isPrivate?: boolean;
  recipientId?: string;
  senderAvatar?: string;
  interactiveCard?: ChatInteractiveCard;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  department?: string;
  company?: string;
  status?: "online" | "offline" | "in-meeting" | "busy";
  lastSeen?: string;
  createdAt: string;
}

export type RecordingStatus = "processing" | "ready" | "failed";

export interface Recording {
  id: string;
  meetingId: string;
  meetingTitle: string;
  durationSeconds: number;
  sizeBytes: number;
  downloadUrl?: string;
  thumbnailUrl?: string;
  status: RecordingStatus;
  createdAt: string;
  hostId: string;
}

export type HistoryEventType = 
  | "meeting_started" 
  | "meeting_ended" 
  | "participant_joined" 
  | "participant_left" 
  | "screenshare_started" 
  | "screenshare_ended"
  | "hand_raised"
  | "hand_lowered";

export interface MeetingHistoryEvent {
  id: string;
  meetingId: string;
  eventType: HistoryEventType;
  participantId?: string;
  participantName?: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  defaultMuteMic: boolean;
  defaultMuteCamera: boolean;
  preferredAudioInputId?: string;
  preferredAudioOutputId?: string;
  preferredVideoInputId?: string;
  notificationsEnabled: boolean;
  soundEffectsEnabled: boolean;
  noiseSuppression: boolean;
  mirrorVideo: boolean;
  hdVideo: boolean;
}

export interface TokenRequestPayload {
  roomName: string;
  participantName: string;
  participantIdentity?: string;
  role?: UserRole;
  metadata?: string;
}

export interface TokenResponseData {
  token: string;
  serverUrl: string;
  roomName: string;
  participantIdentity: string;
}

export interface ReactionItem {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
}
