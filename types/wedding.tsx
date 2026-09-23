// --- 1. KONTEN PAKET BASIC ---
export interface BasicWeddingContent {
  slug: string;
  namaPanggilanPria: string;
  namaPanggilanWanita: string;
  namaLengkapPria: string;
  namaLengkapWanita: string;
  orangTuaPria: string;
  orangTuaWanita: string;
  turutMengundangPria: string;
  turutMengundangWanita: string;
  // Detail Akad Nikah
  tanggalAkad: string;
  waktuAkad: string;
  // Detail Resepsi Nikah
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

export interface PremiumWeddingContent extends BasicWeddingContent {
  musikUrl?: string;
  rekeningBank?: RekeningBank[];
  galeriFoto?: string[];
}

// --- 3. KONTEN PAKET ENTERPRISE (Mewarisi Premium) ---
export interface EnterpriseWeddingContent extends PremiumWeddingContent {
  customDomain?: string;
  liveStreamUrl?: string;
}