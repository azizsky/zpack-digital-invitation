// --- 1. KONTEN PAKET BASIC ---
export type TemplateOption = "theme-minimalist" | "theme-rustic" | "theme-luxury";
export interface BasicWeddingContent {
  templateId: TemplateOption; // <--- Pilihan Template
  slug: string;
  namaPanggilanPria: string;
  namaPanggilanWanita: string;
  namaLengkapPria: string;
  namaLengkapWanita: string;
  orangTuaPria: string;
  orangTuaWanita: string;
  turutMengundangPria: string;
  turutMengundangWanita: string;
  // Detail Akad
  tanggalAkad: string;
  waktuAkad: string;
  // Detail Resepsi
  tanggalResepsi: string;
  waktuResepsi: string;
  // Detail Lokasi
  lokasiTeks: string;
  lokasiMaps: string;
}

// --- 2. KONTEN PAKET PREMIUM (Mewarisi Basic) ---
export interface RekeningBank {
  bank: string;
  noRek: string;
  atasNama: string;
}

export interface LoveStoryItem {
  tahun: string;
  judul: string;
  deskripsi: string;
}

export type MusicOption =
  | "none"
  | "lagu-1"
  | "lagu-2"
  | "lagu-3"
  | "lagu-4"
  | "lagu-5";

export interface PremiumWeddingContent extends BasicWeddingContent {
  musicOption?: string;
  customMusicUrl?: string;
  galeriFoto: string[]; // Maksimal 10 URL Foto
  qrisImageUrl?: string;
  rekeningBank: RekeningBank[];
}

// --- KONTEN PAKET ENTERPRISE ---
export interface EnterpriseWeddingContent extends PremiumWeddingContent {
  enableRSVP: boolean;
  enableGuestBook: boolean;
  liveStreamUrl?: string;
  videoPrewedUrl?: string;
  customMusicUrl?: string;
  loveStory: LoveStoryItem[];
}