/** @type {import('next').NextConfig} */
module.exports = {
  // 纯静态导出：`npm run build` 后 out/ 目录可部署到任意静态托管
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ['next-mdx-remote'],
}
