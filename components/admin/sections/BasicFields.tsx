"use client";

import { useState } from "react";
import { BasicWeddingContent } from "@/types/wedding";

interface BasicFieldsProps {
  formData: BasicWeddingContent;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

export default function BasicFields({ formData, onChange }: BasicFieldsProps) {
  // State kontrol waktu Akad
  const [akadStart, setAkadStart] = useState("08:00");
  const [akadEnd, setAkadEnd] = useState("10:00");
  const [akadSelesai, setAkadSelesai] = useState(true);
  const [akadTz, setAkadTz] = useState("WIB");

  // State kontrol waktu Resepsi
  const [resepsiStart, setResepsiStart] = useState("11:00");
  const [resepsiEnd, setResepsiEnd] = useState("14:00");
  const [resepsiSelesai, setResepsiSelesai] = useState(false);
  const [resepsiTz, setResepsiTz] = useState("WIB");

  // Helper merakit format string waktu Akad
  const updateWaktuAkad = (start: string, end: string, isSelesai: boolean, tz: string) => {
    setAkadStart(start);
    setAkadEnd(end);
    setAkadSelesai(isSelesai);
    setAkadTz(tz);

    const result = `${start} ${isSelesai ? "- Selesai" : `- ${end}`} ${tz}`;
    onChange({
      target: { name: "waktuAkad", value: result },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Helper merakit format string waktu Resepsi
  const updateWaktuResepsi = (start: string, end: string, isSelesai: boolean, tz: string) => {
    setResepsiStart(start);
    setResepsiEnd(end);
    setResepsiSelesai(isSelesai);
    setResepsiTz(tz);

    const result = `${start} ${isSelesai ? "- Selesai" : `- ${end}`} ${tz}`;
    onChange({
      target: { name: "waktuResepsi", value: result },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="space-y-6">
      {/* 1. SLUG URL */}
      <div>
        <label className="block text-xs font-medium text-slate-300">
          1. Custom URL / Slug
        </label>
        <div className="mt-1 flex rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
          <span className="flex items-center px-3 text-xs text-slate-500 bg-slate-900 border-r border-slate-800">
            /wedding/
          </span>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={onChange}
            placeholder="aziz-partner"
            required
            className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* 2 & 3. NAMA PANGGILAN */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-300">
            2. Nama Panggilan Pria
          </label>
          <input
            type="text"
            name="namaPanggilanPria"
            value={formData.namaPanggilanPria}
            onChange={onChange}
            placeholder="Aziz"
            required
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">
            3. Nama Panggilan Wanita
          </label>
          <input
            type="text"
            name="namaPanggilanWanita"
            value={formData.namaPanggilanWanita}
            onChange={onChange}
            placeholder="Partner"
            required
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 4 & 5. NAMA LENGKAP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-300">
            4. Nama Lengkap Pria
          </label>
          <input
            type="text"
            name="namaLengkapPria"
            value={formData.namaLengkapPria}
            onChange={onChange}
            placeholder="Asep Saepul Aziz, S.Kom."
            required
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">
            5. Nama Lengkap Wanita
          </label>
          <input
            type="text"
            name="namaLengkapWanita"
            value={formData.namaLengkapWanita}
            onChange={onChange}
            placeholder="Nama Lengkap Wanita, S.Tr."
            required
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 6 & 7. NAMA ORANG TUA */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-300">
            6. Orang Tua Pria
          </label>
          <input
            type="text"
            name="orangTuaPria"
            value={formData.orangTuaPria}
            onChange={onChange}
            placeholder="Putra dari Bpk. X & Ibu Y"
            required
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">
            7. Orang Tua Wanita
          </label>
          <input
            type="text"
            name="orangTuaWanita"
            value={formData.orangTuaWanita}
            onChange={onChange}
            placeholder="Putri dari Bpk. A & Ibu B"
            required
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 8 & 9. TURUT MENGUNDANG */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-300">
            8. Turut Mengundang (Pihak Pria)
          </label>
          <textarea
            name="turutMengundangPria"
            rows={2}
            value={formData.turutMengundangPria}
            onChange={onChange}
            placeholder="Bpk. Ahmad, Bpk. Budi, dll."
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">
            9. Turut Mengundang (Pihak Wanita)
          </label>
          <textarea
            name="turutMengundangWanita"
            rows={2}
            value={formData.turutMengundangWanita}
            onChange={onChange}
            placeholder="Bpk. Charlie, Ibu Dewi, dll."
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 10 & 11. DETAIL AKAD NIKAH */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-4">
        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
          Detail Akad Nikah
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* DatePicker Tanggal Akad */}
          <div>
            <label className="block text-xs font-medium text-slate-300">
              10. Tanggal Akad
            </label>
            <input
              type="date"
              name="tanggalAkad"
              value={formData.tanggalAkad}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none [color-scheme:dark]"
            />
          </div>

          {/* TimePicker & Zona Waktu Akad */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                11. Waktu Akad
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={akadSelesai}
                  onChange={(e) => updateWaktuAkad(akadStart, akadEnd, e.target.checked, akadTz)}
                  className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
                />
                s/d Selesai
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={akadStart}
                onChange={(e) => updateWaktuAkad(e.target.value, akadEnd, akadSelesai, akadTz)}
                required
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none [color-scheme:dark]"
              />

              {!akadSelesai && (
                <>
                  <span className="text-xs text-slate-500">-</span>
                  <input
                    type="time"
                    value={akadEnd}
                    onChange={(e) => updateWaktuAkad(akadStart, e.target.value, akadSelesai, akadTz)}
                    required
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                  />
                </>
              )}

              {/* Zona Waktu Dropdown */}
              <select
                value={akadTz}
                onChange={(e) => updateWaktuAkad(akadStart, akadEnd, akadSelesai, e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="WIB">WIB</option>
                <option value="WITA">WITA</option>
                <option value="WIT">WIT</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 12 & 13. DETAIL RESEPSI NIKAH */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-4">
        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
          Detail Resepsi Nikah
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* DatePicker Tanggal Resepsi */}
          <div>
            <label className="block text-xs font-medium text-slate-300">
              12. Tanggal Resepsi
            </label>
            <input
              type="date"
              name="tanggalResepsi"
              value={formData.tanggalResepsi}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none [color-scheme:dark]"
            />
          </div>

          {/* TimePicker & Zona Waktu Resepsi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                13. Waktu Resepsi
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={resepsiSelesai}
                  onChange={(e) => updateWaktuResepsi(resepsiStart, resepsiEnd, e.target.checked, resepsiTz)}
                  className="rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-0"
                />
                s/d Selesai
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={resepsiStart}
                onChange={(e) => updateWaktuResepsi(e.target.value, resepsiEnd, resepsiSelesai, resepsiTz)}
                required
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none [color-scheme:dark]"
              />

              {!resepsiSelesai && (
                <>
                  <span className="text-xs text-slate-500">-</span>
                  <input
                    type="time"
                    value={resepsiEnd}
                    onChange={(e) => updateWaktuResepsi(resepsiStart, e.target.value, resepsiSelesai, resepsiTz)}
                    required
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                  />
                </>
              )}

              {/* Zona Waktu Dropdown */}
              <select
                value={resepsiTz}
                onChange={(e) => updateWaktuResepsi(resepsiStart, resepsiEnd, resepsiSelesai, e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="WIB">WIB</option>
                <option value="WITA">WITA</option>
                <option value="WIT">WIT</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 14 & 15. LOKASI TEKS & MAPS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-300">
            14. Teks Alamat Lokasi
          </label>
          <textarea
            name="lokasiTeks"
            rows={2}
            value={formData.lokasiTeks}
            onChange={onChange}
            placeholder="Gedung Graha, Jl. Bandung No. 123"
            required
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">
            15. Embed Google Maps (URL / src)
          </label>
          <textarea
            name="lokasiMaps"
            rows={2}
            value={formData.lokasiMaps}
            onChange={onChange}
            placeholder="https://www.google.com/maps/embed?pb=..."
            required
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}