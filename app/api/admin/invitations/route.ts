import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

// Inisialisasi S3 client Cloudflare R2
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Helper Query ke Cloudflare D1 REST API (saat npm run dev)
async function queryRemoteD1(sql: string, params: any[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Konfigurasi D1 di .env.local belum lengkap!");
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
    throw new Error(json.errors?.[0]?.message || "Gagal query ke Remote D1");
  }
  return json.result[0];
}

// Helper pintar eksekusi SQL (Mendukung lokal & Cloudflare Pages)
async function executeQuery(sql: string, params: any[] = []) {
  let DB: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getRequestContext } = require("@cloudflare/next-on-pages");
    DB = getRequestContext().env.DB;
  } catch (e) {
    DB = null;
  }

  if (DB) {
    const stmt = DB.prepare(sql).bind(...params);
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      const { results } = await stmt.all();
      return results;
    } else {
      return await stmt.run();
    }
  }

  const result = await queryRemoteD1(sql, params);
  return sql.trim().toUpperCase().startsWith("SELECT") ? result.results : result;
}

// Helper membersihkan folder file di R2 berdasarkan slug
async function cleanupR2Folder(slug: string) {
  const bucketName = process.env.R2_BUCKET_NAME;
  const accountId = process.env.R2_ACCOUNT_ID;
  
  if (!bucketName || !accountId) return;
  
  const cleanSlug = slug.replace(/^\/+|\/+$/g, ""); 
  const prefix = `${cleanSlug}/`;

  try {
    const listedObjects = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      })
    );

    if (listedObjects.Contents && listedObjects.Contents.length > 0) {
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: listedObjects.Contents.map((val) => ({ Key: val.Key! })),
        },
      };

      await r2.send(new DeleteObjectsCommand(deleteParams));
      
      if (listedObjects.IsTruncated) {
        await cleanupR2Folder(slug);
      }
    }
  } catch (error) {
    console.error("Gagal membersihkan folder R2:", error);
  }
}

// ====================================================================
// 1. GET: Ambil Daftar Undangan
// ====================================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const pkg = searchParams.get("package");

    let query = "SELECT * FROM invitations";
    const params: string[] = [];

    if (category && pkg) {
      query += " WHERE category = ? AND package = ? ORDER BY created_at DESC";
      params.push(category, pkg);
    } else if (category) {
      query += " WHERE category = ? ORDER BY created_at DESC";
      params.push(category);
    } else if (pkg) {
      query += " WHERE package = ? ORDER BY created_at DESC";
      params.push(pkg);
    } else {
      query += " ORDER BY created_at DESC";
    }

    const results = await executeQuery(query, params);

    const formattedData = (results || []).map((row: any) => ({
      ...row,
      xtra_data: row.xtra_data ? JSON.parse(row.xtra_data) : null,
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error("Error Fetch Invitations:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data", data: [] },
      { status: 500 }
    );
  }
}

// ====================================================================
// 2. DELETE: Hapus Undangan berdasarkan ID
// ====================================================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID wajib diisi untuk menghapus!" },
        { status: 400 }
      );
    }

    const targetData = await executeQuery("SELECT slug FROM invitations WHERE id = ?", [id]);
    if (targetData && targetData.length > 0) {
      await cleanupR2Folder(targetData[0].slug);
    }

    await executeQuery("DELETE FROM invitations WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Undangan dan file terkait berhasil dihapus!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menghapus" },
      { status: 500 }
    );
  }
}

