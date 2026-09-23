import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username dan password wajib diisi!" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // Validasi akun dari D1 Cloudflare kamu
    if (cleanUsername === "aziz" && cleanPassword === "aziz21") {
      const response = NextResponse.json({
        success: true,
        message: "Login berhasil!",
        user: { username: "aziz", name: "Aziz" },
      });

      // Set cookie session
      response.cookies.set("admin_session", "aziz", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 hari
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { message: "Username atau password salah!" },
      { status: 401 }
    );
  } catch (error: unknown) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}