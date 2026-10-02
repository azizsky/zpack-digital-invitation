import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: "preset-music/",
    });

    const data = await s3.send(command);

    // Ambil semua file .mp3 di dalam folder preset-music/
    const musicFiles = (data.Contents || [])
      .filter((item) => item.Key && item.Key.endsWith(".mp3"))
      .map((item) => {
        const fileName = item.Key!.replace("preset-music/", "");
        return {
          filename: fileName,
          title: fileName
            .replace(".mp3", "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          url: `${process.env.R2_PUBLIC_URL || ""}/${item.Key}`,
        };
      });

    return NextResponse.json({ success: true, data: musicFiles });
  } catch (error: any) {
    console.error("Error listing preset music from R2:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}