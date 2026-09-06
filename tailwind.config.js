const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    // 字体栈与 styles/globals.css 里的 --font-* 变量保持一致：
    // 正文/标题用各平台系统 UI 字体（中西文同源、字重匹配），代码用 Fira Mono
    fontFamily: {
      sans: [
        '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Helvetica Neue"', 'Arial',
        '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans CJK SC"',
        '"Noto Sans SC"', 'sans-serif',
      ],
      serif: ['"Playfair Display"', 'Georgia', '"Songti SC"', 'SimSun', 'serif'],
      mono: ['"Fira Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
    },
    extend: {
      maxWidth: { '8xl': '90rem' },
    },
  },
  plugins: [
    // jyywiki 的正文排版就是 typography 插件，类名从 prose 改成了 wiki
    require('@tailwindcss/typography')({ className: 'wiki' }),
    plugin(function ({ addVariant }) {
      addVariant(
        'supports-backdrop-blur',
        '@supports (backdrop-filter: blur(0)) or (-webkit-backdrop-filter: blur(0))'
      )
    }),
  ],
}
