import { UserSettings } from "@/types";

export interface SettingsRepository {
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: Partial<UserSettings>): Promise<UserSettings>;
}

const STORAGE_KEY = "infiplus_user_settings_v1";

const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  defaultMuteMic: false,
  defaultMuteCamera: false,
  notificationsEnabled: true,
  soundEffectsEnabled: true,
  noiseSuppression: true,
  mirrorVideo: true,
  hdVideo: true,
};

export class LocalSettingsRepository implements SettingsRepository {
  async getSettings(): Promise<UserSettings> {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  }
}
