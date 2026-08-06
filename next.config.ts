import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  async headers() {
    return [
      {
        // HTML documents only — everything except Next's content-hashed output.
        // Next serves prerendered pages with `s-maxage=31536000`, which Vercel's
        // own CDN purges on every deploy. An intermediary cache (Cloudflare in
        // front of the domain) has no idea a deploy happened, so it can keep
        // serving year-old HTML pointing at JS chunks that no longer exist.
        // `max-age=0, must-revalidate` still lets caches store the document,
        // but forces a revalidation against the origin, so a deploy is picked
        // up immediately and unchanged pages cost only a 304.
        source: "/((?!_next/static|_next/image|api/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        // API responses are per-user (session cookie) or admin-scoped. They must
        // never land in a shared cache, so they get `no-store` rather than the
        // revalidating policy above.
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        // Content-hashed build output: the filename changes whenever the bytes
        // change, so this is safe to cache forever and must stay that way.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
