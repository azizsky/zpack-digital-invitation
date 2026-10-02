"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
// Import semua style Tailwind yang diisolasi di file terpisah
import * as styles from "./EnterpriseMasterClient.module";

// ==========================================
// INTERFACES & TYPES
// ==========================================
export interface Invitation {
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
  tahun_atau_tanggal: string;
  judul: string;
  cerita: string;
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
  loveStoryList?: LoveStory[];
  alamatKadoFisik?: string;
}

interface EnterpriseMasterClientProps {
  invitation: Invitation;
  xtraData?: XtraData;
}

// ==========================================
// HELPER FUNCTIONS FOR VIDEO PARSING
// ==========================================
function getEmbedVideoUrl(url: string | undefined): string {
  if (!url) return "";

  const ytRegExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegExp);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  }

  const vimeoRegExp =
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)|player\.vimeo\.com\/video\/(\d+))/;
  const vimeoMatch = url.match(vimeoRegExp);
  const vimeoId = vimeoMatch ? vimeoMatch[3] || vimeoMatch[4] : null;
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?dnt=1&app_id=122963`;
  }

  return url;
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
        <p className={styles.masterLayoutStyles.loadingText}>Memuat data undangan...</p>
      </div>
    );
  }

  const pkg = (invitation.package || "basic").toLowerCase();
  const isBasic = pkg === "basic";
  const isEnterprise = pkg === "enterprise" || pkg === "exclusive";

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
  // RSVP Form State
  const [namaTamu, setNamaTamu] = useState<string>("");
  const [jumlahOrang, setJumlahOrang] = useState<string>("1");
  const [statusKehadiran, setStatusKehadiran] = useState<
    "Hadir" | "Tidak Hadir" | "Ragu-ragu"
  >("Hadir");
  const [pesanTamu, setPesanTamu] = useState<string>("");
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState<boolean>(false);
  const [rsvpSuccess, setRsvpSuccess] = useState<boolean>(false);
  
  // TAMBAHKAN STATE INI:
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [showRsvpForm, setShowRsvpForm] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Config domain R2 Cloudflare
  const R2_DOMAIN =
    process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN ||
    "https://pub-e68afb656e1047c18ea6018f93d09ddc.r2.dev";

  // Formatter nama file & fallback jika terisi 'preset'
  const formatMusicFilename = (filename: string) => {
    if (!filename) return "le-onde.mp3";
    let clean = filename.trim().replace(/\s+/g, "-");
    
    if (clean === "preset" || clean === "preset.mp3") {
      return "le-onde.mp3";
    }

    return clean.endsWith(".mp3") ? clean : `${clean}.mp3`;
  };

  // Menentukan sumber audio
  const audioSource = useMemo(() => {
    if (xtraData?.customMusicUrl && xtraData.customMusicUrl.trim() !== "") {
      return xtraData.customMusicUrl.trim();
    }

    if (
      xtraData?.musicOption &&
      xtraData.musicOption.trim() !== "" &&
      xtraData.musicOption.toLowerCase() !== "none"
    ) {
      const option = xtraData.musicOption.trim();

      if (option.startsWith("http://") || option.startsWith("https://")) {
        return option;
      }

      const filename = formatMusicFilename(option);
      return `${R2_DOMAIN}/preset-music/${filename}`;
    }

    return null;
  }, [xtraData, R2_DOMAIN]);

  // Fallback data rekening & QRIS dari props xtraData
  const rekeningListActual = xtraData?.rekeningBank || xtraData?.rekeningList || [];
  const qrisUrlActual = xtraData?.qrisImageUrl || xtraData?.qrisUrl;

  // Countdown Effect
  useEffect(() => {
    const targetDateStr =
      invitation.tanggal_akad ||
      invitation.tanggalAkad ||
      "2026-12-31T08:00:00";
    const targetTime = new Date(targetDateStr).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
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

  // Lock scroll body saat modal cover aktif
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

  // Handler pemutaran audio
  const playAudioSafe = async () => {
    if (!audioRef.current || !audioSource) return;

    try {
      audioRef.current.load();
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("Autoplay terhalang browser / media belum siap:", err);
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

    setIsSubmittingRsvp(true);
    setRsvpError(null);

    // Ambil ID Undangan (Cek dari invitation.id atau invitation_id)
    const activeInvitationId = (invitation as any)?.id || (invitation as any)?.invitation_id || "default-id";

    // Ambil Nomor WA Pengantin dari xtraData
    const targetNoHp = (xtraData as any)?.noHpPengantin || (xtraData as any)?.noHp || (xtraData as any)?.whatsappPengantin || "";

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationId: activeInvitationId, // Sesuai dengan body API
          nama: namaTamu,
          kehadiran: statusKehadiran,
          pesan: pesanTamu,
          noHpPengantin: targetNoHp, // Dikirim ke Fonnte
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan konfirmasi.");
      }

      setRsvpSuccess(true);
      setNamaTamu("");
      setPesanTamu("");
      setStatusKehadiran("Hadir");

      setTimeout(() => {
        setRsvpSuccess(false);
        setShowRsvpForm(false);
      }, 3000);
    } catch (err: any) {
      console.error("Gagal RSVP:", err);
      setRsvpError(err.message || "Gagal mengirim data ke server.");
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

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

      {/* ========================================================= */}
      {/* COVER / POPUP OVERLAY                                     */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* KONTEN UTAMA UNDANGAN                                     */}
      {/* ========================================================= */}
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

          {/* Nama Mempelai */}
          <div className={styles.headerStyles.mempelaiWrapper}>
            {/* Mempelai Wanita */}
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

            {/* Mempelai Pria */}
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

          {/* Ayat / Kutipan */}
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
            {/* Akad Nikah */}
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

            {/* Resepsi */}
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

        {/* 5. LOVE STORY (Opsional) */}
        {isEnterprise &&
          xtraData?.loveStoryList &&
          xtraData.loveStoryList.length > 0 && (
            <section className={styles.loveStoryStyles.section}>
              <h3 className={styles.loveStoryStyles.title}>Love Story</h3>

              <div className={styles.loveStoryStyles.timelineContainer}>
                {xtraData.loveStoryList.map((story, idx) => (
                  <div key={idx} className={styles.loveStoryStyles.item}>
                    <div className={styles.loveStoryStyles.dot} />
                    <span className={styles.loveStoryStyles.year}>
                      {story.tahun_atau_tanggal}
                    </span>
                    <h4 className={styles.loveStoryStyles.heading}>
                      {story.judul}
                    </h4>
                    <p className={styles.loveStoryStyles.story}>
                      {story.cerita}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* 6. GALERI FOTO */}
        {!isBasic && xtraData?.galeriFoto && xtraData.galeriFoto.length > 0 && (
          <section className={styles.galleryStyles.section}>
            <h3 className={styles.galleryStyles.title}>Galeri Foto</h3>
            <div className={styles.galleryStyles.grid}>
              {xtraData.galeriFoto.map((imgUrl, idx) => (
                <div key={idx} className={styles.galleryStyles.imageCard}>
                  <img
                    src={imgUrl}
                    alt={`Galeri foto ${idx + 1}`}
                    className={styles.galleryStyles.image}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Video Teaser (Opsional) */}
        {isEnterprise && xtraData?.videoTeaserUrl && (
          <section className="space-y-6 text-center">
            <h3 className={styles.galleryStyles.title}>Video Prewedding</h3>
            <div className={styles.galleryStyles.videoContainer}>
              <iframe
                src={getEmbedVideoUrl(xtraData.videoTeaserUrl)}
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
              {/* Rekening Bank & E-Wallet */}
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

              {/* QRIS */}
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

              {/* Alamat Kado Fisik */}
              {xtraData?.alamatKadoFisik && (
                <div className={styles.giftStyles.addressCard}>
                  <p className={styles.giftStyles.addressLabel}>
                    Alamat Pengiriman Kado Fisik
                  </p>
                  <p className={styles.giftStyles.addressText}>
                    {xtraData.alamatKadoFisik}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 8. RSVP */}
        {isEnterprise && (
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

              {rsvpSuccess && (
                <p className={styles.rsvpStyles.successText}>
                  ✓ Terima kasih! Konfirmasi Anda telah berhasil dikirim.
                </p>
              )}
            </form>
          </section>
        )}

        {/* 9. FOOTER */}
        <footer className="text-center space-y-4 pt-12 border-t border-slate-900 text-slate-500">
          <p className="text-xs">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.
          </p>
          <p className="text-[10px] uppercase tracking-widest">
            © {new Date().getFullYear()} Zpack Digital Wedding Invitation
          </p>
        </footer>
      </div>
    </div>
  );
}