/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { 
    unoptimized: true 
  },
  // Configuración para Prisma en Vercel
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
      });
    }
    return config;
  },
  // Configuración para variables de entorno
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Build ID para forzar rebuild
  generateBuildId: async () => {
    return 'vercel-fix-' + Date.now();
  },
};

module.exports = nextConfig;
