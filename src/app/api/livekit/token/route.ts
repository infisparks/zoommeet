import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomName, participantName, participantIdentity, role, metadata } = body;

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: "roomName and participantName are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY || "infiplus_livekit";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "infiplus_livekit_secret_test";
    const serverUrl = process.env.LIVEKIT_URL || "wss://live.infiplus.in";

    const identity =
      participantIdentity ||
      `user_${Math.random().toString(36).substring(2, 8)}_${Date.now()}`;

    const isHost = role === "host" || role === "co-host";

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: participantName,
      metadata:
        metadata ||
        JSON.stringify({
          role: role || "participant",
          displayName: participantName,
          joinedAt: new Date().toISOString(),
        }),
      ttl: "6h",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      serverUrl,
      roomName,
      participantIdentity: identity,
      role: role || "participant",
    });
  } catch (error: unknown) {
    console.error("Failed to generate LiveKit access token:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error generating token" },
      { status: 500 }
    );
  }
}
