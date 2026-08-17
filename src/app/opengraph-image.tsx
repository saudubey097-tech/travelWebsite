import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Southbound — Private drivers & day trips across New Zealand";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#141F1A",
          padding: "72px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "3px solid #C99A3C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C99A3C" }} />
          </div>
          <div style={{ color: "#F2EEE3", fontSize: 30, letterSpacing: 1 }}>Southbound</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ color: "#F2EEE3", fontSize: 60, lineHeight: 1.15, maxWidth: 900 }}>
            New Zealand, at the pace of a private road.
          </div>
          <div style={{ color: "rgba(242,238,227,0.7)", fontSize: 26, maxWidth: 760 }}>
            Private drivers, day trips and transfers the length of New Zealand.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "rgba(242,238,227,0.55)", fontSize: 20 }}>
          <span>CAPE REINGA</span>
          <div style={{ width: 220, height: 1, background: "rgba(201,154,60,0.6)" }} />
          <span>BLUFF</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
