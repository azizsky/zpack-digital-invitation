"use client";

import { useState, useEffect } from "react";
import BasicFields from "./sections/BasicFields";
import { EnterpriseWeddingContent, RekeningBank, LoveStoryItem } from "@/types/wedding";

interface MusicPreset {
  id: string;
  title: string;
  url: string;
}

interface FormEnterpriseWeddingProps {
  onSubmit: (data: EnterpriseWeddingContent) => void;
  initialData?: Partial<EnterpriseWeddingContent>;
}

export default function FormEnterpriseWedding({ onSubmit, initialData }: FormEnterpriseWeddingProps) {
  const [formData, setFormData] = useState<EnterpriseWeddingContent>({
    templateId: initialData?.templateId || "theme-enterprise-luxury",
    slug: initialData?.slug || "",
    namaPanggilanPria: initialData?.namaPanggilanPria || "",
    namaPanggilanWanita: initialData?.namaPanggilanWanita || "",
    namaLengkapPria: initialData?.namaLengkapPria || "",
    namaLengkapWanita: initialData?.namaLengkapWanita || "",
    orangTuaPria: initialData?.orangTuaPria || "",
    orangTuaWanita: initialData?.orangTuaWanita || "",
    turutMengundangPria: initialData?.turutMengundangPria || "",
    turutMengundangWanita: initialData?.turutMengundangWanita || "",
    tanggalAkad: initialData?.tanggalAkad || "",
    waktuAkad: initialData?.waktuAkad || "08.00 WIB - Selesai",
    tanggalResepsi: initialData?.tanggalResepsi || "",
    waktuResepsi: initialData?.waktuResepsi || "11.00 - 14.00 WIB",
    lokasiTeks: initialData?.lokasiTeks || "",
    lokasiMaps: initialData?.lokasiMaps || "",
    

    // Fitur Khusus Enterprise & Kontak / RSVP
    enableRsvp: initialData?.enableRsvp ?? true,
    musicOption: initialData?.musicOption || "preset",
    customMusicUrl: initialData?.customMusicUrl || "",
    liveStreamUrl: initialData?.liveStreamUrl || "",
    videoPrewedUrl: initialData?.videoPrewedUrl || "",
    galeriFoto: initialData?.galeriFoto || [],
    loveStory: initialData?.loveStory?.length
      ? initialData.loveStory
      : [{ tahun: "2023", judul: "Pertama Bertemu", deskripsi: "" }],
    qrisImageUrl: initialData?.qrisImageUrl || "",
    rekeningBank: initialData?.rekeningBank?.length
      ? initialData.rekeningBank
      : [{ bank: "BCA", noRek: "", atasNama: "" }],
  });

  // State Daftar Template & Musik Preset R2
  const [templates, setTemplates] = useState<any[]>([]);
  const [musicPresets, setMusicPresets] = useState<MusicPreset[]>([]);

  // State File Pendukung
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string>(initialData?.qrisImageUrl || "");

  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicFileName, setMusicFileName] = useState<string>("");

  // State Video MP4 Prewed R2
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>("");

  const [galeriFiles, setGaleriFiles] = useState<File[]>([]);
  const [galeriPreviews, setGaleriPreviews] = useState<string[]>(initialData?.galeriFoto || []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. FETCH DAFTAR TEMPLATE DAN MUSIK PRESET (R2) SAAT MOUNT
  useEffect(() => {
    async function fetchData() {
      // Fetch Templates
      try {
        const res = await fetch("/api/admin/templates");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setTemplates(json.data);
          } else if (Array.isArray(json)) {
            setTemplates(json);
          } else if (json.data) {
            setTemplates(json.data);
          }
        }
      } catch (err) {
        console.error("❌ Fetch templates error:", err);
      }

      // Fetch Music Presets dari R2
      try {
        const resMusic = await fetch('/api/admin/preset-music');
        if (resMusic.ok) {
          const jsonMusic = await resMusic.json();
          const list = jsonMusic.data || jsonMusic;
          if (Array.isArray(list)) {
            setMusicPresets(list);
          }
        }
      } catch (err) {
        console.error("❌ Fetch music presets error:", err);
      }
    }

    fetchData();
  }, []);

  // Sinkronisasi jika initialData berubah
