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
  allowedDevOrigins: [
    ...lanAddresses(),
    ...(process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(",").map((s) => s.trim()) : []),
  ],
};

module.exports = withNextIntl(nextConfig);
