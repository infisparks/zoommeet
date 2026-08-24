"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types";
import { Button } from "@/components/ui/Button";
import { Send, X, Smile, MessageSquare, Sparkles, Lock, Unlock } from "lucide-react";

interface MeetingChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUserId: string;
  isChatLocked?: boolean;
  isCurrentUserHost?: boolean;
  onToggleChatLock?: () => void;
}

export function MeetingChat({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserId,
  isChatLocked = false,
  isCurrentUserHost = false,
  onToggleChatLock,
}: MeetingChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (isChatLocked && !isCurrentUserHost) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const addEmoji = (emoji: string) => {
    if (isChatLocked && !isCurrentUserHost) return;
    setInputText(prev => prev + emoji);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#0D1527]/95 backdrop-blur-2xl text-white shadow-2xl animate-in slide-in-from-right duration-200 font-[Poppins,sans-serif]">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-white tracking-tight">Meeting Messages</h3>
              {/* Lock / Unlock Status Badge */}
              {isChatLocked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[9px] font-bold text-rose-300">
                  <Lock className="w-2.5 h-2.5 text-rose-400" />
                  <span>Locked</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  <Unlock className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Unlocked</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">{messages.length} total messages</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Host Quick Lock/Unlock Button */}
          {isCurrentUserHost && onToggleChatLock && (
            <button
              type="button"
              onClick={onToggleChatLock}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer border ${
                isChatLocked
                  ? "bg-rose-600/20 hover:bg-rose-600/40 border-rose-500/40 text-rose-200"
                  : "bg-emerald-600/20 hover:bg-emerald-600/40 border-emerald-500/40 text-emerald-200"
              }`}
              title={isChatLocked ? "Unlock Comments for all" : "Lock Comments for attendees"}
            >
              {isChatLocked ? (
                <>
                  <Unlock className="w-3 h-3 text-rose-300" />
                  <span>Unlock</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-emerald-300" />
                  <span>Lock</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 space-y-2 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-300">No messages yet</p>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-[220px]">
              Chat with all participants in real time through encrypted data channels.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.participantId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {isMe ? "You" : msg.participantName}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs max-w-[85%] break-words leading-relaxed font-normal shadow-xs ${
                    isMe
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs"
                      : "bg-[#131E35] border border-white/10 text-slate-200 rounded-bl-xs"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Locked Notice for Attendees or Input Area */}
      {isChatLocked && !isCurrentUserHost ? (
        <div className="border-t border-white/10 p-4 bg-black/60 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-rose-300 font-semibold bg-rose-950/60 border border-rose-800/40 rounded-xl py-2.5 px-3">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Comments have been locked by the host</span>
          </div>
        </div>
      ) : (
        <>
          {/* Emoji Bar */}
          <div className="flex items-center justify-around border-t border-white/5 px-4 py-2 bg-black/20">
            {["👍", "👏", "🔥", "❤️", "🚀", "🎉"].map(em => (
              <button
                key={em}
                type="button"
                onClick={() => addEmoji(em)}
                className="hover:scale-125 transition-transform text-sm p-1 cursor-pointer"
              >
                {em}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSubmit} className="border-t border-white/10 p-3.5 bg-black/40">
            {isChatLocked && isCurrentUserHost && (
              <div className="mb-1.5 flex items-center gap-1 text-[10px] text-amber-300 font-medium">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Comments locked for attendees (Host override)</span>
              </div>
            )}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={isChatLocked ? "Type message as Host..." : "Type a message to everyone..."}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 pr-10 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
