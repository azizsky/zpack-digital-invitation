import { NextResponse } from "next/server";

// Simulasi penyimpanan memori sementara / fallback D1
let invitationsStore: Array<{
  id: string;
  slug: string;
  category: string;
  package: string;
  status: string;
  content: string;
  created_at: string;
}> = [];

// 1. GET: Ambil Daftar Undangan
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const pkg = searchParams.get("package");

  let result = invitationsStore;

  if (category && pkg) {
    result = result.filter(
      (item) => item.category === category && item.package === pkg
    );
  }

  return NextResponse.json({ success: true, data: result });
}

// 2. POST: Simpan Undangan Baru ke Database
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, category, package: pkg, content } = body;

    if (!slug || !category || !pkg) {
      return NextResponse.json(
        { message: "Data tidak lengkap!" },
        { status: 400 }
      );
    }

    const newInvitation = {
      id: Date.now().toString(),
      slug,
      category,
      package: pkg,
      status: "active",
      content: typeof content === "string" ? content : JSON.stringify(content),
      created_at: new Date().toLocaleDateString("id-ID"),
    };

    // Masukkan ke store
    invitationsStore.unshift(newInvitation);

    return NextResponse.json({
      success: true,
      message: "Undangan berhasil disimpan!",
      data: newInvitation,
    });
  } catch (error) {
    console.error("Error Save Invitation:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan data ke database" },
      { status: 500 }
    );
  }
}

// 3. DELETE: Hapus Undangan
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });
  }

  invitationsStore = invitationsStore.filter((item) => item.id !== id);

  return NextResponse.json({
    success: true,
    message: "Undangan berhasil dihapus!",
  });
}