import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  try {
    const { fileUrl } = await request.json();

    if (!fileUrl) {
      return NextResponse.json({ success: false, message: "URL file tidak ditemukan" }, { status: 400 });
    }

    // Ambil path Key dari URL publik R2 (misal: https://pub-xxx.r2.dev/slug/gallery/namafile.jpg -> slug/gallery/namafile.jpg)
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || "";
    const key = fileUrl.replace(`${publicDomain}/`, "");

    if (!key) {
      return NextResponse.json({ success: false, message: "Key file tidak valid" }, { status: 400 });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
    });

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    return NextResponse.json({ success: true, message: "File berhasil dihapus dari R2" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}