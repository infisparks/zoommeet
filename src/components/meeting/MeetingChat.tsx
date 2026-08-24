"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, ChatInteractiveCard } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  Send,
  X,
  Smile,
  MessageSquare,
  Sparkles,
  Lock,
  Unlock,
  Pin,
  ExternalLink,
  Zap,
  Tag,
  ArrowUpRight,
  PlusCircle,
} from "lucide-react";
import { renderWithClickableLinks } from "@/lib/linkify";
import { PinnedMessage } from "./PinnedMessageBanner";

interface MeetingChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string, interactiveCard?: ChatInteractiveCard, andPin?: boolean) => void;
  currentUserId: string;
  isChatLocked?: boolean;
  isCurrentUserHost?: boolean;
  onToggleChatLock?: () => void;
  pinnedMessage?: PinnedMessage | null;
  onPinMessage?: (message: ChatMessage) => void;
  onUnpinMessage?: () => void;
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
  pinnedMessage,
  onPinMessage,
  onUnpinMessage,
}: MeetingChatProps) {
  const [inputText, setInputText] = useState("");
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardTitle, setCardTitle] = useState("Book Slot in just ₹1000");
  const [cardMessage, setCardMessage] = useState("Limited seats available! Claim your 1-on-1 consultation slot now.");
  const [cardPrice, setCardPrice] = useState("₹1000");
  const [cardButtonText, setCardButtonText] = useState("Book Slot Now 🚀");
  const [cardUrl, setCardUrl] = useState("https://");
  const [cardBadge, setCardBadge] = useState("⚡ EXCLUSIVE OFFER");

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

  const handleSendCard = (andPin: boolean = false) => {
    if (!cardMessage.trim() || !cardUrl.trim()) {
      alert("Please enter message and action URL");
      return;
    }
    const cardData: ChatInteractiveCard = {
      title: cardTitle.trim() || undefined,
      priceTag: cardPrice.trim() || undefined,
      buttonText: cardButtonText.trim() || "Open Link ↗",
      buttonUrl: cardUrl.trim(),
      badge: cardBadge.trim() || "⚡ ACTION OFFER",
    };
    onSendMessage(cardMessage.trim(), cardData, andPin);
    setShowCardModal(false);
  };

  const addEmoji = (emoji: string) => {
    if (isChatLocked && !isCurrentUserHost) return;
    setInputText(prev => prev + emoji);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#0D1527]/98 backdrop-blur-2xl text-white shadow-2xl animate-in slide-in-from-right duration-200 font-[Poppins,sans-serif]">
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

      {/* Pinned Message Sticky Box (Inside Chat Drawer) */}
      {pinnedMessage && (
        <div className="bg-gradient-to-r from-amber-950/60 to-slate-900 border-b border-amber-500/30 px-4 py-2.5 flex items-start justify-between gap-2 shadow-inner">
          <div className="flex items-start gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 rotate-45 fill-current" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  {pinnedMessage.interactiveCard?.badge || "Pinned on Screen"}
                </span>
                {pinnedMessage.interactiveCard?.priceTag && (
                  <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-1.5 rounded">
                    {pinnedMessage.interactiveCard.priceTag}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">• {pinnedMessage.participantName}</span>
              </div>
              {pinnedMessage.interactiveCard?.title && (
                <p className="text-xs font-bold text-amber-200 truncate mt-0.5">
                  {pinnedMessage.interactiveCard.title}
                </p>
              )}
              <div className="text-xs text-slate-200 line-clamp-2 mt-0.5 leading-snug">
                {renderWithClickableLinks(
                  pinnedMessage.message,
                  "text-sky-300 hover:underline font-bold inline-flex items-center gap-0.5"
                )}
              </div>
            </div>
          </div>
          {isCurrentUserHost && onUnpinMessage && (
            <button
              type="button"
              onClick={onUnpinMessage}
              className="text-[10px] font-bold text-rose-300 hover:text-rose-200 bg-rose-950/60 border border-rose-700/50 rounded-lg px-2 py-0.5 shrink-0 cursor-pointer transition-colors"
              title="Unpin message from screen"
            >
              Unpin
            </button>
          )}
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 space-y-2 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-300">No messages yet</p>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-[220px]">
              Chat, share links, and send interactive offer cards in real time.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.participantId === currentUserId;
            const isThisPinned = pinnedMessage?.id === msg.id;
            const card = msg.interactiveCard;

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
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

                  {/* Pin Status */}
                  {isThisPinned && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/20 text-amber-300 px-1.5 py-0.2 font-bold text-[9px] border border-amber-500/30">
                      <Pin className="w-2.5 h-2.5 fill-current rotate-45" />
                      <span>Pinned</span>
                    </span>
                  )}

                  {/* Host Pin/Unpin Action Button */}
                  {isCurrentUserHost && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isThisPinned) {
                          if (onUnpinMessage) onUnpinMessage();
                        } else {
                          if (onPinMessage) onPinMessage(msg);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex items-center gap-1 text-[9px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 border border-amber-600/40 rounded px-1.5 py-0.5 cursor-pointer shadow-xs"
                      title={isThisPinned ? "Unpin message" : "Pin to screen for everyone"}
                    >
                      <Pin className="w-2.5 h-2.5 rotate-45" />
                      <span>{isThisPinned ? "Unpin" : "Pin to Screen"}</span>
                    </button>
                  )}
                </div>

                {/* Interactive Card Render */}
                {card ? (
                  <div
                    className={`rounded-2xl p-3 text-xs max-w-[92%] break-words leading-relaxed shadow-lg border ${
                      isThisPinned
                        ? "ring-2 ring-amber-400/70 border-amber-400/50 bg-gradient-to-b from-[#181328] to-[#0D1224]"
                        : "border-indigo-500/40 bg-gradient-to-b from-[#161226] to-[#0E1528]"
                    }`}
                  >
                    {/* Badge & Price Header */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-1 border-b border-white/10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[9px] font-black text-amber-300 uppercase tracking-wider">
                        <Zap className="w-2.5 h-2.5 fill-current text-amber-400" />
                        <span>{card.badge || "EXCLUSIVE OFFER"}</span>
                      </span>
                      {card.priceTag && (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                          {card.priceTag}
                        </span>
                      )}
                    </div>

                    {/* Card Title */}
                    {card.title && (
                      <h4 className="font-black text-xs text-amber-200 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>{card.title}</span>
                      </h4>
                    )}

                    {/* Message Body */}
                    <div className="text-slate-200 text-xs leading-relaxed mb-2.5">
                      {renderWithClickableLinks(
                        msg.message,
                        "text-sky-300 hover:underline font-bold inline-flex items-center gap-0.5 break-all"
                      )}
                    </div>

                    {/* Interactive Glowing Action Button */}
                    <a
                      href={card.buttonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white py-2 px-3 text-xs font-black shadow-md shadow-orange-500/25 transition active:scale-95 cursor-pointer"
                    >
                      <span>{card.buttonText || "Claim Offer 🚀"}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  /* Regular Text Message Bubble */
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs max-w-[88%] break-words leading-relaxed font-normal shadow-xs ${
                      isThisPinned
                        ? "ring-2 ring-amber-500/60 bg-[#16213b] border border-amber-500/40 text-slate-100 rounded-bl-xs"
                        : isMe
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs"
                        : "bg-[#131E35] border border-white/10 text-slate-200 rounded-bl-xs"
                    }`}
                  >
                    {renderWithClickableLinks(
                      msg.message,
                      isMe
                        ? "text-yellow-200 hover:underline font-bold inline-flex items-center gap-0.5 break-all"
                        : "text-sky-300 hover:underline font-bold inline-flex items-center gap-0.5 break-all"
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Card Creator Modal */}
      {showCardModal && (
        <div className="border-t border-indigo-500/30 bg-[#0B1020] p-4 space-y-3 animate-in slide-in-from-bottom duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Create Interactive CTA / Offer Card</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCardModal(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Headline / Offer Title</label>
              <input
                type="text"
                value={cardTitle}
                onChange={e => setCardTitle(e.target.value)}
                placeholder="e.g. Book Slot in just ₹1000"
                className="w-full rounded-lg bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Price Tag</label>
                <input
                  type="text"
                  value={cardPrice}
                  onChange={e => setCardPrice(e.target.value)}
                  placeholder="e.g. ₹1000"
                  className="w-full rounded-lg bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={cardBadge}
                  onChange={e => setCardBadge(e.target.value)}
                  placeholder="e.g. ⚡ LIMITED OFFER"
                  className="w-full rounded-lg bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-amber-300 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Description / Pitch</label>
              <input
                type="text"
                value={cardMessage}
                onChange={e => setCardMessage(e.target.value)}
                placeholder="e.g. Book your slot now before price increases"
                className="w-full rounded-lg bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Button Text</label>
                <input
                  type="text"
                  value={cardButtonText}
                  onChange={e => setCardButtonText(e.target.value)}
                  placeholder="e.g. Book Slot Now 🚀"
                  className="w-full rounded-lg bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Action Link (URL)</label>
                <input
                  type="text"
                  value={cardUrl}
                  onChange={e => setCardUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-sky-300 font-mono focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSendCard(false)}
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 text-xs transition cursor-pointer"
            >
              Send to Chat
            </button>
            {isCurrentUserHost && (
              <button
                type="button"
                onClick={() => handleSendCard(true)}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black py-2 text-xs transition cursor-pointer shadow-md shadow-orange-500/25 flex items-center justify-center gap-1"
              >
                <Pin className="w-3 h-3 fill-current" />
                <span>Send & Pin</span>
              </button>
            )}
          </div>
        </div>
      )}

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
          {/* Action Toolbar & Emoji Bar */}
          <div className="flex items-center justify-between border-t border-white/5 px-3 py-1.5 bg-black/30">
            {isCurrentUserHost ? (
              <button
                type="button"
                onClick={() => setShowCardModal(!showCardModal)}
                className="flex items-center gap-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-2 py-1 text-[10px] font-black text-amber-300 transition cursor-pointer"
                title="Send interactive offer / CTA button card"
              >
                <Zap className="w-3 h-3 fill-current text-amber-400" />
                <span>CTA Card / Offer</span>
              </button>
            ) : (
              <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-slate-400" />
                <span>Live Chat</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              {["👍", "🔥", "❤️", "🚀", "🎉"].map(em => (
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
          </div>

          {/* Input Box */}
          <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 bg-black/40">
            {isChatLocked && isCurrentUserHost && (
              <div className="mb-1.5 flex items-center gap-1 text-[10px] text-amber-300 font-medium">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Comments locked for attendees (Host override)</span>
              </div>
            )}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={isChatLocked ? "Type message as Host..." : "Type message or paste link..."}
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
