/**
 * Zoomeet / Infiplus Meeting Backend Server
 * Running on: meets.infiplus.in (or localhost:5000)
 * Firebase Database: https://meeting-4acaa-default-rtdb.firebaseio.com/
 */

const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");
const { generateFUsers } = require("./indianNames");

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
const FIREBASE_URL = "https://meeting-4acaa-default-rtdb.firebaseio.com";
const FIREBASE_SECRET = "NlUQRLgSDKkXkshe23jdTZCKYgPc4zyLtI9akFb1";

const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://live.infiplus.in";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "infiplus_livekit";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "Lk9mQ2xV7rT4pN8aK5zH1wC6dF3yB9eJ";

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Firebase REST API Helpers
async function firebaseGet(path) {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json?auth=${FIREBASE_SECRET}`);
    return await res.json();
  } catch (err) {
    console.error(`Firebase GET error at ${path}:`, err);
    return null;
  }
}

async function firebasePut(path, data) {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json?auth=${FIREBASE_SECRET}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error(`Firebase PUT error at ${path}:`, err);
    return null;
  }
}

async function firebasePatch(path, data) {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json?auth=${FIREBASE_SECRET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error(`Firebase PATCH error at ${path}:`, err);
    return null;
  }
}

// Health Check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Zoomeet / Infiplus Meeting API",
    livekitUrl: LIVEKIT_URL,
    timestamp: Date.now(),
  });
});

/**
 * 1. Authentication (Login with Firebase Realtime Database)
 * POST /api/auth/login
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await firebaseGet("users");

    // If users collection is empty in Firebase, auto-seed default admin
    if (!users || Object.keys(users).length === 0) {
      const defaultAdmin = {
        id: "usr_admin_1",
        email: cleanEmail,
        password: password, // For custom login
        name: "Administrator",
        role: "admin",
        createdAt: Date.now(),
      };
      await firebasePut(`users/${defaultAdmin.id}`, defaultAdmin);
      return res.json({
        success: true,
        user: {
          id: defaultAdmin.id,
          email: defaultAdmin.email,
          name: defaultAdmin.name,
          role: defaultAdmin.role,
        },
        token: `session_${defaultAdmin.id}_${Date.now()}`,
      });
    }

    // Find user by email
    const userList = Object.values(users);
    const matchedUser = userList.find(
      u => u && u.email && u.email.toLowerCase() === cleanEmail
    );

    if (!matchedUser) {
      return res.status(401).json({ error: "No account found with this email address. Please contact your administrator." });
    }

    if (matchedUser.password !== password) {
      return res.status(401).json({ error: "Invalid password. Please check and try again." });
    }

    return res.json({
      success: true,
      user: {
        id: matchedUser.id || `usr_${Date.now()}`,
        email: matchedUser.email,
        name: matchedUser.name || "User",
        role: matchedUser.role || "user",
      },
      token: `session_${matchedUser.id}_${Date.now()}`,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
});

/**
 * 2. Generate LiveKit Token
 * POST /api/livekit/token
 */
app.post("/api/livekit/token", async (req, res) => {
  try {
    const { roomName, participantIdentity, participantName, isHost, passcode } = req.body;

    if (!roomName || !participantIdentity) {
      return res.status(400).json({ error: "roomName and participantIdentity are required" });
    }

    // Check meeting permissions from Firebase RTDB
    const meeting = await firebaseGet(`meetings/${roomName}`);

    // If meeting has passcode and participant is not host, verify passcode
    if (meeting && meeting.passcode && !isHost) {
      if (passcode && passcode !== meeting.passcode) {
        return res.status(403).json({ error: "Invalid meeting passcode" });
      }
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName || participantIdentity,
      ttl: "6h",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      roomAdmin: !!isHost,
    });

    const token = await at.toJwt();

    return res.json({
      token,
      livekitUrl: LIVEKIT_URL,
      meeting: meeting || null,
    });
  } catch (err) {
    console.error("LiveKit token generation error:", err);
    res.status(500).json({ error: "Failed to generate LiveKit access token" });
  }
});

/**
 * 3. Create Meeting & Save to Firebase RTDB
 * POST /api/meetings/create
 */
app.post("/api/meetings/create", async (req, res) => {
  try {
    const {
      title,
      hostId,
      hostName,
      passcode,
      isVoiceLocked = false,
      isVideoLocked = false,
      isWebinar = false,
      fakeUserCount = 0,
      scheduledTime,
    } = req.body;

    const meetingId = `meet-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const meetingData = {
      id: meetingId,
      title: title || `Meeting ${meetingId.slice(-4).toUpperCase()}`,
      hostId: hostId || "anonymous_host",
      hostName: hostName || "Host",
      passcode: passcode || "",
      isVoiceLocked: !!isVoiceLocked,
      isVideoLocked: !!isVideoLocked,
      isWebinar: !!isWebinar,
      fakeUserCount: parseInt(fakeUserCount, 10) || 0,
      createdAt: Date.now(),
      scheduledTime: scheduledTime || Date.now(),
      status: "active",
    };

    // Save to Firebase RTDB
    await firebasePut(`meetings/${meetingId}`, meetingData);

    return res.json({
      success: true,
      meeting: meetingData,
    });
  } catch (err) {
    console.error("Meeting creation error:", err);
    res.status(500).json({ error: "Failed to create meeting in Firebase" });
  }
});

