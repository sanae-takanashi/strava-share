/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a minimal self-contained server bundle for Docker.
  output: "standalone",
};

module.exports = nextConfig;
