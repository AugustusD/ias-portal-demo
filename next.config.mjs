/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Defense against clickjacking. Portal has no legitimate need to be iframed.
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak full URL to external referrers; cross-origin gets just origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features we don't use
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },

  // Backward-compat redirects for the /dealers/* → / flatten (2026-05-25).
  // Anyone with a bookmarked /dealers/dashboard, an email-link to
  // /dealers/training/module-3, or a Slack-pasted /dealers/leads URL will
  // get a 301 to the new location. Permanent so browsers cache it.
  //
  // /dealers/dashboard is special — the new dashboard is at /, not
  // /dashboard — so handle it explicitly before the catch-all.
  async redirects() {
    return [
      {
        source: "/dealers/dashboard",
        destination: "/",
        permanent: true,
      },
      {
        source: "/dealers/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
