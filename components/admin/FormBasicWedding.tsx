"use client";

import { useState } from "react";
import BasicFields from "./sections/BasicFields";
import { BasicWeddingContent } from "@/types/wedding";

interface FormBasicWeddingProps {
  onSubmit: (data: BasicWeddingContent) => void;
}

export default function FormBasicWedding({ onSubmit }: FormBasicWeddingProps) {
  const [formData, setFormData] = useState<BasicWeddingContent>({
    slug: "",
    namaPanggilanPria: "",
    namaPanggilanWanita: "",
    namaLengkapPria: "",
    namaLengkapWanita: "",
    orangTuaPria: "",
    orangTuaWanita: "",
    turutMengundangPria: "",
    turutMengundangWanita: "",
    tanggalAkad: "",
    waktuAkad: "08.00 WIB - Selesai",
    tanggalResepsi: "",
    waktuResepsi: "11.00 - 14.00 WIB",
    lokasiTeks: "",
    lokasiMaps: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white">
          Form Input Undangan Pernikahan (Paket Basic)
        </h3>
        <p className="text-xs text-slate-400">
          Lengkapi detail data dasar di bawah untuk menerbitkan undangan digital.
        </p>
      </div>

      {/* Memanggil kumpulan input dasar */}
      <BasicFields formData={formData} onChange={handleChange} />

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
      >
        Simpan & Terbitkan Undangan Basic
      </button>
    </form>
  );
}