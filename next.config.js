/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.CAPACITOR_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['node-routeros', 'knex', 'sqlite3'],
  },
};

module.exports = nextConfig;

