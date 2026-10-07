"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as styles from "./EnterpriseMasterClient.module";

// ==========================================
// INTERFACES & TYPES
// ==========================================
export interface Invitation {
  id?: string;
  invitation_id?: string;
  package?: string;
  nama_panggilan_wanita?: string;
  namaPanggilanWanita?: string;
  nama_panggilan_pria?: string;
  namaPanggilanPria?: string;
  nama_lengkap_wanita?: string;
  namaLengkapWanita?: string;
  orang_tua_wanita?: string;
  orangTuaWanita?: string;
  nama_lengkap_pria?: string;
  namaLengkapPria?: string;
  orang_tua_pria?: string;
  orangTuaPria?: string;
  tanggal_akad?: string;
  tanggalAkad?: string;
  waktu_akad?: string;
  waktuAkad?: string;
  tanggal_resepsi?: string;
  tanggalResepsi?: string;
  waktu_resepsi?: string;
  waktuResepsi?: string;
  lokasi_teks?: string;
  lokasiTeks?: string;
  lokasi_maps?: string;
  lokasiMaps?: string;
}

export interface Rekening {
  bank: string;
  norek?: string;
  noRek?: string;
  atas_nama?: string;
  atasNama?: string;
}

export interface LoveStory {
  tahun_atau_tanggal?: string;
  tahun?: string;
  judul: string;
  cerita?: string;
  deskripsi?: string;
}

export interface XtraData {
  musicOption?: string;
  customMusicUrl?: string;
  galeriFoto?: string[];
  qrisUrl?: string;
  qrisImageUrl?: string;
  rekeningList?: Rekening[];
  rekeningBank?: Rekening[];
  liveStreamUrl?: string;
  videoTeaserUrl?: string;
  videoPrewedUrl?: string;
  loveStoryList?: LoveStory[];
  loveStory?: LoveStory[];
  enableRsvp?: boolean;
}

interface EnterpriseMasterClientProps {
  invitation: Invitation;
  xtraData?: XtraData;
}

interface RsvpItem {
  id: string;
  nama: string;
  kehadiran: string;
  pesan: string;
  created_at?: string;
}

