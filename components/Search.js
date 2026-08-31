import { useEffect, useRef, useState } from 'react'

// 顶栏全站搜索：点击放大镜或按 Cmd/Ctrl+K 打开弹层，
// 索引来自构建时生成的 /search-index.json（scripts/gen-search-index.js）
export default function Search() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    if (!index) {
      fetch('/search-index.json')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
        .then(setIndex)
    }
  }, [open, index])

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const results =
    terms.length === 0 || !index
      ? []
      : index
          .map((p) => {
            const title = p.title.toLowerCase()
            const text = p.text.toLowerCase()
            if (!terms.every((t) => title.includes(t) || text.includes(t)))
              return null
            const score = terms.reduce(
              (s, t) => s + (title.includes(t) ? 10 : 0) + (text.includes(t) ? 1 : 0),
              0
            )
            // 取第一个命中词附近的片段做摘要
            const hit = terms.map((t) => p.text.toLowerCase().indexOf(t)).find((i) => i >= 0)
            const from = Math.max(0, (hit ?? 0) - 30)
            const snippet =
              (from > 0 ? '…' : '') + p.text.slice(from, from + 90) + '…'
            return { ...p, score, snippet }
          })
          .filter(Boolean)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)

  return (
    <>
      <button
        type="button"
        aria-label="搜索（Cmd+K）"
        title="搜索（Cmd+K）"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/70 dark:hover:text-slate-200"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-5 w-5"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="not-wiki mx-auto max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索文章…"
              className="w-full border-b border-slate-200 bg-transparent px-4 py-3 text-base text-slate-800 outline-none placeholder:text-slate-400 dark:border-slate-700 dark:text-slate-100"
            />
            <div className="max-h-[50vh] overflow-y-auto">
              {terms.length > 0 && results.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {index ? '没有匹配的文章' : '加载索引中…'}
                </div>
              )}
              {results.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  className="block border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/40"
                >
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {r.title}
                    <span className="ml-2 font-mono text-xs text-slate-400">
                      {r.date} · {r.category}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {r.snippet}
                  </div>
                </a>
              ))}
              {terms.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                  输入关键词搜索全站文章，Esc 关闭
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
