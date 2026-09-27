/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['node-routeros', 'knex', 'sqlite3'],
  },
};

module.exports = nextConfig;
