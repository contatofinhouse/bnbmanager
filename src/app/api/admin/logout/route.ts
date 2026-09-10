import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Sessão finalizada." });
  response.cookies.set({
    name: "bnb_admin_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
