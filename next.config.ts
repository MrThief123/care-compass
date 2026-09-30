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
};

export default nextConfig;
