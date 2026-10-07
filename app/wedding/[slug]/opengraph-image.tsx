import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Zpack Digital Invitation";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "white",
          fontSize: 60,
        }}
      >
        Zpack Digital Invitation
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}