// Sinkronisasi jika initialData berubah
 useEffect(() => {
  if (initialData) {
    // 1. Ambil nilai enableRsvp baik dari root initialData maupun dari xtraData
    const rawRsvp =
      initialData.enableRsvp !== undefined
        ? initialData.enableRsvp
        : (initialData as any).xtraData?.enableRsvp;

    // 2. Jika rawRsvp terdefinisi (baik true maupun false), gunakan nilainya.
    // Jika benar-benar undefined (misal undangan baru / data lama), default-kan ke true.
    const isRsvpActive = rawRsvp !== undefined ? Boolean(rawRsvp) : true;

    setFormData((prev) => ({
      ...prev,
      ...initialData,
      enableRsvp: isRsvpActive, // Dipastikan akurat (true/false)
      loveStory: initialData.loveStory?.length ? initialData.loveStory : prev.loveStory,
      rekeningBank: initialData.rekeningBank?.length ? initialData.rekeningBank : prev.rekeningBank,
      galeriFoto: initialData.galeriFoto || [],
    }));

    if (initialData.galeriFoto) {
      setGaleriPreviews(initialData.galeriFoto);
    }
    if (initialData.qrisImageUrl) {
      setQrisPreview(initialData.qrisImageUrl);
    }
  }
}, [initialData]);

  // Clean up Object URL
  const safeRevokeObjectURL = (url: string) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };


  // --- 1. QRIS (Single File) ---
  const handleQrisSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (qrisPreview && qrisPreview.startsWith("blob:")) {
      safeRevokeObjectURL(qrisPreview);
    }

    setQrisFile(file);
    setQrisPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeQris = () => {
    if (qrisPreview.startsWith("blob:")) {
      safeRevokeObjectURL(qrisPreview);
    }
    setQrisFile(null);
    setQrisPreview("");
    setFormData((prev) => ({ ...prev, qrisImageUrl: "" }));
  };

  // --- 2. Musik Management (Preset R2 & Custom Upload) ---
  const handleMusicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusicFile(file);
    setMusicFileName(file.name);
    e.target.value = "";
  };

  // --- 3. Video Prewedding File Select (MP4 ke R2) ---
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("⚠️ Ukuran file video terlalu besar! Maksimal 100MB.");
      e.target.value = "";
      return;
    }

    setVideoFile(file);
    setVideoFileName(file.name);

    // Buat Blob URL sementara untuk Pratinjau Langsung
    const localBlobUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      videoPrewedUrl: localBlobUrl,
    }));

    e.target.value = "";
  };

  const removeVideo = async () => {
    const videoUrlToRemove = formData.videoPrewedUrl;

    if (videoUrlToRemove && videoUrlToRemove.startsWith("blob:")) {
      safeRevokeObjectURL(videoUrlToRemove);
    } else if (videoUrlToRemove && videoUrlToRemove.includes(".r2.dev")) {
      try {
        await fetch("/api/admin/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: videoUrlToRemove }),
        });
      } catch (err) {
        console.error("Gagal menghapus file video dari R2:", err);
      }
    }

    setVideoFile(null);
    setVideoFileName("");
    setFormData((prev) => ({ ...prev, videoPrewedUrl: "" }));
  };

  // --- 4. Galeri Foto (Multiple) ---
  const handleGaleriSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (galeriPreviews.length + files.length > 20) {
      alert("⚠️ Maksimal total foto galeri Enterprise adalah 20 foto!");
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

    if (formData.galeriFoto.includes(urlToRemove)) {
      try {
        await fetch("/api/admin/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: urlToRemove }),
        });
      } catch (err) {
        console.error("Gagal menghapus file dari server:", err);
      }

      setFormData((prev) => ({
        ...prev,
        galeriFoto: prev.galeriFoto.filter((url) => url !== urlToRemove),
      }));
    } else {
      safeRevokeObjectURL(urlToRemove);
    }

    setGaleriPreviews((prev) => prev.filter((_, i) => i !== index));

    const fileIndex = index - formData.galeriFoto.length;
    if (fileIndex >= 0) {
      setGaleriFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  };

  // --- 5. Love Story Management ---
  const handleStoryChange = (index: number, field: keyof LoveStoryItem, value: string) => {
    const updated = [...formData.loveStory];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, loveStory: updated }));
  };

  const addStorySlot = () => {
    setFormData((prev) => ({
      ...prev,
      loveStory: [...prev.loveStory, { tahun: "", judul: "", deskripsi: "" }],
    }));
  };

  const removeStorySlot = (index: number) => {
    if (formData.loveStory.length > 1) {
      const updated = formData.loveStory.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, loveStory: updated }));
    }
  };

  // --- 6. Rekening Management ---
  const handleBankChange = (index: number, field: keyof RekeningBank, value: string) => {
    const updated = [...formData.rekeningBank];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, rekeningBank: updated }));
  };

  const addBankSlot = () => {
    setFormData((prev) => ({
      ...prev,
      rekeningBank: [...prev.rekeningBank, { bank: "", noRek: "", atasNama: "" }],
    }));
  };

  const removeBankSlot = (index: number) => {
    if (formData.rekeningBank.length > 1) {
      const updated = formData.rekeningBank.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, rekeningBank: updated }));
    }
  };

  // Normalisasi Embed URL YouTube
  const formatEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "youtube.com/embed/");
    }
    return url;
  };

  // --- 7. Submit Handler ---
 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.slug.trim()) {
      setErrorMessage("Mohon isi Slug Undangan terlebih dahulu!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      let finalQrisUrl = formData.qrisImageUrl;
      let finalMusicUrl = formData.customMusicUrl;
      let finalVideoUrl = formData.videoPrewedUrl;

      // A. Upload QRIS
      if (qrisFile) {
        const qData = new FormData();
        qData.append("file", qrisFile);
        qData.append("slug", formData.slug);
        qData.append("folderType", "qris");

        const res = await fetch("/api/admin/upload", { method: "POST", body: qData });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Gagal upload QRIS");
        finalQrisUrl = json.url;
      }

      // B. Upload Custom Music (jika opsi custom dipilih & file diunggah)
      if (formData.musicOption === "custom" && musicFile) {
        const mData = new FormData();
        mData.append("file", musicFile);
        mData.append("slug", formData.slug);
        mData.append("folderType", "music");

        const res = await fetch("/api/admin/upload", { method: "POST", body: mData });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Gagal upload musik");
        finalMusicUrl = json.url;
      }

      // C. Upload Video MP4 Prewed ke R2 (jika file baru dipilih)
      if (videoFile) {
        // Hapus file video lama di R2 jika ada
        if (initialData?.videoPrewedUrl && initialData.videoPrewedUrl.includes(".r2.dev")) {
          try {
            await fetch("/api/admin/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileUrl: initialData.videoPrewedUrl }),
            });
          } catch (err) {
            console.error("Gagal hapus video lama R2:", err);
          }
        }

        const vData = new FormData();
        vData.append("file", videoFile);
        vData.append("slug", formData.slug);
        vData.append("folderType", "video");

        const res = await fetch("/api/admin/upload", { method: "POST", body: vData });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Gagal upload video prewedding");
        finalVideoUrl = json.url;
      } else {
        // Jika tidak upload file baru, gunakan formatter URL
        finalVideoUrl = formatEmbedUrl(formData.videoPrewedUrl || "");
      }

      // D. Upload Galeri Foto Baru
      const uploadedGalleryUrls: string[] = [];
      for (const file of galeriFiles) {
        const gData = new FormData();
        gData.append("file", file);
        gData.append("slug", formData.slug);
        gData.append("folderType", "gallery");

        const res = await fetch("/api/admin/upload", { method: "POST", body: gData });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Gagal upload galeri");
        uploadedGalleryUrls.push(json.url);
      }

      // SANITASI STATUS RSVP & WA NOTIFICATION FOONTE
      const isRsvpActive = Boolean(formData.enableRsvp);

      const finalPayload: EnterpriseWeddingContent = {
        ...formData,
        enableRsvp: Boolean(formData.enableRsvp),
        liveStreamUrl: formatEmbedUrl(formData.liveStreamUrl || ""),
        videoPrewedUrl: finalVideoUrl,
        qrisImageUrl: finalQrisUrl,
        customMusicUrl: finalMusicUrl,
        galeriFoto: [...formData.galeriFoto, ...uploadedGalleryUrls],
      };

      onSubmit(finalPayload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.";
      setErrorMessage(message);
      alert("⚠️ " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-amber-500/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-lg">👑</span>
          <h3 className="text-base font-bold text-white">
            Form Input Undangan Pernikahan (Paket Enterprise Exclusive)
          </h3>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Konfigurasi lengkap tingkat lanjut dengan fitur WhatsApp Kontak, RSVP, Live Streaming, Video Embed/MP4, Musik, dan Love Story.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-500/50 bg-red-950/30 p-3 text-xs text-red-400">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* BASIC FIELDS */}
      <BasicFields
        formData={formData}
        onChange={handleChange}
        templates={templates}
      />
            
      {/* PENGATURAN BUKU TAMU & RSVP */}
      <div className="rounded-xl border border-amber-500/35 bg-amber-950/10 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            💬 Pengaturan Buku Tamu & RSVP
          </h4>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="enableRsvp"
              name="enableRsvp"
              checked={formData.enableRsvp ?? true}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  enableRsvp: e.target.checked,
                }));
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>


      {/* Media & Live Streaming */}
      <div className="rounded-xl border border-amber-500/35 bg-amber-950/10 p-4 space-y-4">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          🎥 Media & Live Streaming
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              URL Live Streaming (YouTube / Zoom Link)
            </label>
            <input
              type="url"
              name="liveStreamUrl"
              value={formData.liveStreamUrl}
              onChange={handleChange}
              placeholder="https://youtube.com/live/..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1">Akan otomatis disematkan sebagai pemutar video live di undangan.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Video Prewedding / Teaser (Upload MP4 ke R2 atau Link YouTube)
            </label>
            
            <div className="space-y-3">
              <input
                type="text"
                name="videoPrewedUrl"
                value={formData.videoPrewedUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=... atau https://pub-xxx.r2.dev/..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none transition-colors"
              />

              <div className="flex items-center gap-4">
                <label className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer bg-amber-600 text-slate-950 hover:bg-amber-500 transition-all shadow-sm">
                  {formData.videoPrewedUrl || videoFileName ? "Ganti File Video MP4" : "Upload Video MP4 ke R2"}
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    onChange={handleVideoSelect}
                  />
                </label>
                <span className="text-xs text-slate-400 truncate max-w-xs">
                  {videoFileName || (formData.videoPrewedUrl ? "Video terpasang" : "Belum ada file video dipilih")}
                </span>
              </div>

              {/* CARD PREVIEW VIDEO + TOMBOL HAPUS */}
              {formData.videoPrewedUrl && (
                <div className="relative mt-2 max-w-sm rounded-xl bg-slate-950 border border-slate-800 p-2 shadow-lg overflow-hidden group">
                  {formData.videoPrewedUrl.includes(".r2.dev") ||
                  formData.videoPrewedUrl.includes(".mp4") ||
                  formData.videoPrewedUrl.startsWith("blob:") ? (
                    <video
                      key={formData.videoPrewedUrl}
                      src={formData.videoPrewedUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-44 rounded-lg object-cover bg-black"
                    />
                  ) : (
                    <div className="w-full h-44 rounded-lg bg-slate-900 flex items-center justify-center text-xs text-slate-400 p-2 text-center border border-slate-800">
                      🎬 Link Video YouTube Embed Terpasang
                    </div>
                  )}

                  {/* Tombol Hapus Merah (✕) */}
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-3 right-3 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-500 transition-colors z-10"
                    title="Hapus Video dari R2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FITUR MUSIK: OPTION, DROPDOWN R2, ATAU UPLOAD MP3 */}
      <div className="rounded-xl border border-amber-500/35 bg-amber-950/10 p-4 space-y-4">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          🎵 Musik Latar Belakang (BGM)
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Pilih Sumber Musik</label>
            <select
              name="musicOption"
              value={formData.musicOption}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="preset">Pilih dari Musik Preset (R2 Storage)</option>
              <option value="custom">Upload File MP3 Sendiri (Custom)</option>
              <option value="none">Tanpa Musik Latar</option>
            </select>
          </div>

          {/* Jika Pilihan PRESET (Pilih dari R2) */}
          {formData.musicOption === "preset" && (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pilih Lagu dari Library R2
              </label>
              <select
                name="customMusicUrl"
                value={formData.customMusicUrl}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Pilih Lagu --</option>
                {musicPresets.map((m) => (
                  <option key={m.id || m.url} value={m.url}>
                    {m.title}
                  </option>
                ))}
              </select>

              {formData.customMusicUrl && !formData.customMusicUrl.startsWith("blob:") && (
                <div className="mt-2 rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                  <p className="text-[11px] text-slate-400 mb-1 font-medium">Pratinjau Suara Musik:</p>
                  <audio 
                    controls 
                    src={
                      formData.customMusicUrl.startsWith("http") 
                        ? formData.customMusicUrl 
                        : `${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}${formData.customMusicUrl.startsWith("/") ? "" : "/"}${formData.customMusicUrl}`
                    } 
                    className="w-full h-8" 
                  />
                </div>
              )}
            </div>
          )}

          {/* Jika Pilihan CUSTOM (Upload File MP3) */}
          {formData.musicOption === "custom" && (
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unggah File Musik Baru (.mp3)
              </label>
              <div className="flex items-center gap-4">
                <label className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer bg-amber-600 text-slate-950 hover:bg-amber-500 transition-all shadow-sm">
                  {musicFileName || formData.customMusicUrl ? "Ganti File MP3" : "Pilih File MP3"}
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/wav"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleMusicSelect(e);
                        
                        const localBlobUrl = URL.createObjectURL(file);
                        setFormData((prev) => ({
                          ...prev,
                          customMusicUrl: localBlobUrl,
                        }));
                      }
                    }}
                  />
                </label>
                <span className="text-xs text-slate-400 truncate max-w-xs">
                  {musicFileName || "Belum ada file dipilih"}
                </span>
              </div>

              {/* Kotak Pratinjau Audio */}
              {formData.customMusicUrl && (
                <div className="mt-2 rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                  <p className="text-[11px] text-slate-400 mb-1 font-medium">Pratinjau Suara Musik:</p>
                  <audio 
                    key={formData.customMusicUrl} 
                    controls 
                    src={
                      formData.customMusicUrl.startsWith("http") || formData.customMusicUrl.startsWith("blob:")
                        ? formData.customMusicUrl 
                        : `${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}${formData.customMusicUrl.startsWith("/") ? "" : "/"}${formData.customMusicUrl}`
                    } 
                    className="w-full h-8" 
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Galeri Foto Enterprise (Hingga 20 Foto) */}
      <div className="rounded-xl border border-amber-500/35 bg-amber-950/10 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              📸 Galeri Foto Eksklusif ({galeriPreviews.length}/20 Foto)
            </h4>
            <p className="text-[11px] text-slate-400">Pilih banyak foto sekaligus dari file manager.</p>
          </div>

          <label className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer transition-all shadow-sm">
            + Pilih Foto Multiple
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
              <div key={idx} className="relative group aspect-square rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shadow">
                <img src={previewUrl} alt={`Galeri ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGaleriItem(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold opacity-80 hover:opacity-100 transition-opacity"
                  title="Hapus Foto"
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

      {/* Love Story (Timeline Perjalanan Cinta) */}
      <div className="rounded-xl border border-amber-500/35 bg-amber-950/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            📖 Love Story (Timeline Hubungan)
          </h4>
          <button type="button" onClick={addStorySlot} className="text-xs font-semibold text-amber-400 hover:underline">
            + Tambah Momen
          </button>
        </div>

        {formData.loveStory.map((story, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 relative">
            <input
              type="text"
              value={story.tahun}
              onChange={(e) => handleStoryChange(idx, "tahun", e.target.value)}
              placeholder="Tahun/Bulan (mis: 2023)"
              className="sm:col-span-3 rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            />
            <input
              type="text"
              value={story.judul}
              onChange={(e) => handleStoryChange(idx, "judul", e.target.value)}
              placeholder="Judul (mis: Pertama Bertemu)"
              className="sm:col-span-8 rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeStorySlot(idx)}
              className="sm:col-span-1 rounded bg-red-600/10 text-xs text-red-400 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center py-1.5 sm:py-0"
              title="Hapus Momen"
            >
              ✕
            </button>
            <textarea
              value={story.deskripsi}
              onChange={(e) => handleStoryChange(idx, "deskripsi", e.target.value)}
              placeholder="Ceritakan singkat momen tersebut..."
              className="sm:col-span-12 rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              rows={2}
            />
          </div>
        ))}
      </div>

      {/* Kado Digital & Amplop (QRIS & Multi Rekening) */}
      <div className="rounded-xl border border-amber-500/35 bg-amber-950/10 p-4 space-y-4">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          💳 Kado Digital & Angpao (QRIS & Rekening)
        </h4>

        {/* QRIS Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">Gambar QRIS (1 Gambar)</label>
          <div className="flex items-center gap-4">
            <label className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-sm">
              {qrisPreview ? "Ganti QRIS" : "Pilih File QRIS"}
              <input type="file" accept="image/*" className="hidden" onChange={handleQrisSelect} />
            </label>
            {qrisPreview && (
              <div className="relative aspect-square w-20 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shadow">
                <img src={qrisPreview} alt="QRIS" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeQris}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                  title="Hapus QRIS"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Multi Rekening Bank dengan Nomor Urut */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Daftar Rekening Bank & E-Wallet
            </label>
            <button
              type="button"
              onClick={addBankSlot}
              className="text-xs font-semibold text-amber-400 hover:underline"
            >
              + Tambah Rekening
            </button>
          </div>

          {formData.rekeningBank.map((bankItem, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-semibold text-amber-400/80">
                Rekening #{idx + 1}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 rounded-lg border border-slate-800 bg-slate-950 p-3 relative">
                <input
                  type="text"
                  value={bankItem.bank}
                  onChange={(e) => handleBankChange(idx, "bank", e.target.value)}
                  placeholder="Bank / E-Wallet (BCA / DANA)"
                  className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={bankItem?.noRek || ""}
                  onChange={(e) => handleBankChange(idx, "noRek", e.target.value)}
                  placeholder="Nomor Rekening / No HP E-Wallet"
                  className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bankItem.atasNama}
                    onChange={(e) => handleBankChange(idx, "atasNama", e.target.value)}
                    placeholder="Atas Nama"
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                  {formData.rekeningBank.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBankSlot(idx)}
                      className="rounded bg-red-600/10 px-2.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                      title="Hapus Rekening"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-amber-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 transition-all disabled:bg-slate-700 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Mengunggah Data Enterprise...</span>
          </>
        ) : (
          "Simpan & Terbitkan Undangan Enterprise"
        )}
      </button>
    </form>
  );
}