import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

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
    // SKENARIO A: Berjalan di Cloudflare Pages (Production)
    // ----------------------------------------------------
    let bucket: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getRequestContext } = require("@cloudflare/next-on-pages");
      bucket = getRequestContext().env.MY_BUCKET; // Pastikan nama binding R2 di Cloudflare kamu 'MY_BUCKET'
    } catch (e) {
      bucket = null;
    }

    if (bucket) {
      // Jika di production Cloudflare Workers/Pages, untuk qris/music kita bisa hapus prefix folder lama jika perlu, 
      // tapi secara default S3 API di bawah ini yang paling sering dipakai untuk Localhost S3.
      await bucket.put(fileName, buffer, {
        httpMetadata: { contentType: file.type },
      });

      const publicDomain = process.env.R2_PUBLIC_DOMAIN || "https://pub-r2.cloudflare.com";
      const fileUrl = `${publicDomain}/${fileName}`;

      return NextResponse.json({ success: true, url: fileUrl });
    }

    // ----------------------------------------------------
    // SKENARIO B: Berjalan di Localhost (S3 API R2)
    // ----------------------------------------------------
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

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

    // ----------------------------------------------------
    // 🛠️ LOGIKA PEMBERSIHAN FILE LAMA (KHUSUS QRIS / MUSIC)
    // ----------------------------------------------------
    // Jika folder tipe qris atau music, bersihkan isi file lama di folder tersebut agar tidak menumpuk
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
        console.error("Gagal membersihkan file lama di R2:", delError);
      }
    }
    // ----------------------------------------------------

    // Upload file baru ke R2
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const fileUrl = `${publicDomain}/${fileName}`;

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