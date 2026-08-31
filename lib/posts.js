// 构建时扫描 content/blog/ 下的所有文章，读取 frontmatter 元信息
// CommonJS 写法，pages/ 和 scripts/gen-rss.js 都能用
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

function normalizeDate(d) {
  if (!d) return null
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  return String(d)
}

// 默认排除 frontmatter 里 draft: true 的草稿（列表/RSS/搜索都不出现）；
// 传 { includeDrafts: true } 可包含草稿。返回按日期从新到旧排序。
function getAllPosts({ includeDrafts = false } = {}) {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => /\.mdx?$/.test(f) && !/^index\.mdx?$/.test(f))
    .map((f) => {
      const slug = f.replace(/\.mdx?$/, '')
      const { data } = matter(fs.readFileSync(path.join(BLOG_DIR, f), 'utf-8'))
      return {
        slug,
        url: `/blog/${slug}/`,
        title: data.title || slug,
        date: normalizeDate(data.date),
        category: data.category || '未分类',
        draft: Boolean(data.draft),
        pinned: Boolean(data.pinned),
      }
    })
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

function getAllCategories() {
  const counts = {}
  for (const p of getAllPosts()) counts[p.category] = (counts[p.category] || 0) + 1
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

module.exports = { getAllPosts, getAllCategories }
