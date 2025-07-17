const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: `
      default-src 'self';
      script-src 'self';
      frame-src https://player.twitch.tv https://www.youtube.com;
      sandbox allow-scripts allow-same-origin allow-popups;
    `,
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
