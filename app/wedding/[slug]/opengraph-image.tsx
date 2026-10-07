import { ImageResponse } from "next/og";

export const alt = "Undangan Digital Zpack";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function getInvitationBySlug(slug: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) return null;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: "SELECT * FROM invitations WHERE slug = ?",
          params: [slug],
        }),
        cache: "no-store",
      }
    );

    const json = await res.json();
    if (!json.success || !json.result[0]?.results?.length) return null;
    return json.result[0].results[0];
  } catch (error) {
    return null;
  }
}

export default async function Image({ params }: { params: { slug: string } }) {
  const invitation = await getInvitationBySlug(params.slug);

  const namaPria = invitation?.nama_pria || "Pengantin Pria";
  const namaWanita = invitation?.nama_wanita || "Pengantin Wanita";
  const tanggalAcara = invitation?.tanggal_resepsi || invitation?.tanggal_akad || "Momen Bahagia";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Pattern Border Halus */}
        <div
          style={{
            position: "absolute",
            inset: "20px",
            border: "2px solid #27272a",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          {/* Label Atas */}
          <div
            style={{
              fontSize: 20,
              letterSpacing: "4px",
              color: "#f43f5e",
              textTransform: "uppercase",
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            The Wedding Of
          </div>

          {/* Nama Pengantin */}
          <div
            style={{
              fontSize: 64,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 20,
              background: "linear-gradient(to right, #ffffff, #a1a1aa)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {namaPria} & {namaWanita}
          </div>

          {/* Tanggal */}
          <div
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              backgroundColor: "#18181b",
              padding: "10px 24px",
              borderRadius: "9999px",
              border: "1px solid #27272a",
            }}
          >
            {tanggalAcara}
          </div>

          {/* Branding Footer */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              fontSize: 16,
              color: "#71717a",
              display: "flex",
              alignItems: "center",
            }}
          >
            Zpack Digital Invitation
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}