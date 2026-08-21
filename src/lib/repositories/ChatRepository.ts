import { ChatMessage } from "@/types";

export interface ChatRepository {
  getMessages(meetingId: string): Promise<ChatMessage[]>;
  saveMessage(message: Omit<ChatMessage, "id" | "timestamp"> & { timestamp?: number }): Promise<ChatMessage>;
  clearMessages(meetingId: string): Promise<void>;
}

const STORAGE_PREFIX = "infiplus_chat_";

export class LocalChatRepository implements ChatRepository {
  private getKey(meetingId: string): string {
    return `${STORAGE_PREFIX}${meetingId}`;
  }

  async getMessages(meetingId: string): Promise<ChatMessage[]> {
    if (typeof window === "undefined") return [];
    const raw = sessionStorage.getItem(this.getKey(meetingId));
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async saveMessage(msg: Omit<ChatMessage, "id" | "timestamp"> & { timestamp?: number }): Promise<ChatMessage> {
    const list = await this.getMessages(msg.meetingId);
    const newMsg: ChatMessage = {
      ...msg,
      id: "msg-" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      timestamp: msg.timestamp || Date.now(),
    };
    list.push(newMsg);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(this.getKey(msg.meetingId), JSON.stringify(list));
    }
    return newMsg;
  }

  async clearMessages(meetingId: string): Promise<void> {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(this.getKey(meetingId));
    }
  }
}
