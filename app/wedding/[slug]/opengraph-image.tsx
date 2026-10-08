import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Zpack Digital Invitation";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function getInvitationBySlug(slug: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    return null;
  }

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

    if (!json.success || !json.result[0]?.results?.length) {
      return null;
    }

    return json.result[0].results[0];
  } catch (error) {
    console.error("OG Error:", error);
    return null;
  }
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#09090b",
            color: "white",
            fontSize: 60,
          }}
        >
          Zpack Digital Invitation
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  const namaPria =
    invitation.nama_panggilan_pria ||
    invitation.nama_lengkap_pria ||
    "Pengantin Pria";

  const namaWanita =
    invitation.nama_panggilan_wanita ||
    invitation.nama_lengkap_wanita ||
    "Pengantin Wanita";

  const tanggal =
    invitation.tanggal_resepsi ||
    invitation.tanggal_akad ||
    "";

  const tanggalFormatted = formatDate(tanggal);

  const packageName =
    invitation.package ||
    "basic";

  const isBasic = packageName === "basic";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf9f6",
          color: "#222",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Decorative border */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "30px",
            right: "30px",
            bottom: "30px",
            border: "2px solid #222",
            display: "flex",
          }}
        />

        {/* Small title */}
        <div
          style={{
            fontSize: 28,
            letterSpacing: "8px",
            marginBottom: "35px",
            display: "flex",
          }}
        >
          WEDDING INVITATION
        </div>

        {/* Wedding title */}
        <div
          style={{
            fontSize: 30,
            letterSpacing: "4px",
            marginBottom: "20px",
            display: "flex",
          }}
        >
          THE WEDDING OF
        </div>

        {/* Names */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "25px",
          }}
        >
          <span>{namaWanita}</span>

          <span
            style={{
              fontSize: 48,
              fontWeight: 400,
            }}
          >
            &
          </span>

          <span>{namaPria}</span>
        </div>

        {/* Date */}
        {tanggalFormatted && (
          <div
            style={{
              marginTop: "35px",
              fontSize: 28,
              letterSpacing: "4px",
              display: "flex",
            }}
          >
            {tanggalFormatted.toUpperCase()}
          </div>
        )}

        {/* Basic branding */}
        {isBasic && (
          <div
            style={{
              position: "absolute",
              bottom: "55px",
              fontSize: 20,
              letterSpacing: "4px",
              display: "flex",
            }}
          >
            ZPACK DIGITAL INVITATION
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}