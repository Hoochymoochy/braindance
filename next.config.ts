import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
};

export default nextConfig;
