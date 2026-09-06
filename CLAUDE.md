# CLAUDE.md — 给 AI 助手的项目手册

个人博客 heartlinked.dev 的源码。Next.js（Pages Router，静态导出）+ MDX（next-mdx-remote）+ Tailwind typography（类名 `wiki`）。
外观复刻 jyywiki.cn，但字体已改为系统字体栈（见「排版规范」）。人类读者请先看 README.md；本文件记录约定与踩过的坑。

## 常用命令与注意事项

- 开发：用 Browser 面板的 `blog-dev` 配置（`.claude/launch.json`）启动，不要在 Bash 里裸跑 `npm run dev`。
- **dev server 运行时不要在仓库里直接 `npm run build`**：build 会覆盖 `.next/`，dev 页面立刻报客户端异常。要验证生产构建，把仓库 rsync 到 scratchpad（排除 node_modules/.next/out/.git，node_modules 用软链）再 build。
- `public/search-index.json` 是**被 git 跟踪的生成物**：文章标题/内容改动后运行 `node scripts/gen-search-index.js` 再提交。`public/rss.xml` 已 gitignore，构建时生成。
- 发布 = push `main`，GitHub Actions 自动构建部署（约 1 分钟）。上线后用 curl 抓线上页面核对（CDN 偶有 1–2 分钟缓存）。
- 生产构建会跳过 `draft: true` 的文章；dev 下仍可直接访问 URL 预览。已发布文章不要链接到仍是草稿的文章（会 404）。

## 内容结构

- 文章：`content/blog/<slug>.md`，frontmatter `title / date / category / draft`。正文**不写一级标题**（标题由 frontmatter 渲染）。
- 文章列表行（博客列表 / 主页最近文章 / 分类页）统一由 `components/PostRow.js` 渲染：等宽日期 + 标题链接 + 分类胶囊标签 `.post-tag`（小号等宽、圆角浅底，和标题拉开）。
- 图片：`public/img/`，用 `<img src="/img/x.png" alt="…" width="520" />` 控制大小（`.wiki img` 已块级居中、`height:auto`）；示意图 520px 左右合适，不要撑满正文列。
- 系列文章「AI 时代数据格式」：`columnar-storage-first-principles`（草稿）、`lance-file-format`（草稿）、`lance-table-format`（2026-09-06 上线）。

## MDX 语法约定

内容按 MDX 解析，内嵌 HTML 必须是合法 JSX：`className`、自闭合 `<img />`、`style` 必须是对象——**`<font style="…">` 这类字符串 style 会让 React 抛错**。正文里的 `{`、`<` 要转义或放进行内代码。

| 需求 | 写法 | 说明 |
| --- | --- | --- |
| 文字底色高亮 | `<mark>…</mark>` / `<mark color="cyan">` / `pink` / `green` | 黄 #FBF5CB（默认）、青 #CEF5F7、粉 #FBDFEF、绿 #E8F7CF，与语雀一致；暗色模式自动换半透明色 |
| 整段高亮块 | `<div className="box callout cyan-box">` 空行 正文 空行 `</div>` | `cyan-box`=语雀 color1，`mint-box`=color2；0.9em 字号 |
| 文字颜色 | `<red>` `<green>` `<blue>` | jyywiki 标签 |
| 插入式注释 | `> 引用` | 渲染为 0.9em 灰色细左线，无引号 |
| 卡片/彩色框 | `<div className="box slate-box">` 等 | 见 globals.css `.box` |
| 标题编号 | 手写 `## 1.` `### 2.1` `#### 2.1.1` | 目录组件收集 h2–h4 |

- 加粗紧贴引号会失效（`**"x"**` 渲染成字面 `**`），前面加标点或改用 `<mark>`。
- 代码块用裸 ``` 围栏（不要 ```plain）。列对齐的代码块里**中文只放行尾**，前面各列全 ASCII——中文在等宽字体里宽度不是 ASCII 的整数倍，夹在中间必歪。

## 从语雀搬文章（用户的主要写作流程）

