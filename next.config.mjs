/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Output configuration for Vercel
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix for PDFKit: Don't bundle it, load from node_modules at runtime
      // This ensures font files are accessible from their original location
      config.externals = config.externals || [];
      
      // Make PDFKit an external dependency so it's not bundled
      // This allows it to access font files from node_modules/pdfkit/js/data
      config.externals.push({
        'pdfkit': 'commonjs pdfkit',
        'canvas': 'commonjs canvas',
      });
    }
    return config;
  },
};

export default nextConfig;

