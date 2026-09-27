import { NextResponse } from "next/server";

export const runtime = "edge";

async function queryRemoteD1(sql: string, params: any[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Konfigurasi Cloudflare D1 (ACCOUNT_ID, DATABASE_ID, API_TOKEN) di .env.local belum lengkap!");
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.errors?.[0]?.message || "Gagal query ke Cloudflare D1 REST API");
  }
  
  return json.result[0]?.results || [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan password wajib diisi!" },
        { status: 400 }
      );
    }

    const query = "SELECT * FROM admins WHERE username = ? AND password = ?";
    const users = await queryRemoteD1(query, [username, password]);

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Username atau password salah!" },
        { status: 401 }
      );
    }

    // Buat response sukses dan set cookie autentikasi agar lolos dari redirect 307 middleware/dashboard
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil!",
    });

    // Menaruh cookie sesi admin selama 1 hari
    response.cookies.set({
      name: "admin_session",
      value: "authenticated",
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, 
    });

    return response;
  } catch (error: any) {
    console.error("Error Login:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}