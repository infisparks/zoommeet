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
import { Track, ConnectionState } from "livekit-client";
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
import {
  Video as VideoIcon,
  WifiOff,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Check,
  Share2,
  Sparkles,
} from "lucide-react";

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
  onLeave: () => void;
}

function MeetingRoomInner({
  roomName,
  meetingTitle,
  isHost = false,
  initialAudio = false,
  initialVideo = false,
  onLeave,
}: {
  roomName: string;
  meetingTitle?: string;
  isHost?: boolean;
  initialAudio?: boolean;
  initialVideo?: boolean;
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

  // Real-time State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [raisedHands, setRaisedHands] = useState<string[]>([]);
  const [coHosts, setCoHosts] = useState<string[]>([]);
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);

  // Meeting Duration Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [participantToast, setParticipantToast] = useState<string | null>(null);
  const publishedInitialRef = useRef(false);
  const prevCountRef = useRef(participants.length);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const krispProcessorRef = useRef<any>(null);

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
    if (participants.length > prevCountRef.current && prevCountRef.current > 0) {
      const latest = participants[participants.length - 1];
      const name = latest?.name || latest?.identity || "Someone";
      setParticipantToast(`${name} joined the room`);
      const timer = setTimeout(() => setParticipantToast(null), 4000);
      prevCountRef.current = participants.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = participants.length;
  }, [participants]);

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

  // Attempt initial audio/video publishing ONLY once fully connected
  useEffect(() => {
    if (!localParticipant || connectionState !== ConnectionState.Connected) return;
    if (publishedInitialRef.current) return;
    publishedInitialRef.current = true;

    if (initialAudio && !localParticipant.isMicrophoneEnabled) {
      const audioOptions = {
        ...ZOOM_HD_AUDIO_OPTIONS,
        ...(krispProcessorRef.current ? { processor: krispProcessorRef.current } : {}),
      };
      localParticipant.setMicrophoneEnabled(true, audioOptions).catch(err => {
        console.warn("Initial microphone publish notice:", err);
      });
    }

    if (initialVideo && !localParticipant.isCameraEnabled) {
      localParticipant.setCameraEnabled(true, { facingMode: cameraFacing }).catch(err => {
        console.warn("Initial camera publish with facingMode failed, retrying default:", err);
        localParticipant.setCameraEnabled(true).catch(e => console.warn("Camera init fallback failed:", e));
      });
    }
  }, [localParticipant, connectionState, initialAudio, initialVideo, cameraFacing]);

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
      }
    } catch (e) {
      console.warn("Error decoding data channel packet", e);
    }
  }, [roomName, isChatOpen, localParticipant, onLeave]);

  const { send } = useDataChannel(onDataReceived);

  // Tracks for Camera and Screen Sharing
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const cameraTracks = tracks.filter(t => t.source === Track.Source.Camera);
  const screenShareTrack = tracks.find(
    t => t.source === Track.Source.ScreenShare && isTrackReference(t)
  );

  // Guarantee every participant connected in the room (local or remote) is ALWAYS in the video grid
  const allParticipantTiles = React.useMemo(() => {
    const tileMap = new Map<string, TrackReferenceOrPlaceholder>();

    // 1. First add all detected camera tracks/placeholders
    cameraTracks.forEach(t => {
      if (t.participant?.identity) {
        tileMap.set(t.participant.identity, t);
      }
    });

    // 2. Ensure every participant from useParticipants() has a tile even before camera publication
    participants.forEach(p => {
      if (!tileMap.has(p.identity)) {
        tileMap.set(p.identity, {
          participant: p,
          source: Track.Source.Camera,
        } as TrackReferenceOrPlaceholder);
      }
    });

    // 3. Fallback: ensure local participant is always present
    if (localParticipant && !tileMap.has(localParticipant.identity)) {
      tileMap.set(localParticipant.identity, {
        participant: localParticipant,
        source: Track.Source.Camera,
      } as TrackReferenceOrPlaceholder);
    }

    return Array.from(tileMap.values());
  }, [cameraTracks, participants, localParticipant]);

  const isLocalScreenSharing = Boolean(
    localParticipant &&
    screenShareTrack &&
    screenShareTrack.participant?.identity === localParticipant.identity
  );

  const handleCopyMeetingLink = () => {
    const url = `${window.location.origin}/meeting/${roomName}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Media Controls Actions
  const handleToggleMic = async () => {
    if (!localParticipant) return;
    try {
      const isCurrentlyEnabled = localParticipant.isMicrophoneEnabled;
      if (!isCurrentlyEnabled) {
        const audioOptions = {
          ...ZOOM_HD_AUDIO_OPTIONS,
          ...(krispProcessorRef.current ? { processor: krispProcessorRef.current } : {}),
        };
        await localParticipant.setMicrophoneEnabled(true, audioOptions);
      } else {
        await localParticipant.setMicrophoneEnabled(false);
      }
    } catch (err) {
      console.warn("Microphone toggle notice:", err);
    }
  };

  const handleToggleVideo = async () => {
    if (!localParticipant) return;
    try {
      const isCurrentlyEnabled = localParticipant.isCameraEnabled;
      if (!isCurrentlyEnabled) {
        try {
          await localParticipant.setCameraEnabled(true, { facingMode: cameraFacing });
        } catch (e) {
          console.warn("Camera start with facingMode failed, retrying standard:", e);
          await localParticipant.setCameraEnabled(true);
        }
      } else {
        await localParticipant.setCameraEnabled(false);
      }
    } catch (err) {
      console.warn("Camera toggle notice:", err);
    }
  };

  const handleFlipCamera = async () => {
    if (!localParticipant) return;
    try {
      const nextFacing = cameraFacing === "user" ? "environment" : "user";
      await localParticipant.setCameraEnabled(false);
      try {
        await localParticipant.setCameraEnabled(true, { facingMode: nextFacing });
      } catch {
        await localParticipant.setCameraEnabled(true);
      }
      setCameraFacing(nextFacing);
    } catch (err) {
      console.warn("Flip camera notice:", err);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!localParticipant) return;
    try {
      const isSharing = localParticipant.isScreenShareEnabled;
      if (isSharing) {
        await localParticipant.setScreenShareEnabled(false);
      } else {
        await localParticipant.setScreenShareEnabled(true, {
          audio: false,
          selfBrowserSurface: "include",
          surfaceSwitching: "include",
        });
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.warn("Screen share notice:", err?.message || err);
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
    participants.forEach(p => {
      if (!p.isLocal) {
        handleMuteParticipant(p.identity);
      }
    });
  };

  const handleMakeCoHost = (identity: string) => {
    setCoHosts(prev =>
      prev.includes(identity) ? prev.filter(id => id !== identity) : [...prev, identity]
    );
  };

  // Build extended participant details for panel
  const extendedParticipants: ExtendedParticipantInfo[] = participants.map(p => ({
    identity: p.identity,
    name: p.name || p.identity,
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

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-[#070B14] text-white overflow-hidden select-none font-[Poppins,sans-serif]">
      {/* Audio Renderer for remote audio tracks */}
      <RoomAudioRenderer />

      {/* Top Floating Info Bar */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Meeting Title & Timer */}
        <div className="flex items-center gap-3 rounded-2xl bg-slate-900/90 px-4 py-2 border border-white/10 backdrop-blur-xl pointer-events-auto shadow-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <VideoIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white max-w-[180px] sm:max-w-xs truncate">
              {meetingTitle || roomName}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{formatTimer(elapsedSeconds)}</span>
              <span>•</span>
              <span className="text-indigo-300">Room: {roomName}</span>
            </div>
          </div>
        </div>

        {/* Right: Copy Meeting Link & Security Indicators */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleCopyMeetingLink}
            className="flex items-center gap-1.5 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white border border-indigo-400/30 backdrop-blur-xl shadow-lg transition active:scale-95 cursor-pointer"
            title="Click to copy invitation link"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span className="text-emerald-200">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-indigo-200" />
                <span className="hidden sm:inline">Invite / Copy Link</span>
                <span className="sm:hidden">Share</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-900/90 px-3.5 py-2 border border-white/10 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              {connectionState === ConnectionState.Connected ? (
                <>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs sm:text-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="hidden md:inline">SFU Live</span>
                  </span>
                  <div className="h-3.5 w-px bg-white/20 hidden sm:block" />
                  <span className="hidden sm:flex items-center gap-1 text-[11px] text-indigo-300 font-medium bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-400/20">
                    <Sparkles className="w-3 h-3 text-indigo-300" />
                    <span>HD Noise Cancel</span>
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-medium text-xs">
                  <WifiOff className="h-4 w-4" />
                  <span>Connecting...</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Participant Join Notification Toast */}
      {participantToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl bg-indigo-600/95 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xl backdrop-blur-xl border border-indigo-400/40 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{participantToast}</span>
        </div>
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

      {/* Main Video Area */}
      <div className="relative flex-1 w-full h-full pt-16 pb-24 sm:pb-28">
        {screenShareTrack ? (
          <ScreenShareView
            screenTrack={screenShareTrack}
            cameraTracks={allParticipantTiles}
            hostIdentity={isHost ? localParticipant?.identity : undefined}
            isLocalSharing={isLocalScreenSharing}
            onStopShare={handleToggleScreenShare}
          />
        ) : (
          <VideoGrid
            tracks={allParticipantTiles}
            hostIdentity={isHost ? localParticipant?.identity : undefined}
            coHostIdentities={coHosts}
            raisedHandIdentities={raisedHands}
            isFocusView={isFocusView}
          />
        )}
      </div>

      {/* Floating Reactions Overlay */}
      <ReactionsOverlay reactions={reactions} />

      {/* Floating Bottom Controls */}
      <MeetingControls
        isMuted={!localParticipant?.isMicrophoneEnabled}
        isVideoMuted={!localParticipant?.isCameraEnabled}
        isScreenSharing={!!localParticipant?.isScreenShareEnabled}
        isHandRaised={isLocalHandRaised}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        unreadCount={unreadCount}
        participantCount={participants.length}
        isFocusView={isFocusView}
        isHost={isHost}
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
        isCurrentUserHost={isHost}
        onMuteParticipant={handleMuteParticipant}
        onMuteAll={handleMuteAll}
        onMakeCoHost={handleMakeCoHost}
        onLowerHand={id => setRaisedHands(prev => prev.filter(x => x !== id))}
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
      audio={false}
      video={false}
      options={{
        publishDefaults: {
          audioPreset: {
            maxBitrate: 64000,
          },
          dtx: true,
          red: true,
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
        // Only set error for fatal token validation rejection, NEVER for reconnection/signaling retry
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
        onLeave={onLeave}
      />
    </LiveKitRoom>
  );
}
