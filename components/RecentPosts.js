import PostRow from './PostRow'

// 主页"最近文章"列表，数据由 [[...index]].js 的 getStaticProps 在构建时注入
export default function RecentPosts({ posts }) {
  return (
    <ul>
      {posts.map((p) => (
        <PostRow key={p.slug} post={p} />
      ))}
      <li>
        <a href="/blog/">全部文章 →</a>
      </li>
    </ul>
  )
}
