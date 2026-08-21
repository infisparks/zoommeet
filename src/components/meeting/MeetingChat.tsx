"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types";
import { Button } from "@/components/ui/Button";
import { Send, X, Smile, MessageSquare, Sparkles } from "lucide-react";

interface MeetingChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUserId: string;
}

export function MeetingChat({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserId,
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
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#0D1527]/95 backdrop-blur-2xl text-white shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white tracking-tight">Meeting Messages</h3>
            <p className="text-[10px] text-slate-400 font-mono">{messages.length} total messages</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
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
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Type a message to everyone..."
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
    </div>
  );
}
