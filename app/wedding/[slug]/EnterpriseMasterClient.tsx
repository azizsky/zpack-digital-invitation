"use client";

import { useState, useRef } from "react";

interface Rekening {
  bank: string;
  norek: string;
  atas_nama: string;
}

interface LoveStory {
  tahun_atau_tanggal: string;
  judul: string;
  cerita: string;
}

interface XtraData {
  musicOption?: string;
  customMusicUrl?: string;
  galeriFoto?: string[];
  qrisUrl?: string;
  rekeningList?: Rekening[];
  liveStreamUrl?: string;
  videoTeaserUrl?: string;
  loveStoryList?: LoveStory[];
}

// Helper untuk convert URL YouTube biasa jadi Iframe Embed URL
function getYouTubeEmbedUrl(url: string) {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : url;
}

export default function EnterpriseMasterClient({
  invitation,
  xtraData,
}: {
  invitation: any;
  xtraData: XtraData;
}) {
  const pkg = (invitation.package || "basic").toLowerCase();
  const isBasic = pkg === "basic";
  const isEnterprise = pkg === "enterprise" || pkg === "exclusive";

  // Control state
  const [isOpen, setIsOpen] = useState(isBasic);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Penentuan sumber audio (Custom MP3 Enterprise vs Preset Premium)
  const audioSource =
    isEnterprise && xtraData.customMusicUrl
      ? xtraData.customMusicUrl
      : xtraData.musicOption && xtraData.musicOption !== "none"
      ? `/music/${xtraData.musicOption}.mp3`
      : null;

  // Handler Buka Undangan
  const handleOpenInvitation = () => {
    setIsOpen(true);
    if (!isBasic && audioSource && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Autoplay blocked:", err));
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center p-0 md:p-4 font-sans">
      {/* Audio Element */}
      {!isBasic && audioSource && (
        <audio ref={audioRef} loop src={audioSource} />
      )}

      {/* Floating Music Button */}
      {!isBasic && isOpen && audioSource && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-6 right-6 z-40 bg-rose-600/80 hover:bg-rose-600 text-white p-3.5 rounded-full shadow-lg backdrop-blur-md border border-rose-400/30 transition duration-300 animate-pulse"
          title="Toggle Music"
        >
          {isPlaying ? "🎵" : "🔇"}
        </button>
      )}

      {/* Main Card View (Mobile-First Layout) */}
      <div className="w-full max-w-md min-h-screen md:min-h-[840px] bg-slate-900 border border-slate-800 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between relative">
        
        {/* ========================================================= */}
        {/* POPUP COVER AWAL (PREMIUM & ENTERPRISE)                   */}
        {/* ========================================================= */}
        {!isOpen && !isBasic && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="space-y-4">
              {isEnterprise && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  👑 Exclusive Invitation
                </span>
              )}
              <p className="text-xs uppercase tracking-widest text-rose-400 font-semibold pt-2">
                Walimatul 'Ursy
              </p>
              <h1 className="text-4xl font-serif text-white leading-tight">
                {invitation.nama_panggilan_pria} <br />
                <span className="text-rose-400 text-2xl">&</span> <br />
                {invitation.nama_panggilan_wanita}
              </h1>
              <p className="text-xs text-slate-400 pt-2">
                Kepada Yth. Bapak/Ibu/Saudara/i
              </p>

              <button
                onClick={handleOpenInvitation}
                className="mt-6 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm rounded-full shadow-lg shadow-rose-600/30 transition duration-300 flex items-center gap-2 mx-auto"
              >
                ✉️ Buka Undangan
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* KONTEN UTAMA UNDANGAN                                     */}
        {/* ========================================================= */}
        <div className="p-6 space-y-8 my-auto overflow-y-auto">
          
          {/* Header Mempelai */}
          <div className="text-center space-y-3 pt-6">
            <p className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
              Walimatul 'Ursy
            </p>
            <h1 className="text-4xl font-serif text-white tracking-wide">
              {invitation.nama_panggilan_pria} <span className="text-rose-400">&</span> {invitation.nama_panggilan_wanita}
            </h1>
            <p className="text-xs text-slate-400 px-4">
              Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri hari bahagia kami.
            </p>
          </div>

          {/* 🎥 [ENTERPRISE ONLY] VIDEO PREWEDDING / TEASER */}
          {isEnterprise && xtraData.videoTeaserUrl && (
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 space-y-3">
              <h3 className="font-semibold text-amber-400 text-xs uppercase tracking-wider text-center">
                🎬 Prewedding Teaser
              </h3>
              <div className="aspect-video rounded-xl overflow-hidden border border-slate-700">
                <iframe
                  src={getYouTubeEmbedUrl(xtraData.videoTeaserUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  title="Prewedding Video"
                ></iframe>
              </div>
            </div>
          )}

          {/* Profil Lengkap & Orang Tua */}
          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 space-y-4 text-center">
            <div>
              <h2 className="text-lg font-serif font-bold text-white">
                {invitation.nama_lengkap_pria}
              </h2>
              {invitation.orang_tua_pria && (
                <p className="text-xs text-slate-400 mt-1">
                  Putra dari Bpk/Ibu: {invitation.orang_tua_pria}
                </p>
              )}
            </div>

            <div className="text-rose-400 font-serif text-xl">&</div>

            <div>
              <h2 className="text-lg font-serif font-bold text-white">
                {invitation.nama_lengkap_wanita}
              </h2>
              {invitation.orang_tua_wanita && (
                <p className="text-xs text-slate-400 mt-1">
                  Putri dari Bpk/Ibu: {invitation.orang_tua_wanita}
                </p>
              )}
            </div>
          </div>

          {/* Turut Mengundang */}
          {(invitation.turut_mengundang_pria || invitation.turut_mengundang_wanita) && (
            <div className="text-center text-xs text-slate-400 space-y-1 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
              <p className="font-semibold text-slate-300">Turut Mengundang:</p>
              {invitation.turut_mengundang_pria && <p>{invitation.turut_mengundang_pria}</p>}
              {invitation.turut_mengundang_wanita && <p>{invitation.turut_mengundang_wanita}</p>}
            </div>
          )}

          {/* Rincian Acara */}
          <div className="space-y-4">
            {/* Akad Nikah */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full">
                Akad Nikah
              </span>
              <p className="text-sm font-semibold text-white mt-2">
                {invitation.tanggal_akad || "Tanggal belum diatur"}
              </p>
              <p className="text-xs text-slate-400">
                Pukul: {invitation.waktu_akad || "08.00 WIB s/d Selesai"}
              </p>
            </div>

            {/* Resepsi Nikah */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full">
                Resepsi Nikah
              </span>
              <p className="text-sm font-semibold text-white mt-2">
                {invitation.tanggal_resepsi || invitation.tanggal_akad}
              </p>
              <p className="text-xs text-slate-400">
                Pukul: {invitation.waktu_resepsi || "10.00 WIB s/d Selesai"}
              </p>
            </div>
          </div>

          {/* 🎥 [ENTERPRISE ONLY] LIVE STREAMING */}
          {isEnterprise && xtraData.liveStreamUrl && (
            <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/30 space-y-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full">
                📡 Live Streaming Acara
              </span>
              <p className="text-xs text-slate-300 pt-1">
                Bagi tamu yang tidak dapat hadir secara langsung, Anda dapat menyaksikan prosesi acara melalui tayangan siaran langsung di bawah ini:
              </p>
              
              {xtraData.liveStreamUrl.includes("youtube") || xtraData.liveStreamUrl.includes("youtu.be") ? (
                <div className="aspect-video rounded-xl overflow-hidden border border-amber-500/20 mt-2">
                  <iframe
                    src={getYouTubeEmbedUrl(xtraData.liveStreamUrl)}
                    className="w-full h-full"
                    allowFullScreen
                    title="Live Stream"
                  ></iframe>
                </div>
              ) : (
                <a
                  href={xtraData.liveStreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-xl shadow-md transition"
                >
                  🔗 Klik Untuk Bergabung Siaran Langsung (Zoom/Meet)
                </a>
              )}
            </div>
          )}

          {/* Lokasi & Maps */}
          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 space-y-3">
            <h3 className="font-semibold text-rose-400 text-sm flex items-center gap-1.5">
              📍 Lokasi Acara
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {invitation.lokasi_teks || "Lokasi belum diatur"}
            </p>

            {invitation.lokasi_maps && (
              <div className="pt-2 rounded-xl overflow-hidden">
                <iframe
                  src={invitation.lokasi_maps}
                  width="100%"
                  height="180"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="rounded-lg"
                ></iframe>
              </div>
            )}
          </div>

          {/* 📖 [ENTERPRISE ONLY] LOVE STORY / TIMELINE KISAH CINTA */}
          {isEnterprise && xtraData.loveStoryList && xtraData.loveStoryList.length > 0 && (
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 space-y-4">
              <h3 className="font-semibold text-amber-400 text-sm text-center">
                📖 Love Story (Kisah Cinta Kami)
              </h3>
              
              <div className="relative border-l-2 border-amber-500/40 ml-3 space-y-6 pl-4 pt-2">
                {xtraData.loveStoryList.map((story, idx) => (
                  <div key={idx} className="relative">
                    {/* Bullet Marker */}
                    <div className="absolute -left-[23px] top-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-slate-900 shadow-sm" />
                    
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {story.tahun_atau_tanggal}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1">
                      {story.judul}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {story.cerita}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📸 GALERI FOTO (PREMIUM MAX 10, ENTERPRISE MAX 20) */}
          {!isBasic && xtraData.galeriFoto && xtraData.galeriFoto.length > 0 && (
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 space-y-4">
              <h3 className="font-semibold text-rose-400 text-sm text-center">
                📸 Galeri Momen Bahagia
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {xtraData.galeriFoto.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-700/40"
                  >
                    <img
                      src={imgUrl}
                      alt={`Galeri ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 💳 KADO DIGITAL & AMPLOP */}
          {!isBasic && (((xtraData.rekeningList && xtraData.rekeningList.length > 0) || xtraData.qrisUrl)) && (
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 space-y-5 text-center">
              <h3 className="font-semibold text-rose-400 text-sm">
                💳 Kado Digital & Amplop
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Doa restu Anda merupakan karunia terindah bagi kami. Bagi yang ingin memberikan tanda kasih, dapat melalui nomor rekening / QRIS berikut:
              </p>

              {/* QRIS */}
              {xtraData.qrisUrl && (
                <div className="p-3 bg-white/5 rounded-xl border border-slate-700 inline-block">
                  <img
                    src={xtraData.qrisUrl}
                    alt="QRIS Pembayaran"
                    className="w-44 h-44 object-contain mx-auto rounded-lg"
                  />
                  <p className="text-[10px] text-slate-400 mt-2">Scan QRIS All Payment</p>
                </div>
              )}

              {/* Rekening Bank */}
              {xtraData.rekeningList && xtraData.rekeningList.length > 0 && (
                <div className="space-y-3 pt-2">
                  {xtraData.rekeningList.map((rek, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 text-left space-y-2 relative"
                    >
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                        {rek.bank}
                      </span>
                      <p className="text-sm font-mono font-semibold text-white tracking-wider">
                        {rek.norek}
                      </p>
                      <p className="text-xs text-slate-400">
                        a.n. {rek.atas_nama}
                      </p>

                      <button
                        onClick={() => copyToClipboard(rek.norek, idx)}
                        className="mt-2 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-600 transition"
                      >
                        {copiedIndex === idx ? "✅ Tersalin!" : "📋 Salin No. Rekening"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="text-center py-4 bg-slate-950/50 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-500">
            Powered by <strong className="text-slate-400">Zpack Digital Invitation</strong>
          </p>
        </div>

      </div>
    </div>
  );
}