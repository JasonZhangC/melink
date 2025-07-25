import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 为了支持大文件上传，设置外部包
  serverExternalPackages: [],
  // 允许外部图片域名
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3845',
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;
