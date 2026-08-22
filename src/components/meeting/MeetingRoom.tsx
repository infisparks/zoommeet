"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useConnectionState,
  useDataChannel,
  RoomAudioRenderer,
  isTrackReference,
  TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import {
  Track,
  ConnectionState,
  VideoPresets,
  ScreenSharePresets,
  LocalVideoTrack,
  LocalAudioTrack,
  createLocalVideoTrack,
} from "livekit-client";
import { VideoGrid } from "./VideoGrid";
import { ScreenShareView } from "./ScreenShareView";
import { MeetingControls } from "./MeetingControls";
import { MeetingChat } from "./MeetingChat";
import { MeetingParticipants, ExtendedParticipantInfo } from "./MeetingParticipants";
import { ReactionsOverlay } from "./ReactionsOverlay";
import { HostWaitingRoomBanner, WaitingUser } from "./WaitingRoom";
import { ChatMessage, ReactionItem } from "@/types";
import { chatService } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import {
  Video as VideoIcon,
  WifiOff,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Check,
  Share2,
  Sparkles,
  Maximize,
  Minimize,
  Users,
  Lock,
  MicOff,
  VideoOff,
  Settings,
  Shield,
  Sliders,
  Crown,
  VolumeX,
} from "lucide-react";
import { PermissionModal } from "./PermissionModal";
import { VirtualParticipant, generateFUsers } from "@/lib/indianNames";

export const ZOOM_HD_AUDIO_OPTIONS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
  sampleRate: 48000,
};

interface MeetingRoomProps {
  serverUrl: string;
  token: string;
  roomName: string;
  meetingTitle?: string;
  isHost?: boolean;
  initialAudio?: boolean;
  initialVideo?: boolean;
  fakeUserCount?: number;
  isVoiceLocked?: boolean;
  isVideoLocked?: boolean;
  onlyShowHost?: boolean;
  onLeave: () => void;
}

