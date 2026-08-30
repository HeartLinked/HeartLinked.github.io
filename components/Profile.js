import config from '../site.config'

function Chip({ href, children }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="inline-block rounded-full border border-slate-300 bg-white/60 px-3 py-0.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100 hover:text-sky-600 dark:border-slate-500 dark:bg-slate-700/40 dark:text-slate-200"
    >
      {children}
    </a>
  )
}

// 主页个人简介卡片，在 markdown 里写 <Profile /> 使用
export default function Profile() {
  const { name, bio, avatar, links } = config.author
  return (
    <div className="not-wiki mb-4 mt-2 flex items-center gap-6">
      <img
        src={avatar}
        alt={name}
        className="h-24 w-24 shrink-0 rounded-full border border-slate-200 shadow-md"
      />
      <div>
        <div className="text-2xl font-bold">{name}</div>
        <div className="mt-1 text-slate-600 dark:text-slate-300">{bio}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {links.github && <Chip href={links.github}>GitHub</Chip>}
          {links.zhihu && <Chip href={links.zhihu}>知乎</Chip>}
          {links.email && <Chip href={`mailto:${links.email}`}>Email</Chip>}
          <Chip href="/rss.xml">RSS</Chip>
        </div>
      </div>
    </div>
  )
}