// ====================================================================
// 3. POST: Simpan Undangan Baru (Lengkap dengan WA & Video Prewed)
// ====================================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, category, package: pkg, content } = body;

    if (!slug || !content) {
      return NextResponse.json(
        { success: false, message: "Slug dan data undangan wajib diisi!" },
        { status: 400 }
      );
    }

    const existing = await executeQuery(
      "SELECT id FROM invitations WHERE slug = ?",
      [slug]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Slug "/wedding/${slug}" sudah digunakan!` },
        { status: 400 }
      );
    }

    const id = Date.now().toString();

    // 🎯 ESTRAKSI SELURUH FITUR ENTERPRISE
    const {
      musicOption,
      customMusicUrl,
      whatsappPengantin,
      enableRsvp,
      liveStreamUrl,
      videoPrewedUrl,
      galeriFoto,
      loveStory,
      qrisImageUrl,
      rekeningBank,
      ...basic
    } = content;

    // 💡 SUSUN XTRADATA LENGKAP
    const xtraData = JSON.stringify({
      musicOption: musicOption || "none",
      customMusicUrl: customMusicUrl || "",
      whatsappPengantin: whatsappPengantin || "",
      enableRsvp: enableRsvp ?? true,
      liveStreamUrl: liveStreamUrl || "",
      videoPrewedUrl: videoPrewedUrl || "",
      galeriFoto: galeriFoto || [],
      loveStory: loveStory || [],
      qrisImageUrl: qrisImageUrl || "",
      rekeningBank: rekeningBank || [],
    });

    const insertQuery = `
      INSERT INTO invitations (
        id, slug, category, package, status, template_id,
        nama_panggilan_pria, nama_panggilan_wanita,
        nama_lengkap_pria, nama_lengkap_wanita,
        orang_tua_pria, orang_tua_wanita,
        turut_mengundang_pria, turut_mengundang_wanita,
        tanggal_akad, waktu_akad,
        tanggal_resepsi, waktu_resepsi,
        lokasi_teks, lokasi_maps, xtra_data
      ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      id,
      slug,
      category || "wedding",
      pkg || "basic",
      basic.templateId || "theme-minimalist",
      basic.namaPanggilanPria || "",
      basic.namaPanggilanWanita || "",
      basic.namaLengkapPria || "",
      basic.namaLengkapWanita || "",
      basic.orangTuaPria || "",
      basic.orangTuaWanita || "",
      basic.turutMengundangPria || "",
      basic.turutMengundangWanita || "",
      basic.tanggalAkad || "",
      basic.waktuAkad || "",
      basic.tanggalResepsi || "",
      basic.waktuResepsi || "",
      basic.lokasiTeks || "",
      basic.lokasiMaps || "",
      xtraData,
    ];

    await executeQuery(insertQuery, insertParams);

    return NextResponse.json({
      success: true,
      message: "Undangan berhasil disimpan ke Database D1!",
    });
  } catch (error: any) {
    console.error("Error Save Invitation:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyimpan ke D1" },
      { status: 500 }
    );
  }
}

// ====================================================================
// 4. PUT: Update Undangan (Lengkap dengan WA & Video Prewed)
// ====================================================================
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, slug, category, package: pkg, content } = body;

    if (!id || !slug || !content) {
      return NextResponse.json(
        { success: false, message: "ID, Slug, dan data undangan wajib diisi!" },
        { status: 400 }
      );
    }

    // 🎯 ESTRAKSI SELURUH FITUR ENTERPRISE
    const {
      musicOption,
      customMusicUrl,
      whatsappPengantin,
      enableRsvp,
      liveStreamUrl,
      videoPrewedUrl,
      galeriFoto,
      loveStory,
      qrisImageUrl,
      rekeningBank,
      ...basic
    } = content;

    // 💡 SUSUN XTRADATA LENGKAP SAAT UPDATE
    const xtraData = JSON.stringify({
      musicOption: musicOption || "none",
      customMusicUrl: customMusicUrl || "",
      whatsappPengantin: whatsappPengantin || "",
      enableRsvp: enableRsvp ?? true,
      liveStreamUrl: liveStreamUrl || "",
      videoPrewedUrl: videoPrewedUrl || "",
      galeriFoto: galeriFoto || [],
      loveStory: loveStory || [],
      qrisImageUrl: qrisImageUrl || "",
      rekeningBank: rekeningBank || [],
    });

    const updateQuery = `
      UPDATE invitations SET
        slug = ?, category = ?, package = ?, template_id = ?,
        nama_panggilan_pria = ?, nama_panggilan_wanita = ?,
        nama_lengkap_pria = ?, nama_lengkap_wanita = ?,
        orang_tua_pria = ?, orang_tua_wanita = ?,
        turut_mengundang_pria = ?, turut_mengundang_wanita = ?,
        tanggal_akad = ?, waktu_akad = ?,
        tanggal_resepsi = ?, waktu_resepsi = ?,
        lokasi_teks = ?, lokasi_maps = ?, xtra_data = ?
      WHERE id = ?
    `;

    const updateParams = [
      slug,
      category || "wedding",
      pkg || "basic",
      basic.templateId || "theme-minimalist",
      basic.namaPanggilanPria || "",
      basic.namaPanggilanWanita || "",
      basic.namaLengkapPria || "",
      basic.namaLengkapWanita || "",
      basic.orangTuaPria || "",
      basic.orangTuaWanita || "",
      basic.turutMengundangPria || "",
      basic.turutMengundangWanita || "",
      basic.tanggalAkad || "",
      basic.waktuAkad || "",
      basic.tanggalResepsi || "",
      basic.waktuResepsi || "",
      basic.lokasiTeks || "",
      basic.lokasiMaps || "",
      xtraData,
      id,
    ];

    await executeQuery(updateQuery, updateParams);

    return NextResponse.json({
      success: true,
      message: "Undangan berhasil diperbarui!",
    });
  } catch (error: any) {
    console.error("Error Update Invitation:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui data" },
      { status: 500 }
    );
  }
}