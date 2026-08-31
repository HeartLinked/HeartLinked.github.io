import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import Layout from '../components/Layout'
import Profile from '../components/Profile'
import Comments from '../components/Comments'
import RecentPosts from '../components/RecentPosts'
import Exp from '../components/Exp'
import Toc from '../components/Toc'
import { getAllPosts } from '../lib/posts'

// content/ 下的目录结构即网站结构：
//   content/index.md          -> /
//   content/blog/hello.md     -> /blog/hello/
// （/blog/ 和 /categories/ 由 pages/ 下的专用页面自动生成，优先于本 catch-all）
const CONTENT_DIR = path.join(process.cwd(), 'content')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(p)
    return /\.mdx?$/.test(entry.name) ? [p] : []
  })
}

export async function getStaticPaths() {
  const paths = walk(CONTENT_DIR).map((file) => {
    const rel = path.relative(CONTENT_DIR, file).replace(/\.mdx?$/, '')
    const segments = rel.split(path.sep)
    if (segments[segments.length - 1] === 'index') segments.pop()
    return { params: { index: segments } }
  })
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const segments = params.index || []
  const base = path.join(CONTENT_DIR, ...segments)
  const file = ['.md', '.mdx', `${path.sep}index.md`, `${path.sep}index.mdx`]
    .map((suffix) => base + suffix)
    .find((p) => fs.existsSync(p))
  const { content, data } = matter(fs.readFileSync(file, 'utf-8'))
  const source = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeSlug, rehypeKatex, rehypeHighlight],
    },
  })
  // 阅读时间：中文按 400 字/分钟、英文按 200 词/分钟估算
  const cjkCount = (content.match(/[一-鿿]/g) || []).length
  const wordCount = (
    content.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) || []
  ).length
  // frontmatter 需要可 JSON 序列化（YAML 日期会解析成 Date 对象）
  const frontmatter = {
    title: data.title || null,
    date: data.date
      ? data.date instanceof Date
        ? data.date.toISOString().slice(0, 10)
        : String(data.date)
      : null,
    category: data.category || null,
    readingMinutes: Math.max(1, Math.round(cjkCount / 400 + wordCount / 200)),
  }
  // 上一篇（更早）/ 下一篇（更新），仅博客文章页需要
  let prevPost = null
  let nextPost = null
  if (frontmatter.date && segments[0] === 'blog' && segments.length === 2) {
    const posts = getAllPosts() // 已按日期从新到旧排序
    const i = posts.findIndex((p) => p.slug === segments[1])
    if (i >= 0) {
      nextPost = i > 0 ? { title: posts[i - 1].title, url: posts[i - 1].url } : null
      prevPost =
        i < posts.length - 1
          ? { title: posts[i + 1].title, url: posts[i + 1].url }
          : null
    }
  }
  return {
    props: {
      source,
      frontmatter,
      recentPosts: getAllPosts().slice(0, 3),
      prevPost,
      nextPost,
    },
  }
}

export default function Page({
  source,
  frontmatter,
  recentPosts,
  prevPost,
  nextPost,
}) {
  const isPost = Boolean(frontmatter.date)
  return (
    <Layout title={frontmatter.title || null}>
      {isPost && <Toc />}
      {isPost && (
        <div className="not-wiki font-mono text-sm text-slate-500 dark:text-slate-400">
          {frontmatter.date}
          {frontmatter.category && (
            <>
              {' · '}
              <a href={`/categories/${encodeURIComponent(frontmatter.category)}/`}>
                {frontmatter.category}
              </a>
            </>
          )}
          {' · '}约 {frontmatter.readingMinutes} 分钟
        </div>
      )}
      {isPost && frontmatter.title && <h1>{frontmatter.title}</h1>}
      <MDXRemote
        {...source}
        components={{
          Profile,
          Exp,
          RecentPosts: () => <RecentPosts posts={recentPosts} />,
        }}
      />
      {isPost && (prevPost || nextPost) && (
        <div className="not-wiki mt-8 flex justify-between gap-4 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
          <div>{prevPost && <a href={prevPost.url}>← {prevPost.title}</a>}</div>
          <div className="text-right">
            {nextPost && <a href={nextPost.url}>{nextPost.title} →</a>}
          </div>
        </div>
      )}
      {isPost && <Comments />}
    </Layout>
  )
}