用户在语雀写好后让助手搬到博客。要求：**忠于原文的结构、颜色、层次**，不要"改写"。

1. 读取：语雀私有文档 WebFetch 会 401。让用户在应用内 Browser 面板登录语雀，然后在页面里 `fetch('/{user}/{book}/{slug}/markdown?attachment=true&latexcode=false&anchor=false&linebreak=false')` 拿原始 markdown（`/api/docs/{slug}?book_id=…` 只返回 HTML）。不要点协作者邀请链接（`collaborator/join`），那是账号操作。
2. 图片在 cdn.nlark.com，直接 curl 到 `public/img/`，起有意义的文件名。纯文本截图（如字节偏移表）改写成代码块。
3. 映射：`<font style="background-color:#…">` → `<mark>`（按上表颜色）；`:::color1` / `:::color2` → callout 块；`>` 保持引用；**不要用加粗代替颜色**。
4. 列表：语雀里当小节标签用的 `+ 项` **保持为列表项，不要升级成标题**；其后的段落、代码、引用、子列表、高亮块缩进 2 格归入该项，子项自然成为 ○ 二级列表。语雀导出的 4 空格 `    - ` 在 CommonMark 里会变成代码块，必须重排。
5. 标题：h2/h3/h4 手动编号；标题文字宁短勿长（用户偏好如「2.1 L1：Manifest」）。
6. 笔误可以顺手修，但要在回复里逐条列出；不要补写原文没有的内容（原文断在哪里就发到哪里，并告知用户）。
7. 验证：dev 下截图（光/暗）核对 mark、高亮块、列表层次、代码块对齐；检查页面文本里没有泄漏的 `**`、`<mark`、`className`；scratchpad 生产构建通过；再提交。**push 前问用户**。

## 排版规范（styles/globals.css）

- 字体栈只在 `:root` 的 `--font-body / --font-heading / --font-mono` 定义，其余规则引用变量。**文章页**用系统 UI 字体（SF Pro+苹方 / Segoe UI+雅黑 / Noto Sans CJK）——技术文英文标识符太密，手写体像满篇斜体；**主页、博客列表、分类页**通过 `Layout` 的 `wikiClassName="wiki-jyy"` 切回 jyywiki 的 Kalam / Merienda One 手写体（这些页面英文零星，手写体是站点个性）。代码 Fira Mono，站名 Playfair Display。日期、副标题这类元信息用 Fira Mono（`.exp-time`、Profile 的 bio、文章 meta 行）。
- 改 `.wiki img` 之类的通用规则前先想到 Profile / Exp / school-logo 里的图片——2026-09-06 曾因 `.wiki img { margin:auto }` 把主页头像布局撑散；文章配图规则只作用于 `.wiki > img` 和 `.wiki > p > img`。
- 正文 16px 两端对齐、段首缩进 2em；**列表项左对齐**（两端对齐遇长代码串会撑出大空隙）。
- 首段**首字下沉**保留；首行强制大写已删（会把 `.lance` 变成 `.LANCE`）。首段避免以英文单词或「一」开头（下沉后拆词/变成横杠）。
- 引用块与高亮块 0.9em，与正文拉开层次。行内代码 Fira Mono 400 + 浅灰底。
- h4 17px 加粗、上间距 1.25rem；`h3 + h4` 上间距归零。
- 顶层列表 ● inside；子列表 ○ 缩进 2rem。松散列表项首段行内显示（否则 inside 项目符号会掉到单独一行）。
- 右侧目录 `components/Toc.js`：h2–h4，仅 ≥1280px 显示（正文列右缘约 1040px，再窄会压到正文）。用户很在意目录可见；若常在窄窗口看，可加"标题下方折叠目录"兜底。

## 用户偏好速记

- 判断标准是"不凌乱、有层次、和语雀原稿一致"，不是保留 jyywiki 的花活。
- 每次只改用户点名的东西；顺手的改动必须在回复里明确列出，用户会逐条核对。
- 上线前用户要看效果（dev 预览 + 截图）；push 是发布动作，需要用户明确说"push"。
