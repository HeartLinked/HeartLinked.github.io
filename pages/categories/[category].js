import Layout from '../../components/Layout'
import { getAllPosts, getAllCategories } from '../../lib/posts'

export async function getStaticPaths() {
  return {
    paths: getAllCategories().map((c) => ({ params: { category: c.name } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const posts = getAllPosts().filter((p) => p.category === params.category)
  return { props: { posts, category: params.category } }
}

// 单个分类下的文章列表
export default function CategoryPage({ posts, category }) {
  return (
    <Layout title={`分类：${category}`}>
      <h1>分类：{category}</h1>
      <ul>
        {posts.map((p) => (
          <li key={p.slug}>
            <span className="not-wiki font-mono text-sm text-slate-500 dark:text-slate-400">
              {p.date}
            </span>{' '}
            <a href={p.url}>{p.title}</a>
          </li>
        ))}
      </ul>
      <p>
        <a href="/categories/">← 全部分类</a>
      </p>
    </Layout>
  )
}