function MeetingRoomInner({
  roomName,
  meetingTitle,
  isHost = false,
  initialAudio = false,
  initialVideo = false,
  fakeUserCount = 200,
  isVoiceLocked = false,
  isVideoLocked = false,
  onlyShowHost = true,
  onLeave,
}: {
  roomName: string;
  meetingTitle?: string;
  isHost?: boolean;
  initialAudio?: boolean;
  initialVideo?: boolean;
  fakeUserCount?: number;
  isVoiceLocked?: boolean;
  isVideoLocked?: boolean;
  onlyShowHost?: boolean;
  onLeave: () => void;
}) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  // Layout and Side Panels
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isFocusView, setIsFocusView] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMediaType, setPermissionMediaType] = useState<"camera" | "microphone" | "both">("both");
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Social Proof Booster (fuser) & Webinar Lock State
  const [fuserCount, setFuserCount] = useState(fakeUserCount || 200);
  const [fakeUsers, setFakeUsers] = useState<VirtualParticipant[]>(() =>
    generateFUsers(fakeUserCount || 200, roomName)
  );
  const [voiceLocked, setVoiceLocked] = useState(!!isVoiceLocked);
  const [videoLocked, setVideoLocked] = useState(!!isVideoLocked);
  const [onlyShowHostState, setOnlyShowHostState] = useState(onlyShowHost ?? true);
  const [showBoosterModal, setShowBoosterModal] = useState(false);
  const [tempBoosterCount, setTempBoosterCount] = useState(fakeUserCount || 200);

  // Host Admin Controls Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminVoiceLock, setAdminVoiceLock] = useState(!!isVoiceLocked);
  const [adminVideoLock, setAdminVideoLock] = useState(!!isVideoLocked);
  const [adminOnlyShowHost, setAdminOnlyShowHost] = useState(onlyShowHost ?? true);
  const [adminBoosterCount, setAdminBoosterCount] = useState(fakeUserCount || 200);

  // Real-time State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [raisedHands, setRaisedHands] = useState<string[]>([]);
  const [coHosts, setCoHosts] = useState<string[]>([]);
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  // Meeting Duration Timer & Fullscreen/Auto-Hide Controls
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const publishedInitialRef = useRef(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const krispProcessorRef = useRef<any>(null);

  // Auto-hide controls after 3.5 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [resetControlsTimeout]);

  // Auto-detect mobile landscape orientation: auto-hide UI to maximize video/screen share
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        setShowControls(false);
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener("orientationchange", handleOrientation);
    window.addEventListener("resize", handleOrientation);

    return () => {
      window.removeEventListener("orientationchange", handleOrientation);
      window.removeEventListener("resize", handleOrientation);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (screen.orientation && "lock" in screen.orientation) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (screen.orientation as any).lock("landscape").catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen toggle notice:", err);
    }
  };

  // Initialize Krisp AI Deep-Learning Noise Filter
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("@livekit/krisp-noise-filter")
      .then(({ isKrispNoiseFilterSupported, KrispNoiseFilter }) => {
        if (isKrispNoiseFilterSupported()) {
          const processor = KrispNoiseFilter();
          krispProcessorRef.current = processor;
        }
      })
      .catch(err => {
        console.warn("Krisp AI noise filter load notice:", err);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Attempt initial audio/video publishing once fully connected & hardware lock released
  useEffect(() => {
    if (!localParticipant || connectionState !== ConnectionState.Connected) return;
    if (publishedInitialRef.current) return;
    publishedInitialRef.current = true;

    const timer = setTimeout(async () => {
      // 1. Initial Microphone publish
      if (initialAudio && !localParticipant.isMicrophoneEnabled && (!voiceLocked || isHost)) {
        try {
          await localParticipant.setMicrophoneEnabled(true, ZOOM_HD_AUDIO_OPTIONS);
        } catch (e) {
          console.warn("Mic init notice:", e);
        }
      }

      // 2. Initial Camera publish (after PreJoin hardware release)
      if (initialVideo && !localParticipant.isCameraEnabled && (!videoLocked || isHost)) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: cameraFacing,
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          });
          const [mediaTrack] = stream.getVideoTracks();
          if (mediaTrack) {
            const localVideoTrack = new LocalVideoTrack(mediaTrack);
            await localParticipant.publishTrack(localVideoTrack);
          } else {
            await localParticipant.setCameraEnabled(true);
          }
        } catch (e) {
          console.warn("Initial direct hardware camera notice, trying standard fallback:", e);
          localParticipant.setCameraEnabled(true).catch(() => {});
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localParticipant, connectionState, initialAudio, initialVideo, cameraFacing, voiceLocked, videoLocked, isHost]);

  // Load initial chat history
  useEffect(() => {
    chatService.getMessages(roomName).then(msgs => {
      setMessages(msgs);
    });
  }, [roomName]);

  // LiveKit Data Channel listener
  const onDataReceived = useCallback((msg: { payload: Uint8Array; topic?: string }) => {
    try {
      const decoded = new TextDecoder().decode(msg.payload);
      const data = JSON.parse(decoded);

      if (data.type === "chat") {
        const newMsg: ChatMessage = {
          id: data.id || `msg-${Date.now()}`,
          meetingId: roomName,
          participantId: data.participantId,
          participantName: data.participantName,
          message: data.message,
          timestamp: data.timestamp || Date.now(),
        };
        setMessages(prev => [...prev, newMsg]);
        chatService.saveMessage(newMsg);
        if (!isChatOpen) {
          setUnreadCount(prev => prev + 1);
        }
      } else if (data.type === "reaction") {
        const newReaction: ReactionItem = {
          id: `rx-${Date.now()}-${Math.random()}`,
          emoji: data.emoji,
          senderName: data.senderName,
          timestamp: Date.now(),
        };
        setReactions(prev => [...prev.slice(-8), newReaction]);
      } else if (data.type === "hand_toggle") {
        setRaisedHands(prev => {
          if (data.isHandRaised) {
            return prev.includes(data.identity) ? prev : [...prev, data.identity];
          } else {
            return prev.filter(id => id !== data.identity);
          }
        });
      } else if (data.type === "end_meeting_all") {
        alert("The host has ended this meeting.");
        onLeave();
      } else if (data.type === "force_mute") {
        if (localParticipant && localParticipant.identity === data.targetIdentity) {
          localParticipant.setMicrophoneEnabled(false).catch(() => {});
        }
      } else if (data.type === "force_mute_all") {
        setVoiceLocked(true);
        if (!isHost && localParticipant) {
          localParticipant.setMicrophoneEnabled(false).catch(() => {});
        }
      } else if (data.type === "force_lock_video") {
        setVideoLocked(true);
        if (!isHost && localParticipant) {
          localParticipant.setCameraEnabled(false).catch(() => {});
        }
      } else if (data.type === "room_settings_update") {
        if (typeof data.voiceLocked === "boolean") {
          setVoiceLocked(data.voiceLocked);
          if (data.voiceLocked && !isHost && !coHosts.includes(localParticipant?.identity || "")) {
            localParticipant?.setMicrophoneEnabled(false).catch(() => {});
          }
        }
        if (typeof data.videoLocked === "boolean") {
          setVideoLocked(data.videoLocked);
          if (data.videoLocked && !isHost && !coHosts.includes(localParticipant?.identity || "")) {
            localParticipant?.setCameraEnabled(false).catch(() => {});
          }
        }
        if (typeof data.onlyShowHost === "boolean") {
          setOnlyShowHostState(data.onlyShowHost);
        }
        if (typeof data.fuserCount === "number") {
          setFuserCount(data.fuserCount);
          setFakeUsers(generateFUsers(data.fuserCount, roomName));
        }
      } else if (data.type === "booster_update") {
        if (data.count && typeof data.count === "number") {
          setFuserCount(data.count);
          setFakeUsers(generateFUsers(data.count, roomName));
        }
      } else if (data.type === "cohost_toggle") {
        setCoHosts(prev => {
          if (data.isCoHost) {
            if (localParticipant && localParticipant.identity === data.identity) {
              alert("🎉 You are now a Co-Host! You can now unmute your mic and share your camera.");
            }
            return prev.includes(data.identity) ? prev : [...prev, data.identity];
          } else {
            return prev.filter(id => id !== data.identity);
          }
        });
      } else if (data.type === "rename_participant") {
        if (data.identity && data.newName) {
          setCustomNames(prev => ({ ...prev, [data.identity]: data.newName }));
        }
      }
    } catch (e) {
      console.warn("Error decoding data channel packet", e);
    }
  }, [roomName, isChatOpen, localParticipant, isHost, onLeave]);

  const { send } = useDataChannel(onDataReceived);

  // Tracks for Camera and Screen Sharing
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenShareTrack = tracks.find(
    t => t.source === Track.Source.ScreenShare && isTrackReference(t)
  );

  const isLocalScreenSharing = !!localParticipant?.isScreenShareEnabled;
  const allParticipantTiles = tracks.filter(t => t.source === Track.Source.Camera);

  const handleCopyMeetingLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRetryPermission = async () => {
    setShowPermissionModal(false);
    setPermissionError(null);
    try {
      if (permissionMediaType === "camera" || permissionMediaType === "both") {
        await localParticipant?.setCameraEnabled(true, { facingMode: cameraFacing });
      }
      if (permissionMediaType === "microphone" || permissionMediaType === "both") {
        await localParticipant?.setMicrophoneEnabled(true);
      }
    } catch (e: unknown) {
      console.warn("Manual retry permission notice:", e);
    }
  };

  const handleToggleMic = async () => {
    if (!localParticipant) return;
    const isCoHost = coHosts.includes(localParticipant.identity);
    if (voiceLocked && !isHost && !isCoHost) {
      alert("🎙️ Voice is locked by the host for this webinar.");
      return;
    }

    const currentStatus = localParticipant.isMicrophoneEnabled;
    const nextStatus = !currentStatus;

    try {
      await localParticipant.setMicrophoneEnabled(nextStatus, ZOOM_HD_AUDIO_OPTIONS);
    } catch (err: unknown) {
      console.warn("Microphone toggle notice, retrying fallback:", err);
      try {
        await localParticipant.setMicrophoneEnabled(nextStatus);
      } catch (fallbackErr: unknown) {
        const error = fallbackErr as Error;
        console.warn("Microphone fallback notice:", error);
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError" ||
          (error.message?.toLowerCase().includes("permission") && !error.message?.toLowerCase().includes("livekit"))
        ) {
          setPermissionMediaType("microphone");
          setPermissionError("Microphone access was denied. Please allow microphone in browser settings.");
          setShowPermissionModal(true);
        }
      }
    }
  };

  const handleToggleVideo = async () => {
    if (!localParticipant) return;
    const isCoHost = coHosts.includes(localParticipant.identity);
    if (videoLocked && !isHost && !isCoHost) {
      alert("📹 Video is locked by the host for this webinar.");
      return;
    }

    const currentStatus = localParticipant.isCameraEnabled;
    const nextStatus = !currentStatus;

    if (!nextStatus) {
      // Turn off camera and stop hardware tracks
      try {
        await localParticipant.setCameraEnabled(false);
      } catch {
        const pub = localParticipant.getTrackPublication(Track.Source.Camera);
        if (pub && pub.track) {
          localParticipant.unpublishTrack(pub.track).catch(() => {});
          pub.track.stop();
        }
      }
      return;
    }

    try {
      // 1. Direct native hardware capture (100% reliable and instantaneous on Android/iOS/Desktop)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      const [mediaTrack] = stream.getVideoTracks();
      if (mediaTrack) {
        const localVideoTrack = new LocalVideoTrack(mediaTrack);
        await localParticipant.publishTrack(localVideoTrack);
      } else {
        await localParticipant.setCameraEnabled(true);
      }
    } catch (err: unknown) {
      console.warn("Direct native getUserMedia notice, trying standard fallback:", err);
      try {
        await localParticipant.setCameraEnabled(true);
      } catch (fallbackErr: unknown) {
        const fbError = fallbackErr as Error;
        console.warn("Camera fallback notice:", fbError);
        if (
          fbError.name === "NotAllowedError" ||
          fbError.name === "PermissionDeniedError"
        ) {
          setPermissionMediaType("camera");
          setPermissionError("Camera access was denied. Please allow camera in browser settings.");
          setShowPermissionModal(true);
        }
      }
    }
  };

  const handleFlipCamera = async () => {
    if (!localParticipant || !localParticipant.isCameraEnabled) return;
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(nextFacing);
    try {
      const pub = localParticipant.getTrackPublication(Track.Source.Camera);
      if (pub && pub.track) {
        await localParticipant.unpublishTrack(pub.track).catch(() => {});
        pub.track.stop();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: nextFacing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      const [mediaTrack] = stream.getVideoTracks();
      if (mediaTrack) {
        const localVideoTrack = new LocalVideoTrack(mediaTrack);
        await localParticipant.publishTrack(localVideoTrack);
      }
    } catch (e) {
      console.warn("Flip camera fallback:", e);
      localParticipant.setCameraEnabled(true, { facingMode: nextFacing }).catch(() => {});
    }
  };

  const handleToggleScreenShare = async () => {
    if (!localParticipant) return;
    const isCoHost = coHosts.includes(localParticipant.identity);
    if (videoLocked && !isHost && !isCoHost) {
      alert("📹 Screen sharing is locked by the host for this webinar.");
      return;
    }

    try {
      if (localParticipant.isScreenShareEnabled) {
        await localParticipant.setScreenShareEnabled(false);
      } else {
        const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
        if (isMobile) {
          await localParticipant.setScreenShareEnabled(true, { audio: false });
        } else {
          await localParticipant.setScreenShareEnabled(true, {
            audio: true,
            selfBrowserSurface: "include",
            surfaceSwitching: "include",
            systemAudio: "include",
          });
        }
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.warn("Screen share notice, attempting fallback:", err?.message || err);
      if (err.name !== "AbortError" && !err.message?.includes("Permission denied") && !err.message?.includes("cancelled")) {
        try {
          await localParticipant.setScreenShareEnabled(true);
        } catch (fallbackErr: unknown) {
          const fbErr = fallbackErr as Error;
          if (fbErr.name !== "AbortError" && !fbErr.message?.includes("Permission denied")) {
            alert("Screen sharing notice: " + (fbErr.message || "Please check your browser permissions"));
          }
        }
      }
    }
  };

  const handleToggleHand = () => {
    if (!localParticipant) return;
    const isRaised = raisedHands.includes(localParticipant.identity);
    const newStatus = !isRaised;

    setRaisedHands(prev =>
      newStatus ? [...prev, localParticipant.identity] : prev.filter(id => id !== localParticipant.identity)
    );

    const payload = JSON.stringify({
      type: "hand_toggle",
      identity: localParticipant.identity,
      isHandRaised: newStatus,
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleSendReaction = (emoji: string) => {
    const senderName = localParticipant?.name || "Participant";
    const newReaction: ReactionItem = {
      id: `rx-${Date.now()}-${Math.random()}`,
      emoji,
      senderName,
      timestamp: Date.now(),
    };
    setReactions(prev => [...prev.slice(-8), newReaction]);

    const payload = JSON.stringify({
      type: "reaction",
      emoji,
      senderName,
    });
    send(new TextEncoder().encode(payload), { reliable: false });
  };

  const handleSendMessage = (text: string) => {
    if (!localParticipant) return;
    const senderName = localParticipant.name || "Participant";
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      meetingId: roomName,
      participantId: localParticipant.identity,
      participantName: senderName,
      message: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMsg]);
    chatService.saveMessage(newMsg);

    const payload = JSON.stringify({
      type: "chat",
      id: newMsg.id,
      participantId: localParticipant.identity,
      participantName: senderName,
      message: text,
      timestamp: newMsg.timestamp,
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleEndMeetingForAll = () => {
    const payload = JSON.stringify({ type: "end_meeting_all" });
    send(new TextEncoder().encode(payload), { reliable: true });
    onLeave();
  };

  const handleMuteParticipant = (identity: string) => {
    const payload = JSON.stringify({ type: "force_mute", targetIdentity: identity });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleMuteAll = () => {
    setVoiceLocked(true);
    participants.forEach(p => {
      if (!p.isLocal) {
        handleMuteParticipant(p.identity);
      }
    });
    const payload = JSON.stringify({ type: "force_mute_all" });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleLockAllVideo = () => {
    setVideoLocked(true);
    const payload = JSON.stringify({ type: "force_lock_video" });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleMakeCoHost = (identity: string) => {
    const isAlready = coHosts.includes(identity);
    const newStatus = !isAlready;
    setCoHosts(prev =>
      newStatus ? [...prev, identity] : prev.filter(id => id !== identity)
    );
    const payload = JSON.stringify({
      type: "cohost_toggle",
      identity,
      isCoHost: newStatus,
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleApplyBooster = () => {
    setFuserCount(tempBoosterCount);
    setFakeUsers(generateFUsers(tempBoosterCount, roomName));
    setShowBoosterModal(false);

    const payload = JSON.stringify({ type: "booster_update", count: tempBoosterCount });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleOpenAdminModal = () => {
    setAdminVoiceLock(voiceLocked);
    setAdminVideoLock(videoLocked);
    setAdminOnlyShowHost(onlyShowHostState);
    setAdminBoosterCount(fuserCount);
    setShowAdminModal(true);
  };

  const handleSaveAdminSettings = async () => {
    setVoiceLocked(adminVoiceLock);
    setVideoLocked(adminVideoLock);
    setOnlyShowHostState(adminOnlyShowHost);
    setFuserCount(adminBoosterCount);
    setFakeUsers(generateFUsers(adminBoosterCount, roomName));
    setShowAdminModal(false);

    // If voice locked, mute non-host local participant
    if (adminVoiceLock && !isHost && !coHosts.includes(localParticipant?.identity || "")) {
      localParticipant?.setMicrophoneEnabled(false).catch(() => {});
    }
    // If video locked, turn off camera for non-host local participant
    if (adminVideoLock && !isHost && !coHosts.includes(localParticipant?.identity || "")) {
      localParticipant?.setCameraEnabled(false).catch(() => {});
    }

    const payload = JSON.stringify({
      type: "room_settings_update",
      voiceLocked: adminVoiceLock,
      videoLocked: adminVideoLock,
      onlyShowHost: adminOnlyShowHost,
      fuserCount: adminBoosterCount,
    });
    send(new TextEncoder().encode(payload), { reliable: true });

    // Sync to backend Firebase RTDB
    try {
      await api.updateMeetingLocks(roomName, {
        isVoiceLocked: adminVoiceLock,
        isVideoLocked: adminVideoLock,
        onlyShowHost: adminOnlyShowHost,
        fakeUserCount: adminBoosterCount,
      });
    } catch (e) {
      console.warn("Meeting locks backend sync notice:", e);
    }
  };

  const handleForceMuteAll = () => {
    setVoiceLocked(true);
    setAdminVoiceLock(true);
    const payload = JSON.stringify({ type: "force_mute_all" });
    send(new TextEncoder().encode(payload), { reliable: true });
    alert("🔇 All attendees have been muted.");
  };

  const handleRenameSelf = (newName: string) => {
    if (!localParticipant || !newName.trim()) return;
    const clean = newName.trim();
    setCustomNames(prev => ({ ...prev, [localParticipant.identity]: clean }));
    localParticipant.setName(clean).catch(() => {});
    if (typeof window !== "undefined") {
      sessionStorage.setItem("infiplus_guest_name", clean);
    }
    const payload = JSON.stringify({
      type: "rename_participant",
      identity: localParticipant.identity,
      newName: clean,
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  // Build extended participant details for panel
  const extendedParticipants: ExtendedParticipantInfo[] = participants.map(p => ({
    identity: p.identity,
    name: customNames[p.identity] || p.name || p.identity,
    isLocal: p.isLocal,
    isHost: isHost && p.isLocal,
    isCoHost: coHosts.includes(p.identity),
    isSpeaking: p.isSpeaking,
    isAudioEnabled: p.isMicrophoneEnabled,
    isVideoEnabled: p.isCameraEnabled,
    isHandRaised: raisedHands.includes(p.identity),
    livekitParticipant: p,
  }));

  const isLocalHandRaised = localParticipant
    ? raisedHands.includes(localParticipant.identity)
    : false;

  const totalConnectedCount = participants.length + fakeUsers.length;

  const actualHostIdentity = isHost
    ? localParticipant?.identity
    : (participants.find(p => !p.isLocal && (p.identity.startsWith("usr_") || p.name?.toLowerCase().includes("admin") || p.name?.toLowerCase().includes("host")))?.identity
      || participants.find(p => !p.isLocal)?.identity
      || localParticipant?.identity);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-[#070B14] text-white overflow-hidden select-none font-[Poppins,sans-serif]">
      {/* Audio Renderer for remote audio tracks */}
      <RoomAudioRenderer />

      {/* Minimal Floating Top Pill (Auto-Hides) */}
      <div
        className={`absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex items-center justify-between pointer-events-none transition-all duration-300 ${
          showControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-8 pointer-events-none"
        }`}
      >
        {/* Minimal Meeting Info */}
        <div className="flex items-center gap-2 rounded-full bg-slate-950/90 px-3.5 py-1.5 border border-white/10 backdrop-blur-xl pointer-events-auto shadow-lg text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white max-w-[120px] sm:max-w-xs truncate">
            {meetingTitle || roomName}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            • {formatTimer(elapsedSeconds)}
          </span>
          <div className="h-3 w-px bg-white/20" />
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setIsParticipantsOpen(true);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-200 bg-indigo-600/30 hover:bg-indigo-600/60 px-2.5 py-0.5 rounded-full border border-indigo-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title="Click to view all attendees"
          >
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            <span>{totalConnectedCount}</span>
          </button>
        </div>

        {/* Right Actions: Host Controls, Quick Share & Fullscreen */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Host Admin Controls */}
          {isHost && (
            <button
              type="button"
              onClick={handleOpenAdminModal}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600/40 to-indigo-600/40 hover:from-purple-600/60 hover:to-indigo-600/60 border border-purple-400/40 px-3 py-1.5 text-xs font-bold text-purple-200 backdrop-blur-md transition active:scale-95 cursor-pointer shadow-lg"
              title="Host Webinar & Moderation Controls"
            >
              <Settings className="h-3.5 w-3.5 text-purple-300 animate-spin-slow" />
              <span className="hidden sm:inline text-[11px]">Host Controls</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyMeetingLink}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600/90 hover:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition active:scale-95 cursor-pointer shadow-md"
            title="Copy Invite Link"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-emerald-200 text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-indigo-200" />
                <span className="hidden sm:inline text-[11px]">Share</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 backdrop-blur-md transition active:scale-95 cursor-pointer shadow-md"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Host Waiting Room Banner */}
      {isHost && (
        <HostWaitingRoomBanner
          waitingUsers={waitingUsers}
          onAdmit={id => setWaitingUsers(prev => prev.filter(u => u.identity !== id))}
          onDeny={id => setWaitingUsers(prev => prev.filter(u => u.identity !== id))}
          onAdmitAll={() => setWaitingUsers([])}
        />
      )}

      {/* Main Full-Bleed Video Area (Tap to reveal/hide controls) */}
      <div
        onClick={() => {
          if (!showControls) {
            resetControlsTimeout();
          } else {
            setShowControls(false);
          }
        }}
        className="relative flex-1 w-full h-full p-1 sm:p-2 cursor-pointer"
      >
        {screenShareTrack ? (
          <ScreenShareView
            screenTrack={screenShareTrack}
            cameraTracks={allParticipantTiles}
            hostIdentity={actualHostIdentity}
            isLocalSharing={isLocalScreenSharing}
            onStopShare={handleToggleScreenShare}
          />
        ) : (
          <VideoGrid
            tracks={allParticipantTiles}
            hostIdentity={actualHostIdentity}
            coHostIdentities={coHosts}
            raisedHandIdentities={raisedHands}
            customNames={customNames}
            isFocusView={isFocusView}
            onlyShowHost={onlyShowHostState}
            totalAudienceCount={totalConnectedCount}
          />
        )}
      </div>

      {/* Floating Reactions Overlay */}
      <ReactionsOverlay reactions={reactions} />

      {/* Floating Bottom Controls (Auto-Hides) */}
      <MeetingControls
        isMuted={!localParticipant?.isMicrophoneEnabled}
        isVideoMuted={!localParticipant?.isCameraEnabled}
        isScreenSharing={!!localParticipant?.isScreenShareEnabled}
        isHandRaised={isLocalHandRaised}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        unreadCount={unreadCount}
        participantCount={totalConnectedCount}
        isFocusView={isFocusView}
        isHost={isHost}
        isVisible={showControls}
        isFullscreen={isFullscreen}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleHand={handleToggleHand}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) setUnreadCount(0);
        }}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        onToggleViewMode={() => setIsFocusView(!isFocusView)}
        onSendReaction={handleSendReaction}
        onLeaveMeeting={onLeave}
        onEndMeetingForAll={isHost ? handleEndMeetingForAll : undefined}
        onCopyLink={handleCopyMeetingLink}
        isRecording={isRecording}
        onToggleRecord={() => setIsRecording(!isRecording)}
        onFlipCamera={handleFlipCamera}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Slide-out Panels */}
      <MeetingChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUserId={localParticipant?.identity || "me"}
      />

      <MeetingParticipants
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        participants={extendedParticipants}
        fakeParticipants={fakeUsers}
        isCurrentUserHost={isHost}
        isVoiceLocked={voiceLocked}
        isVideoLocked={videoLocked}
        onRenameSelf={handleRenameSelf}
        onMuteParticipant={handleMuteParticipant}
        onMuteAll={handleMuteAll}
        onLockAllVideo={handleLockAllVideo}
        onMakeCoHost={handleMakeCoHost}
        onLowerHand={id => setRaisedHands(prev => prev.filter(x => x !== id))}
      />

      {/* ⚙️ Host Live Webinar & Room Controls Modal */}
      {isHost && (
        <Modal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          title="Host & Webinar Live Controls"
          description="Manage voice lock, video lock, stage mode, and participant capacity."
          maxWidth="lg"
        >
          <div className="space-y-3.5 pt-1 font-[Poppins,sans-serif]">
            {/* 1. Voice Lock (Mute Attendees) */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                  <MicOff className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">Voice Lock (Mute Attendees)</p>
                  <p className="text-[11px] text-slate-500">Only host & co-hosts can speak. Attendees cannot unmute.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={adminVoiceLock}
                onChange={e => setAdminVoiceLock(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* 2. Video Lock (Disable Cameras) */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                  <VideoOff className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">Video Lock (Disable Cameras)</p>
                  <p className="text-[11px] text-slate-500">Attendees cannot broadcast video. Preserves bandwidth.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={adminVideoLock}
                onChange={e => setAdminVideoLock(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* 3. Webinar Stage Mode (Show Only Host) */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                  <Crown className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">Webinar Stage Mode (Show Only Host)</p>
                  <p className="text-[11px] text-slate-500">Only Host is shown full screen; attendees watch as audience without filling grid tiles.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={adminOnlyShowHost}
                onChange={e => setAdminOnlyShowHost(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* 4. Audience Capacity & Participant Scaling */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">Audience Capacity (Attendee Slots)</span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600">+{adminBoosterCount} connected</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={adminBoosterCount}
                  onChange={e => setAdminBoosterCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <div className="flex gap-1.5 shrink-0">
                  {[50, 100, 200, 500].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setAdminBoosterCount(cnt)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                        adminBoosterCount === cnt
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      +{cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action: Force Mute All */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={handleForceMuteAll}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
              >
                <VolumeX className="w-4 h-4 text-rose-600" />
                <span>Mute All Attendees Now</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowAdminModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAdminSettings}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                >
                  Save & Broadcast Live
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Mobile Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onRequestPermission={handleRetryPermission}
        mediaType={permissionMediaType}
        errorMessage={permissionError || undefined}
      />
    </div>
  );
}

export function MeetingRoom({
  serverUrl,
  token,
  roomName,
  meetingTitle,
  isHost = false,
  initialAudio = false,
  initialVideo = false,
  fakeUserCount = 200,
  isVoiceLocked = false,
  isVideoLocked = false,
  onlyShowHost = true,
  onLeave,
}: MeetingRoomProps) {
  const [connectError, setConnectError] = useState<string | null>(null);

  if (connectError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white relative overflow-hidden font-[Poppins,sans-serif]">
        <div className="relative z-10 w-full max-w-lg rounded-2xl border border-rose-500/30 bg-slate-900/95 p-8 text-center shadow-2xl backdrop-blur-md space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">LiveKit Connection Error</h2>
            <p className="text-xs text-rose-300 font-mono mt-1 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800/50">
              {connectError}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" onClick={onLeave} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to Dashboard</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConnectError(null);
                window.location.reload();
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              <span>Retry Connection</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={initialAudio && (!isVoiceLocked || isHost)}
      video={initialVideo && (!isVideoLocked || isHost)}
      options={{
        publishDefaults: {
          audioPreset: { maxBitrate: 64000 },
          dtx: true,
          red: true,
          simulcast: false,
          videoCodec: "vp8",
          screenShareEncoding: {
            maxBitrate: 3500000,
            maxFramerate: 30,
          },
        },
        audioCaptureDefaults: ZOOM_HD_AUDIO_OPTIONS,
        videoCaptureDefaults: {
          facingMode: "user",
        },
        adaptiveStream: true,
        dynacast: true,
      }}
      data-lk-theme="default"
      className="h-[100dvh] w-screen bg-[#070B14]"
      onError={err => {
        const msg = err?.message || "";
        if (
          msg.includes("token signature is invalid") ||
          msg.includes("invalid token")
        ) {
          console.error("Fatal LiveKit token signature error:", err);
          setConnectError(msg || "Authentication token rejected by LiveKit server.");
        } else {
          console.warn("LiveKit non-fatal engine event:", msg);
        }
      }}
    >
      <MeetingRoomInner
        roomName={roomName}
        meetingTitle={meetingTitle}
        isHost={isHost}
        initialAudio={initialAudio}
        initialVideo={initialVideo}
        fakeUserCount={fakeUserCount}
        isVoiceLocked={isVoiceLocked}
        isVideoLocked={isVideoLocked}
        onlyShowHost={onlyShowHost}
        onLeave={onLeave}
      />
    </LiveKitRoom>
  );
}
