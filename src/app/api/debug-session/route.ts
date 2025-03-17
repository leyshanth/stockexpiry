import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    // Return detailed session info
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        user: {
          id: session.user?.id,
          name: session.user?.name,
          email: session.user?.email,
          // Don't include any sensitive data
        },
        expires: session.expires
      } : null,
      authOptions: {
        providers: authOptions.providers.map(p => p.id),
        callbacks: Object.keys(authOptions.callbacks || {}),
        pages: authOptions.pages,
        session: authOptions.session
      }
    });
  } catch (error) {
    console.error("Session debug error:", error);
    return NextResponse.json(
      { error: "Session debug failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 