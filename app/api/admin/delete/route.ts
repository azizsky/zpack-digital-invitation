import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Helper ekstraksi Key R2 dari URL/Path
function extractR2Key(fileUrl: string): string {
  let cleanPath = fileUrl.trim();

  // Jika berupa URL Utuh (http:// atau https://)
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    try {
      const parsedUrl = new URL(cleanPath);
      cleanPath = parsedUrl.pathname;
    } catch {
      // Abaikan jika gagal parse
    }
  }

  // Buang slash di paling depan
  cleanPath = cleanPath.replace(/^\/+/, "");

  // Bersihkan prefix 'invitations/' jika ada di URL tetapi file di R2 disimpan langsung dari slug
  cleanPath = cleanPath.replace(/^(\/?invitations\/)+/, "");

  return cleanPath;
}

export async function POST(request: Request) {
  try {
    const { fileUrl } = await request.json();

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, message: "URL file tidak ditemukan" },
        { status: 400 }
      );
    }

    const key = extractR2Key(fileUrl);

    if (!key) {
      return NextResponse.json(
        { success: false, message: "Key file tidak valid" },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // SKENARIO A: Berjalan di Cloudflare Pages / Workers (Production)
    // ----------------------------------------------------
    let bucket: any = null;

      try {
        const { env } = getCloudflareContext();
        bucket = (env as any).MY_BUCKET;
      } catch (e) {
        bucket = null;
      }
    if (bucket) {
      console.log(`🗑️ [Cloudflare Binding] Menghapus file R2 Key: ${key}`);
      await bucket.delete(key);

      return NextResponse.json({
        success: true,
        message: `File (${key}) berhasil dihapus dari R2 Binding`,
      });
    }

    // ----------------------------------------------------
    // SKENARIO B: Berjalan di Localhost / Node.js Server (S3 API R2)
    // ----------------------------------------------------
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi R2 di environment belum lengkap" },
        { status: 500 }
      );
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    console.log(`🗑️ [S3 Client] Menghapus file dari R2 Bucket [${bucketName}], Key: ${key}`);

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    return NextResponse.json({
      success: true,
      message: `File (${key}) berhasil dihapus dari R2`,
    });
  } catch (error: any) {
    console.error("❌ Error Delete R2:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menghapus file dari R2" },
      { status: 500 }
    );
  }
}