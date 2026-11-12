import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Conventional rendering: pages that read cookies render on demand,
  // everything else is static.

  // Basic protections on every page: no embedding CivicKettle inside another
  // site (stops click-tricking), no guessing file types, private links are
  // not passed to other sites, and no access to camera, microphone or location.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
