// 构建前生成 public/search-index.json，供顶栏搜索框（components/Search.js）使用
// package.json 的 dev / build 脚本会先跑这个；草稿（draft: true）不进索引
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const { getAllPosts } = require('../lib/posts')

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

// 粗略地把 markdown/MDX 转成可检索的纯文本
function toPlainText(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ') // 代码块
    .replace(/<[^>]+>/g, ' ') // JSX/HTML 标签
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接保留文字
    .replace(/[#>*`~_|-]+/g, ' ') // 标记符号
    .replace(/\s+/g, ' ')
    .trim()
}

const index = getAllPosts().map((p) => {
  const file = ['.md', '.mdx']
    .map((ext) => path.join(BLOG_DIR, p.slug + ext))
    .find((f) => fs.existsSync(f))
  const { content } = matter(fs.readFileSync(file, 'utf-8'))
  return {
    title: p.title,
    url: p.url,
    date: p.date,
    category: p.category,
    text: toPlainText(content),
  }
})

fs.writeFileSync(
  path.join(process.cwd(), 'public', 'search-index.json'),
  JSON.stringify(index)
)
console.log(`search-index.json generated with ${index.length} posts`)
