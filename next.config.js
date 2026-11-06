const os = require("os");
const withNextIntl = require("next-intl/plugin")();

// Dev only: let phones/tablets on the same Wi-Fi load the dev server
// (npm run dev -- -H 0.0.0.0). Allows this computer's own LAN addresses,
// detected automatically, plus any extra hosts in DEV_ORIGINS
// (comma-separated). Has no effect on production builds.
function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === "IPv4" && !iface.internal)
    .map((iface) => iface.address);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // The hero video + poster: cache for a week, refresh quietly after that
        source: "/animations/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
  allowedDevOrigins: [
    ...lanAddresses(),
    ...(process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(",").map((s) => s.trim()) : []),
  ],
};

module.exports = withNextIntl(nextConfig);
