/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  // GitHub Pages is a plain file host: prerender everything to ./out and let the
  // client components hydrate there. No route here needs a server.
  output: "export",
  // No image optimiser behind a static host, so the logos ship as authored.
  images: { unoptimized: true },
};

export default nextConfig;
