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

export default async function PublicInvitationPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
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

  // Default fallback struktur xtraData
  let xtraData = {
    // Premium & Enterprise Common
    musicOption: "none",
    customMusicUrl: "",
    galeriFoto: [] as string[],
    qrisUrl: "",
    rekeningList: [] as { bank: string; norek: string; atas_nama: string }[],
    // Enterprise Specific
    liveStreamUrl: "",
    videoTeaserUrl: "",
    loveStoryList: [] as { tahun_atau_tanggal: string; judul: string; cerita: string }[],
  };

  try {
    if (invitation.xtra_data) {
      const parsed = typeof invitation.xtra_data === "string" 
        ? JSON.parse(invitation.xtra_data) 
        : invitation.xtra_data;

      // Map data dengan normalisasi kunci agar kompatibel baik camelCase maupun snake_case
      xtraData = {
        musicOption: parsed.musicOption || parsed.music_option || "none",
        customMusicUrl: parsed.customMusicUrl || parsed.custom_music_url || "",
        galeriFoto: Array.isArray(parsed.galeriFoto) 
          ? parsed.galeriFoto 
          : Array.isArray(parsed.galeri_foto) 
          ? parsed.galeri_foto 
          : [],
        qrisUrl: parsed.qrisUrl || parsed.qrisImageUrl || parsed.qris_url || "",
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
        videoTeaserUrl: parsed.videoTeaserUrl || parsed.videoPrewedUrl || parsed.video_teaser_url || "",
        loveStoryList: Array.isArray(parsed.loveStoryList)
          ? parsed.loveStoryList
          : Array.isArray(parsed.loveStory)
          ? parsed.loveStory.map((l: any) => ({
              tahun_atau_tanggal: l.tahun || l.tahun_atau_tanggal || "",
              judul: l.judul || "",
              cerita: l.deskripsi || l.cerita || "",
            }))
          : [],
      };
    }
  } catch (e) {
    console.error("Gagal parse xtra_data:", e);
  }

  return <EnterpriseMasterClient invitation={invitation} xtraData={xtraData} />;
}