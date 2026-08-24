import { ChatMessage } from "@/types";

export interface ChatRepository {
  getMessages(meetingId: string): Promise<ChatMessage[]>;
  saveMessage(message: Omit<ChatMessage, "id" | "timestamp"> & { id?: string; timestamp?: number }): Promise<ChatMessage>;
  clearMessages(meetingId: string): Promise<void>;
}

const STORAGE_PREFIX = "infiplus_chat_";

export class LocalChatRepository implements ChatRepository {
  private getKey(meetingId: string): string {
    return `${STORAGE_PREFIX}${meetingId.toLowerCase().trim()}`;
  }

  async getMessages(meetingId: string): Promise<ChatMessage[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.getKey(meetingId)) || sessionStorage.getItem(this.getKey(meetingId));
      if (!raw) return [];
      const parsed: ChatMessage[] = JSON.parse(raw);
      // Deduplicate by message ID
      const seen = new Set<string>();
      return parsed.filter(m => {
        if (!m || !m.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    } catch {
      return [];
    }
  }

  async saveMessage(msg: Omit<ChatMessage, "id" | "timestamp"> & { id?: string; timestamp?: number }): Promise<ChatMessage> {
    const list = await this.getMessages(msg.meetingId);
    const existingIndex = msg.id ? list.findIndex(m => m.id === msg.id) : -1;

    const newMsg: ChatMessage = {
      ...msg,
      id: msg.id || "msg-" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      timestamp: msg.timestamp || Date.now(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = newMsg;
    } else {
      list.push(newMsg);
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.getKey(msg.meetingId), JSON.stringify(list));
      } catch {
        sessionStorage.setItem(this.getKey(msg.meetingId), JSON.stringify(list));
      }
    }
    return newMsg;
  }

  async clearMessages(meetingId: string): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.getKey(meetingId));
      sessionStorage.removeItem(this.getKey(meetingId));
    }
  }
}

