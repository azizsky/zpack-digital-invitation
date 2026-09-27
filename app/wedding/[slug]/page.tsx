"use client";

import { useState, useEffect } from "react";

interface PremiumTemplateProps {
  data?: {
    namaPanggilanPria?: string;
    namaPanggilanWanita?: string;
    namaLengkapPria?: string;
    namaLengkapWanita?: string;
    tanggalAkad?: string;
    waktuAkad?: string;
    tanggalResepsi?: string;
    waktuResepsi?: string;
    lokasiTeks?: string;
    lokasiMaps?: string;
    musicOption?: string;
    galeriFoto?: string[];
    qrisImageUrl?: string;
    rekeningBank?: Array<{ bank: string; noRek: string; atasNama: string }>;
  };
}

export default function PremiumTemplate({ data }: PremiumTemplateProps) {
  // 1. SAFEGUARD: Jika data belum dimuat / undefined, tampilkan UI Loading
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p>Memuat data undangan...</p>
      </div>
    );
  }

  // Fallback aman untuk nilai variabel dasar
  const namaPria = data.namaPanggilanPria || "Pria";
  const namaWanita = data.namaPanggilanWanita || "Wanita";
  const galeriList = Array.isArray(data.galeriFoto) ? data.galeriFoto : [];

  // State Pop-up Cover Sampul (Default: Belum dibuka)
  const [isOpen, setIsOpen] = useState(false);

  // Kunci Scroll Body Saat Pop-up Masih Aktif
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handler Buka Undangan
  const handleOpenInvitation = () => {
    setIsOpen(true);

    const audioElement = document.getElementById("bg-music") as HTMLAudioElement;
    if (audioElement) {
      audioElement.play().catch((err) => console.log("Autoplay blocked:", err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-slate-900 min-h-screen relative shadow-2xl overflow-x-hidden border-x border-slate-800">
        
        {/* ==================== 1. POPUP / COVER SAMPUL PEMBUKA ==================== */}
        {!isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
            <div className="w-full max-w-md h-full flex flex-col justify-between p-6 text-center relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-x border-slate-800">
              
              {/* Header Cover */}
              <div className="pt-12 space-y-2">
                <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                  The Wedding Of
                </p>
                <h1 className="text-3xl font-serif font-bold text-white tracking-wide">
                  {namaPria} & {namaWanita}
                </h1>
              </div>

              {/* Middle Section */}
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full border-2 border-emerald-500/50 p-1">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-2xl">
                    💍
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Kepada Yth. Bapak/Ibu/Saudara/i
                </p>
              </div>

              {/* Tombol Buka Undangan */}
              <div className="pb-12">
                <button
                  onClick={handleOpenInvitation}
                  className="w-full max-w-xs mx-auto py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  ✉️ Buka Undangan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. KONTEN UTAMA UNDANGAN ==================== */}
        <main className={`transition-opacity duration-700 ${isOpen ? "opacity-100" : "opacity-0 h-screen overflow-hidden"}`}>
          
          {/* Header Banner */}
          <section className="p-8 text-center space-y-4 pt-16 bg-gradient-to-b from-emerald-950/30 to-transparent">
            <p className="text-xs font-semibold text-emerald-400 tracking-widest uppercase">
              Undangan Pernikahan
            </p>
            <h2 className="text-4xl font-serif font-bold text-white">
              {namaPria} & {namaWanita}
            </h2>
            <p className="text-xs text-slate-400">
              {data.tanggalAkad || "Senin, 01 Januari 2027"}
            </p>
          </section>

          {/* Galeri Foto dengan Fallback Handler */}
          <section className="p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 text-center">
              📸 Galeri Foto
            </h3>

            {galeriList.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {galeriList.map((imgUrl, idx) => (
                  <div key={idx} className="aspect-square rounded-xl bg-slate-800 overflow-hidden border border-slate-700/50 relative shadow">
                    <img
                      src={imgUrl}
                      alt={`Galeri ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; 
                        target.src = "https://placehold.co/400x400/0f172a/334155?text=Foto+Galeri";
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-slate-500 italic">
                Belum ada foto galeri.
              </p>
            )}
          </section>

          {/* Musik Player */}
          {data.musicOption !== "none" && (
            <audio
              id="bg-music"
              loop
              src={
                data.musicOption?.startsWith("http")
                  ? data.musicOption
                  : `/music/${data.musicOption || "lagu-1"}.mp3`
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}