import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("bnb_admin_session")?.value;
  const isAuthenticated = verifySessionToken(token);

  return NextResponse.json({ authenticated: isAuthenticated });
}
