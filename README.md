# My Wiki

复刻 [jyywiki.cn](https://jyywiki.cn/)（南京大学蒋炎岩老师的个人 Wiki）外观的个人网站模板。

技术栈与原站一致：**Next.js（Pages Router，静态导出）+ MDX（next-mdx-remote）+ Tailwind CSS（typography 插件，类名 `wiki`）+ KaTeX + highlight.js**。
样式为从原站编译产物中提取的自定义 CSS（见 `styles/globals.css`，原站内容以 CC BY-NC 4.0 发布）。

## 快速开始

```bash
npm install
npm run dev     # 开发：http://localhost:3000
npm run build   # 构建：纯静态站点输出到 out/
```

## 新增页面

`content/` 下的目录结构就是网站结构，放 markdown 文件即可：

| 文件 | URL |
|------|-----|
| `content/index.md` | `/` |
| `content/blog/index.md` | `/blog/` |
| `content/blog/my-post.md` | `/blog/my-post/` |
| `content/notes/os/index.md` | `/notes/os/` |

文件头部可写 frontmatter 设置页面标题：

```markdown
---
title: 文章标题
---
```

新文章写完后，记得在列表页（如 `content/blog/index.md`）手动加一条链接——jyywiki 也是这么维护课程列表的。

## Markdown 能力

- GFM（表格、删除线、任务列表）
- 数学公式：`$...$` 行内、`$$...$$` 块级（KaTeX）
- 代码块自动高亮（highlight.js）
- jyywiki 特色标签：`<red>红字</red>`、`<green>绿字</green>`、
  `<span className="box-blue">彩色框</span>`（box-gray/blue/green/violet）、
  `<div className="box slate-box">卡片盒子</div>`（slate/red/yellow/blue/purple-box）

注意：内容按 **MDX** 解析（和原站相同），比普通 markdown 严格——
内嵌 HTML 必须是合法 JSX（`<img />` 要自闭合，属性用 `className`），
正文里的花括号 `{}` 和小于号 `<` 需要转义或放进代码块。

## 站点配置

- 站名、导航栏链接、页脚（License/备案号）：改 `site.config.js`
- 页面骨架（顶栏/页脚 DOM）：`components/Layout.js`
- 样式：`styles/globals.css`（jyywiki 提取样式）+ `tailwind.config.js`（字体栈等）

## 部署

`npm run build` 后把 `out/` 目录扔到任意静态托管即可：

- **GitHub Pages**：推送仓库后用 Actions 部署 `out/`
- **Vercel**：导入仓库，零配置（它会自动识别 Next.js）
- **自己的服务器**：`out/` 拷到 nginx 站点目录

## 致谢

页面设计与样式来自 [jyywiki.cn](https://jyywiki.cn/)（蒋炎岩老师），
原站内容以 [CC BY-NC 4.0](http://creativecommons.org/licenses/by-nc/4.0/) 发布。
本模板仅供个人非商业用途，请保留出处说明。
