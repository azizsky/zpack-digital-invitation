"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  const categories = [
    {
      id: "wedding",
      title: "Undangan Pernikahan",
      desc: "Untuk akad nikah, resepsi, lamaran, & engagement.",
      icon: "💍",
    },
    {
      id: "syukuran",
      title: "Khitan / Syukuran / Ultah",
      desc: "Untuk walimatul khitan, ulang tahun, & syukuran keluarga.",
      icon: "🎉",
    },
    {
      id: "event",
      title: "Undangan Event",
      desc: "Untuk seminar, konser, reuni, & acara komunitas.",
      icon: "🎟️",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070d19] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Pilih Kategori Acara</h1>
        <p className="text-gray-400 text-center mb-10">
          Pilih kategori jenis acara yang ingin kamu kelola
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/admin/dashboard/${cat.id}`}
              className="bg-[#0e172a] border border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h2 className="text-xl font-bold mb-2">{cat.title}</h2>
              <p className="text-sm text-gray-400">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}