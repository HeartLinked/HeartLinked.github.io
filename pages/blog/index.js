import Layout from '../../components/Layout'
import { getAllPosts } from '../../lib/posts'

export async function getStaticProps() {
  return { props: { posts: getAllPosts() } }
}

// 自动生成的文章列表，按年份分组
export default function BlogIndex({ posts }) {
  const years = [...new Set(posts.map((p) => (p.date || '').slice(0, 4) || '未注明'))]
  return (
    <Layout title="博客">
      <h1>博客</h1>
      {posts.length === 0 && <p>还没有文章。</p>}
      {years.map((year) => (
        <section key={year}>
          <h2>{year}</h2>
          <ul>
            {posts
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
