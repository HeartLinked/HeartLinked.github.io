import { useEffect, useState } from 'react'

// 顶栏右侧的亮暗模式切换按钮。首选项存 localStorage.theme，
// 首屏由 _document.js 的内联脚本在渲染前设置 html.dark，避免闪烁
export default function ThemeToggle() {
  const [dark, setDark] = useState(null)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.theme = next ? 'dark' : 'light'
    } catch (e) {
      /* 隐私模式等场景下 localStorage 不可用，忽略 */
    }
    // 同步 highlight.js 亮暗主题（_document.js 中的两个 link）
    const light = document.getElementById('hljs-light')
    const darkCss = document.getElementById('hljs-dark')
    if (light && darkCss) {
      light.disabled = next
      darkCss.disabled = !next
    }
    // 同步 giscus 评论区主题
    document
      .querySelector('iframe.giscus-frame')
      ?.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: next ? 'dark' : 'light' } } },
        'https://giscus.app'
      )
    setDark(next)
  }

  return (
    <button
      type="button"
      aria-label={dark ? '切换到亮色模式' : '切换到暗色模式'}
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/70 dark:hover:text-slate-200"
    >
      {dark === null ? (
        <span className="h-5 w-5" />
      ) : dark ? (
        // 太阳（feather icons, MIT）
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // 月亮（feather icons, MIT）
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
