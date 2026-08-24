"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PreJoin } from "@/components/meeting/PreJoin";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { WaitingRoomAttendeeView } from "@/components/meeting/WaitingRoom";
import { useAuth } from "@/contexts/AuthContext";
import { api, MeetingData } from "@/lib/api";
import { AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ meetingId: string }>;
}

export default function MeetingRoomPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawMeetingId = resolvedParams.meetingId;
  const meetingId = decodeURIComponent(rawMeetingId).trim().toLowerCase();

  const { user } = useAuth();
  const router = useRouter();

  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inMeeting, setInMeeting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  // LiveKit Connection State
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("wss://live.infiplus.in");
  const [initialAudio, setInitialAudio] = useState(true);
  const [initialVideo, setInitialVideo] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeetingData() {
      try {
        const found = await api.getMeeting(meetingId);
        if (found) {
          setMeeting(found);
        }
      } catch (err) {
        console.warn("Could not fetch meeting metadata from Firebase:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMeetingData();
  }, [meetingId]);

  const isHost = Boolean(user && meeting && user.id === meeting.hostId);

  const handleJoinFromPreJoin = async ({
    displayName,
    audioEnabled,
    videoEnabled,
    enteredPassword,
  }: {
    displayName: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    audioDeviceId?: string;
    videoDeviceId?: string;
    enteredPassword?: string;
  }) => {
    setJoinError(null);

    // Validate password if meeting has one
    if (meeting?.passcode) {
      if (enteredPassword !== meeting.passcode) {
        setJoinError("Invalid meeting passcode. Please verify and try again.");
        return;
      }
    }

    setInitialAudio(audioEnabled);
    setInitialVideo(videoEnabled);

    try {
      const roomName = (meeting?.id || meetingId).trim().toLowerCase();

      // ALWAYS generate a unique participant identity per tab/device
      const deviceRandom = Math.random().toString(36).substring(2, 7);
      const uniqueIdentity = user?.id
        ? `${user.id}_${deviceRandom}`
        : `guest_${deviceRandom}_${Date.now().toString().slice(-4)}`;

      const data = await api.getLiveKitToken({
        roomName,
        participantName: displayName || "Guest Attendee",
        participantIdentity: uniqueIdentity,
        isHost,
        passcode: enteredPassword,
      });

      if (!data || data.error || !data.token) {
        throw new Error(data?.error || "Failed to retrieve LiveKit room token");
      }

      setToken(data.token);
      if (data.livekitUrl || data.serverUrl) {
        setServerUrl(data.livekitUrl || data.serverUrl);
      }

      setInMeeting(true);
    } catch (err: unknown) {
      console.error("Token acquisition error:", err);
      setJoinError((err as Error).message || "Connection to LiveKit media server failed.");
    }
  };

  const handleLeave = () => {
    setInMeeting(false);
    setIsWaiting(false);
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-[Poppins,sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Connecting to Firebase & LiveKit room...</p>
        </div>
      </div>
    );
  }

  // Attendee Waiting Room Screen
  if (isWaiting && !isHost) {
    return (
      <WaitingRoomAttendeeView
        meetingTitle={meeting?.title}
        meetingId={meetingId}
        hostName={meeting?.hostName}
        onLeave={handleLeave}
      />
    );
  }

  // Live LiveKit Conference Room
  if (inMeeting && token) {
    return (
      <MeetingRoom
        serverUrl={serverUrl}
        token={token}
        roomName={(meeting?.id || meetingId).trim().toLowerCase()}
        meetingTitle={meeting?.title}
        isHost={isHost}
        initialAudio={initialAudio}
        initialVideo={initialVideo}
        fakeUserCount={meeting?.fakeUserCount ?? 200}
        isVoiceLocked={meeting?.isVoiceLocked}
        isVideoLocked={meeting?.isVideoLocked}
        onlyShowHost={meeting?.onlyShowHost ?? true}
        showCommentPopup={meeting?.showCommentPopup ?? false}
        isChatLocked={meeting?.isChatLocked ?? false}
        onLeave={handleLeave}
      />
    );
  }

  // Pre-Join Check Screen
  return (
    <div className="min-h-screen bg-slate-950 text-white font-[Poppins,sans-serif]">
      {joinError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">
          <AlertCircle className="h-4 w-4" />
          <span>{joinError}</span>
        </div>
      )}

      <PreJoin
        meetingTitle={meeting?.title}
        meetingId={meetingId}
        initialName={user?.name || (typeof window !== "undefined" ? sessionStorage.getItem("infiplus_guest_name") || "" : "")}
        isHost={isHost}
        passwordRequired={Boolean(meeting?.passcode)}
        onJoin={handleJoinFromPreJoin}
      />
    </div>
  );
}
