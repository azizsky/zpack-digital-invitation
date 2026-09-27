"use client";

import { useState, useEffect } from "react";
import BasicFields from "./sections/BasicFields";
import { BasicWeddingContent } from "@/types/wedding";

interface FormBasicWeddingProps {
  onSubmit: (data: BasicWeddingContent) => void;
  initialData?: Partial<BasicWeddingContent>;
}

export default function FormBasicWedding({
  onSubmit,
  initialData,
}: FormBasicWeddingProps) {
  const [formData, setFormData] = useState<BasicWeddingContent>({
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
    waktuAkad: "08:00 - 10:00 WIB",
    tanggalResepsi: "",
    waktuResepsi: "11:00 - 14:00 WIB",
    lokasiTeks: "",
    lokasiMaps: "",
  });

  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        console.log("🚀 [FORM_PARENT] Fetching templates from /api/admin/templates...");
        
        // UBAT URL ENDPOINT DARI /api/templates MENJADI /api/admin/templates
        const res = await fetch("/api/admin/templates");

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        console.log("📦 [FORM_PARENT] Response from API:", json);

        if (json.success && Array.isArray(json.data)) {
          setTemplates(json.data);
        } else if (Array.isArray(json)) {
          setTemplates(json);
        } else if (json.data) {
          setTemplates(json.data);
        }
      } catch (err) {
        console.error("❌ [FORM_PARENT] Fetch templates error:", err);
      }
    }

    fetchTemplates();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
          Lengkapi detail data dasar di bawah untuk menerbitkan atau memperbarui undangan digital.
        </p>
      </div>

      <BasicFields
        formData={formData}
        onChange={handleChange}
        templates={templates}
      />

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
      >
        {initialData ? "Simpan Perubahan (Update)" : "Simpan & Terbitkan Undangan Basic"}
      </button>
    </form>
  );
}