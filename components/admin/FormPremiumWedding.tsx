"use client";

import { useState, useEffect } from "react";
import BasicFields from "./sections/BasicFields";
import { PremiumWeddingContent, RekeningBank } from "@/types/wedding";

interface FormPremiumWeddingProps {
  onSubmit: (data: PremiumWeddingContent) => void;
  initialData?: Partial<PremiumWeddingContent>; // Ditambahkan untuk mendukung mode Edit
}

export default function FormPremiumWedding({ onSubmit, initialData }: FormPremiumWeddingProps) {
  const [formData, setFormData] = useState<PremiumWeddingContent>({
    templateId: "theme-minimalist",
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
    musicOption: "lagu-1",
    galeriFoto: [],
    qrisImageUrl: "",
    rekeningBank: [{ bank: "BCA", noRek: "", atasNama: "" }],
  });

  // State untuk menampung data templates dari API
  const [templates, setTemplates] = useState([]);

  // State lokal untuk file QRIS baru
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string>("");

  // State lokal untuk galeri (Menyimpan URL lama dari DB & File baru yang dipilih)
  const [galeriFiles, setGaleriFiles] = useState<File[]>([]);
  const [galeriPreviews, setGaleriPreviews] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch daftar template saat komponen di-mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        console.log("🚀 [FORM_PREMIUM] Fetching templates from /api/admin/templates...");
        const res = await fetch("/api/admin/templates");

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        console.log("📦 [FORM_PREMIUM] Response from API:", json);

        if (json.success && Array.isArray(json.data)) {
          setTemplates(json.data);
        } else if (Array.isArray(json)) {
          setTemplates(json);
        } else if (json.data) {
          setTemplates(json.data);
        }
      } catch (err) {
        console.error("❌ [FORM_PREMIUM] Fetch templates error:", err);
      }
    }

    fetchTemplates();
  }, []);

  // Sinkronisasi data saat tombol Edit diklik (Load data lama)
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
      // Jika ada URL QRIS lama, tampilkan di preview
      if (initialData.qrisImageUrl) {
        setQrisPreview(initialData.qrisImageUrl);
      }
      // Jika ada galeri lama, tampilkan di preview galeri
      if (initialData.galeriFoto && Array.isArray(initialData.galeriFoto)) {
        setGaleriPreviews(initialData.galeriFoto);
      }
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- 1. QRIS: HANYA 1 FILE ---
  const handleQrisSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrisFile(file);
    setQrisPreview(URL.createObjectURL(file));
    e.target.value = ""; 
  };

  const removeQris = () => {
    setQrisFile(null);
    setQrisPreview("");
    setFormData((prev) => ({ ...prev, qrisImageUrl: "" }));
  };

  // --- 2. GALERI: MULTIPLE FILES & URL LAMA ---
  const handleGaleriSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Hitung total gabungan galeri lama (di formData) dan file baru
    const totalCurrent = (formData.galeriFoto?.length || 0) + galeriFiles.length + files.length;
    if (totalCurrent > 10) {
      alert("⚠️ Maksimal total foto galeri adalah 10 foto!");
      e.target.value = "";
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setGaleriFiles((prev) => [...prev, ...files]);
    setGaleriPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = ""; 
  };

  
  const removeGaleriItem = async (index: number) => {
    const urlToRemove = galeriPreviews[index];

    // Cek apakah URL tersebut adalah file yang sudah tersimpan di R2
    if (formData.galeriFoto.includes(urlToRemove)) {
      try {
        const response = await fetch("/api/admin/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: urlToRemove }),
        });
        
        const result = await response.json();
        if (!result.success) {
          console.error("Gagal menghapus file dari R2:", result.message);
          return;
        }
      } catch (err) {
        console.error("Terjadi kesalahan saat menghapus:", err);
        return;
      }

      // Update state formData agar foto terhapus dari list database
      setFormData((prev) => ({
        ...prev,
        galeriFoto: prev.galeriFoto.filter((url) => url !== urlToRemove),
      }));
    }

    // Hapus dari preview tampilan layar
    setGaleriPreviews((prev) => prev.filter((_, i) => i !== index));
    
    // Hapus dari antrean file lokal jika belum sempat di-upload
    const fileIndex = index - formData.galeriFoto.length;
    if (fileIndex >= 0) {
      setGaleriFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  };

  // --- 3. SUBMIT & UPLOAD KE R2 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.slug.trim()) {
      alert("⚠️ Mohon isi Slug Undangan terlebih dahulu di bagian Data Dasar!");
      return;
    }

    setIsSubmitting(true);

    try {
      // 🧹 A. PANGGIL API UNTUK BERSIHKAN FOLDER LAMA DI R2
      if (initialData) {
        await fetch("/api/admin/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: formData.slug }),
        }).catch(() => {
          // Lanjutkan proses jika endpoint delete belum ada
        });
      }

      let finalQrisUrl = formData.qrisImageUrl;

      // B. Upload QRIS baru jika user memilih file baru
      if (qrisFile) {
        const qrisData = new FormData();
        qrisData.append("file", qrisFile);
        qrisData.append("slug", formData.slug);
        qrisData.append("folderType", "qris");

        const res = await fetch("/api/admin/upload", { method: "POST", body: qrisData });
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal upload QRIS ke Cloudflare R2.");
        }
        finalQrisUrl = json.url;
      }

      // C. Upload Foto Galeri Baru
      const uploadedGalleryUrls: string[] = [];
      for (const file of galeriFiles) {
        const galeriData = new FormData();
        galeriData.append("file", file);
        galeriData.append("slug", formData.slug);
        galeriData.append("folderType", "gallery");

        const res = await fetch("/api/admin/upload", { method: "POST", body: galeriData });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal upload salah satu foto galeri.");
        }
        uploadedGalleryUrls.push(json.url);
      }

      // D. Gabungkan data
      const finalPayload: PremiumWeddingContent = {
        ...formData,
        qrisImageUrl: finalQrisUrl,
        galeriFoto: [...(formData.galeriFoto || []), ...uploadedGalleryUrls],
      };

      onSubmit(finalPayload);
    } catch (err: any) {
      alert("⚠️ " + err.message);
    } finally { // <--- DI SINI SUDAH DIPERBAIKI DARI 'fontally' KE 'finally'
      setIsSubmitting(false);
    }
  };

  // --- Kelola Rekening Bank ---
  const handleBankChange = (index: number, field: keyof RekeningBank, value: string) => {
    const updatedBank = [...formData.rekeningBank];
    updatedBank[index][field] = value;
    setFormData((prev) => ({ ...prev, rekeningBank: updatedBank }));
  };

  const addBankSlot = () => {
    setFormData((prev) => ({
      ...prev,
      rekeningBank: [...prev.rekeningBank, { bank: "BCA", noRek: "", atasNama: "" }],
    }));
  };

  const removeBankSlot = (index: number) => {
    if (formData.rekeningBank.length > 1) {
      const updatedBank = formData.rekeningBank.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, rekeningBank: updatedBank }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">⭐</span>
          <h3 className="text-base font-bold text-white">
            Form Input Undangan Pernikahan (Paket Premium)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          {initialData ? "Perbarui detail data dan kelola media foto di bawah ini." : "Lengkapi data, pilih foto galeri sekaligus, dan pastikan konfigurasi R2 di .env.local sudah benar."}
        </p>
      </div>

      <BasicFields formData={formData} onChange={handleChange} templates={templates} />

      {/* Musik Background */}
      <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/10 p-4 space-y-3">
        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
          🎵 Pilihan Musik Background
        </h4>
        <select
          name="musicOption"
          value={formData.musicOption}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
        >
          <option value="none">Tanpa Musik (None)</option>
          <option value="lagu-1">Lagu 1 - Instrument Romance</option>
          <option value="lagu-2">Lagu 2 - Acoustic Wedding</option>
          <option value="lagu-3">Lagu 3 - Soft Piano</option>
          <option value="lagu-4">Lagu 4 - Orchestra Love</option>
          <option value="lagu-5">Lagu 5 - Sundanese Instrumental</option>
        </select>
      </div>

      {/* Galeri Foto */}
      <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/10 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              📸 Galeri Foto Prewedding ({galeriPreviews.length}/10 Foto)
            </h4>
            <p className="text-[11px] text-slate-400">
              Kamu bisa melihat foto lama dan menghapus bagian foto yang tidak diinginkan sebelum disimpan ulang.
            </p>
          </div>

          <label className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer transition-all">
            + Pilih Foto (Multiple)
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGaleriSelect}
            />
          </label>
        </div>

        {galeriPreviews.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2.5 pt-2">
            {galeriPreviews.map((previewUrl, idx) => (
              <div
                key={idx}
                className="relative group aspect-square rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shadow"
              >
                <img src={previewUrl} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGaleriItem(idx)}
                  className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow"
                  title="Hapus foto ini"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-800 rounded-lg p-4 text-center text-xs text-slate-500">
            Belum ada foto galeri yang dipilih.
          </div>
        )}
      </div>

      {/* Kado Digital & Amplop */}
      <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/10 p-4 space-y-4">
        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
          💳 Kado Digital & Amplop
        </h4>

        {/* QRIS */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">Gambar QRIS (Maksimal 1 Gambar)</label>
          <div className="flex items-center gap-4">
            <label className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer bg-blue-600 text-white hover:bg-blue-500 transition-all">
              {qrisPreview ? "Ganti QRIS" : "Pilih File QRIS"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrisSelect}
              />
            </label>

            {qrisPreview && (
              <div className="relative aspect-square w-20 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shadow">
                <img
                  src={qrisPreview}
                  alt="Preview QRIS"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeQris}
                  className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow"
                  title="Hapus QRIS"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rekening Bank */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">Daftar Rekening Bank</label>
            <button
              type="button"
              onClick={addBankSlot}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              + Tambah Rekening
            </button>
          </div>

          {formData.rekeningBank.map((bankItem, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 gap-2 sm:grid-cols-3 rounded-lg border border-slate-800 bg-slate-950 p-3 relative"
            >
              <input
                type="text"
                value={bankItem.bank}
                onChange={(e) => handleBankChange(idx, "bank", e.target.value)}
                placeholder="Nama Bank (misal: BCA)"
                className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200"
              />
              <input
                type="text"
                value={bankItem?.noRek || ""} 
                onChange={(e) => handleBankChange(idx, "noRek", e.target.value)}
                className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bankItem.atasNama}
                  onChange={(e) => handleBankChange(idx, "atasNama", e.target.value)}
                  placeholder="Atas Nama"
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200"
                />
                {formData.rekeningBank.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBankSlot(idx)}
                    className="rounded bg-red-600/10 px-2 text-xs text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:bg-slate-700"
      >
        {isSubmitting
          ? "Sedang Memproses & Membersihkan R2..."
          : initialData
          ? "Simpan Perubahan & Perbarui Undangan Premium"
          : "Simpan & Terbitkan Undangan Premium"}
      </button>
    </form>
  );
}