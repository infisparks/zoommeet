"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { recordingService } from "@/lib/services";
import { Recording } from "@/types";
import { formatDuration, formatBytes, formatScheduledDate } from "@/lib/utils";
import {
  Disc,
  Play,
  Download,
  Trash2,
  Share2,
  Clock,
  HardDrive,
  Check,
  Video,
} from "lucide-react";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [activePlayback, setActivePlayback] = useState<Recording | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadRecordings = async () => {
    const list = await recordingService.getRecordings();
    setRecordings(list);
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this cloud recording?")) {
      await recordingService.deleteRecording(id);
      loadRecordings();
    }
  };

  const handleShare = (rec: Recording) => {
    const url = `${window.location.origin}/recordings?id=${rec.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout
      title="Meeting Recordings"
      subtitle="Access cloud video archives, stream recordings, and share playback links."
    >
      <div className="space-y-6">
        {recordings.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Disc className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No recordings found</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Recorded meetings will automatically appear here for playback and team sharing.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recordings.map(rec => (
              <Card key={rec.id} className="overflow-hidden p-0 flex flex-col group border-slate-200 hover:border-blue-300 transition-all hover:shadow-md">
                {/* Thumbnail Preview Stage */}
                <div
                  onClick={() => setActivePlayback(rec)}
                  className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {rec.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rec.thumbnailUrl}
                      alt={rec.meetingTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Video className="w-8 h-8" />
                      <span className="text-xs">LiveKit Video Track</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/90 text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 text-[11px] font-medium text-white backdrop-blur-xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatDuration(rec.durationSeconds)}</span>
                  </div>

                  <div className="absolute top-2.5 left-2.5">
                    <Badge
                      variant={rec.status === "ready" ? "success" : "warning"}
                      size="sm"
                    >
                      {rec.status === "ready" ? "HD Ready" : "Processing"}
                    </Badge>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">
                      {rec.meetingTitle}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{formatScheduledDate(rec.createdAt)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatBytes(rec.sizeBytes)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(rec)}
                    >
                      {copiedId === rec.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === rec.id ? "Copied" : "Share"}</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => alert("Cloud recording file download initiated.")}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete recording"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Video Player Modal */}
        {activePlayback && (
          <Modal
            isOpen={!!activePlayback}
            onClose={() => setActivePlayback(null)}
            title={activePlayback.meetingTitle}
            description={`Recorded on ${formatScheduledDate(activePlayback.createdAt)} • Duration: ${formatDuration(activePlayback.durationSeconds)}`}
            maxWidth="2xl"
          >
            <div className="space-y-4 pt-1">
              <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
                <div className="text-center space-y-3 p-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                    <Play className="h-8 w-8 ml-1" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    Cloud Playback Simulation Player
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    In production with LiveKit Egress, this streams the processed MP4/HLS recording track directly from cloud storage.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Size: {formatBytes(activePlayback.sizeBytes)}</span>
                  <span>•</span>
                  <span>Codec: H.264 / Opus</span>
                </div>
                <Button variant="primary" size="sm" onClick={() => setActivePlayback(null)}>
                  Close Player
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
