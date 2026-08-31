import Head from 'next/head'
import { useRouter } from 'next/router'
import config from '../site.config'
import ThemeToggle from './ThemeToggle'

// 页面骨架：DOM 结构与类名与 jyywiki.cn 逐一对应
// （顶部毛玻璃 sticky 导航栏 + .wiki 正文区 + 页脚）
// 区别于原版：导航栏在小屏幕也显示
export default function Layout({ title, children }) {
  const { asPath } = useRouter()
  // 当前页导航高亮："关于" 仅精确匹配首页，其余按路径前缀匹配
  const isActive = (href) =>
    href === '/' ? asPath === '/' : asPath.startsWith(href.replace(/\/$/, ''))
  return (
    <div className="bg-slate-300/10 dark:bg-slate-900">
      <Head>
        <title>
          {title && title !== config.siteName
            ? `${title} - ${config.siteName}`
            : config.siteName}
        </title>
      </Head>
      <div className="sticky top-0 z-40 w-full backdrop-blur flex-none border-b border-slate-900/10 bg-white/75 supports-backdrop-blur:bg-white/60 dark:border-slate-50/[0.06] dark:bg-slate-900/75">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="py-4">
            <div className="relative flex items-center">
              <a href="/" className="site-title">
                {config.siteName}
              </a>
              <div className="relative flex flex-1 items-center ml-4 pl-4 border-l dark:border-slate-50/[0.12]">
                <nav className="text-sm leading-6 font-semibold text-slate-700 dark:text-slate-200">
                  <ul className="flex flex-wrap space-x-4 lg:space-x-8">
                    {config.nav.map((item) => (
                      <li key={item.href}>
                        <a
                          className={
                            isActive(item.href)
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'hover:text-sky-500 dark:hover:text-sky-400'
                          }
                          href={item.href}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-5xl flex flex-col min-h-screen px-4">
        <div className="wiki bg-neutral-200/10 dark:bg-slate-800/50">{children}</div>
      </div>
      <div className="bg-neutral-100 text-center text-neutral-600 dark:bg-neutral-600 dark:text-neutral-200 lg:text-left">
        <div className="bg-neutral-200 p-6 text-center dark:bg-neutral-700">
          <a rel="license" href={config.footer.license.href}>
            {config.footer.license.text}
          </a>
          {config.footer.icp && (
            <>
              <br />
              <a href={config.footer.icp.href}>{config.footer.icp.text}</a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
