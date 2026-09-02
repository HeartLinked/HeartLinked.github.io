// 站点配置：改这里就能换名字/导航/页脚/个人信息
module.exports = {
  siteName: "HeartLinked's Wiki",
  siteUrl: 'https://heartlinked.dev',
  siteDescription:
    '李飞扬（Feiyang Li）的个人网站与博客：AI Data Infrastructure、数据系统与 AI 系统。',

  // 个人信息（主页 <Profile /> 组件和页脚使用）
  author: {
    name: 'Feiyang Li (HeartLinked)',
    bio: "PKU MSE '27 · AI Data Infrastructure",
    avatar: '/avatar.png',
    links: {
      github: 'https://github.com/HeartLinked',
      zhihu: 'https://www.zhihu.com/people/li-fei-yang-73-26',
      email: 'lifeiyang@zju.edu.cn',
      wechat: 'lfyhl0907',
    },
  },

  // 顶栏导航
  nav: [
    { title: '博客', href: '/blog/' },
    { title: '分类', href: '/categories/' },
    { title: '关于', href: '/' },
  ],

  footer: {
    license: {
      text: 'Creative Commons License: BY-NC 4.0',
      href: 'http://creativecommons.org/licenses/by-nc/4.0/',
    },
    // 有备案号就填，例如 { text: '苏 ICP 备 XXXXXXXX 号', href: 'https://beian.miit.gov.cn/' }
    icp: null,
  },

  // giscus 评论区（基于 GitHub Discussions）
  // 首次使用需在 https://github.com/apps/giscus 给仓库安装 giscus App
  giscus: {
    repo: 'HeartLinked/HeartLinked.github.io',
    repoId: 'R_kgDOUI7adg',
    category: 'Announcements',
    categoryId: 'DIC_kwDOUI7ads4DEhWf',
  },
}
