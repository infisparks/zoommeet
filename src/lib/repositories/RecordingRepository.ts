import { Recording } from "@/types";

export interface RecordingRepository {
  getRecordings(hostId?: string): Promise<Recording[]>;
  getRecordingById(id: string): Promise<Recording | null>;
  createRecording(data: Omit<Recording, "id" | "createdAt">): Promise<Recording>;
  deleteRecording(id: string): Promise<boolean>;
}

const STORAGE_KEY = "infiplus_recordings_v1";

const DEFAULT_RECORDINGS: Recording[] = [
  {
    id: "rec-1",
    meetingId: "arch-perf-qa",
    meetingTitle: "WebRTC Load Testing Retrospective",
    durationSeconds: 3600,
    sizeBytes: 482344960, // ~460 MB
    status: "ready",
    downloadUrl: "#",
    thumbnailUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    hostId: "user-demo-1",
  },
  {
    id: "rec-2",
    meetingId: "q3-roadmap-exec",
    meetingTitle: "Q3 Strategic Product Roadmap & OKR Alignment",
    durationSeconds: 2700,
    sizeBytes: 314572800, // ~300 MB
    status: "ready",
    downloadUrl: "#",
    thumbnailUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    hostId: "user-demo-1",
  },
  {
    id: "rec-3",
    meetingId: "livekit-poc-test",
    meetingTitle: "Audio/Video Track Ingestion Stress Benchmark",
    durationSeconds: 1800,
    sizeBytes: 157286400, // ~150 MB
    status: "processing",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    hostId: "user-demo-1",
  }
];

export class LocalRecordingRepository implements RecordingRepository {
  private getStorage(): Recording[] {
    if (typeof window === "undefined") return DEFAULT_RECORDINGS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECORDINGS));
      return DEFAULT_RECORDINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_RECORDINGS;
    }
  }

  private saveStorage(recs: Recording[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recs));
  }

  async getRecordings(hostId?: string): Promise<Recording[]> {
    const list = this.getStorage();
    if (!hostId) return list;
    return list.filter(r => r.hostId === hostId);
  }

  async getRecordingById(id: string): Promise<Recording | null> {
    return this.getStorage().find(r => r.id === id) || null;
  }

  async createRecording(data: Omit<Recording, "id" | "createdAt">): Promise<Recording> {
    const list = this.getStorage();
    const newRec: Recording = {
      ...data,
      id: "rec-" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRec);
    this.saveStorage(list);
    return newRec;
  }

  async deleteRecording(id: string): Promise<boolean> {
    const list = this.getStorage();
    const filtered = list.filter(r => r.id !== id);
    this.saveStorage(filtered);
    return filtered.length !== list.length;
  }
}
