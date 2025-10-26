/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: true,
  },
  images: {
    domains: [
      'maps.googleapis.com',
      'lh3.googleusercontent.com',
      'places.googleapis.com'
    ],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  }
}

export default nextConfig
