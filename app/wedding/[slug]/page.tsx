import { notFound } from "next/navigation";
import EnterpriseMasterClient from "./EnterpriseMasterClient";

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
        cache: "no-store", // Mengabaikan cache server agar data selalu paling baru
      }
    );

    const json = await res.json();

    if (!json.success || !json.result[0]?.results?.length) return null;

    return json.result[0].results[0];
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return null;
  }
}

// HELPER UNTUK MEMPERBAIKI PATH R2/IMAGE RELATIF
function fixR2Path(pathStr: string | undefined): string {
  if (!pathStr) return "";

  let clean = pathStr.trim();

  // Jika sudah berupa URL lengkap (http/https), biarkan
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  // Bersihkan leading slash
  clean = clean.replace(/^\/+/, "");

  // Jika path belum diawali 'invitations/' dan bukan 'preset-music/', tambahkan 'invitations/'
  if (!clean.startsWith("invitations/") && !clean.startsWith("preset-music/")) {
    clean = `invitations/${clean}`;
  }

  return clean;
}

export default async function PublicInvitationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Safe resolve params untuk kompatibilitas Next.js App Router
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  if (!slug) {
    notFound();
  }

  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    notFound();
  }

  // Default fallback struktur xtraData (TAMBAHKAN enableRsvp)
  let xtraData = {
    enableRsvp: true, // <-- 1. Tambahkan default value di sini
    musicOption: "none",
    customMusicUrl: "",
    galeriFoto: [] as string[],
    qrisUrl: "",
    rekeningList: [] as {
      bank: string;
      norek: string;
      atas_nama: string;
    }[],
    liveStreamUrl: "",
    videoTeaserUrl: "",
    loveStoryList: [] as {
      tahun_atau_tanggal: string;
      judul: string;
      cerita: string;
    }[],
  };

  try {
    if (invitation.xtra_data) {
      const parsed =
        typeof invitation.xtra_data === "string"
          ? JSON.parse(invitation.xtra_data)
          : invitation.xtra_data;

      const rawGaleri = Array.isArray(parsed.galeriFoto)
        ? parsed.galeriFoto
        : Array.isArray(parsed.galeri_foto)
        ? parsed.galeri_foto
        : [];

      const rawQris =
        parsed.qrisUrl || parsed.qrisImageUrl || parsed.qris_url || "";

      const rawMusic =
        parsed.customMusicUrl || parsed.custom_music_url || "";

      // Map data & perbaiki path R2
      xtraData = {
        // <-- 2. TAMBAHKAN KONDISI INI UNTUK PASSTHROUGH ENABLE_RSVP
        enableRsvp:
          parsed.enableRsvp !== undefined
            ? Boolean(parsed.enableRsvp)
            : parsed.enable_rsvp !== undefined
            ? Boolean(parsed.enable_rsvp)
            : true,
        musicOption: parsed.musicOption || parsed.music_option || "none",
        customMusicUrl: fixR2Path(rawMusic),
        galeriFoto: rawGaleri.map((img: string) => fixR2Path(img)),
        qrisUrl: fixR2Path(rawQris),
        rekeningList: Array.isArray(parsed.rekeningList)
          ? parsed.rekeningList
          : Array.isArray(parsed.rekeningBank)
          ? parsed.rekeningBank.map((r: any) => ({
              bank: r.bank || "",
              norek: r.noRek || r.norek || "",
              atas_nama: r.atasNama || r.atas_nama || "",
            }))
          : [],
        liveStreamUrl: parsed.liveStreamUrl || parsed.live_stream_url || "",
        videoTeaserUrl:
          parsed.videoTeaserUrl ||
          parsed.videoPrewedUrl ||
          parsed.video_teaser_url ||
          "",
        loveStoryList: Array.isArray(parsed.loveStoryList)
          ? parsed.loveStoryList
          : Array.isArray(parsed.loveStory)
          ? parsed.loveStory.map((l: any) => ({
              tahun_atau_tanggal:
                l.tahun || l.tahun_atau_tanggal || "",
              judul: l.judul || "",
              cerita: l.deskripsi || l.cerita || "",
            }))
          : [],
      };
    }
  } catch (e) {
    console.error("Gagal parse xtra_data:", e);
  }

  return (
    <EnterpriseMasterClient
      invitation={invitation}
      xtraData={xtraData}
    />
  );
}