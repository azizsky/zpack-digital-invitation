import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function queryRemoteD1(sql: string, params: any[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Konfigurasi Cloudflare D1 belum lengkap di .env.local!");
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
      cache: "no-store",
    }
  );

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.errors?.[0]?.message || "Gagal query D1");
  }

  return json.result?.[0]?.results || [];
}

// POST: Simpan RSVP ke Database D1
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invitationId, nama, kehadiran, pesan } = body;

    if (!invitationId || !nama || !kehadiran) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap (invitationId, nama, dan kehadiran wajib diisi)" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const pesanClean = pesan ? pesan.trim() : "-";

    // Simpan ke Database D1 (catatan: sesuaikan nama tabel jika menggunakan rsvp atau rsvps)
    const sql = `
      INSERT INTO rsvps (id, invitation_id, nama, kehadiran, pesan)
      VALUES (?, ?, ?, ?, ?)
    `;
    await queryRemoteD1(sql, [id, invitationId, nama, kehadiran, pesanClean]);

    return NextResponse.json({
      success: true,
      message: "RSVP berhasil disimpan",
      data: { id, invitationId, nama, kehadiran, pesan: pesanClean },
    });
  } catch (error: any) {
    console.error("❌ [RSVP POST ERROR]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyimpan RSVP" },
      { status: 500 }
    );
  }
}

// GET: Ambil daftar ucapan/RSVP berdasarkan invitationId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json(
        { success: false, message: "invitationId diperlukan" },
        { status: 400 }
      );
    }

    const sql = `
      SELECT id, nama, kehadiran, pesan, created_at 
      FROM rsvps 
      WHERE invitation_id = ? 
      ORDER BY created_at DESC
    `;
    const rsvps = await queryRemoteD1(sql, [invitationId]);

    return NextResponse.json({
      success: true,
      data: rsvps,
    });
  } catch (error: any) {
    console.error("❌ [RSVP GET ERROR]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data ucapan" },
      { status: 500 }
    );
  }
}