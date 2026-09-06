import Layout from '../../components/Layout'
import PostRow from '../../components/PostRow'
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
    <Layout title={`分类：${category}`} wikiClassName="wiki-jyy">
      <h1>分类：{category}</h1>
      <ul>
        {posts.map((p) => (
          <PostRow key={p.slug} post={p} showCategory={false} />
        ))}
      </ul>
      <p>
        <a href="/categories/">← 全部分类</a>
      </p>
    </Layout>
  )
}
