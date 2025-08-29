import { NextRequest, NextResponse } from "next/server";
import { sign } from "jsonwebtoken";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("🔐 Login attempt:", { email, password });

    // For demo purposes, use hardcoded admin credentials
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    console.log("🔑 Expected credentials:", { ADMIN_EMAIL, ADMIN_PASSWORD });

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log("✅ Credentials match, generating JWT...");

      const token = sign({ email, userId: "admin" }, JWT_SECRET, {
        expiresIn: "7d",
      });

      console.log("🎫 JWT generated successfully");

      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        user: { email, userId: "admin" },
      });

      // Set HTTP-only cookie
      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log("🍪 Cookie set successfully");

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
