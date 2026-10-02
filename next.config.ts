import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Uploads are up to 20 MB (MAX_DOCUMENT_SIZE_BYTES) plus multipart overhead. The Server
    // Action default is 1 MB; with proxy.ts the body is also buffered, by default only to 10 MB.
    serverActions: { bodySizeLimit: "21mb" },
    proxyClientMaxBodySize: "21mb",
  },
  // F0-21 FD-11: browsers use HTTPS only for 2 years after the first visit. No includeSubDomains
  // or preload: the production domain isn't settled and both are hard to undo.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Strict-Transport-Security", value: "max-age=63072000" }],
      },
    ];
  },
};

export default nextConfig;
