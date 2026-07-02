/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',       // 静态导出,适合 Cloudflare Pages / Netlify / GitHub Pages
  images: {
    unoptimized: true,    // 静态部署无法使用 Next.js 图片优化
  },
  trailingSlash: true,    // 兼容 Cloudflare Pages 路由
};

module.exports = nextConfig;
