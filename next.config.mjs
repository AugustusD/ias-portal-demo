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
};

export default nextConfig;
