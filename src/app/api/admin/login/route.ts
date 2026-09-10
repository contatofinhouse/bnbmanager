import { NextRequest, NextResponse } from "next/server";
import { checkPassword, generateSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Senha não fornecida." }, { status: 400 });
    }

    if (!checkPassword(password)) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    const token = generateSessionToken();

    const response = NextResponse.json({ success: true, message: "Login realizado com sucesso." });
    response.cookies.set({
      name: "bnb_admin_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
