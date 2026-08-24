"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService } from "@/lib/services";
import { UserSettings } from "@/types";
import {
  User,
  Sun,
  Moon,
  Monitor,
  Mic,
  Video,
  Volume2,
  Bell,
  CheckCircle2,
  Sliders,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, updateProfile } = useAuth();

  // Profile Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<UserSettings>({
    theme: "light",
    defaultMuteMic: false,
    defaultMuteCamera: false,
    notificationsEnabled: true,
    soundEffectsEnabled: true,
    noiseSuppression: true,
    mirrorVideo: true,
    hdVideo: true,
  });

  // Browser Media Devices state
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setCompany(user.company || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  useEffect(() => {
    settingsService.getSettings().then(s => setSettings(s));

    // Enumerate real browser devices if permissions allowed
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setAudioInputs(devices.filter(d => d.kind === "audioinput"));
        setAudioOutputs(devices.filter(d => d.kind === "audiooutput"));
        setVideoInputs(devices.filter(d => d.kind === "videoinput"));
      }).catch(err => console.log("Device enumeration preview", err));
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name,
        email,
        company,
        avatar,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
    const updated = await settingsService.saveSettings(updates);
    setSettings(updated);
  };

  return (
    <DashboardLayout
      title="Settings & Preferences"
      subtitle="Manage your profile credentials, theme customization, audio/video devices, and alerts."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Tabs
          tabs={[
            { id: "profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
            { id: "appearance", label: "Appearance & Theme", icon: <Sun className="w-4 h-4" /> },
            { id: "devices", label: "Audio & Video Devices", icon: <Sliders className="w-4 h-4" /> },
            { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab 1: Profile */}
        {activeTab === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your meeting display name, avatar, and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-5 pb-4 border-b border-slate-100">
                  <Avatar name={name || "User"} src={avatar} size="xl" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-700">Profile Picture</p>
                    <p className="text-xs text-slate-400">
                      Avatar URL or auto-generated avatar avatar seed
                    </p>
                    <Input
                      placeholder="https://..."
                      value={avatar}
                      onChange={e => setAvatar(e.target.value)}
                      className="text-xs max-w-sm mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />

                  <Input
                    label="Company / Organization"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. First Option Agency"
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Account Role
                    </label>
                    <input
                      disabled
                      value="Workspace Admin (Host)"
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {profileSuccess && (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Profile settings successfully saved!</span>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button type="submit" variant="primary" isLoading={isSavingProfile}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Appearance */}
        {activeTab === "appearance" && (
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Theme</CardTitle>
              <CardDescription>
                Customize your workspace interface and meeting room visual style.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "light", label: "Light Theme", icon: Sun, desc: "Clean, high-contrast dashboard" },
                  { id: "dark", label: "Dark Theme", icon: Moon, desc: "Deep charcoal palette" },
                  { id: "system", label: "System Sync", icon: Monitor, desc: "Matches operating system" },
                ].map(themeOpt => {
                  const isSelected = settings.theme === themeOpt.id;
                  const Icon = themeOpt.icon;
                  return (
                    <div
                      key={themeOpt.id}
                      onClick={() => handleUpdateSettings({ theme: themeOpt.id as UserSettings["theme"] })}
                      className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg mb-2 ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{themeOpt.label}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{themeOpt.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Video Canvas Options</h4>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Mirror My Video</p>
                    <p className="text-[11px] text-slate-500">Flips your local camera feed horizontally</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.mirrorVideo}
                    onChange={e => handleUpdateSettings({ mirrorVideo: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer border-t border-slate-200/60 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Enable High-Definition (HD) Video</p>
                    <p className="text-[11px] text-slate-500">Streams 720p/1080p when bandwidth permits</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.hdVideo}
                    onChange={e => handleUpdateSettings({ hdVideo: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Devices */}
        {activeTab === "devices" && (
          <Card>
            <CardHeader>
              <CardTitle>Audio & Video Hardware</CardTitle>
              <CardDescription>
                Configure default microphones, speakers, and webcams for meetings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                {/* Microphone Select */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span>Microphone</span>
                  </label>
                  <select
                    value={settings.preferredAudioInputId || ""}
                    onChange={e => handleUpdateSettings({ preferredAudioInputId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="">Default Microphone</option>
                    {audioInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speaker Select */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span>Speakers / Audio Output</span>
                  </label>
                  <select
                    value={settings.preferredAudioOutputId || ""}
                    onChange={e => handleUpdateSettings({ preferredAudioOutputId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="">Default System Output</option>
                    {audioOutputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Speaker ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Camera Select */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <Video className="w-4 h-4 text-emerald-600" />
                    <span>Camera</span>
                  </label>
                  <select
                    value={settings.preferredVideoInputId || ""}
                    onChange={e => handleUpdateSettings({ preferredVideoInputId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="">Default Camera</option>
                    {videoInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 pt-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">AI Background Noise Suppression</p>
                    <p className="text-[11px] text-slate-500">Filter out keyboard clicks, fans, and echo</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.noiseSuppression}
                    onChange={e => handleUpdateSettings({ noiseSuppression: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer border-t border-slate-200/60 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Mute microphone when joining</p>
                    <p className="text-[11px] text-slate-500">Always enter meetings with microphone silenced</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.defaultMuteMic}
                    onChange={e => handleUpdateSettings({ defaultMuteMic: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer border-t border-slate-200/60 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Turn off camera when joining</p>
                    <p className="text-[11px] text-slate-500">Always enter meetings with video muted</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.defaultMuteCamera}
                    onChange={e => handleUpdateSettings({ defaultMuteCamera: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === "notifications" && (
          <Card>
            <CardHeader>
              <CardTitle>Notifications & Audio Cues</CardTitle>
              <CardDescription>
                Manage in-meeting chimes, chat alerts, and attendee admission cues.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Meeting Join/Leave Audio Chimes</p>
                    <p className="text-[11px] text-slate-500">Play subtle sound when someone enters or departs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEffectsEnabled}
                    onChange={e => handleUpdateSettings({ soundEffectsEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer border-t border-slate-200/60 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">In-Meeting Chat Notifications</p>
                    <p className="text-[11px] text-slate-500">Show notification badges and preview popups</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={e => handleUpdateSettings({ notificationsEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
