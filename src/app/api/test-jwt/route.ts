import { NextRequest, NextResponse } from "next/server";
import { sign } from "jsonwebtoken";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing JWT generation...");

    // Generate a test JWT
    const testToken = sign(
      { email: "test@test.com", userId: "test" },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    console.log("🎫 Test JWT generated:", testToken.substring(0, 50) + "...");

    const response = NextResponse.json({
      success: true,
      message: "JWT test successful",
      token: testToken,
      secret: JWT_SECRET.substring(0, 20) + "...",
    });

    // Try to set a test cookie
    response.cookies.set("test-token", testToken, {
      httpOnly: false, // Make it visible for testing
      secure: false, // Allow HTTP for localhost
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    console.log("🍪 Test cookie set");

    return response;
  } catch (error) {
    console.error("❌ JWT test failed:", error);
    return NextResponse.json(
      { success: false, error: "JWT test failed" },
      { status: 500 }
    );
  }
}
