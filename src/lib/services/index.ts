import { LocalUserRepository } from "@/lib/repositories/LocalUserRepository";
import { LocalMeetingRepository } from "@/lib/repositories/LocalMeetingRepository";
import { LocalChatRepository } from "@/lib/repositories/ChatRepository";
import { LocalContactRepository } from "@/lib/repositories/ContactRepository";
import { LocalRecordingRepository } from "@/lib/repositories/RecordingRepository";
import { LocalHistoryRepository } from "@/lib/repositories/HistoryRepository";
import { LocalSettingsRepository } from "@/lib/repositories/SettingsRepository";

import { User, Meeting, ChatMessage, Contact, Recording, MeetingHistoryEvent, UserSettings } from "@/types";
import { CreateMeetingInput } from "@/lib/repositories/MeetingRepository";

// Repository Singletons (Swappable with SupabaseRepository implementations later)
export const userRepository = new LocalUserRepository();
export const meetingRepository = new LocalMeetingRepository();
export const chatRepository = new LocalChatRepository();
export const contactRepository = new LocalContactRepository();
export const recordingRepository = new LocalRecordingRepository();
export const historyRepository = new LocalHistoryRepository();
export const settingsRepository = new LocalSettingsRepository();

// High level Services
export const meetingService = {
  createMeeting: (input: CreateMeetingInput) => meetingRepository.createMeeting(input),
  getMeeting: (id: string) => meetingRepository.getMeeting(id),
  getMeetingByRoomName: (room: string) => meetingRepository.getMeetingByRoomName(room),
  updateMeeting: (id: string, updates: Partial<Meeting>) => meetingRepository.updateMeeting(id, updates),
  updateStatus: (id: string, status: Meeting["status"]) => meetingRepository.updateStatus(id, status),
  deleteMeeting: (id: string) => meetingRepository.deleteMeeting(id),
  getMeetings: (hostId?: string) => meetingRepository.getMeetings(hostId),
  getUpcomingMeetings: (hostId?: string) => meetingRepository.getUpcomingMeetings(hostId),
  getPastMeetings: (hostId?: string) => meetingRepository.getPastMeetings(hostId),
};

export const chatService = {
  getMessages: (meetingId: string) => chatRepository.getMessages(meetingId),
  saveMessage: (msg: Omit<ChatMessage, "id" | "timestamp"> & { timestamp?: number }) => chatRepository.saveMessage(msg),
  clearMessages: (meetingId: string) => chatRepository.clearMessages(meetingId),
};

export const contactService = {
  getContacts: () => contactRepository.getContacts(),
  getContactById: (id: string) => contactRepository.getContactById(id),
  createContact: (data: Omit<Contact, "id" | "createdAt">) => contactRepository.createContact(data),
  updateContact: (id: string, updates: Partial<Contact>) => contactRepository.updateContact(id, updates),
  deleteContact: (id: string) => contactRepository.deleteContact(id),
  searchContacts: (query: string) => contactRepository.searchContacts(query),
};

export const recordingService = {
  getRecordings: (hostId?: string) => recordingRepository.getRecordings(hostId),
  getRecordingById: (id: string) => recordingRepository.getRecordingById(id),
  createRecording: (data: Omit<Recording, "id" | "createdAt">) => recordingRepository.createRecording(data),
  deleteRecording: (id: string) => recordingRepository.deleteRecording(id),
};

export const meetingHistoryService = {
  getEvents: (meetingId: string) => historyRepository.getEvents(meetingId),
  logEvent: (event: Omit<MeetingHistoryEvent, "id" | "timestamp">) => historyRepository.logEvent(event),
};

export const settingsService = {
  getSettings: () => settingsRepository.getSettings(),
  saveSettings: (updates: Partial<UserSettings>) => settingsRepository.saveSettings(updates),
};
