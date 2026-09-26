/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    // Preserve the existing AdSense integration. Next's inline hydration/theme
    // scripts currently require unsafe-inline; a nonce rollout is separate work.
    const ads = 'https://*.googlesyndication.com https://*.doubleclick.net https://*.googleadservices.com https://www.google.com';
    const csp = ["default-src 'self'", "script-src 'self' 'unsafe-inline' " + ads + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''), "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https://images.unsplash.com " + ads, "font-src 'self' data:", "media-src 'self' blob:", "connect-src 'self' " + ads, 'frame-src ' + ads, "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"].join('; ');
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: csp }, { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
    ] }];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/fr',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/ml/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:5000/api/ml/:path*'
            : '/api/ml/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/admin/data-intelligence': ['./server-data/casablanca-market.csv'],
      '/[locale]/cities/[citySlug]/market': ['./server-data/casablanca-market.csv'],
    },
  },
};

export default nextConfig;
