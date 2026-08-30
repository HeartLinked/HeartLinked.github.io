import config from '../site.config'

// simple-icons (CC0) 的 GitHub / 知乎图标 path；email 为 Material Design 信封图标
const ICONS = {
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  zhihu:
    'M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.171H9.384a58.104 58.104 0 01-.112 3.797h2.712c.388.023.393 1.251.393 1.266H9.183a9.223 9.223 0 01-.408 2.102l.757-.604c.452.456 1.512 1.712 1.906 2.177.473.681.063 2.081.063 2.081l-2.794-3.382c-.653 2.518-1.845 3.607-1.845 3.607-.523.468-1.58.82-2.64.516 2.218-1.73 3.44-3.917 3.667-6.497H4.491c0-.015.197-1.243.806-1.266h2.71c.024-.32.086-3.254.086-3.797H6.598c-.136.406-.158.447-.268.753-.594 1.095-1.603 1.122-1.907 1.155.906-1.821 1.416-3.6 1.591-4.064.425-1.124 1.671-1.125 1.671-1.125zM13.078 6h6.377v11.33h-2.573l-2.184 1.373-.401-1.373h-1.219zm1.313 1.219v8.86h.623l.263.937 1.455-.938h1.456v-8.86z',
  email:
    'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4.236l-8 4.882-8-4.882V6.618l8 4.882 8-4.882v1.618z',
}

function Chip({ href, icon, children }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/60 px-3 py-0.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100 hover:text-sky-600 dark:border-slate-500 dark:bg-slate-700/40 dark:text-slate-200"
    >
      {icon && (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0"
        >
          <path d={ICONS[icon]} />
        </svg>
      )}
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
          {links.github && (
            <Chip href={links.github} icon="github">
              GitHub
            </Chip>
          )}
          {links.email && (
            <Chip href={`mailto:${links.email}`} icon="email">
              Email
            </Chip>
          )}
          {links.zhihu && (
            <Chip href={links.zhihu} icon="zhihu">
              Zhihu
            </Chip>
          )}
        </div>
      </div>
    </div>
  )
}
