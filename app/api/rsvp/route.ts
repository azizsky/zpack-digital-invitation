import { NextResponse } from "next/server";

export const runtime = "edge";

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

// Helper untuk Kirim WA via Fonnte
async function sendWaViaFonnte(targetPhone: string, message: string) {
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (!fonnteToken) {
    console.warn("⚠️ FONNTE_TOKEN belum diatur di .env.local, skip kirim WA.");
    return;
  }

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: targetPhone,
        message: message,
      }),
    });

    const resJson = await res.json();
    console.log("📲 [FONNTE RESPONSE]:", resJson);
  } catch (err) {
    console.error("❌ [FONNTE ERROR]: Gagal mengirim WA", err);
  }
}

// POST: Simpan RSVP & Kirim WA Notifikasi ke Pengantin
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invitationId, nama, kehadiran, pesan, noHpPengantin } = body;

    // HAPUS !pesan DARI SYARAT WAJIB (Pesan bersifat opsional)
    if (!invitationId || !nama || !kehadiran) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap (invitationId, nama, dan kehadiran wajib diisi)" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const pesanClean = pesan ? pesan.trim() : "-";

    // 1. Simpan ke Database D1
    const sql = `
      INSERT INTO rsvps (id, invitation_id, nama, kehadiran, pesan)
      VALUES (?, ?, ?, ?, ?)
    `;
    await queryRemoteD1(sql, [id, invitationId, nama, kehadiran, pesanClean]);

    // 2. Format Teks Pesan WhatsApp
    const waText = 
`💌 *KONFIRMASI RSVP BARU*
----------------------------------------
*Nama Guest:* ${nama}
*Kehadiran:* ${kehadiran}
*Pesan & Doa:*
"${pesanClean}"

----------------------------------------
_Pesan otomatis dari Undangan Digital_`;

    // 3. Kirim WhatsApp jika nomor pengantin tersedia
    if (noHpPengantin) {
      await sendWaViaFonnte(noHpPengantin, waText);
    }

    return NextResponse.json({
      success: true,
      message: "RSVP berhasil disimpan & notifikasi WA terkirim",
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