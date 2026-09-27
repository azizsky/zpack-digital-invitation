"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function SelectPackagePage() {
  const params = useParams();
  const category = params.category as string;

  const packages = [
    {
      id: "basic",
      name: "Basic",
      badge: "PAKET 01",
      desc: "Fitur standar digital, detail pengantin, akad, resepsi, & lokasi maps.",
      color: "border-blue-500 text-blue-400",
    },
    {
      id: "premium",
      name: "Premium",
      badge: "PAKET 02",
      desc: "Basic + Musik MP3, Galeri Foto (10 foto), QRIS, & No. Rekening.",
      color: "border-emerald-500 text-emerald-400",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      badge: "PAKET 03",
      desc: "Premium + Buku Tamu/Ucapan, RSVP Kehadiran, & Live Streaming.",
      color: "border-purple-500 text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070d19] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/admin/dashboard"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Kembali ke Pilih Kategori
          </Link>
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider text-blue-400">
            Kategori: {category}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Pilih Paket Undangan</h1>
        <p className="text-gray-400 text-center mb-10">
          Tentukan paket fitur yang sesuai dengan kebutuhan
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-[#0e172a] border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-600 transition-all"
            >
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${pkg.color}`}>
                  {pkg.badge}
                </span>
                <h2 className="text-2xl font-bold my-2">{pkg.name}</h2>
                <p className="text-sm text-gray-400 mb-6">{pkg.desc}</p>
              </div>

              <Link
                href={`/admin/dashboard/${category}/${pkg.id}`}
                className={`w-full py-2.5 px-4 rounded-lg font-medium text-center transition-all bg-slate-800 hover:bg-blue-600 hover:text-white`}
              >
                Pilih Paket {pkg.name} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}