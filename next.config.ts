import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Conventional rendering: pages that read cookies render on demand,
  // everything else is static. Keeps Netlify's Next runtime on the well-trodden path.
};

export default nextConfig;
