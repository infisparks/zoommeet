const express = require("express");
const cors = require("cors");
const { AccessToken, RoomServiceClient, WebhookReceiver } = require("livekit-server-sdk");

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://live.infiplus.in";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "infiplus_livekit";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "infiplus_livekit_secret_test";

const roomService = new RoomServiceClient(
  LIVEKIT_URL.replace("wss://", "https://").replace("ws://", "http://"),
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

const webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

app.use(cors());
app.use(express.json());
// Raw parser for webhook validation
app.use(express.raw({ type: "application/webhook+json" }));

// 1. Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", livekitUrl: LIVEKIT_URL, time: new Date().toISOString() });
});

// 2. Generate LiveKit Access Token
app.post("/api/livekit/token", async (req, res) => {
  try {
    const { roomName, participantName, participantIdentity, role, metadata } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({ error: "roomName and participantName are required" });
    }

    const normalizedRoom = String(roomName).trim().toLowerCase();
    const identity =
      participantIdentity ||
      `user_${Math.random().toString(36).substring(2, 7)}_${Date.now().toString().slice(-4)}`;

    const isHost = role === "host" || role === "co-host";

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
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
      room: normalizedRoom,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
    });

    const token = await at.toJwt();

    console.log(`\x1b[32m[TOKEN GENERATED]\x1b[0m Room: "${normalizedRoom}" | User: "${participantName}" (${identity}) | Role: ${role || "participant"}`);

    return res.json({
      token,
      serverUrl: LIVEKIT_URL,
      roomName: normalizedRoom,
      participantIdentity: identity,
      role: role || "participant",
    });
  } catch (error) {
    console.error("\x1b[31m[TOKEN ERROR]\x1b[0m", error);
    return res.status(500).json({ error: error.message || "Failed to generate token" });
  }
});

// 3. LiveKit Webhook Receiver (Logs all participant joins/leaves in terminal)
app.post("/api/livekit/webhook", async (req, res) => {
  try {
    const authHeader = req.get("Authorization");
    const event = await webhookReceiver.receive(req.body, authHeader);

    const time = new Date().toLocaleTimeString();

    switch (event.event) {
      case "participant_joined":
        console.log(`\x1b[36m[${time}] PARTICIPANT JOINED:\x1b[0m Room: "${event.room?.name}" | Participant: "${event.participant?.name || event.participant?.identity}" | Total: ${event.room?.numParticipants}`);
        break;

      case "participant_left":
        console.log(`\x1b[33m[${time}] PARTICIPANT LEFT:\x1b[0m Room: "${event.room?.name}" | Participant: "${event.participant?.name || event.participant?.identity}"`);
        break;

      case "room_started":
        console.log(`\x1b[35m[${time}] ROOM STARTED:\x1b[0m Room: "${event.room?.name}"`);
        break;

      case "room_finished":
        console.log(`\x1b[90m[${time}] ROOM FINISHED:\x1b[0m Room: "${event.room?.name}"`);
        break;

      case "track_published":
        console.log(`\x1b[34m[${time}] TRACK PUBLISHED:\x1b[0m User: "${event.participant?.identity}" | Source: ${event.track?.source} | Kind: ${event.track?.type}`);
        break;

      default:
        console.log(`[${time}] Event: ${event.event} in room "${event.room?.name}"`);
    }

    res.status(200).send("ok");
  } catch (err) {
    console.warn("Webhook validation notice:", err.message);
    res.status(200).send("ignored");
  }
});

// 4. List Active Rooms & Participants
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await roomService.listRooms();
    return res.json({ rooms });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 5. List Participants in a Specific Room
app.get("/api/rooms/:roomName/participants", async (req, res) => {
  try {
    const participants = await roomService.listParticipants(req.params.roomName);
    return res.json({ room: req.params.roomName, count: participants.length, participants });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 LiveKit Node.js Backend running on http://localhost:${PORT}`);
  console.log(`📡 LiveKit Server URL: ${LIVEKIT_URL}`);
  console.log(`🔑 LiveKit API Key: ${LIVEKIT_API_KEY}`);
  console.log(`==============================================\n`);
});
