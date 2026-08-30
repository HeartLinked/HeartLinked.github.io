import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import Layout from '../components/Layout'

// content/ 下的目录结构即网站结构：
//   content/index.md          -> /
//   content/blog/index.md     -> /blog/
//   content/blog/hello.md     -> /blog/hello/
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
      rehypePlugins: [rehypeKatex, rehypeHighlight],
    },
  })
  return { props: { source, frontmatter: data } }
}

export default function Page({ source, frontmatter }) {
  return (
    <Layout title={frontmatter.title || null}>
      <MDXRemote {...source} />
    </Layout>
  )
}
