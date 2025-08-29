import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Auth verify request received");

    const token = request.cookies.get("auth-token")?.value;
    console.log("🍪 Token from cookie:", token ? "Present" : "Missing");

    if (!token) {
      console.log("❌ No token provided");
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      );
    }

    console.log("🔓 Verifying token...");
    const decoded = verify(token, JWT_SECRET) as {
      email: string;
      userId: string;
    };
    console.log("✅ Token verified successfully:", {
      email: decoded.email,
      userId: decoded.userId,
    });

    return NextResponse.json({
      success: true,
      user: { email: decoded.email, userId: decoded.userId },
    });
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 500 }
    );
  }
}
