import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000/api',
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
