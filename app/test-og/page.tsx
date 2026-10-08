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
        url: "https://zpack-digital-invitation.zpack.workers.dev/wedding/latif-nanda/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Test Zpack Preview",
      },
    ],
  },
};

export default function TestOGPage() {
  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Test Zpack OG Preview</h1>
      <p>Halaman ini hanya untuk testing Open Graph.</p>
    </main>
  );
}