// ==========================================
// HELPER FUNCTIONS FOR VIDEO & AUDIO FORMAT
// ==========================================
function getEmbedVideoUrl(url: string | undefined): string {
  if (!url) return "";

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  const ytRegExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const ytMatch = url.match(ytRegExp);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  }

  const vimeoRegExp = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)|player\.vimeo\.com\/video\/(\d+))/;
  const vimeoMatch = url.match(vimeoRegExp);
  const vimeoId = vimeoMatch ? vimeoMatch[3] || vimeoMatch[4] : null;
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?dnt=1&app_id=122963`;
  }

  return url;
}

function formatMusicFilename(filename: string): string {
  if (!filename) return "le-onde.mp3";
  let clean = filename.trim().replace(/\s+/g, "-");
  if (clean === "preset" || clean === "preset.mp3") {
    return "le-onde.mp3";
  }
  return clean.endsWith(".mp3") ? clean : `${clean}.mp3`;
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function EnterpriseMasterClient({
  invitation,
  xtraData = {},
}: EnterpriseMasterClientProps) {
  if (!invitation) {
    return (
      <div className={styles.masterLayoutStyles.loadingWrapper}>
        <div className={styles.masterLayoutStyles.spinner}></div>
        <p className={styles.masterLayoutStyles.loadingText}>
          Memuat data undangan...
        </p>
      </div>
    );
  }

  const pkg = (invitation?.package || "basic").toLowerCase();
  const isBasic = pkg === "basic";
  const isEnterprise = pkg === "enterprise" || pkg === "exclusive" || pkg === "pro";

  // Flag Kondisional Fitur dari XtraData
  // 1. Parse xtraData jika bentuknya masih String JSON
// 1. Parse xtraData jika bentuknya String JSON
const parsedXtra = typeof xtraData === "string" ? JSON.parse(xtraData || "{}") : (xtraData || {});
 
const isRsvpActive = parsedXtra?.enableRsvp !== undefined ? Boolean(parsedXtra.enableRsvp) : true;

  // State Management
  const [isOpen, setIsOpen] = useState<boolean>(isBasic);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });


  // RSVP Form State
  const [namaTamu, setNamaTamu] = useState<string>("");
  const [jumlahOrang, setJumlahOrang] = useState<string>("1");
  const [statusKehadiran, setStatusKehadiran] = useState<
    "Hadir" | "Tidak Hadir" | "Ragu-ragu"
  >("Hadir");
  const [pesanTamu, setPesanTamu] = useState<string>("");
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState<boolean>(false);
  const [rsvpSuccess, setRsvpSuccess] = useState<boolean>(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpList, setRsvpList] = useState<RsvpItem[]>([]);
  const [isLoadingRsvp, setIsLoadingRsvp] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Config domain R2 Cloudflare
  const rawR2Domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN?.trim();
  const R2_DOMAIN = useMemo(() => {
    return rawR2Domain && rawR2Domain !== "" && rawR2Domain !== "/"
      ? rawR2Domain.replace(/\/+$/, "")
      : "https://assets.zpack.my.id";
  }, [rawR2Domain]);

  // HELPER PENGAMBILAN GAMBAR UNTUK GALERI & QRIS
  const getImageUrl = useCallback((urlStr: string | undefined): string => {
    if (!urlStr) return "";
    let cleanStr = urlStr.trim();

    // 1. Bersihkan prefix 'invitations/' jika ada
    cleanStr = cleanStr.replace(/^(\/?invitations\/)+/, "");

    // 2. Jika di database tersimpan URL lama, ganti domainnya ke R2_DOMAIN
    if (cleanStr.includes(".r2.dev") || cleanStr.startsWith("https://zpack.my.id/")) {
      cleanStr = cleanStr.replace(/^https?:\/\/[^\/]+/, R2_DOMAIN);
    }

    // 3. Jika sudah merupakan URL lengkap https://...
    if (cleanStr.startsWith("http://") || cleanStr.startsWith("https://")) {
      return cleanStr;
    }

    // 4. Jika hanya path relatif
    const pathWithoutLeadingSlash = cleanStr.replace(/^\/+/, "");
    return `${R2_DOMAIN}/${pathWithoutLeadingSlash}`;
  }, [R2_DOMAIN]);

  const activeInvitationId = invitation?.id || invitation?.invitation_id;

  const fetchRsvpList = useCallback(async () => {
    if (!activeInvitationId || !isRsvpActive) return;
    try {
      const res = await fetch(`/api/rsvp?invitationId=${activeInvitationId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRsvpList(json.data);
      }
    } catch (err) {
      console.error("Gagal mengambil daftar ucapan:", err);
    } finally {
      setIsLoadingRsvp(false);
    }
  }, [activeInvitationId, isRsvpActive]);

  useEffect(() => {
    if (isRsvpActive) {
      fetchRsvpList();
    }
  }, [fetchRsvpList, isRsvpActive]);

  useEffect(() => {
    if (activeInvitationId) {
      const storageKey = `zpack_rsvp_sent_${activeInvitationId}`;
      if (localStorage.getItem(storageKey)) {
        setRsvpError("Anda sudah pernah mengirimkan konfirmasi kehadiran.");
      }
    }
  }, [activeInvitationId]);

  // AUDIO SOURCE MANAGER
  const audioSource = useMemo(() => {
    const cleanAudioPath = (rawStr: string): string => {
      let clean = rawStr.trim();

      // 1. Bersihkan prefix 'invitations/' jika ada
      clean = clean.replace(/^(\/?invitations\/)+/, "");

      // 2. Jika pakai domain r2.dev lama atau zpack.my.id lama, ganti ke R2_DOMAIN
      if (clean.includes(".r2.dev") || clean.startsWith("https://zpack.my.id/")) {
        clean = clean.replace(/^https?:\/\/[^\/]+/, R2_DOMAIN);
      }

      // 3. Jika sudah berupa URL lengkap http/https
      if (clean.startsWith("http://") || clean.startsWith("https://")) {
        return clean;
      }

      // 4. Hilangkan leading slash di awal path
      const pathWithoutSlash = clean.replace(/^\/+/, "");

      // Jika berupa preset-music/
      if (pathWithoutSlash.startsWith("preset-music/")) {
        const fileName = pathWithoutSlash.replace(/^preset-music\//, "");
        return `${R2_DOMAIN}/preset-music/${formatMusicFilename(fileName)}`;
      }

      return `${R2_DOMAIN}/${pathWithoutSlash}`;
    };

    // A. Custom music dari xtraData
    let customUrl = xtraData?.customMusicUrl;
    if (customUrl && typeof customUrl === "string" && customUrl.trim() !== "") {
      return cleanAudioPath(customUrl);
    }

    // B. Preset music option dari xtraData
    if (
      xtraData?.musicOption &&
      typeof xtraData.musicOption === "string" &&
      xtraData.musicOption.trim() !== "" &&
      xtraData.musicOption.toLowerCase() !== "none"
    ) {
      const option = xtraData.musicOption.trim();

      if (option.includes("/") || option.startsWith("http")) {
        return cleanAudioPath(option);
      }

      const formattedFile = formatMusicFilename(option);
      return `${R2_DOMAIN}/preset-music/${formattedFile}`;
    }

    // C. Fallback default
    return `${R2_DOMAIN}/preset-music/le-onde.mp3`;
  }, [xtraData, R2_DOMAIN]);

  // Debug log untuk membantu melacak URL Audio di Console Browser
  useEffect(() => {
    if (audioSource) {
      console.log("🔊 Audio Target URL:", audioSource);
    }
  }, [audioSource]);

  // Fallback data
  const rekeningListActual = xtraData?.rekeningBank || xtraData?.rekeningList || [];
  const qrisUrlActual = getImageUrl(xtraData?.qrisImageUrl || xtraData?.qrisUrl);
  const galeriFotoList = useMemo(() => {
    return (xtraData?.galeriFoto || []).map((imgUrl) => getImageUrl(imgUrl));
  }, [xtraData?.galeriFoto, getImageUrl]);
  const loveStoryListActual = xtraData?.loveStory || xtraData?.loveStoryList || [];

  // Countdown Effect
  useEffect(() => {
    const targetDateStr =
      invitation.tanggal_akad ||
      invitation.tanggalAkad ||
      invitation.tanggal_resepsi ||
      invitation.tanggalResepsi ||
      "2026-12-31T08:00:00";
    const targetTime = new Date(targetDateStr).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [invitation]);

  useEffect(() => {
    if (!isOpen && !isBasic) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isBasic]);

  const playAudioSafe = async () => {
    if (!audioRef.current || !audioSource) return;

    try {
      audioRef.current.load();
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("Autoplay/Play terhalang oleh browser atau gagal dimuat:", err);
      setIsPlaying(false);
    }
  };

  const handleOpenInvitation = () => {
    setIsOpen(true);
    setTimeout(() => {
      playAudioSafe();
    }, 150);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playAudioSafe();
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!namaTamu.trim()) return;

  // 1. KUNCI LOCALSTORAGE UNTUK CEK PROTEKSI SPAM
  const storageKey = `zpack_rsvp_sent_${activeInvitationId}`;
  if (localStorage.getItem(storageKey)) {
    setRsvpError("Anda sudah pernah mengirimkan konfirmasi kehadiran untuk undangan ini.");
    return;
  }

  setIsSubmittingRsvp(true);
  setRsvpError(null);

  try {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invitationId: activeInvitationId,
        nama: namaTamu,
        kehadiran: statusKehadiran,
        pesan: pesanTamu,
        jumlahOrang: jumlahOrang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Gagal menyimpan konfirmasi.");
    }

    // 2. SIMPAN FLAG DI LOCALSTORAGE AGAR TIDAK BISA KIRIM LAGI
    localStorage.setItem(storageKey, "true");

    setRsvpSuccess(true);

    const newRsvpItem: RsvpItem = {
      id: Date.now().toString(),
      nama: namaTamu,
      kehadiran: statusKehadiran,
      pesan: pesanTamu || "-",
      created_at: new Date().toISOString(),
    };

    setRsvpList((prev) => [newRsvpItem, ...prev]);

    if (typeof fetchRsvpList === "function") {
      fetchRsvpList();
    }

    setNamaTamu("");
    setPesanTamu("");
    setJumlahOrang("1");
    setStatusKehadiran("Hadir");

    setTimeout(() => {
      setRsvpSuccess(false);
    }, 4000);
  } catch (err: any) {
    console.error("Gagal RSVP:", err);
    setRsvpError(err.message || "Gagal mengirim data ke server.");
  } finally {
    setIsSubmittingRsvp(false);
  }
};

  

  // Jangan lupa sertakan <audio ref={audioRef} src={audioSource} /> di dalam JSX return komponen kamu nantinya.

  return (
    <div className={styles.masterLayoutStyles.pageWrapper}>
      {/* Background Decor Glows */}
      <div className={styles.masterLayoutStyles.glowTop} />
      <div className={styles.masterLayoutStyles.glowBottom} />

      {/* Audio Player */}
      {audioSource && (
        <audio
          key={audioSource}
          ref={audioRef}
          loop
          preload="auto"
          src={audioSource}
          onError={(e) => {
            console.warn("File audio belum siap atau URL tidak ditemukan:", audioSource);
            setIsPlaying(false);
          }}
        />
      )}

      {/* Floating Music Control */}
      {!isBasic && isOpen && audioSource && (
        <button
          onClick={toggleMusic}
          aria-label={isPlaying ? "Jeda Musik" : "Putar Musik"}
          className={styles.masterLayoutStyles.musicFloatingBtn}
          title="Atur Musik"
        >
          {isPlaying ? (
            <span className="animate-pulse block text-base">🎵</span>
          ) : (
            <span className="opacity-60 block text-base">🔇</span>
          )}
        </button>
      )}

      {/* COVER / POPUP OVERLAY */}
      {!isOpen && !isBasic && (
        <div className={styles.coverOverlayStyles.overlay}>
          <div className={styles.coverOverlayStyles.wrapper}>
            {isEnterprise && (
              <span className={styles.coverOverlayStyles.badge}>
                Exclusive Invitation
              </span>
            )}
            <div className={styles.coverOverlayStyles.titleContainer}>
              <p className={styles.coverOverlayStyles.subtitle}>
                The Wedding Of
              </p>
              <h1 className={styles.coverOverlayStyles.mempelaiTitle}>
                {invitation.nama_panggilan_wanita ||
                  invitation.namaPanggilanWanita ||
                  "Wanita"}
                <span className={styles.coverOverlayStyles.andText}>&</span>
                {invitation.nama_panggilan_pria ||
                  invitation.namaPanggilanPria ||
                  "Pria"}
              </h1>
            </div>

            <div className={styles.coverOverlayStyles.guestContainer}>
              <p className={styles.coverOverlayStyles.guestLabel}>
                Kepada Yth. Bapak/Ibu/Saudara/i
              </p>
              <p className={styles.coverOverlayStyles.guestName}>
                Tamu Undangan
              </p>
            </div>

            <button
              onClick={handleOpenInvitation}
              className={styles.coverOverlayStyles.button}
            >
              ✉️ Buka Undangan
            </button>
          </div>
        </div>
      )}

      {/* KONTEN UTAMA UNDANGAN */}
      <div
        className={`${styles.masterLayoutStyles.mainContent} ${
          isOpen ? "opacity-100 block" : "opacity-0 hidden"
        }`}
      >
        {/* 1. SALAM & PEMBUKAAN */}
        <section className={styles.headerStyles.section}>
          <div className={styles.headerStyles.salamWrapper}>
            <p className={styles.headerStyles.salamText}>
              Assalamu’alaikum Wr. Wb.
            </p>
            <p className={styles.headerStyles.pembukaText}>
              &ldquo;Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud
              menyelenggarakan pernikahan putra-putri kami:&rdquo;
            </p>
          </div>

          <div className={styles.headerStyles.mempelaiWrapper}>
            <div className={styles.headerStyles.mempelaiBlock}>
              <h1 className={styles.headerStyles.namaText}>
                {invitation.nama_lengkap_wanita ||
                  invitation.namaLengkapWanita ||
                  "Nama Lengkap Mempelai Wanita"}
              </h1>
              {(invitation.orang_tua_wanita || invitation.orangTuaWanita) && (
                <p className={styles.headerStyles.ortuText}>
                  Putri dari Pasangan Bpk. & Ibu{" "}
                  <span className={styles.headerStyles.ortuSpan}>
                    {invitation.orang_tua_wanita || invitation.orangTuaWanita}
                  </span>
                </p>
              )}
            </div>

            <div className={styles.headerStyles.divider}>&</div>

            <div className={styles.headerStyles.mempelaiBlock}>
              <h1 className={styles.headerStyles.namaText}>
                {invitation.nama_lengkap_pria ||
                  invitation.namaLengkapPria ||
                  "Nama Lengkap Mempelai Pria"}
              </h1>
              {(invitation.orang_tua_pria || invitation.orangTuaPria) && (
                <p className={styles.headerStyles.ortuText}>
                  Putra dari Pasangan Bpk. & Ibu{" "}
                  <span className={styles.headerStyles.ortuSpan}>
                    {invitation.orang_tua_pria || invitation.orangTuaPria}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className={styles.headerStyles.ayatWrapper}>
            <p className={styles.headerStyles.ayatText}>
              &ldquo;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan
              untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung
              dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa
              kasih dan sayang.&rdquo;
            </p>
            <p className={styles.headerStyles.surahText}>(QS. Ar-Rum: 21)</p>
          </div>
        </section>

        {/* 2. DETAIL ACARA */}
        <section className={styles.eventStyles.section}>
          <h3 className={styles.eventStyles.title}>Detail Acara</h3>

          <div className={styles.eventStyles.grid}>
            <div className={styles.eventStyles.card}>
              <span className={styles.eventStyles.label}>Akad Nikah</span>
              <p className={styles.eventStyles.date}>
                {invitation.tanggal_akad ||
                  invitation.tanggalAkad ||
                  "Senin, 01 Januari 2026"}
              </p>
              <p className={styles.eventStyles.time}>
                Pukul:{" "}
                {invitation.waktu_akad ||
                  invitation.waktuAkad ||
                  "08.00 WIB s/d Selesai"}
              </p>
            </div>

            <div className={styles.eventStyles.card}>
              <span className={styles.eventStyles.label}>Resepsi</span>
              <p className={styles.eventStyles.date}>
                {invitation.tanggal_resepsi ||
                  invitation.tanggalResepsi ||
                  invitation.tanggal_akad ||
                  invitation.tanggalAkad ||
                  "Senin, 01 Januari 2026"}
              </p>
              <p className={styles.eventStyles.time}>
                Pukul:{" "}
                {invitation.waktu_resepsi ||
                  invitation.waktuResepsi ||
                  "11.00 WIB s/d Selesai"}
              </p>
            </div>
          </div>
        </section>

        {/* 3. COUNTDOWN */}
        <section className={styles.countdownStyles.section}>
          <p className={styles.countdownStyles.title}>
            Hitung Mundur Hari Bahagia
          </p>
          <div className={styles.countdownStyles.grid}>
            {[
              { label: "Hari", value: timeLeft.days },
              { label: "Jam", value: timeLeft.hours },
              { label: "Menit", value: timeLeft.minutes },
              { label: "Detik", value: timeLeft.seconds },
            ].map((item, idx) => (
              <div key={idx} className={styles.countdownStyles.item}>
                <span className={styles.countdownStyles.number}>
                  {String(item.value).padStart(2, "0")}
                </span>
                <span className={styles.countdownStyles.unit}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. GOOGLE MAPS / LOKASI */}
        <section className={styles.locationStyles.section}>
          <h3 className={styles.locationStyles.title}>Lokasi Acara</h3>
          <p className={styles.locationStyles.address}>
            {invitation.lokasi_teks ||
              invitation.lokasiTeks ||
              "Gedung Pernikahan Indah, Jl. Contoh Alamat No. 123, Kota Bandung"}
          </p>

          {(invitation.lokasi_maps || invitation.lokasiMaps) && (
            <div className={styles.locationStyles.wrapper}>
              <div className={styles.locationStyles.mapContainer}>
                <iframe
                  src={invitation.lokasi_maps || invitation.lokasiMaps}
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Lokasi Acara"
                  className={styles.locationStyles.iframe}
                ></iframe>
              </div>

              <a
                href={invitation.lokasi_maps || invitation.lokasiMaps}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.locationStyles.button}
              >
                📍 Buka Google Maps
              </a>
            </div>
          )}
        </section>

        {/* 5. LOVE STORY */}
        {isEnterprise && loveStoryListActual.length > 0 && (
          <section className={styles.loveStoryStyles.section}>
            <h3 className={styles.loveStoryStyles.title}>Love Story</h3>

            <div className={styles.loveStoryStyles.timelineContainer}>
              {loveStoryListActual.map((story, idx) => (
                <div key={idx} className={styles.loveStoryStyles.item}>
                  <div className={styles.loveStoryStyles.dot} />
                  <span className={styles.loveStoryStyles.year}>
                    {story.tahun_atau_tanggal || story.tahun}
                  </span>
                  <h4 className={styles.loveStoryStyles.heading}>
                    {story.judul}
                  </h4>
                  <p className={styles.loveStoryStyles.story}>
                    {story.cerita || story.deskripsi}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. GALERI FOTO (FIXED WITH getImageUrl) */}
        {!isBasic && galeriFotoList.length > 0 && (
          <section className={styles.galleryStyles.section}>
            <h3 className={styles.galleryStyles.title}>Galeri Foto</h3>
            <div className={styles.galleryStyles.grid}>
              {galeriFotoList.map((imgUrl, idx) => (
                <div key={idx} className={styles.galleryStyles.imageCard}>
                  <img
                    src={getImageUrl(imgUrl)}
                    alt={`Galeri foto ${idx + 1}`}
                    className={styles.galleryStyles.image}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Video Teaser */}
        {isEnterprise && (xtraData?.videoTeaserUrl || xtraData?.videoPrewedUrl) && (
          <section className="space-y-6 text-center my-8">
            <h3 className={styles.galleryStyles.title}>Video Prewedding</h3>
            <div className={styles.galleryStyles.videoContainer}>
              <iframe
                src={getEmbedVideoUrl(xtraData.videoTeaserUrl || xtraData.videoPrewedUrl)}
                className={styles.galleryStyles.iframe}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Prewedding Video"
              ></iframe>
            </div>
          </section>
        )}

        {/* 7. WEDDING GIFT */}
        {rekeningListActual.length > 0 && (
          <section className={styles.giftStyles.section}>
            <div className={styles.giftStyles.headerWrapper}>
              <h3 className={styles.giftStyles.title}>Wedding Gift</h3>
              <p className={styles.giftStyles.description}>
                Doa restu Anda merupakan karunia terindah bagi kami. Namun jika
                ingin memberi hadiah, Anda dapat menggunakan opsi berikut:
              </p>
            </div>

            <div className={styles.giftStyles.container}>
              {rekeningListActual.map((rek, idx) => {
                const nomorRekening = rek.norek || rek.noRek || "";
                const atasNama = rek.atas_nama || rek.atasNama || "";

                return (
                  <div key={idx} className={styles.giftStyles.bankCard}>
                    <p className={styles.giftStyles.bankName}>{rek.bank}</p>
                    <p className={styles.giftStyles.accountNum}>
                      {nomorRekening}
                    </p>
                    <p className={styles.giftStyles.accountOwner}>
                      a.n {atasNama}
                    </p>
                    <button
                      onClick={() => copyToClipboard(nomorRekening, idx)}
                      className={styles.giftStyles.copyButton}
                    >
                      {copiedIndex === idx ? "✓ Tersalin" : "📋 Salin Rekening"}
                    </button>
                  </div>
                );
              })}

              {qrisUrlActual && (
                <div className={styles.giftStyles.qrisWrapper}>
                  <p className={styles.giftStyles.qrisLabel}>QRIS Pembayaran</p>
                  <img
                    src={qrisUrlActual}
                    alt="QRIS Gift"
                    className={styles.giftStyles.qrisImage}
                  />
                </div>
              )}

            </div>
          </section>
        )}

        {/* 8. SECTION RSVP & BUKU UCAPAN */}
        {isRsvpActive && (
          <React.Fragment>
            <section className={styles.rsvpStyles.section}>
              <div className={styles.rsvpStyles.headerWrapper}>
                <h3 className={styles.rsvpStyles.title}>
                  Konfirmasi Kehadiran (RSVP)
                </h3>
                <p className={styles.rsvpStyles.description}>
                  Mohon konfirmasikan kehadiran Anda untuk membantu persiapan acara.
                </p>
              </div>

              <form onSubmit={handleRsvpSubmit} className={styles.rsvpStyles.form}>
                <div>
                  <label className={styles.rsvpStyles.label}>
                    Nama Tamu / Rombongan
                  </label>
                  <input
                    type="text"
                    required
                    value={namaTamu}
                    onChange={(e) => setNamaTamu(e.target.value)}
                    placeholder="Masukkan nama Anda"
                    className={styles.rsvpStyles.input}
                  />
                </div>

                <div className={styles.rsvpStyles.gridTwoCol}>
                  <div>
                    <label className={styles.rsvpStyles.label}>
                      Jumlah Orang
                    </label>
                    <select
                      value={jumlahOrang}
                      onChange={(e) => setJumlahOrang(e.target.value)}
                      className={styles.rsvpStyles.select}
                    >
                      <option value="1">1 Orang</option>
                      <option value="2">2 Orang</option>
                      <option value="3">3 Orang</option>
                      <option value="4+">Lebih dari 3</option>
                    </select>
                  </div>

                  <div>
                    <label className={styles.rsvpStyles.label}>
                      Konfirmasi Kehadiran
                    </label>
                    <select
                      value={statusKehadiran}
                      onChange={(e) =>
                        setStatusKehadiran(
                          e.target.value as "Hadir" | "Tidak Hadir" | "Ragu-ragu"
                        )
                      }
                      className={styles.rsvpStyles.select}
                    >
                      <option value="Hadir">Hadir</option>
                      <option value="Tidak Hadir">Tidak Hadir</option>
                      <option value="Ragu-ragu">Ragu-ragu</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={styles.rsvpStyles.label}>
                    Pesan / Ucapan Singkat (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={pesanTamu}
                    onChange={(e) => setPesanTamu(e.target.value)}
                    placeholder="Tulis ucapan selamat..."
                    className={styles.rsvpStyles.textarea}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingRsvp}
                  className={styles.rsvpStyles.button}
                >
                  {isSubmittingRsvp ? "Mengirim..." : "Kirim Konfirmasi"}
                </button>

                {rsvpError && (
                  <p className="text-red-400 text-sm mt-2 text-center">
                    {rsvpError}
                  </p>
                )}

                {rsvpSuccess && (
                  <p className={styles.rsvpStyles.successText}>
                    ✓ Terima kasih! Konfirmasi Anda telah berhasil dikirim.
                  </p>
                )}
              </form>
            </section>

            {/* BUKU UCAPAN (SCROLLABLE BOX) */}
            <div className="mt-8 w-full max-w-lg mx-auto bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  💬 Ucapan & Doa
                </h3>
                <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                  {rsvpList.length} Pesan
                </span>
              </div>

              <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {isLoadingRsvp ? (
                  <p className="text-center text-sm text-slate-400 py-6">
                    Memuat ucapan...
                  </p>
                ) : rsvpList.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-6">
                    Belum ada ucapan. Jadilah yang pertama memberikan doa!
                  </p>
                ) : (
                  rsvpList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/50 border border-slate-700/50 p-3.5 rounded-lg text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-200 text-sm">
                          {item.nama}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            item.kehadiran === "Hadir"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.kehadiran === "Tidak Hadir"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {item.kehadiran}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {item.pesan}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}