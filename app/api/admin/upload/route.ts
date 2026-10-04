import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

// Helper untuk memastikan tidak ada dobel slash pada URL
function formatR2Url(domain: string, fileName: string): string {
  const cleanDomain = domain.replace(/\/+$/, ""); // Hapus trailing slash di domain jika ada
  const cleanFileName = fileName.replace(/^\/+/, ""); // Hapus leading slash di path
  return `${cleanDomain}/${cleanFileName}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;
    const folderType = (formData.get("folderType") || formData.get("type") || "gallery") as string;

    if (!file || !slug) {
      return NextResponse.json(
        { success: false, message: "File dan Slug wajib diisi!" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${slug}/${folderType}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;

    // ----------------------------------------------------
    // SKENARIO A: Berjalan di Cloudflare Pages / Workers (Production)
    // ----------------------------------------------------
    let bucket: any = null;
    let env: any = {};

      try {
        const context = getCloudflareContext();
        env = context.env;
        bucket = (env as any).MY_BUCKET;
      } catch (e) {
        bucket = null;
      }

    if (bucket) {
      // 1. Bersihkan file lama jika folderType qris atau music
      if (folderType === "qris" || folderType === "music") {
        const prefix = `${slug}/${folderType}/`;
        try {
          const listed = await bucket.list({ prefix });
          if (listed && listed.objects.length > 0) {
            const deletePromises = listed.objects.map((obj: any) => bucket.delete(obj.key));
            await Promise.all(deletePromises);
          }
        } catch (delErr) {
          console.error("Gagal membersihkan file R2 Binding Cloudflare:", delErr);
        }
      }

      // 2. Upload file ke R2 Binding
      await bucket.put(fileName, buffer, {
        httpMetadata: { contentType: file.type },
      });

      // 3. Gunakan R2 Public Domain dari Context atau Fallback ke assets.zpack.my.id
      const publicDomain =
        env.R2_PUBLIC_DOMAIN ||
        process.env.R2_PUBLIC_DOMAIN ||
        "https://assets.zpack.my.id";

      const fileUrl = formatR2Url(publicDomain, fileName);

      return NextResponse.json({ success: true, url: fileUrl });
    }

    // ----------------------------------------------------
    // SKENARIO B: Berjalan di Localhost / Server Node.js (S3 API R2)
    // ----------------------------------------------------
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || "https://assets.zpack.my.id";

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json(
        {
          success: false,
          message: "Environment Variable Cloudflare R2 di .env.local belum lengkap!",
        },
        { status: 500 }
      );
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Bersihkan file lama jika folderType qris / music
    if (folderType === "qris" || folderType === "music") {
      const prefix = `${slug}/${folderType}/`;
      try {
        const listCmd = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
        });

        const listedFiles = await s3.send(listCmd);
        if (listedFiles.Contents && listedFiles.Contents.length > 0) {
          const objectsToDelete = listedFiles.Contents.map((item) => ({ Key: item.Key }));
          const deleteCmd = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: { Objects: objectsToDelete },
          });
          await s3.send(deleteCmd);
        }
      } catch (delError) {
        console.error("Gagal membersihkan file lama di R2 via S3:", delError);
      }
    }

    // Upload file baru ke R2 via S3 Client
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const fileUrl = formatR2Url(publicDomain, fileName);

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error("Error Detail Upload R2:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengunggah file ke Cloudflare R2: " + error.message,
      },
      { status: 500 }
    );
  }
}