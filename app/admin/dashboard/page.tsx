"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormBasicWedding from "@/components/admin/FormBasicWedding";
import { BasicWeddingContent } from "@/types/wedding";

type KategoriUndangan = "wedding" | "celebration" | "event";
type PaketUndangan = "basic" | "premium" | "enterprise";

interface UndanganItem {
  id: string;
  slug: string;
  category: KategoriUndangan;
  package: PaketUndangan;
  status: string;
  content: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // State Navigasi
  const [selectedCategory, setSelectedCategory] = useState<KategoriUndangan | null>(null);
  const [selectedPaket, setSelectedPaket] = useState<PaketUndangan | null>(null);

  // State Modal Popup
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Data Undangan dari DB
  const [listUndangan, setListUndangan] = useState<UndanganItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data dari API setiap kali kategori atau paket dipilih
  useEffect(() => {
    if (selectedCategory && selectedPaket) {
      fetchInvitations();
    }
  }, [selectedCategory, selectedPaket]);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/invitations?category=${selectedCategory}&package=${selectedPaket}`
      );
      const data = await res.json();
      if (data.success) {
        setListUndangan(data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const getKategoriLabel = (cat: KategoriUndangan) => {
    switch (cat) {
      case "wedding":
        return "Undangan Pernikahan";
      case "celebration":
        return "Khitan / Syukuran / Ultah";
      case "event":
        return "Undangan Event";
    }
  };

  // Handler Simpan Data dari Form Basic ke API D1
  const handleSaveBasic = async (formData: BasicWeddingContent) => {
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: formData.slug,
          category: selectedCategory,
          package: selectedPaket,
          content: formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan");
      }

      alert("Undangan berhasil dibuat & disimpan ke Database!");
      setIsModalOpen(false); // Tutup Modal setelah sukses
      fetchInvitations(); // Refresh list data
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  // Handler Hapus Undangan
  const handleHapusUndangan = async (id: string) => {
    if (!confirm("Yakin ingin menghapus undangan ini?")) return;

    try {
      const res = await fetch(`/api/admin/invitations?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchInvitations();
      }
    } catch (err) {
      console.error("Gagal menghapus:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ==================================================================== */}
        {/* LANGKAH 1: ROOT DASHBOARD                                            */}
        {/* ==================================================================== */}
        {!selectedCategory && (
          <div className="space-y-8">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard Zpack</h1>
                <p className="text-xs text-slate-400">Sistem Kelola Undangan Digital</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600/10 px-4 py-2 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white transition"
              >
                Logout
              </button>
            </div>

            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-white">Mau buat undangan apa nih?</h2>
              <p className="text-xs text-slate-400 mt-1">Pilih kategori jenis acara yang ingin kamu kelola</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <button
                onClick={() => setSelectedCategory("wedding")}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center transition duration-300 hover:border-blue-500 hover:bg-slate-900 hover:scale-[1.02]"
              >
                <div className="text-5xl mb-4">💍</div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                  Undangan Pernikahan
                </h3>
                <p className="mt-2 text-xs text-slate-400">
                  Untuk akad nikah, resepsi, lamaran, & engagement.
                </p>
              </button>

              <button
                onClick={() => setSelectedCategory("celebration")}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center transition duration-300 hover:border-emerald-500 hover:bg-slate-900 hover:scale-[1.02]"
              >
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
                  Khitan / Syukuran / Ultah
                </h3>
                <p className="mt-2 text-xs text-slate-400">
                  Untuk walimatul khitan, ulang tahun, & syukuran keluarga.
                </p>
              </button>

              <button
                onClick={() => setSelectedCategory("event")}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center transition duration-300 hover:border-purple-500 hover:bg-slate-900 hover:scale-[1.02]"
              >
                <div className="text-5xl mb-4">🎟️</div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition">
                  Undangan Event
                </h3>
                <p className="mt-2 text-xs text-slate-400">
                  Untuk seminar, konser, reuni, & acara komunitas.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LANGKAH 2: PILIH PAKET                                               */}
        {/* ==================================================================== */}
        {selectedCategory && !selectedPaket && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="inline-flex items-center text-xs font-semibold text-blue-400 hover:underline transition"
              >
                ← Kembali ke Root Dashboard
              </button>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {getKategoriLabel(selectedCategory)}
              </span>
            </div>

            <div className="text-center py-2">
              <h2 className="text-2xl font-bold text-white mt-1">Pilih Paket Undangan</h2>
              <p className="text-xs text-slate-400 mt-1">Tentukan paket fitur yang sesuai dengan kebutuhan</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <button
                onClick={() => setSelectedPaket("basic")}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left transition duration-300 hover:border-blue-500 hover:bg-slate-900"
              >
                <div className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">Paket 01</div>
                <h3 className="text-xl font-bold text-white">Basic</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Fitur standar digital, detail pengantin, akad, resepsi, & lokasi maps.
                </p>
                <div className="mt-6 text-xs font-semibold text-blue-400 group-hover:underline">
                  Pilih Paket Basic →
                </div>
              </button>

              <button
                onClick={() => setSelectedPaket("premium")}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left transition duration-300 hover:border-emerald-500 hover:bg-slate-900"
              >
                <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Paket 02</div>
                <h3 className="text-xl font-bold text-white">Premium</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Basic + Musik MP3, Galeri Foto (10 foto), QRIS, & No. Rekening.
                </p>
                <div className="mt-6 text-xs font-semibold text-emerald-400 group-hover:underline">
                  Pilih Paket Premium →
                </div>
              </button>

              <button
                onClick={() => setSelectedPaket("enterprise")}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left transition duration-300 hover:border-purple-500 hover:bg-slate-900"
              >
                <div className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-2">Paket 03</div>
                <h3 className="text-xl font-bold text-white">Enterprise</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Premium + Buku Tamu/Ucapan, RSVP Kehadiran, & Live Streaming.
                </p>
                <div className="mt-6 text-xs font-semibold text-purple-400 group-hover:underline">
                  Pilih Paket Enterprise →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LANGKAH 3: WORKSPACE LIST & TOMBOL "+ BUAT UNDANGAN BARU"            */}
        {/* ==================================================================== */}
        {selectedCategory && selectedPaket && (
          <div className="space-y-6">
            
            {/* Navigasi Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-white">{getKategoriLabel(selectedCategory)}</span>
                <span className="text-slate-600">/</span>
                <span className="font-semibold text-emerald-400 uppercase">Paket {selectedPaket}</span>
              </div>
              
              <div className="flex gap-4 text-xs">
                <button
                  onClick={() => setSelectedPaket(null)}
                  className="text-slate-400 hover:text-white underline"
                >
                  ← Ganti Paket
                </button>
                <button
                  onClick={() => {
                    setSelectedPaket(null);
                    setSelectedCategory(null);
                  }}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  ← Ke Root Dashboard
                </button>
              </div>
            </div>

            {/* HEADER AREA: TABEL & TOMBOL OPEN MODAL */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
              <div>
                <h3 className="text-lg font-bold text-white">Daftar Undangan Aktif</h3>
                <p className="text-xs text-slate-400">
                  Kelola undangan yang telah diterbitkan pada paket <span className="uppercase font-semibold text-emerald-400">{selectedPaket}</span>.
                </p>
              </div>

              {/* TOMBOL Pemicu POPUP MODAL */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95"
              >
                <span>+</span> Buat Undangan Baru
              </button>
            </div>

            {/* DAFTAR UNDANGAN AKTIF */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-500">Memuat data dari database...</div>
              ) : listUndangan.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
                  Belum ada undangan yang dibuat. Klik tombol <b>"+ Buat Undangan Baru"</b> di atas untuk mulai membuat.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-3">Slug / URL</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Tanggal Buat</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listUndangan.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800/60 hover:bg-slate-950/40">
                          <td className="p-3 text-emerald-400 font-mono font-semibold">
                            /wedding/{item.package}/{item.slug}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{item.created_at}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleHapusUndangan(item.id)}
                              className="rounded bg-red-600/10 px-2.5 py-1 text-[11px] text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white transition"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* POPUP MODAL FORM INPUT (Tampil Hanya Saat isModalOpen === true)      */}
        {/* ==================================================================== */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
              
              {/* Header Modal & Tombol Close (X) */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Input Data Undangan ({selectedPaket?.toUpperCase()})
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Isi Form Sesuai Paket */}
              {selectedCategory === "wedding" && selectedPaket === "basic" && (
                <FormBasicWedding onSubmit={handleSaveBasic} />
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}