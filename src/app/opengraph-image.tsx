import { ImageResponse } from "next/og";

export const alt = "Braindance — Stream DJ sets. Discover new mixes.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 40,
          padding: "64px 72px",
          background:
            "linear-gradient(145deg, #0a0a0c 0%, #12121a 45%, #0d0a18 100%)",
          color: "#fafafa",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 18% 30%, rgba(0,204,255,0.28), transparent 42%), radial-gradient(circle at 82% 20%, rgba(255,0,247,0.22), transparent 40%), radial-gradient(circle at 55% 88%, rgba(55,0,255,0.28), transparent 45%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.045em",
              maxWidth: 920,
            }}
          >
            <span>Stream DJ sets.</span>
            <span>Discover new mixes.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "rgba(250,250,250,0.72)",
              maxWidth: 760,
              lineHeight: 1.35,
            }}
          >
            Fresh sets and classics. One place. No fuss.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            fontSize: 22,
            color: "rgba(250,250,250,0.55)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>DJ catalog · live streams</span>
          <span>braindance.live</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
