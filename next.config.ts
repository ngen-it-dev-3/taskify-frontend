// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      // ✅ Using only your official backend now
      {
        protocol: "https",
        hostname: "orvix-backend.ngengroup.org",
        pathname: "/uploads/**",
      },
    ],
  },

  /* ------------------------------------------------
   * Proxy /uploads/* to the backend so downloads
   * become same-origin. Same-origin is required for
   * `<a download>` to actually save files instead of
   * opening a new tab.
   * ------------------------------------------------ */
  async rewrites() {
    // ✅ Using your official backend on HTTPS
    const backendOrigin = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"
    ).replace(/\/api\/v1\/?$/, "");

    return [
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;