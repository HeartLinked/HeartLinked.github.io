import Layout from '../../components/Layout'
import { getAllCategories } from '../../lib/posts'

export async function getStaticProps() {
  return { props: { categories: getAllCategories() } }
}

// 全部分类及文章数
export default function Categories({ categories }) {
  return (
    <Layout title="分类">
      <h1>分类</h1>
      {categories.length === 0 && <p>还没有分类。</p>}
      <ul>
        {categories.map((c) => (
          <li key={c.name}>
            <a href={`/categories/${encodeURIComponent(c.name)}/`}>{c.name}</a>{' '}
            ({c.count})
          </li>
        ))}
      </ul>
    </Layout>
  )
}
