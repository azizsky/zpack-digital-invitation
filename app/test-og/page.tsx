
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Zpack Preview",
  description: "Test WhatsApp Open Graph Preview",

  openGraph: {
    title: "Test Zpack Preview",
    description: "Test WhatsApp Open Graph Preview",
    url: "https://zpack-digital-invitation.zpack.workers.dev/test-og",
    siteName: "Zpack Digital Invitation",
    type: "website",

    images: [
      {
        url: "https://assets.zpack.my.id/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Test Zpack Preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Test Zpack Preview",
    description: "Test WhatsApp Open Graph Preview",
    images: ["https://assets.zpack.my.id/opengraph-image.png"],
  },
};

export default function TestOGPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Test Zpack OG Preview</h1>

      <p>Halaman ini hanya untuk testing Open Graph.</p>

      <p>
        OG Image:
        {" "}
        <a
          href="https://assets.zpack.my.id/opengraph-image.png"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lihat gambar
        </a>
      </p>
    </main>
  );
}

