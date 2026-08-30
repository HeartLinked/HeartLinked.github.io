// 主页"最近文章"列表，数据由 [[...index]].js 的 getStaticProps 在构建时注入
export default function RecentPosts({ posts }) {
  return (
    <ul>
      {posts.map((p) => (
        <li key={p.slug}>
          <span className="not-wiki font-mono text-sm text-slate-500 dark:text-slate-400">
            {p.date}
          </span>{' '}
          <a href={p.url}>{p.title}</a>
        </li>
      ))}
      <li>
        <a href="/blog/">全部文章 →</a>
      </li>
    </ul>
  )
}
