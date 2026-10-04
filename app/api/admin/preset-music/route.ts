import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Helper untuk format URL R2 tanpa dobel slash
function formatR2Url(domain: string, key: string): string {
  const cleanDomain = domain.replace(/\/+$/, "");
  const cleanKey = key.replace(/^\/+/, "");
  return `${cleanDomain}/${cleanKey}`;
}

export async function GET() {
  try {
    // ----------------------------------------------------
    // SKENARIO A: Berjalan di Cloudflare Pages / Workers (Production)
    // ----------------------------------------------------
    let bucket: any = null;
    let env: any = {};

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getRequestContext } = require("@cloudflare/next-on-pages");
      const ctx = getRequestContext();
      bucket = ctx.env.MY_BUCKET;
      env = ctx.env;
    } catch (e) {
      bucket = null;
    }

    if (bucket) {
      const publicDomain =
        env.R2_PUBLIC_DOMAIN ||
        process.env.R2_PUBLIC_DOMAIN ||
        "https://assets.zpack.my.id";

      const listed = await bucket.list({ prefix: "preset-music/" });
      const objects = listed?.objects || [];

      const musicFiles = objects
        .filter((item: any) => item.key && item.key.toLowerCase().endsWith(".mp3"))
        .map((item: any) => {
          const fileName = item.key.replace(/^preset-music\//, "");
          return {
            filename: fileName,
            title: fileName
              .replace(/\.mp3$/i, "")
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (l: string) => l.toUpperCase()),
            url: formatR2Url(publicDomain, item.key),
          };
        });

      return NextResponse.json({ success: true, data: musicFiles });
    }

    // ----------------------------------------------------
    // SKENARIO B: Berjalan di Localhost / Server Node.js (S3 API R2)
    // ----------------------------------------------------
    const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain =
      process.env.R2_PUBLIC_DOMAIN ||
      process.env.R2_PUBLIC_URL ||
      "https://assets.zpack.my.id";

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json(
        {
          success: false,
          message: "Environment Variable R2 belum lengkap!",
          data: [],
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

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "preset-music/",
    });

    const data = await s3.send(command);

    const musicFiles = (data.Contents || [])
      .filter((item) => item.Key && item.Key.toLowerCase().endsWith(".mp3"))
      .map((item) => {
        const fileName = item.Key!.replace(/^preset-music\//, "");
        return {
          filename: fileName,
          title: fileName
            .replace(/\.mp3$/i, "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          url: formatR2Url(publicDomain, item.Key!),
        };
      });

    return NextResponse.json({ success: true, data: musicFiles });
  } catch (error: any) {
    console.error("Error listing preset music from R2:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}