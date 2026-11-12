import { ImageResponse } from "next/og";

// The picture that shows when someone shares a CivicKettle link in a text,
// an email or on social media.
export const alt = "CivicKettle: volunteer sign-ups, reminders and hours for small nonprofits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px 80px", background: "#2b3c30", color: "#f4f2e9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 96, height: 96, borderRadius: 22, background: "#e3b04b" }}>
            <svg width="70" height="70" viewBox="6.75 3.2 60 60">
              <path fill="#2b3c30" d="M11 50C11 36 19.5 26 32 26s21 10 21 24v2.5a1.5 1.5 0 0 1-1.5 1.5h-39A1.5 1.5 0 0 1 11 52.5Z" />
              <path fill="#2b3c30" d="M49 39l9.2-9.6a2 2 0 0 1 3.3.7l.9 2.3a2 2 0 0 1-.5 2.2L51 46Z" />
              <path d="M17.5 31C17.5 9 46.5 9 46.5 31" fill="none" stroke="#2b3c30" strokeWidth="4.2" strokeLinecap="round" />
              <circle cx="32" cy="23" r="3.2" fill="#2b3c30" />
              <path d="M22.5 40.5l6.700 6.500L42 33.500" fill="none" stroke="#e3b04b" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 600, letterSpacing: -1.5 }}>CivicKettle</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 30, color: "#e3b04b" }}>Volunteer sign-ups and scheduling for small nonprofits</div>
          <div style={{ display: "flex", fontSize: 66, lineHeight: 1.06, letterSpacing: -2.5, maxWidth: 1040 }}>Organizing volunteers shouldn&apos;t be another full-time job.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#c9d0c1" }}>
          <div style={{ display: "flex" }}>Free for volunteers. Free to try for organizers.</div>
          <div style={{ display: "flex" }}>civickettle.com</div>
        </div>
      </div>
    ),
    size,
  );
}
