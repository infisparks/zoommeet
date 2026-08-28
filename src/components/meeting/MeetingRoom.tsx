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
  useRoomContext,
  useAudioPlayback,
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
import { CommentPopupOverlay, CommentPopupItem } from "./CommentPopupOverlay";
import { HostWaitingRoomBanner, WaitingUser } from "./WaitingRoom";
import { SharedVideoPlayer, BackgroundAudioBar, YouTubeShareModal, SharedVideoState } from "./SharedVideoPlayer";
import { ChatMessage, ReactionItem, ChatInteractiveCard } from "@/types";
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
  Volume2,
  VolumeX,
  MessageSquare,
  Unlock,
  PictureInPicture2,
  Pin,
} from "lucide-react";
import { PermissionModal } from "./PermissionModal";
import { MiniMeetingWindow } from "./MiniMeetingWindow";
import { PinnedMessageBanner, PinnedMessage } from "./PinnedMessageBanner";
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
  showCommentPopup?: boolean;
  isChatLocked?: boolean;
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
  showCommentPopup = false,
  isChatLocked = false,
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
  showCommentPopup?: boolean;
  isChatLocked?: boolean;
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
  const [isMiniWindow, setIsMiniWindow] = useState(false);
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
  const [showCommentPopupState, setShowCommentPopupState] = useState(showCommentPopup ?? false);
  const [chatLocked, setChatLocked] = useState(!!isChatLocked);
  const [showBoosterModal, setShowBoosterModal] = useState(false);
  const [tempBoosterCount, setTempBoosterCount] = useState(fakeUserCount || 200);

  // System & Video Sound Share State (Persisted)
  const [shareSystemAudio, setShareSystemAudio] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zoomeet_share_system_audio");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const handleSetShareSystemAudio = (enabled: boolean) => {
    setShareSystemAudio(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("zoomeet_share_system_audio", String(enabled));
    }
  };

  // Browser Audio Playback Autoplay Policy Unblocker
  const room = useRoomContext();
  const { canPlayAudio, startAudio } = useAudioPlayback(room);

  // Shared YouTube Video State
  const [sharedVideo, setSharedVideo] = useState<SharedVideoState | null>(null);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);

  // Auto-attempt to unblock audio playback on any click or keypress
  useEffect(() => {
    if (!canPlayAudio && startAudio) {
      const handleUserInteraction = () => {
        startAudio().catch(e => console.warn("Auto startAudio notice:", e));
      };
      window.addEventListener("click", handleUserInteraction, { once: true });
      window.addEventListener("touchstart", handleUserInteraction, { once: true });
      window.addEventListener("keydown", handleUserInteraction, { once: true });
      return () => {
        window.removeEventListener("click", handleUserInteraction);
        window.removeEventListener("touchstart", handleUserInteraction);
        window.removeEventListener("keydown", handleUserInteraction);
      };
    }
  }, [canPlayAudio, startAudio]);

  // Host Admin Controls Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminVoiceLock, setAdminVoiceLock] = useState(!!isVoiceLocked);
  const [adminVideoLock, setAdminVideoLock] = useState(!!isVideoLocked);
  const [adminOnlyShowHost, setAdminOnlyShowHost] = useState(onlyShowHost ?? true);
  const [adminShowCommentPopup, setAdminShowCommentPopup] = useState(showCommentPopup ?? false);
  const [adminChatLock, setAdminChatLock] = useState(!!isChatLocked);
  const [adminBoosterCount, setAdminBoosterCount] = useState(fakeUserCount || 200);
  const [isCameraTransitioning, setIsCameraTransitioning] = useState(false);

  // Real-time State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [commentPopups, setCommentPopups] = useState<CommentPopupItem[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<PinnedMessage | null>(null);
  const [lockToast, setLockToast] = useState<{ message: string; type: "locked" | "unlocked" } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [raisedHands, setRaisedHands] = useState<string[]>([]);
  const [coHosts, setCoHosts] = useState<string[]>([]);
  const [allowedMicUsers, setAllowedMicUsers] = useState<string[]>([]);
  const [allowedVideoUsers, setAllowedVideoUsers] = useState<string[]>([]);
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  // Trigger 2-second Message Popup on Screen for all incoming/outgoing messages
  const triggerCommentPopup = useCallback(
    (senderName: string, message: string, interactiveCard?: ChatInteractiveCard) => {
      const id = `popup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newItem: CommentPopupItem = {
        id,
        senderName,
        message,
        timestamp: Date.now(),
        interactiveCard,
      };
      setCommentPopups(prev => [...prev.slice(-2), newItem]);

      // Automatically hide after exactly 2 seconds
      setTimeout(() => {
        setCommentPopups(prev => prev.filter(p => p.id !== id));
      }, 2000);
    },
    []
  );

  // Trigger small Lock/Unlock Notification Toast on Screen
  const triggerLockToast = useCallback((locked: boolean) => {
    setLockToast({
      message: locked ? "Comments have been locked by the host" : "Comments have been unlocked by the host",
      type: locked ? "locked" : "unlocked",
    });
    setTimeout(() => {
      setLockToast(null);
    }, 2800);
  }, []);

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

  // Lock body/html scroll and handle iOS Safari rotation/viewport changes
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Apply strict meeting lock class to body
    document.body.classList.add("meeting-active");
    document.documentElement.classList.add("meeting-active");

    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyPosition = document.body.style.position;
    const origBodyWidth = document.body.style.width;
    const origBodyHeight = document.body.style.height;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    // Handle iOS Safari orientation changes & bar hiding
    const handleViewportReset = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };

    handleViewportReset();
    window.addEventListener("orientationchange", handleViewportReset, { passive: true });
    window.addEventListener("resize", handleViewportReset, { passive: true });

    return () => {
      document.body.classList.remove("meeting-active");
      document.documentElement.classList.remove("meeting-active");
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.position = origBodyPosition;
      document.body.style.width = origBodyWidth;
      document.body.style.height = origBodyHeight;
      window.removeEventListener("orientationchange", handleViewportReset);
      window.removeEventListener("resize", handleViewportReset);
    };
  }, []);

  const requestFullscreenPolyfill = async (el: HTMLElement) => {
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        await (el as any).mozRequestFullScreen();
      } else if ((el as any).msRequestFullscreen) {
        await (el as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen polyfill notice:", err);
    }
  };

  const exitFullscreenPolyfill = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.warn("Exit fullscreen polyfill notice:", err);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        )
      );
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [resetControlsTimeout]);

  // Auto-detect mobile landscape orientation: auto-fullscreen & auto-hide UI to maximize video/screen share
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isMobile = window.innerWidth < 1024 || ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);

      if (isLandscape && isMobile) {
        setShowControls(false);
        setIsFullscreen(true);
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
          requestFullscreenPolyfill(document.documentElement).catch(() => {});
        }
      } else if (!isLandscape && isMobile && !document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("orientationchange", handleOrientation);
    window.addEventListener("resize", handleOrientation);
    if (screen?.orientation) {
      screen.orientation.addEventListener?.("change", handleOrientation);
    }

    handleOrientation();

    return () => {
      window.removeEventListener("orientationchange", handleOrientation);
      window.removeEventListener("resize", handleOrientation);
      if (screen?.orientation) {
        screen.orientation.removeEventListener?.("change", handleOrientation);
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const currentlyFull = isFullscreen || !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      if (!currentlyFull) {
        await requestFullscreenPolyfill(document.documentElement);
        setIsFullscreen(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (screen.orientation && "lock" in screen.orientation) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (screen.orientation as any).lock("landscape").catch(() => {});
        }
      } else {
        await exitFullscreenPolyfill();
        setIsFullscreen(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (screen.orientation && "unlock" in screen.orientation) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (screen.orientation as any).unlock?.().catch(() => {});
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle notice:", err);
      setIsFullscreen(prev => !prev);
    }
  };

  const handleToggleMiniWindow = async () => {
    try {
      const videoEl = document.querySelector("video") as HTMLVideoElement | null;
      if (document.pictureInPictureEnabled && videoEl && !document.pictureInPictureElement) {
        await videoEl.requestPictureInPicture();
        return;
      }
    } catch (e) {
      console.warn("Native PiP notice:", e);
    }
    // Fallback or explicit In-App Pop-up Window
    setIsMiniWindow(prev => !prev);
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
          await localParticipant.setCameraEnabled(true, { facingMode: cameraFacing });
        } catch (e) {
          console.warn("Initial camera publish notice:", e);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localParticipant, connectionState, initialAudio, initialVideo, cameraFacing, voiceLocked, videoLocked, isHost]);

  // Load initial chat history and persistent pinned message
  useEffect(() => {
    chatService.getMessages(roomName).then(msgs => {
      if (msgs && msgs.length > 0) {
        setMessages(msgs);
      }
    });

    if (typeof window !== "undefined") {
      try {
        const savedPin = localStorage.getItem(`infiplus_pinned_${roomName.toLowerCase().trim()}`);
        if (savedPin) {
          setPinnedMessage(JSON.parse(savedPin));
        }
      } catch {}
    }
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
          interactiveCard: data.interactiveCard,
        };
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        chatService.saveMessage(newMsg);
        if (!isChatOpen) {
          setUnreadCount(prev => prev + 1);
        }
        triggerCommentPopup(data.participantName, data.message, data.interactiveCard);
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
        if (typeof data.showCommentPopup === "boolean") {
          setShowCommentPopupState(data.showCommentPopup);
        }
        if (typeof data.chatLocked === "boolean") {
          if (data.chatLocked !== chatLocked) {
            triggerLockToast(data.chatLocked);
          }
          setChatLocked(data.chatLocked);
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
      } else if (data.type === "user_mic_permission_toggle") {
        if (data.identity) {
          setAllowedMicUsers(prev =>
            data.allowed ? (prev.includes(data.identity) ? prev : [...prev, data.identity]) : prev.filter(id => id !== data.identity)
          );
          if (localParticipant && localParticipant.identity === data.identity) {
            if (data.allowed) {
              alert("🎉 The host has granted you microphone permission. You can now unmute to speak.");
            } else {
              alert("🎙️ Your microphone permission has been revoked by the host.");
              localParticipant.setMicrophoneEnabled(false).catch(() => {});
            }
          }
        }
      } else if (data.type === "user_video_permission_toggle") {
        if (data.identity) {
          setAllowedVideoUsers(prev =>
            data.allowed ? (prev.includes(data.identity) ? prev : [...prev, data.identity]) : prev.filter(id => id !== data.identity)
          );
          if (localParticipant && localParticipant.identity === data.identity) {
            if (data.allowed) {
              alert("🎉 The host has granted you camera permission. You can now turn on your camera.");
            } else {
              alert("📹 Your camera permission has been revoked by the host.");
              localParticipant.setCameraEnabled(false).catch(() => {});
            }
          }
        }
      } else if (data.type === "pinned_message_update") {
        setPinnedMessage(data.pinnedMessage || null);
        if (typeof window !== "undefined") {
          const key = `infiplus_pinned_${roomName.toLowerCase().trim()}`;
          if (data.pinnedMessage) {
            localStorage.setItem(key, JSON.stringify(data.pinnedMessage));
          } else {
            localStorage.removeItem(key);
          }
        }
      } else if (data.type === "rename_participant") {
        if (data.identity && data.newName) {
          setCustomNames(prev => ({ ...prev, [data.identity]: data.newName }));
        }
      } else if (data.type === "shared_video") {
        if (data.action === "start" && data.videoState) {
          setSharedVideo(data.videoState);
        } else if (data.action === "stop") {
          setSharedVideo(null);
        }
      }
    } catch (e) {
      console.warn("Error decoding data channel packet", e);
    }
  }, [roomName, isChatOpen, localParticipant, isHost, onLeave, triggerCommentPopup]);

  const { send } = useDataChannel(onDataReceived);

  const handleStartSharedVideo = (url: string) => {
    if (!localParticipant) return;
    const newVideoState: SharedVideoState = {
      url,
      isPlaying: true,
      sharerName: localParticipant.name || "Host",
      sharerIdentity: localParticipant.identity,
    };
    setSharedVideo(newVideoState);
    const payload = JSON.stringify({
      type: "shared_video",
      action: "start",
      videoState: newVideoState,
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleStopSharedVideo = () => {
    setSharedVideo(null);
    const payload = JSON.stringify({
      type: "shared_video",
      action: "stop",
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleToggleBackgroundSharedVideo = () => {
    if (!sharedVideo) return;
    const nextState = { ...sharedVideo, isBackground: !sharedVideo.isBackground };
    setSharedVideo(nextState);
    const payload = JSON.stringify({
      type: "shared_video",
      action: "start",
      videoState: nextState,
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  // Tracks for Camera, Screen Sharing, and Screen Audio
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.ScreenShareAudio, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenShareTrack = tracks.find(
    t => t.source === Track.Source.ScreenShare && isTrackReference(t)
  );

  const isLocalScreenSharing = !!localParticipant?.isScreenShareEnabled;
  const localScreenAudioPub = localParticipant?.getTrackPublication(Track.Source.ScreenShareAudio);
  const isLocalScreenAudioActive = !!localScreenAudioPub && !localScreenAudioPub.isMuted;
  const isScreenAudioTransmitting =
    isLocalScreenAudioActive ||
    tracks.some(t => t.source === Track.Source.ScreenShareAudio && isTrackReference(t) && !t.publication?.isMuted);

  const isScreenAudioMuted = !!localScreenAudioPub?.isMuted;

  const handleToggleScreenAudioMute = async () => {
    if (!localParticipant) return;
    const pub = localParticipant.getTrackPublication(Track.Source.ScreenShareAudio);
    if (pub) {
      if (pub.isMuted) {
        await pub.unmute();
      } else {
        await pub.mute();
      }
    }
  };

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
    const hasMicPermission = isHost || isCoHost || allowedMicUsers.includes(localParticipant.identity);
    if (voiceLocked && !hasMicPermission) {
      alert("🎙️ Microphone is locked by the host for this webinar. Raise your hand to request speaking permission.");
      return;
    }

    const currentStatus = localParticipant.isMicrophoneEnabled;
    const nextStatus = !currentStatus;

    api.logDiagnostic(roomName, {
      action: "mic_toggle_click",
      message: `Toggle mic: ${currentStatus ? "ON -> OFF" : "OFF -> ON"}`,
      participant: localParticipant.identity,
    });

    try {
      await localParticipant.setMicrophoneEnabled(nextStatus, ZOOM_HD_AUDIO_OPTIONS);
    } catch (err: unknown) {
      console.warn("Microphone toggle notice, retrying fallback:", err);
      try {
        await localParticipant.setMicrophoneEnabled(nextStatus);
      } catch (fallbackErr: unknown) {
        const error = fallbackErr as Error;
        api.logDiagnostic(roomName, {
          action: "mic_toggle_error",
          message: error?.message || "Unknown mic error",
          level: "error",
          participant: localParticipant.identity,
        });
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
    if (!localParticipant || isCameraTransitioning) return;
    const isCoHost = coHosts.includes(localParticipant.identity);
    const hasVideoPermission = isHost || isCoHost || allowedVideoUsers.includes(localParticipant.identity);
    if (videoLocked && !hasVideoPermission) {
      alert("📹 Video is locked by the host for this webinar.");
      return;
    }

    const currentStatus = localParticipant.isCameraEnabled;
    const nextStatus = !currentStatus;
    setIsCameraTransitioning(true);

    api.logDiagnostic(roomName, {
      action: "camera_toggle_click",
      message: `Toggle camera initiated: ${currentStatus ? "ON -> OFF" : "OFF -> ON"}`,
      participant: localParticipant.identity,
      details: { facingMode: cameraFacing },
    });

    try {
      if (!nextStatus) {
        await localParticipant.setCameraEnabled(false);
        api.logDiagnostic(roomName, {
          action: "camera_disabled_success",
          message: "Camera turned OFF successfully",
          participant: localParticipant.identity,
        });
      } else {
        await localParticipant.setCameraEnabled(true, {
          facingMode: cameraFacing,
        });
        api.logDiagnostic(roomName, {
          action: "camera_enabled_success",
          message: "Camera turned ON successfully",
          participant: localParticipant.identity,
        });
      }
    } catch (err: unknown) {
      const fbError = err as Error;
      api.logDiagnostic(roomName, {
        action: "camera_toggle_error",
        message: fbError?.message || "Unknown camera error",
        level: "error",
        participant: localParticipant.identity,
        details: { name: fbError?.name },
      });
      console.warn("Camera fallback notice:", fbError);
      if (
        fbError.name === "NotAllowedError" ||
        fbError.name === "PermissionDeniedError"
      ) {
        setPermissionMediaType("camera");
        setPermissionError("Camera access was denied. Please allow camera in browser settings.");
        setShowPermissionModal(true);
      }
    } finally {
      setIsCameraTransitioning(false);
    }
  };

  const handleFlipCamera = async () => {
    if (!localParticipant || !localParticipant.isCameraEnabled) return;
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(nextFacing);
    try {
      await localParticipant.setCameraEnabled(true, { facingMode: nextFacing });
      api.logDiagnostic(roomName, {
        action: "camera_flip_success",
        message: `Flipped camera facing mode to ${nextFacing}`,
        participant: localParticipant.identity,
      });
    } catch (e) {
      console.warn("Flip camera fallback:", e);
    }
  };

  const handleToggleScreenShare = async (forceWithAudio?: boolean) => {
    if (!localParticipant) return;
    const isCoHost = coHosts.includes(localParticipant.identity);
    const hasVideoPermission = isHost || isCoHost || allowedVideoUsers.includes(localParticipant.identity);
    if (videoLocked && !hasVideoPermission) {
      alert("📹 Screen sharing is locked by the host for this webinar.");
      return;
    }

    const nextStatus = !localParticipant.isScreenShareEnabled;
    const withAudio = forceWithAudio !== undefined ? forceWithAudio : shareSystemAudio;

    api.logDiagnostic(roomName, {
      action: "screen_share_toggle_click",
      message: `Toggle screen share: ${nextStatus ? "START" : "STOP"} (withAudio: ${withAudio})`,
      participant: localParticipant.identity,
    });

    try {
      if (localParticipant.isScreenShareEnabled) {
        await localParticipant.setScreenShareEnabled(false);
        api.logDiagnostic(roomName, {
          action: "screen_share_stopped_success",
          message: "Screen share stopped successfully",
          participant: localParticipant.identity,
        });
      } else {
        if (withAudio) {
          try {
            await localParticipant.setScreenShareEnabled(true, {
              audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
              },
              systemAudio: "include",
              selfBrowserSurface: "include",
              surfaceSwitching: "include",
              suppressLocalAudioPlayback: false,
            });
          } catch (optErr) {
            console.warn("Screen share advanced audio options fallback:", optErr);
            try {
              await localParticipant.setScreenShareEnabled(true, {
                audio: true,
                systemAudio: "include",
              });
            } catch (basicErr) {
              console.warn("Screen share audio fallback to video only:", basicErr);
              await localParticipant.setScreenShareEnabled(true);
            }
          }
        } else {
          await localParticipant.setScreenShareEnabled(true, {
            audio: false,
          });
        }

        api.logDiagnostic(roomName, {
          action: "screen_share_started_success",
          message: `Screen share started successfully (audio: ${withAudio})`,
          participant: localParticipant.identity,
        });
      }
    } catch (e: unknown) {
      const err = e as Error;
      api.logDiagnostic(roomName, {
        action: "screen_share_error",
        message: err?.message || "Screen share error",
        level: "error",
        participant: localParticipant.identity,
        details: { name: err?.name },
      });
      console.warn("Screen share notice:", err?.message || err);
      if (err.name !== "AbortError" && !err.message?.includes("Permission denied") && !err.message?.includes("cancelled")) {
        alert("Screen sharing notice: " + (err.message || "Please check your browser permissions"));
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

  const handleSendMessage = (
    text: string,
    interactiveCard?: ChatInteractiveCard,
    andPin: boolean = false
  ) => {
    if (!localParticipant) return;
    if (chatLocked && !isHost && !coHosts.includes(localParticipant.identity)) {
      alert("Comments are currently locked by the host.");
      return;
    }
    const senderName = localParticipant.name || "Participant";
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      meetingId: roomName,
      participantId: localParticipant.identity,
      participantName: senderName,
      message: text,
      timestamp: Date.now(),
      interactiveCard,
    };

    setMessages(prev => {
      if (prev.some(m => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    chatService.saveMessage(newMsg);
    triggerCommentPopup(senderName, text, interactiveCard);

    const payload = JSON.stringify({
      type: "chat",
      id: newMsg.id,
      participantId: localParticipant.identity,
      participantName: senderName,
      message: text,
      timestamp: newMsg.timestamp,
      interactiveCard,
    });
    send(new TextEncoder().encode(payload), { reliable: true });

    if (andPin && isHost) {
      handlePinMessage(newMsg);
    }
  };

  const handlePinMessage = (msg: ChatMessage) => {
    if (!isHost) return;
    const item: PinnedMessage = {
      id: msg.id,
      participantId: msg.participantId,
      participantName: msg.participantName,
      message: msg.message,
      timestamp: msg.timestamp,
      pinnedBy: localParticipant?.name || "Host",
      pinnedAt: Date.now(),
      interactiveCard: msg.interactiveCard,
    };
    setPinnedMessage(item);
    if (typeof window !== "undefined") {
      localStorage.setItem(`infiplus_pinned_${roomName.toLowerCase().trim()}`, JSON.stringify(item));
    }

    const payload = JSON.stringify({
      type: "pinned_message_update",
      pinnedMessage: item,
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleUnpinMessage = () => {
    if (!isHost) return;
    setPinnedMessage(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`infiplus_pinned_${roomName.toLowerCase().trim()}`);
    }

    const payload = JSON.stringify({
      type: "pinned_message_update",
      pinnedMessage: null,
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleToggleChatLock = async () => {
    if (!isHost) return;
    const newLocked = !chatLocked;
    setChatLocked(newLocked);
    setAdminChatLock(newLocked);
    triggerLockToast(newLocked);

    const payload = JSON.stringify({
      type: "room_settings_update",
      voiceLocked,
      videoLocked,
      onlyShowHost: onlyShowHostState,
      showCommentPopup: showCommentPopupState,
      chatLocked: newLocked,
      fuserCount,
    });
    send(new TextEncoder().encode(payload), { reliable: true });

    try {
      await api.updateMeetingLocks(roomName, {
        isVoiceLocked: voiceLocked,
        isVideoLocked: videoLocked,
        onlyShowHost: onlyShowHostState,
        showCommentPopup: showCommentPopupState,
        isChatLocked: newLocked,
        fakeUserCount: fuserCount,
      });
    } catch (e) {
      console.warn("Meeting locks backend sync notice:", e);
    }
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
    const isNowCoHost = !coHosts.includes(identity);
    setCoHosts(prev => (isNowCoHost ? [...prev, identity] : prev.filter(id => id !== identity)));
    const payload = JSON.stringify({
      type: "cohost_toggle",
      identity,
      isCoHost: isNowCoHost,
    });
    send(new TextEncoder().encode(payload), { reliable: true });
  };

  const handleToggleMicPermission = (identity: string, allow: boolean) => {
    setAllowedMicUsers(prev => (allow ? [...prev, identity] : prev.filter(id => id !== identity)));
    const payload = JSON.stringify({
      type: "user_mic_permission_toggle",
      identity,
      allowed: allow,
    });
    send(new TextEncoder().encode(payload), { reliable: true });

    if (!allow) {
      const lockPayload = JSON.stringify({ type: "force_mute", targetIdentity: identity });
      send(new TextEncoder().encode(lockPayload), { reliable: true });
    }
  };

  const handleToggleVideoPermission = (identity: string, allow: boolean) => {
    setAllowedVideoUsers(prev => (allow ? [...prev, identity] : prev.filter(id => id !== identity)));
    const payload = JSON.stringify({
      type: "user_video_permission_toggle",
      identity,
      allowed: allow,
    });
    send(new TextEncoder().encode(payload), { reliable: true });

    if (!allow) {
      const lockPayload = JSON.stringify({ type: "force_lock_video" });
      send(new TextEncoder().encode(lockPayload), { reliable: true });
    }
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
    setAdminShowCommentPopup(showCommentPopupState);
    setAdminChatLock(chatLocked);
    setAdminBoosterCount(fuserCount);
    setShowAdminModal(true);
  };

  const handleSaveAdminSettings = async () => {
    setVoiceLocked(adminVoiceLock);
    setVideoLocked(adminVideoLock);
    setOnlyShowHostState(adminOnlyShowHost);
    setShowCommentPopupState(adminShowCommentPopup);
    setChatLocked(adminChatLock);
    if (adminChatLock !== chatLocked) {
      triggerLockToast(adminChatLock);
    }
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
      showCommentPopup: adminShowCommentPopup,
      chatLocked: adminChatLock,
      fuserCount: adminBoosterCount,
    });
    send(new TextEncoder().encode(payload), { reliable: true });

    // Sync to backend Firebase RTDB
    try {
      await api.updateMeetingLocks(roomName, {
        isVoiceLocked: adminVoiceLock,
        isVideoLocked: adminVideoLock,
        onlyShowHost: adminOnlyShowHost,
        showCommentPopup: adminShowCommentPopup,
        isChatLocked: adminChatLock,
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
    hasMicPermission: isHost || coHosts.includes(p.identity) || allowedMicUsers.includes(p.identity) || !voiceLocked,
    hasVideoPermission: isHost || coHosts.includes(p.identity) || allowedVideoUsers.includes(p.identity) || !videoLocked,
    livekitParticipant: p,
  }));

  const isLocalHandRaised = localParticipant
    ? raisedHands.includes(localParticipant.identity)
    : false;

  const isCoHost = localParticipant ? coHosts.includes(localParticipant.identity) : false;
  const hasLocalMicPermission = isHost || isCoHost || (localParticipant ? allowedMicUsers.includes(localParticipant.identity) : false);
  const hasLocalVideoPermission = isHost || isCoHost || (localParticipant ? allowedVideoUsers.includes(localParticipant.identity) : false);
  const isMicLockedForUser = voiceLocked && !hasLocalMicPermission;
  const isVideoLockedForUser = videoLocked && !hasLocalVideoPermission;

  const totalConnectedCount = participants.length + fakeUsers.length;

  const actualHostIdentity = isHost
    ? localParticipant?.identity
    : (participants.find(p => !p.isLocal && (p.identity.startsWith("usr_") || p.name?.toLowerCase().includes("admin") || p.name?.toLowerCase().includes("host")))?.identity
      || participants.find(p => !p.isLocal)?.identity
      || localParticipant?.identity);

  return (
    <div
      className="fixed inset-0 z-40 flex h-full w-full flex-col bg-[#070B14] text-white overflow-hidden select-none font-[Poppins,sans-serif] overscroll-none touch-manipulation"
      style={{
        height: "100dvh",
        width: "100dvw",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        overscrollBehavior: "none",
      }}
    >
      {/* Audio Renderer for remote audio tracks */}
      <RoomAudioRenderer />

      {/* Minimal Floating Top Pill (Auto-Hides) */}
      <div
        className={`absolute z-20 flex items-center justify-between pointer-events-none transition-all duration-300 ${
          showControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-8 pointer-events-none"
        }`}
        style={{
          top: "max(0.5rem, env(safe-area-inset-top, 0px))",
          left: "max(0.5rem, env(safe-area-inset-left, 0px))",
          right: "max(0.5rem, env(safe-area-inset-right, 0px))",
        }}
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
            onClick={handleToggleMiniWindow}
            className="flex items-center justify-center h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-full bg-slate-900/90 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 backdrop-blur-md transition active:scale-95 cursor-pointer shadow-md"
            title="Pop-up Window (Picture-in-Picture)"
          >
            <PictureInPicture2 className="h-3.5 w-3.5" />
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

      {/* Floating In-App Mini Pop-up Window */}
      {isMiniWindow && (
        <MiniMeetingWindow
          meetingTitle={meetingTitle}
          roomName={roomName}
          elapsedSeconds={elapsedSeconds}
          activeTrack={allParticipantTiles[0]}
          isMuted={!localParticipant?.isMicrophoneEnabled}
          isVideoMuted={!localParticipant?.isCameraEnabled}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
          onExpand={() => setIsMiniWindow(false)}
          onLeave={onLeave}
        />
      )}

      {/* Host Waiting Room Banner */}
      {isHost && (
        <HostWaitingRoomBanner
          waitingUsers={waitingUsers}
          onAdmit={id => setWaitingUsers(prev => prev.filter(u => u.identity !== id))}
          onDeny={id => setWaitingUsers(prev => prev.filter(u => u.identity !== id))}
          onAdmitAll={() => setWaitingUsers([])}
        />
      )}

      {/* Browser Autoplay Audio Unblock Banner */}
      {!canPlayAudio && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-indigo-600 border border-indigo-400 px-4 py-2 text-xs font-bold text-white shadow-2xl animate-bounce">
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span>Meeting audio is paused by your browser</span>
          <button
            type="button"
            onClick={() => startAudio()}
            className="rounded-xl bg-white px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-slate-100 shadow-md cursor-pointer"
          >
            Enable Audio
          </button>
        </div>
      )}

      {/* Background Audio Pill when minimized */}
      {sharedVideo && sharedVideo.isBackground && (
        <BackgroundAudioBar
          videoState={sharedVideo}
          isHost={isHost || sharedVideo.sharerIdentity === localParticipant?.identity}
          onExpand={handleToggleBackgroundSharedVideo}
          onClose={handleStopSharedVideo}
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
        className="relative flex-1 min-h-0 min-w-0 w-full h-full p-1 sm:p-2 cursor-pointer overflow-hidden flex flex-col"
      >
        {sharedVideo && !sharedVideo.isBackground ? (
          <SharedVideoPlayer
            videoState={sharedVideo}
            isHost={isHost || sharedVideo.sharerIdentity === localParticipant?.identity}
            onToggleBackground={handleToggleBackgroundSharedVideo}
            onClose={handleStopSharedVideo}
          />
        ) : screenShareTrack ? (
          <ScreenShareView
            screenTrack={screenShareTrack}
            cameraTracks={allParticipantTiles}
            hostIdentity={actualHostIdentity}
            isCurrentUserHost={isHost}
            isLocalSharing={isLocalScreenSharing}
            isScreenAudioActive={isScreenAudioTransmitting}
            totalAudienceCount={totalConnectedCount}
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

      {/* Admin Pinned Message & Link Banner on Screen */}
      <PinnedMessageBanner
        pinnedMessage={pinnedMessage}
        isCurrentUserHost={isHost}
        onUnpin={handleUnpinMessage}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Floating 2-Second Comment Popups Overlay */}
      <CommentPopupOverlay popups={commentPopups} />

      {/* Floating System Lock / Unlock Toast Notification */}
      {lockToast && (
        <div
          className={`fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-2xl backdrop-blur-2xl border animate-in slide-in-from-top-4 fade-in duration-200 pointer-events-none select-none font-[Poppins,sans-serif] ${
            lockToast.type === "locked"
              ? "bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-950/50"
              : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50"
          }`}
        >
          {lockToast.type === "locked" ? (
            <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span>{lockToast.message}</span>
        </div>
      )}

      {/* Floating Reactions Overlay */}
      <ReactionsOverlay reactions={reactions} />

      {/* Floating Bottom Controls (Auto-Hides) */}
      <MeetingControls
        isMuted={!localParticipant?.isMicrophoneEnabled}
        isVideoMuted={!localParticipant?.isCameraEnabled}
        isMicLocked={isMicLockedForUser}
        isVideoLocked={isVideoLockedForUser}
        isScreenSharing={!!localParticipant?.isScreenShareEnabled}
        isScreenAudioActive={isLocalScreenAudioActive}
        isScreenAudioMuted={isScreenAudioMuted}
        shareSystemAudio={shareSystemAudio}
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
        onToggleScreenAudioMute={handleToggleScreenAudioMute}
        onSetShareSystemAudio={handleSetShareSystemAudio}
        onOpenYouTubeShare={isHost ? () => setShowYouTubeModal(true) : undefined}
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
        onToggleMiniWindow={handleToggleMiniWindow}
        isRecording={isRecording}
        onToggleRecord={() => setIsRecording(!isRecording)}
        onFlipCamera={handleFlipCamera}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* YouTube Direct Broadcast Modal */}
      <YouTubeShareModal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        onStartShare={handleStartSharedVideo}
      />

      {/* Slide-out Panels */}
      <MeetingChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUserId={localParticipant?.identity || "me"}
        isChatLocked={chatLocked}
        isCurrentUserHost={isHost}
        onToggleChatLock={isHost ? handleToggleChatLock : undefined}
        pinnedMessage={pinnedMessage}
        onPinMessage={isHost ? handlePinMessage : undefined}
        onUnpinMessage={isHost ? handleUnpinMessage : undefined}
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
        onToggleMicPermission={handleToggleMicPermission}
        onToggleVideoPermission={handleToggleVideoPermission}
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

            {/* 3. Show Only Admin Screen (Default: Checked) */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                  <Crown className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">Show Only Admin Screen (Default)</p>
                  <p className="text-[11px] text-slate-500">When checked, only the Admin screen fills the stage for everyone (like screen share). Uncheck to let all participants see all screens in a shared grid.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={adminOnlyShowHost}
                onChange={e => setAdminOnlyShowHost(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* 4. Show Comment Popups on Screen (Default: Hidden) */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">Show Comment Popups on Screen</p>
                  <p className="text-[11px] text-slate-500">When enabled (unhidden), incoming chat comments pop up for 2 seconds on screen for all participants. Default: Hidden.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={adminShowCommentPopup}
                onChange={e => setAdminShowCommentPopup(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* 5. Chat / Comment Lock (Mute Messages) */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">Chat / Comment Lock (Mute Messages)</p>
                  <p className="text-[11px] text-slate-500">When checked, attendees cannot send comments. Only Host can send messages.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={adminChatLock}
                onChange={e => setAdminChatLock(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* 6. Audience Capacity & Participant Scaling */}
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
  showCommentPopup = false,
  isChatLocked = false,
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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-[#070B14] touch-none overscroll-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
      }}
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
        showCommentPopup={showCommentPopup}
        isChatLocked={isChatLocked}
        onLeave={onLeave}
      />
    </LiveKitRoom>
  );
}
