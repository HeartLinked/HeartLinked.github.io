import { useEffect, useState } from 'react'

// 文章右侧悬浮目录：客户端渲染后收集正文 h2/h3（rehype-slug 已生成 id），
// 用 IntersectionObserver 高亮当前所在小节。standalone 样式见 globals.css 的 .toc
export default function Toc() {
  const [items, setItems] = useState([])
  const [active, setActive] = useState(null)

  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll('.wiki h2[id], .wiki h3[id]')
    )
    setItems(
      headings.map((h) => ({
        id: h.id,
        text: h.textContent,
        level: h.tagName === 'H3' ? 3 : 2,
      }))
    )
    if (headings.length < 2) return

    const visible = new Set()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id)
          else visible.delete(e.target.id)
        }
        // 取当前可见标题中最靠前的；都不可见时保持原高亮
        const first = headings.find((h) => visible.has(h.id))
        if (first) setActive(first.id)
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [])

  if (items.length < 2) return null

  return (
    <nav className="toc" aria-label="目录">
      <div className="toc-title">目录</div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={
            (item.level === 3 ? 'toc-h3' : '') +
            (item.id === active ? ' toc-active' : '')
          }
        >
          {item.text}
        </a>
      ))}
    </nav>
  )
}
