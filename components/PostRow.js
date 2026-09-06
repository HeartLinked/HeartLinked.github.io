// 文章列表的一行：日期（等宽灰字） + 标题链接 + 分类小标签。
// 博客列表、主页"最近文章"、分类页共用；分类页不显示标签（showCategory=false）
export default function PostRow({ post, showCategory = true }) {
  return (
    <li>
      <span className="not-wiki font-mono text-sm text-slate-500 dark:text-slate-400">
        {post.date}
      </span>{' '}
      <a href={post.url}>{post.title}</a>
      {showCategory && post.category && (
        <a className="post-tag" href={`/categories/${encodeURIComponent(post.category)}/`}>
          {post.category}
        </a>
      )}
    </li>
  )
}