/**
 * 4. List Meetings
 * GET /api/meetings
 */
app.get("/api/meetings", async (req, res) => {
  try {
    const { hostId } = req.query;
    const meetings = await firebaseGet("meetings");

    if (!meetings) {
      return res.json({ meetings: [] });
    }

    let meetingList = Object.values(meetings).filter(m => m && m.id);
    if (hostId) {
      meetingList = meetingList.filter(m => m.hostId === hostId);
    }

    meetingList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.json({ meetings: meetingList });
  } catch (err) {
    console.error("Fetch meetings error:", err);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
});

/**
 * 5. Get Meeting Details
 * GET /api/meetings/:id
 */
app.get("/api/meetings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await firebaseGet(`meetings/${id}`);

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    return res.json({ meeting });
  } catch (err) {
    console.error("Get meeting error:", err);
    res.status(500).json({ error: "Failed to get meeting details" });
  }
});

/**
 * 6. Get Simulated Attendees ("fusers" for Webinar Social Proof)
 * POST /api/meetings/:id/fusers
 */
app.post("/api/meetings/:id/fusers", async (req, res) => {
  try {
    const { id } = req.params;
    let count = parseInt(req.body.count, 10);

    if (isNaN(count) || count <= 0) {
      const meeting = await firebaseGet(`meetings/${id}`);
      count = meeting?.fakeUserCount || 0;
    }

    const fusers = generateFUsers(count, id);

    return res.json({
      meetingId: id,
      count: fusers.length,
      fusers,
    });
  } catch (err) {
    console.error("Fusers generation error:", err);
    res.status(500).json({ error: "Failed to generate simulated attendees" });
  }
});

/**
 * 7. Update Live Moderation / Lock Status
 * POST /api/meetings/:id/lock
 */
app.post("/api/meetings/:id/lock", async (req, res) => {
  try {
    const { id } = req.params;
    const { isVoiceLocked, isVideoLocked, onlyShowHost, fakeUserCount } = req.body;

    const updates = {};
    if (typeof isVoiceLocked === "boolean") updates.isVoiceLocked = isVoiceLocked;
    if (typeof isVideoLocked === "boolean") updates.isVideoLocked = isVideoLocked;
    if (typeof onlyShowHost === "boolean") updates.onlyShowHost = onlyShowHost;
    if (typeof fakeUserCount === "number") updates.fakeUserCount = fakeUserCount;

    await firebasePatch(`meetings/${id}`, updates);

    return res.json({ success: true, updates });
  } catch (err) {
    console.error("Lock update error:", err);
    res.status(500).json({ error: "Failed to update meeting lock settings" });
  }
});

/**
 * 8. Remote Diagnostic Logs for Meeting Troubleshooting
 * POST /api/meetings/:id/logs
 */
app.post("/api/meetings/:id/logs", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, message, level = "info", details = {}, participant = "anonymous" } = req.body;
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logEntry = {
      timestamp: Date.now(),
      isoTime: new Date().toISOString(),
      participant,
      action: action || "general_log",
      level,
      message: message || "",
      details,
    };
    await firebasePut(`meetings/${id}/logs/${logId}`, logEntry);
    console.log(`[Diagnostic Log] [${id}] [${participant}] ${action}: ${message}`);
    return res.json({ success: true, logId });
  } catch (err) {
    console.error("Diagnostic log error:", err);
    res.status(500).json({ error: "Failed to record log" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Zoomeet Server running on port ${PORT}`);
  console.log(` Firebase RTDB: ${FIREBASE_URL}`);
  console.log(` LiveKit SFU:   ${LIVEKIT_URL}`);
  console.log(`=========================================`);
});
