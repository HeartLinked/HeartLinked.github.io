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
  // frontmatter 需要可 JSON 序列化（YAML 日期会解析成 Date 对象）
  const frontmatter = {
    title: data.title || null,
    date: data.date
      ? data.date instanceof Date
        ? data.date.toISOString().slice(0, 10)
        : String(data.date)
      : null,
    category: data.category || null,
  }
  return { props: { source, frontmatter } }
}

export default function Page({ source, frontmatter }) {
  const isPost = Boolean(frontmatter.date)
  return (
    <Layout title={frontmatter.title || null}>
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
        </div>
      )}
      {isPost && frontmatter.title && <h1>{frontmatter.title}</h1>}
      <MDXRemote {...source} components={{ Profile }} />
      {isPost && <Comments />}
    </Layout>
  )
}
