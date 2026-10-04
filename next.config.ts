import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/admin', destination: '/dashboard' },
      { source: '/admin/coupons', destination: '/dashboard/coupons' },
      { source: '/admin/coupons/:code', destination: '/dashboard/coupons/:code' },
      { source: '/admin/create', destination: '/dashboard/coupons/create' },
      { source: '/admin/settings', destination: '/dashboard/settings' },
      { source: '/admin/audit', destination: '/dashboard/audit-log' },
    ];
  },
};

export default nextConfig;
