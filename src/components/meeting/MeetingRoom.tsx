"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

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

  // Real-time State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [raisedHands, setRaisedHands] = useState<string[]>([]);
  const [coHosts, setCoHosts] = useState<string[]>([]);
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);

  // Meeting Duration Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  // Attempt initial audio/video publishing safely
  useEffect(() => {
    if (!localParticipant) return;

    if (initialAudio) {
      localParticipant.setMicrophoneEnabled(true).catch(err => {
        console.warn("Initial microphone publish notice:", err);
      });
    }

    if (initialVideo) {
      localParticipant.setCameraEnabled(true).catch(err => {
        console.warn("Initial camera publish notice:", err);
      });
    }
  }, [localParticipant, initialAudio, initialVideo]);

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

  // Tracks for Camera and Screen Sharing (withPlaceholder ensures smooth rendering)
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const cameraTracks = tracks.filter(t => t.source === Track.Source.Camera);
  const screenShareTrack = tracks.find(
    t => t.source === Track.Source.ScreenShare && isTrackReference(t)
  );

  const isLocalScreenSharing = Boolean(
    localParticipant &&
    screenShareTrack &&
    screenShareTrack.participant?.identity === localParticipant.identity
  );

  // Media Controls Actions
  const handleToggleMic = async () => {
    if (!localParticipant) return;
    try {
      const isCurrentlyEnabled = localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(!isCurrentlyEnabled);
    } catch (err) {
      console.warn("Microphone toggle notice:", err);
    }
  };

  const handleToggleVideo = async () => {
    if (!localParticipant) return;
    try {
      const isCurrentlyEnabled = localParticipant.isCameraEnabled;
      await localParticipant.setCameraEnabled(!isCurrentlyEnabled);
    } catch (err) {
      console.warn("Camera toggle notice:", err);
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
    <div className="relative flex h-screen w-full flex-col bg-[#070B14] text-white overflow-hidden select-none font-[Poppins,sans-serif]">
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

        {/* Right: Security & Network Indicators */}
        <div className="flex items-center gap-2 rounded-2xl bg-slate-900/90 px-3.5 py-2 border border-white/10 backdrop-blur-xl pointer-events-auto shadow-lg">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            {connectionState === ConnectionState.Connected ? (
              <span className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Encrypted SFU</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium text-xs">
                <WifiOff className="h-4 w-4" />
                <span>Reconnecting...</span>
              </span>
            )}
          </div>
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

      {/* Main Video Area */}
      <div className="relative flex-1 w-full h-full pt-16 pb-24 sm:pb-28">
        {screenShareTrack ? (
          <ScreenShareView
            screenTrack={screenShareTrack}
            cameraTracks={cameraTracks}
            hostIdentity={isHost ? localParticipant?.identity : undefined}
            isLocalSharing={isLocalScreenSharing}
            onStopShare={handleToggleScreenShare}
          />
        ) : (
          <VideoGrid
            tracks={cameraTracks}
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
        onCopyLink={() => {
          const url = `${window.location.origin}/meeting/${roomName}`;
          navigator.clipboard.writeText(url);
        }}
        isRecording={isRecording}
        onToggleRecord={() => setIsRecording(!isRecording)}
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
      data-lk-theme="default"
      className="h-screen w-screen bg-[#070B14]"
      onError={err => {
        const msg = err?.message || "";
        if (
          msg.includes("token signature is invalid") ||
          msg.includes("invalid token") ||
          msg.includes("could not establish signal connection")
        ) {
          console.error("Fatal LiveKit auth failure:", err);
          setConnectError(msg || "Authentication token rejected by LiveKit server.");
        } else {
          console.warn("LiveKit non-fatal event:", msg);
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
