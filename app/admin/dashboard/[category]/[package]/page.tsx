"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FormBasicWedding from "@/components/admin/FormBasicWedding";
import FormPremiumWedding from "@/components/admin/FormPremiumWedding";
import FormEnterpriseWedding from "@/components/admin/FormEnterpriseWedding";

export default function ManageInvitationsPage() {
  const params = useParams();
  const category = params.category as string;
  const pkg = params.package as string;

  const [listUndangan, setListUndangan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // State untuk Mode Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);

  // Ambil Data Khusus Category & Package ini
  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/invitations?category=${category}&package=${pkg}`
      );
      const data = await res.json();
      if (data.success) {
        setListUndangan(data.data || []);
      }
    } catch (err) {
      console.error("Gagal ambil data undangan:", err);
    } finally {
      setLoading(false);
    }
  }, [category, pkg]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Hapus Undangan
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus undangan ini?")) return;
    try {
      const res = await fetch(`/api/admin/invitations?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert("Undangan berhasil dihapus!");
        fetchInvitations();
      }
    } catch (err) {
      alert("Gagal menghapus undangan");
    }
  };

  // Salin Link Undangan ke Clipboard
  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/wedding/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    alert("🔗 Link undangan berhasil disalin: " + fullUrl);
  };

  // Buka Form untuk Edit (Update) - Memetakan kolom database D1 ke Form State
  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setInitialData({
      slug: item.slug,
      templateId: item.template_id || "theme-minimalist",
      namaPanggilanPria: item.nama_panggilan_pria || "",
      namaPanggilanWanita: item.nama_panggilan_wanita || "",
      namaLengkapPria: item.nama_lengkap_pria || "",
      namaLengkapWanita: item.nama_lengkap_wanita || "",
      orangTuaPria: item.orang_tua_pria || "",
      orangTuaWanita: item.orang_tua_wanita || "",
      turutMengundangPria: item.turut_mengundang_pria || "",
      turutMengundangWanita: item.turut_mengundang_wanita || "",
      tanggalAkad: item.tanggal_akad || "",
      waktuAkad: item.waktu_akad || "",
      tanggalResepsi: item.tanggal_resepsi || "",
      waktuResepsi: item.waktu_resepsi || "",
      lokasiTeks: item.lokasi_teks || "",
      lokasiMaps: item.lokasi_maps || "",
      // Mengurai data tambahan dari xtra_data (galeri, qris, rekening, musik)
      ...(item.xtra_data || {}),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit Form (Create / Update)
  const handleSubmitForm = async (formData: any) => {
    try {
      const url = "/api/admin/invitations";
      const method = editingId ? "PUT" : "POST";
      const bodyPayload: any = {
        slug: formData.slug.toLowerCase().trim().replace(/\s+/g, "-"),
        category: category,
        package: pkg,
        content: formData,
      };

      if (editingId) {
        bodyPayload.id = editingId;
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success) {
        alert(editingId ? "✅ Undangan berhasil diperbarui!" : "✅ Undangan berhasil ditambahkan!");
        setShowForm(false);
        setEditingId(null);
        setInitialData(null);
        fetchInvitations();
      } else {
        alert("⚠️ " + data.message);
      }
    } catch (err: any) {
      alert("⚠️ Error: " + err.message);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setInitialData(null);
  };

  return (
    <div className="min-h-screen bg-[#070d19] text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb Header - Responsif */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400">
            <Link href="/admin/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <span>/</span>
            <Link href={`/admin/dashboard/${category}`} className="hover:text-white uppercase">
              {category}
            </Link>
            <span>/</span>
            <span className="text-emerald-400 font-bold uppercase">{pkg}</span>
          </div>

          <Link
            href={`/admin/dashboard/${category}`}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-gray-300 transition-all self-end sm:self-auto"
          >
            ← Ganti Paket
          </Link>
        </div>

        {/* Title Card - Responsif */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0e172a] border border-slate-800 p-5 sm:p-6 rounded-xl gap-4 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Daftar Undangan Aktif</h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Kelola undangan yang telah diterbitkan pada paket{" "}
              <span className="uppercase text-emerald-400 font-bold">{pkg}</span>.
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm) {
                handleCancelForm();
              } else {
                setEditingId(null);
                setInitialData(null);
                setShowForm(true);
              }
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg shadow-blue-600/20 text-center"
          >
            {showForm ? "✕ Batal" : "+ Buat Undangan Baru"}
          </button>
        </div>

        {/* FORM SECTION */}
        {showForm && (
          <div className="bg-[#0e172a] border border-slate-800 p-4 sm:p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-semibold text-emerald-400">
                {editingId ? "✏️ Edit Undangan (Timpa Data)" : "✨ Buat Undangan Baru"}
              </h2>
              <button onClick={handleCancelForm} className="text-xs text-gray-400 hover:text-white">
                Tutup ✕
              </button>
            </div>

            {pkg === "basic" && (
              <FormBasicWedding onSubmit={handleSubmitForm} initialData={initialData} />
            )}
            {pkg === "premium" && (
              <FormPremiumWedding onSubmit={handleSubmitForm} initialData={initialData} />
            )}
            {pkg === "enterprise" && (
              <FormEnterpriseWedding onSubmit={handleSubmitForm} initialData={initialData} />
            )}
          </div>
        )}

        {/* TABEL / DAFTAR UNDANGAN */}
        <div className="bg-[#0e172a] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Memuat data undangan...</div>
          ) : listUndangan.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Belum ada undangan untuk paket {pkg.toUpperCase()}. Klik tombol di atas untuk membuat.
            </div>
          ) : (
            <div>
              {/* Tampilan Desktop: Tabel Standar */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-gray-400 uppercase bg-slate-900/50">
                      <th className="p-4">SLUG / URL</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4">TANGGAL BUAT</th>
                      <th className="p-4 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listUndangan.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all text-sm">
                        <td className="p-4 text-emerald-400 font-mono">
                          <div className="flex items-center gap-2">
                            <span>/wedding/{item.slug}</span>
                            <a
                              href={`/wedding/${item.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-gray-300 px-2 py-0.5 rounded"
                            >
                              Preview ↗
                            </a>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                            {item.status || "active"}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 text-xs">
                          {item.created_at || "-"}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleCopyLink(item.slug)}
                            className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 px-3 py-1 rounded text-xs transition-all"
                          >
                            Copy Link
                          </button>
                          <button
                            onClick={() => handleEditClick(item)}
                            className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-1 rounded text-xs transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded text-xs transition-all"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tampilan Mobile: Card Stack */}
              <div className="block md:hidden divide-y divide-slate-800">
                {listUndangan.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">URL / Slug:</span>
                        <span className="text-emerald-400 font-mono text-sm font-bold">
                          /wedding/{item.slug}
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                        {item.status || "active"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 flex justify-between">
                      <span>Dibuat: {item.created_at || "-"}</span>
                      <a
                        href={`/wedding/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 underline"
                      >
                        Preview ↗
                      </a>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => handleCopyLink(item.slug)}
                        className="flex-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 py-1.5 rounded text-xs font-medium transition-all text-center"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleEditClick(item)}
                        className="flex-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 py-1.5 rounded text-xs font-medium transition-all text-center"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 py-1.5 rounded text-xs font-medium transition-all text-center"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}