import { MeetingHistoryEvent } from "@/types";

export interface HistoryRepository {
  getEvents(meetingId: string): Promise<MeetingHistoryEvent[]>;
  logEvent(event: Omit<MeetingHistoryEvent, "id" | "timestamp">): Promise<MeetingHistoryEvent>;
}

const STORAGE_PREFIX = "infiplus_history_";

export class LocalHistoryRepository implements HistoryRepository {
  private getKey(meetingId: string): string {
    return `${STORAGE_PREFIX}${meetingId}`;
  }

  async getEvents(meetingId: string): Promise<MeetingHistoryEvent[]> {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(this.getKey(meetingId));
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async logEvent(data: Omit<MeetingHistoryEvent, "id" | "timestamp">): Promise<MeetingHistoryEvent> {
    const list = await this.getEvents(data.meetingId);
    const newEvent: MeetingHistoryEvent = {
      ...data,
      id: "evt-" + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    list.push(newEvent);
    if (typeof window !== "undefined") {
      localStorage.setItem(this.getKey(data.meetingId), JSON.stringify(list));
    }
    return newEvent;
  }
}
