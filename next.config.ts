import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placeholder.pics',
        pathname: '/svg/**',
      },
      {
        protocol: 'https',
        hostname: 'ksinvccpidotzehzxkrl.supabase.co',
        pathname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)', // apply to all pages
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              frame-src https://player.twitch.tv https://www.youtube.com;
              frame-ancestors 'self';
              object-src 'none';
              base-uri 'self';
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
