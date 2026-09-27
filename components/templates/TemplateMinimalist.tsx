"use client";

import React from "react";

// Definisikan tipe data props yang diterima dari database
interface TemplateProps {
  data: {
    nama_panggilan_pria: string;
    nama_panggilan_wanita: string;
    nama_lengkap_pria: string;
    nama_lengkap_wanita: string;
    tanggal_akad: string;
    waktu_akad: string;
    tanggal_resepsi: string;
    waktu_resepsi: string;
    lokasi_teks: string;
    lokasi_maps: string;
  };
  xtraData: {
    musicOption?: string;
    galeriFoto?: string[];
    qrisImageUrl?: string;
    rekeningBank?: Array<{ bank: string; nomor: string; nama: string }>;
  };
}

export default function TemplateMinimalist({ data, xtraData }: TemplateProps) {
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-amber-500 selection:text-white">
      
      {/* BAGIAN 1: COVER / HERO SECTION */}
      <section className="flex flex-col items-center justify-center h-screen text-center px-4">
        <p className="text-sm tracking-widest text-amber-400 uppercase mb-4">The Wedding Of</p>
        <h1 className="text-5xl md:text-7xl font-serif mb-4">
          {data.nama_panggilan_pria} & {data.nama_panggilan_wanita}
        </h1>
        <p className="text-stone-400 text-sm">{data.tanggal_resepsi || data.tanggal_akad}</p>
      </section>

      {/* BAGIAN 2: MEMPELAI */}
      <section className="py-20 px-4 max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-serif mb-10 text-amber-400">Mempelai Bahagia</h2>
        
        <div className="mb-8">
          <h3 className="text-2xl font-semibold">{data.nama_lengkap_pria}</h3>
          <p className="text-stone-400 text-sm mt-1">Putra dari Keluarga Bapak & Ibu</p>
        </div>

        <div className="text-2xl font-serif text-amber-500 my-6">&</div>

        <div>
          <h3 className="text-2xl font-semibold">{data.nama_lengkap_wanita}</h3>
          <p className="text-stone-400 text-sm mt-1">Putri dari Keluarga Bapak & Ibu</p>
        </div>
      </section>

      {/* BAGIAN 3: ACARA (AKAD & RESEPSI) */}
      <section className="py-20 px-4 bg-stone-950 text-center">
        <h2 className="text-3xl font-serif mb-10 text-amber-400">Waktu & Tempat</h2>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800">
            <h3 className="text-xl font-semibold mb-2">Akad Nikah</h3>
            <p className="text-stone-300">📅 {data.tanggal_akad}</p>
            <p className="text-stone-300">⏰ {data.waktu_akad}</p>
          </div>

          <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800">
            <h3 className="text-xl font-semibold mb-2">Resepsi</h3>
            <p className="text-stone-300">📅 {data.tanggal_resepsi}</p>
            <p className="text-stone-300">⏰ {data.waktu_resepsi}</p>
          </div>
        </div>

        <div className="mt-8 max-w-xl mx-auto">
          <p className="text-stone-300 mb-4">📍 {data.lokasi_teks}</p>
          {data.lokasi_maps && (
            <a 
              href={data.lokasi_maps} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Buka Google Maps
            </a>
          )}
        </div>
      </section>

      {/* BAGIAN 4: GALERI FOTO (DIAMBIL DARI XTRA DATA) */}
      {xtraData.galeriFoto && xtraData.galeriFoto.length > 0 && (
        <section className="py-20 px-4 max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif text-center mb-10 text-amber-400">Galeri Momen</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {xtraData.galeriFoto.map((foto, index) => (
              <div key={index} className="overflow-hidden rounded-xl aspect-square bg-stone-800">
                <img src={foto} alt={`Galeri ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition duration-500" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BAGIAN 5: KIRIM HADIAH / QRIS */}
      {xtraData.qrisImageUrl && (
        <section className="py-20 px-4 bg-stone-950 text-center">
          <h2 className="text-3xl font-serif mb-6 text-amber-400">Kirim Hadiah</h2>
          <p className="text-stone-400 mb-6 max-w-md mx-auto text-sm">Doa restu Anda merupakan karunia yang sangat berarti bagi kami.</p>
          
          <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 inline-block max-w-xs mx-auto">
            <img src={xtraData.qrisImageUrl} alt="QRIS Gift" className="w-48 h-48 mx-auto rounded-lg mb-4 bg-white p-2" />
            <p className="text-xs text-stone-400">Scan QRIS menggunakan m-Banking atau E-Wallet</p>
          </div>
        </section>

      )}

    </div>
  );
}