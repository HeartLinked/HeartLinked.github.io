import { useEffect, useRef } from 'react'
import config from '../site.config'

// giscus 评论区（GitHub Discussions）。仅在 site.config.js 配置了 giscus 时渲染。
export default function Comments() {
  const ref = useRef(null)

  useEffect(() => {
    const g = config.giscus
    if (!g?.repo || !ref.current || ref.current.hasChildNodes()) return
    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    const attrs = {
      'data-repo': g.repo,
      'data-repo-id': g.repoId,
      'data-category': g.category,
      'data-category-id': g.categoryId,
      'data-mapping': 'pathname',
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'bottom',
      'data-theme': 'preferred_color_scheme',
      'data-lang': 'zh-CN',
    }
    for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v)
    ref.current.appendChild(script)
  }, [])

  if (!config.giscus?.repo) return null
  return <div ref={ref} className="not-wiki mt-10" />
}
