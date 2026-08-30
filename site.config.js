// 站点配置：改这里就能换名字/导航/页脚
module.exports = {
  siteName: "HeartLinked's Wiki",
  // 顶栏右侧导航（大屏幕才显示，和 jyywiki 一致）
  nav: [
    { title: '博客', href: '/blog/' },
  ],
  footer: {
    license: {
      text: 'Creative Commons License: BY-NC 4.0',
      href: 'http://creativecommons.org/licenses/by-nc/4.0/',
    },
    // 有备案号就填，例如 { text: '苏 ICP 备 XXXXXXXX 号', href: 'https://beian.miit.gov.cn/' }
    icp: null,
  },
}
