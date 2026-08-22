import { NextRequest, NextResponse } from "next/server";

const FIREBASE_URL = "https://meeting-4acaa-default-rtdb.firebaseio.com";
const FIREBASE_SECRET = "NlUQRLgSDKkXkshe23jdTZCKYgPc4zyLtI9akFb1";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Fetch users from Firebase Realtime Database
    const res = await fetch(`${FIREBASE_URL}/users.json?auth=${FIREBASE_SECRET}`);
    const users = await res.json();

    // If users collection is empty, seed default admin
    if (!users || Object.keys(users).length === 0) {
      const defaultAdmin = {
        id: "usr_admin_1",
        email: cleanEmail,
        password: password,
        name: "Administrator",
        role: "admin",
        createdAt: Date.now(),
      };

      await fetch(`${FIREBASE_URL}/users/${defaultAdmin.id}.json?auth=${FIREBASE_SECRET}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultAdmin),
      });

      return NextResponse.json({
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userList: any[] = Object.values(users);
    const matchedUser = userList.find(
      u => u && u.email && u.email.toLowerCase() === cleanEmail
    );

    if (!matchedUser) {
      return NextResponse.json(
        { error: "No account found with this email address. Please contact your administrator." },
        { status: 401 }
      );
    }

    if (matchedUser.password !== password) {
      return NextResponse.json(
        { error: "Invalid password. Please check and try again." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: matchedUser.id || `usr_${Date.now()}`,
        email: matchedUser.email,
        name: matchedUser.name || "User",
        role: matchedUser.role || "user",
      },
      token: `session_${matchedUser.id}_${Date.now()}`,
    });
  } catch (err: unknown) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
