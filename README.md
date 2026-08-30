# HeartLinked's Wiki

复刻 [jyywiki.cn](https://jyywiki.cn/)（南京大学蒋炎岩老师的个人 Wiki）外观的个人网站。
线上地址：<https://heartlinked.github.io/>

技术栈与原站一致：**Next.js（Pages Router，静态导出）+ MDX（next-mdx-remote）+ Tailwind CSS（typography 插件，类名 `wiki`）+ KaTeX + highlight.js**。
样式为从原站编译产物中提取的自定义 CSS（见 `styles/globals.css`，原站内容以 CC BY-NC 4.0 发布）。

## 快速开始

```bash
npm install
npm run dev     # 开发：http://localhost:3000
npm run build   # 构建：生成 RSS + 纯静态站点输出到 out/
```

推送到 main 分支后 GitHub Actions 自动构建部署，约一分钟生效。

## 写文章

在 `content/blog/` 下新建 `xxx.md`，写好 frontmatter，**正文不要再写 `# 一级标题`**（标题由 frontmatter 渲染）：

```markdown
---
title: 文章标题
date: 2026-08-30
category: 系统
---

正文从这里开始……
```

放好文件即完成——文章列表（`/blog/`，按年份分组）、分类页（`/categories/`）、RSS（`/rss.xml`）都会在构建时自动生成，不需要手动维护任何列表。

普通页面（非文章）放在 `content/` 其他位置，不写 `date` 字段即可，例如 `content/index.md` 是主页。

## Markdown 能力

- GFM（表格、删除线、任务列表）；`$...$` / `$$...$$` 数学公式；代码块自动高亮
- 标题自动生成锚点，可用 `/blog/xxx/#标题文字` 直达
- 图片放 `public/`，正文里写 `![说明](/img/foo.png)`
- jyywiki 特色标签：`<red>红字</red>`、`<green>绿字</green>`、
  `<span className="box-blue">彩色框</span>`、`<div className="box slate-box">卡片</div>`
- 主页专用：`<Profile />` 渲染个人简介卡片（数据在 `site.config.js`）；
  `<RecentPosts />` 渲染最近 3 篇文章列表（构建时自动生成）

注意：内容按 **MDX** 解析（和原站相同），比普通 markdown 严格——
内嵌 HTML 必须是合法 JSX（`<img />` 自闭合、`className`），
正文里的 `{`、`<` 需要转义（`\{`、`\<`）或放进行内代码。

## 站点配置

- 站名、导航、个人信息（头像/简介/社交链接）、页脚、giscus：`site.config.js`
- 页面骨架：`components/Layout.js`；简介卡片：`components/Profile.js`
- 样式：`styles/globals.css`（jyywiki 提取样式）+ `tailwind.config.js`

## 评论区（giscus）

评论基于 GitHub Discussions。首次使用需要在
<https://github.com/apps/giscus> 给本仓库安装 giscus App（一次性操作），
之后每篇文章底部自动出现评论区，读者用 GitHub 账号登录即可评论。

## 致谢

页面设计与样式来自 [jyywiki.cn](https://jyywiki.cn/)（蒋炎岩老师），
原站内容以 [CC BY-NC 4.0](http://creativecommons.org/licenses/by-nc/4.0/) 发布。
本站仅供个人非商业用途。
