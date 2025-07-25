import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 为了支持大文件上传，设置实验性功能
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
