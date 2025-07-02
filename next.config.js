/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable /app directory (Next.js 13+)
  experimental: {
    appDir: true,
  },

  // Allow images from your domains (add more as needed)
  images: {
    domains: [
      'localhost',         // For local development
      'dev.goval.app',     // Your own backend/API domain if serving images
      // 'cdn.example.com', // Add any CDN or other domains here
    ],
  },

  // Enable strict build checks in production
  eslint: {
    ignoreDuringBuilds: false, // Set to true only if you want to allow lint errors (not recommended for prod)
  },

  typescript: {
    ignoreBuildErrors: false,  // Set to true only if you want to allow TS errors (not recommended for prod)
  },

  // If you have environment variables for runtime, consider enabling runtime env (Next.js 14+)
   runtimeEnv: {
     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
   },
}

module.exports = nextConfig;
