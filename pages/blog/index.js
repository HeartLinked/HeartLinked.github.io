import Layout from '../../components/Layout'
import { getAllPosts } from '../../lib/posts'

export async function getStaticProps() {
  // 置顶文章（frontmatter pinned: true）排到最前
  const posts = getAllPosts().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  return { props: { posts } }
}

// 自动生成的文章列表，按年份分组（置顶文章单独一组）
export default function BlogIndex({ posts }) {
  const pinned = posts.filter((p) => p.pinned)
  const normal = posts.filter((p) => !p.pinned)
  const years = [...new Set(normal.map((p) => (p.date || '').slice(0, 4) || '未注明'))]
  return (
    <Layout title="博客">
      <h1>博客</h1>
      {posts.length === 0 && <p>还没有文章。</p>}
      {pinned.length > 0 && (
        <section>
          <h2>置顶</h2>
          <ul>
            {pinned.map((p) => (
              <li key={p.slug}>
                <span className="not-wiki font-mono text-sm text-slate-500 dark:text-slate-400">
                  {p.date}
                </span>{' '}
                <a href={p.url}>{p.title}</a>{' '}
                <a
                  className="text-sm"
                  href={`/categories/${encodeURIComponent(p.category)}/`}
                >
                  #{p.category}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {years.map((year) => (
        <section key={year}>
          <h2>{year}</h2>
          <ul>
            {normal
              .filter((p) => ((p.date || '').slice(0, 4) || '未注明') === year)
              .map((p) => (
                <li key={p.slug}>
                  <span className="not-wiki font-mono text-sm text-slate-500 dark:text-slate-400">
                    {p.date}
                  </span>{' '}
                  <a href={p.url}>{p.title}</a>{' '}
                  <a
                    className="text-sm"
                    href={`/categories/${encodeURIComponent(p.category)}/`}
                  >
                    #{p.category}
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </Layout>
  )
}
