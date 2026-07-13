/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Ensure proper output for Render.com deployment
  output: "standalone",
};

export default nextConfig;
