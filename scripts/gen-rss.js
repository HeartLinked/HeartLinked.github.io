// 构建前生成 public/rss.xml（package.json 的 build 脚本会先跑这个）
const fs = require('fs')
const path = require('path')
const { getAllPosts } = require('../lib/posts')
const config = require('../site.config')

const posts = getAllPosts().slice(0, 20)

const items = posts
  .map(
    (p) => `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${config.siteUrl}${p.url}</link>
      <guid>${config.siteUrl}${p.url}</guid>${
        p.date ? `\n      <pubDate>${new Date(p.date).toUTCString()}</pubDate>` : ''
      }
      <category><![CDATA[${p.category}]]></category>
    </item>`
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[${config.siteName}]]></title>
    <link>${config.siteUrl}</link>
    <description><![CDATA[${config.author.bio}]]></description>
    <language>zh-cn</language>
${items}
  </channel>
</rss>
`

fs.writeFileSync(path.join(process.cwd(), 'public', 'rss.xml'), xml)
console.log(`rss.xml generated with ${posts.length} posts`)
