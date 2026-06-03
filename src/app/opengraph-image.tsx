import { ImageResponse } from "next/og";
import { publicEnv } from "@/lib/env";

export const runtime = "edge";
export const alt =
  "Dr. Aditya & Akhila's Metabolic Programme. For the woman who has tried everything except the root cause.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic OG image. next/og requires `display: flex` on every element with
 * multiple children. We avoid the ₹ glyph because the runtime's default font
 * does not include it; "Rs." is rendered instead.
 */
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #FDFBF7 0%, #FAF6EE 50%, #F5EFE2 100%)",
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -120,
            right: -100,
            width: 520,
            height: 520,
            borderRadius: 260,
            background:
              "radial-gradient(circle, rgba(210, 108, 60, 0.18) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: -140,
            left: -100,
            width: 540,
            height: 540,
            borderRadius: 270,
            background:
              "radial-gradient(circle, rgba(189, 127, 53, 0.18) 0%, transparent 70%)",
          }}
        />

        {/* Top: brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 28,
              background: "linear-gradient(135deg, #B85A30 0%, #D26C3C 100%)",
              color: "#FFF9F5",
              fontSize: 28,
              fontWeight: 700,
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(210, 108, 60, 0.25)",
            }}
          >
            A
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 600,
                color: "#1A1412",
                letterSpacing: -0.5,
              }}
            >
              Dr. Aditya · Akhila
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 16,
                fontWeight: 500,
                color: "#7E6B61",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              The Metabolic Reset Programme
            </div>
          </div>
        </div>

        {/* Middle: headline */}
        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 1040 }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: "#9C6628",
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            Rs. {publicEnv.assessmentFeeInr} · Assessment Call · Refundable
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              lineHeight: 1.04,
              fontWeight: 500,
              color: "#1A1412",
              letterSpacing: -2,
            }}
          >
            <div style={{ display: "flex" }}>For the woman who has</div>
            <div
              style={{
                display: "flex",
                color: "#D26C3C",
                fontStyle: "italic",
              }}
            >
              tried everything.
            </div>
            <div style={{ display: "flex" }}>Except the root cause.</div>
          </div>
        </div>

        {/* Bottom: trust strip */}
        <div
          style={{
            display: "flex",
            gap: 36,
            alignItems: "center",
            paddingTop: 20,
            borderTop: "1px solid rgba(210, 108, 60, 0.15)",
          }}
        >
          {[
            "Expert-Led",
            "Nutrient Support Included",
            "Personalised Assessment",
            "Money-Back Guarantee",
          ].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                fontSize: 20,
                color: "#5D4D45",
                fontWeight: 500,
                fontFamily: "system-ui, sans-serif",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: "#BD7F35",
                }}
              />
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
