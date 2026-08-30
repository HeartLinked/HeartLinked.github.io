const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    // 与 jyywiki.cn 相同的字体栈
    fontFamily: {
      sans: ['Merienda One', 'Arial', 'Helvetica', 'Sans'],
      serif: ['Kalam', 'Sans Serif', 'Sans'],
      mono: ['Fira Mono'],
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
