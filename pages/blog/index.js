import Layout from '../../components/Layout'
import PostRow from '../../components/PostRow'
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
    <Layout title="博客" wikiClassName="wiki-jyy">
      <h1>博客</h1>
      {posts.length === 0 && <p>还没有文章。</p>}
      {pinned.length > 0 && (
        <section>
          <h2>置顶</h2>
          <ul>
            {pinned.map((p) => (
              <PostRow key={p.slug} post={p} />
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
                <PostRow key={p.slug} post={p} />
              ))}
          </ul>
        </section>
      ))}
    </Layout>
  )
}
