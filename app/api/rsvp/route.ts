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

// Helper untuk Kirim WA via Fonnte
async function sendWaViaFonnte(targetPhone: string, message: string) {
  const fonnteToken =
    process.env.FONNTE_TOKEN || "RiyoSKnVwuKkLqLrT7wU";

  if (!fonnteToken) {
    console.warn("⚠️ FONNTE_TOKEN belum diatur, skip kirim WA.");
    return;
  }

  // Format nomor WA agar diawali 62/angka tanpa karakter khusus
  let formattedPhone = String(targetPhone).replace(/\D/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "62" + formattedPhone.slice(1);
  }

  try {
    const formData = new URLSearchParams();
    formData.append("target", formattedPhone);
    formData.append("message", message);
    formData.append("countryCode", "62");

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken.trim(),
      },
      body: formData,
    });

    const resJson = await res.json();
    console.log("📲 [FONNTE RESPONSE]:", resJson);

    if (!resJson.status) {
      console.error("❌ [FONNTE REJECTED]:", resJson.reason || resJson.message);
    }
  } catch (err) {
    console.error("❌ [FONNTE ERROR]: Gagal mengirim WA", err);
  }
}

// POST: Simpan RSVP & Kirim WA Notifikasi ke Pengantin
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invitationId, nama, kehadiran, pesan, jumlahOrang, noHpPengantin } = body;

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

    // 2. Ambil detail undangan & konfigurasi WA dari D1
    let targetWa = noHpPengantin;
    let namaPria = "Pengantin";
    let namaWanita = "Pengantin";
    let isWaEnabled = false; // Default: matikan notifikasi Fonnte

    try {
      const invQuery = `SELECT xtra_data, no_whatsapp, nama_panggilan_pria, nama_panggilan_wanita FROM invitations WHERE id = ?`;
      const invResults = await queryRemoteD1(invQuery, [invitationId]);

      if (invResults && invResults.length > 0) {
        const inv = invResults[0];
        if (inv.nama_panggilan_pria) namaPria = inv.nama_panggilan_pria;
        if (inv.nama_panggilan_wanita) namaWanita = inv.nama_panggilan_wanita;

        let xtraData: any = {};
        if (typeof inv.xtra_data === "string") {
          try {
            xtraData = JSON.parse(inv.xtra_data);
          } catch (e) {}
        } else if (typeof inv.xtra_data === "object" && inv.xtra_data !== null) {
          xtraData = inv.xtra_data;
        }

        // Cek status toggle enableWaNotification dari xtraData
        isWaEnabled = Boolean(xtraData.enableWaNotification);

        if (!targetWa) {
          targetWa =
            xtraData.whatsappPengantin ||
            xtraData.noHpPengantin ||
            xtraData.noHp ||
            inv.no_whatsapp;
        }
      }
    } catch (dbErr) {
      console.warn("⚠️ Gagal mengambil detail undangan dari D1 untuk WA:", dbErr);
    }

    // 3. Pengecekan Syarat Kirim Fonnte (Hanya kirim jika toggle AKTIF dan nomor HP TERISI)
    if (isWaEnabled && targetWa && String(targetWa).trim() !== "") {
      const waText = 
`📩 *KONFIRMASI RSVP BARU - ZPACK INVITATION*
Halo Kak ${namaPria} & ${namaWanita}, ada konfirmasi kehadiran baru dari tamu undangan Anda:

👤 *Nama Guest:* ${nama}
📌 *Status Kehadiran:* ${kehadiran}
👥 *Jumlah Tamu:* ${jumlahOrang || 1} Orang
💬 *Pesan & Doa:*
"${pesanClean}"

----------------------------------------
_Pesan otomatis dikirim oleh Zpack Digital Invitation_`;

      await sendWaViaFonnte(targetWa, waText);
    } else {
      console.log("ℹ️ [FONNTE SKIPPED]: Notifikasi WA nonaktif atau nomor HP pengantin tidak diisi. Kuota aman.");
    }

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