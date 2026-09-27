import { NextResponse } from "next/server";

export const runtime = "edge";

async function queryRemoteD1(sql: string, params: any[] = []) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    console.error("❌ [API ROUTE] ENV D1 BELUM LENGKAP!");
    throw new Error("Konfigurasi Cloudflare D1 di .env.local belum lengkap!");
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
  console.log("🔍 [API ROUTE] RAW D1 RESPONSE:", JSON.stringify(json, null, 2));

  if (!json.success) {
    console.error("❌ [API ROUTE] D1 ERROR:", json.errors);
    throw new Error(json.errors?.[0]?.message || "Gagal query ke Cloudflare D1");
  }

  return json.result?.[0]?.results || [];
}

export async function GET() {
  try {
    const results = await queryRemoteD1("SELECT * FROM templates");
    console.log("✅ [API ROUTE] FETCHED TEMPLATES RESULT:", results);

    return NextResponse.json(
      {
        success: true,
        data: results || [],
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ [API ROUTE] CATCH ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal memuat data template",
        data: [],
      },
      { status: 500 }
    );
  }
}