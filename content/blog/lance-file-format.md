---
title: Lance File Format 详解：为 AI 时代重新设计的列存格式
date: 2026-08-31
category: Training Data Infra
draft: true
---

如果你做过向量检索或者多模态模型训练，大概率遇到过这样的场景：ANN 索引召回了一批行号，要按行号去列存文件里取回原始数据；或者 DataLoader 要对一个混着标量特征、3KB embedding、几百 KB 图片的数据集做 shuffle。这时候你会发现，陪伴了数据工程十年的 Parquet 突然不好用了——它是为"从头到尾扫一遍"设计的，而你需要的是"随机取几行"。

[Lance](https://github.com/lance-format/lance) 就是为这个缺口设计的格式：**一个把随机访问（random access）当作一等公民、同时不牺牲扫描性能的开源列存格式**。官方 benchmark 中，Lance 的点查吞吐比 Parquet 高出两到三个数量级；而在扫描场景下，它与 Parquet 相当甚至更快。

本文试图把 Lance file format 讲清楚：它的文件长什么样、编码体系如何围绕"点查只花 1～2 次 IO"这个目标展开、它为此付出了什么代价，以及它和 Parquet 到底应该怎么选。文章结构上参考了 mwish 的[源码分析文章](https://blog.mwish.me/2025/04/16/Lance-file-format/)、Lance 的[官方论文](https://arxiv.org/abs/2504.15247)与 [lance.org 规范](https://lance.org/format/)，并更新到 2.1 stable 之后的状态。

## 1. 全景：Lance 不只是一个文件格式
打点
在钻进文件内部之前，先花一节把 Lance 的定位讲清楚，因为"Lance"这个词实际上指一整个格式栈（官方现在称之为 multimodal lakehouse format），自底向上包括：

- **File Format**（`.lance` 文件）：单个数据文件怎么摆放、怎么编码——**本文的主角**；
- **Table Format**：如何把一堆文件组织成一张有版本的表。核心概念包括 fragment（行的分组单位）、data file（一个 fragment 可以有多个数据文件，各自持有列的子集）、deletion file（删除标记）、manifest（快照与 ACID 提交）、stable row id；
- **Index Format**：向量索引（IVF、HNSW）、全文索引、标量索引（BTree、Bitmap、LabelList、NGram）都是表上的一等公民；
- **Catalog / Namespace 规范**：directory catalog（零依赖，直接扔对象存储上）与 REST catalog。

Table 层有两个特性值得单独点一下。一是 **schema evolution**：因为一个 fragment 的不同列可以放在不同的 data file 里（官方称"二维组织"），加列和回填是纯元数据操作，不需要重写已有数据——这对反复做特征工程的场景非常友好。二是**版本管理**：manifest 机制提供了类似 git 的 time travel，可以回溯任意历史版本做数据实验。这些展开讲又是一篇文章，本文按下不表，**下文中"Lance"均指 file format**。

一点历史：Lance 有 V1 和 V2 两代文件格式。V1 是早期版本，虽然对外主打点查，但当时几乎没有编码体系，点查性能名不副实；2024 年团队用 V2 彻底重写了容器结构（下文第 3 节），2025 年又在 V2 容器内引入了完整的**结构编码**体系（下文第 4 节），并于 2025 年 10 月宣布 **Lance File 2.1 stable**——这也是本文描述的版本。2.2 / 2.3 的增量演进见第 8 节。另外，代码仓库已从 lancedb/lance 迁移到独立的 [lance-format](https://github.com/lance-format/lance) 组织，规范文档在 [lance.org](https://lance.org/format/)；LanceDB 则是构建在 Lance 之上的向量数据库 / 检索产品。

## 2. 预备知识：读懂 Lance 需要的四个概念

> 熟悉列存与 Parquet 的读者可以直接跳到第 3 节。

**列存为什么点查难。** 列存把同一列的值连续存放，扫描和压缩都受益于此；但一行数据因此散落在文件各处，点查一行意味着每一列都要独立定位一次。更麻烦的是，主流编码往往是"不解开一片就拿不到一个值"的——想取第 1000 行的一个 8 字节整数，可能要解压整个数据页。点查的真实成本 = 每列的 IO 次数 × 每次 IO 的读放大 × 解码开销。

**Parquet 的结构。** 一个 Parquet 文件按 row group（一组行，通常几十万行）→ column chunk（row group 内的一列）→ page（压缩单元，默认 1MB 级）三级组织，元数据集中在 footer。嵌套类型用 Google Dremel 论文的 repetition / definition levels 压平：definition level 表达"null 出现在哪一层"，repetition level 表达"list 从哪一层重新开始"。记住这两个词，Lance 把它们继承了下来，但存放方式完全不同。

**Transparent vs opaque 压缩。** 这是 Lance 论文里的核心概念，也是理解后文一切编码选择的钥匙：

- **transparent（透明）压缩**：压缩后仍能定位并解出单个值，如 bitpacking（去掉用不到的高位 bit）、FSST（字符串子串替换）、字典编码；
- **opaque（不透明）压缩**：必须解压一整块才能取值，如 delta 编码、LZ4/Zstd 这类通用块压缩。

Parquet 对两者不做区分，一律以页为解压单元，这正是它点查慢的深层原因之一。Lance 的编码规则很大程度上就是在回答一个问题：**哪里可以用 opaque 换压缩率，哪里必须 transparent 保点查**。

**IOPS 视角。** 现代 NVMe SSD 能提供近百万级的 4KB 随机 IOPS（论文实验用的 Samsung 970 EVO Plus 标称 850K IOPS、3.4GB/s），对象存储的单请求延迟则在毫秒级但并发可以拉满。两种介质给出同一个结论：点查性能的第一性原理是**每取一个值需要几次 IO、每次 IO 读多少字节**。下文你会看到，Lance 的所有设计都在把这个数字往"1～2 次、正好一块"上压。

## 3. Lance 文件的基础结构设计

### 3.1 五段式布局

一个 `.lance` 文件从头到尾分为五个区域：

```
+--------------------------------------------------+
|  Data Pages                                      |
|    各列的数据页；一个 page 由多个 data buffer 组成  |
|    页可以乱序交错，无需同列连续                     |
+--------------------------------------------------+
|  Column Metadatas                                |
|    每列一段独立的 protobuf 元数据                  |
+--------------------------------------------------+
|  Column Metadata Offset Table                    |
|    每列元数据的 (offset, size)                    |
+--------------------------------------------------+
|  Global Buffers Offset Table                     |
|    全局 buffer 表；第一个必是文件 schema           |
+--------------------------------------------------+
|  Footer (40 bytes)                               |
+--------------------------------------------------+
```

逐段解释：

- **Data Pages**：列数据的主体。一个 page 由多个 data buffer 组成（比如变长字符串的 offsets buffer 和 values buffer），buffer 可按 64B 对齐以支持 direct I/O。官方推荐每个 page 不小于 **8MB**——页大小面向 IO 效率设计，而不是面向行数。最特别的一点：**page 允许乱序出现在文件里**，A 列的第 2 页可以夹在 B 列的第 1、2 页之间，这是"各列独立分页"的自然结果。
- **Column Metadata**：每列一段自包含的 protobuf，记录该列所有 page 的位置（buffer 的 offset/size 列表）、行范围（start_row 与行数）和编码信息。注意"每列独立"这个性质：读一列只需解析一列的元数据，不用像 Parquet 那样解析整个 footer 里的 thrift 大对象。
- **Column Metadata Offset Table / Global Buffers Offset Table**：前者索引各列元数据的位置；后者指向文件级的全局 buffer——第一个 global buffer 固定是 protobuf 编码的文件 schema，此外还可以放多列共享的字典等（下文会再遇到它）。
- **Footer**：固定 **40 字节**，小端序，是整个文件的入口：

```
<u64>  Column Metadata 区起始 offset
<u64>  Column Metadata Offset Table 起始 offset
<u64>  Global Buffers Offset Table 起始 offset
<u32>  global buffer 数量
<u32>  列数
<u16>  major version
<u16>  minor version
<4B>   magic: "LANC"
```

### 3.2 设计决策一：没有 row group，只有 page

这是 Lance 容器层最重要、也最"反 Parquet 直觉"的决策，官方博客的原话点得很准：当表里有一个很宽的列时，**不存在一个正确的 row group 行数**。

想象一张表：一列是 8 字节的 int64，一列是 3KB 的 embedding，一列是 100KB 的图片。row group 设 1 万行，图片列的 column chunk 就有 1GB，写入端要么内存爆炸要么被迫提前切断；设 1000 行，int64 列的 column chunk 只有 8KB，扫描退化成小碎 IO，元数据也随 row group 数量成倍膨胀。行数这个旋钮，对窄列和宽列永远拧不到同一个位置——这是所有用 Parquet 存过多模态数据的人都踩过的坑。

Lance 的解法是干脆取消这个旋钮：**没有 row group，每列按自己的节奏切 page**。int64 列可能 100 万行才攒满一个 8MB 页，图片列 80 行就切一页，互不干扰；页在文件里乱序落盘，靠 column metadata 拼回逻辑顺序。

代价也要诚实地说。其一，写入端需要为每列各自缓冲 8～32MB 才 flush，宽表的写入内存占用比小 row group 的 Parquet 高——本质上相当于"整个文件是一个 row group"。其二，Parquet 的 row group 顺便充当了并行读取的天然切分单位，Lance 取消它之后，并行度改由读取端按行范围自由切分（官方有一篇 *Parallelism without row groups* 专门讲这件事），灵活性更高，但读取器实现也更复杂。

### 3.3 设计决策二：元数据与数据彻底解耦

Parquet 有一个隐蔽的限制：编码只能决定 data page 里放什么，无法触碰列级或文件级元数据。最典型的受害者是字典编码——字典明明在整列范围内不变，却被迫在每个 row group 里重复存一份。

Lance 把这个限制从根上拆掉了。它的 buffer 是一个统一抽象，编码可以自由声明一个 buffer 放在哪一层，`encodings.proto` 里的定义非常直白：

```protobuf
// A pointer to a buffer in a Lance file
message Buffer {
    // 该 buffer 在所属集合中的下标
    uint32 buffer_index = 1;
    enum BufferType {
      page = 0;      // 放在 data page 里
      column = 1;    // 放在 column metadata 里
      file = 2;      // 放在文件级 global buffer 里
    };
    BufferType buffer_type = 2;
}
```

于是：整列共享的字典可以直接放进 column metadata；多列共享的字典可以抽到 global buffer；RLE 列的 skip table、zone map 统计（min/max/null_count）也能挂在元数据上，用略大的元数据换点查时的快速定位。**元数据不再只是"描述数据的数据"，而是编码器可以主动利用的一块存储位置**——这是 Lance 编码体系灵活性的地基。

## 4. Column Encoding：为随机访问设计的编码体系

这是 Lance 2.1 最有原创性的部分，也是那篇 SIGMOD 论文（arXiv 2504.15247）的主体。mwish 写作时（2025 年 4 月）这套体系刚成形，当时文中描述的 `FullZipLayout` / `MiniBlockLayout` / `prefers_miniblock` 如今已经正式化为 2.1 规范的核心，本节按稳定后的口径来讲。

### 4.1 两阶段框架

Lance 把编码拆成两个正交的阶段：

1. **结构编码（structural encoding）**：把（可能嵌套的）数组压平成叶子列，并决定 rep/def levels、offsets、值这些 buffer 在 page 内如何排布——它决定"取一个值要几次 IO"；
2. **压缩编码（compressive encoding）**：对每个叶子 buffer 应用具体压缩算法——它决定压缩率和解码 CPU。

嵌套结构的压平沿用 Dremel 思路：只存**叶子列**，struct 的各层 null 折叠进 definition levels，list 的边界折叠进 repetition levels。与 Parquet 不同的是这些 levels 的存放方式——Parquet 把它们作为独立段落存在 page 里，点查时必须顺序解析才能定位值；Lance 则把它们编进下面两种页布局，让定位变成算术运算。

结构编码只有两种主力布局，按值的宽度二选一。这个"二元自适应"正是论文标题里 *Adaptive Structural Encodings* 的含义。

### 4.2 Mini-Block Layout：小值的选择

适用于窄类型（int、float、短字符串等）。核心思想一句话：**既然值很小，不如接受一点读放大，把一小片行打包成块，点查整块读回**。

- 数据被切成约 **4KiB** 的 chunk（压缩后），每 chunk 最多 4096 个值；
- 每个 chunk 内打包了三段：repetition levels、definition levels、值——所以**取任意一个值、无论嵌套多深，都只需 1 次 IO**（读回所在 chunk）；
- 因为反正要整块读回解码，chunk 内部允许 **opaque 压缩**（delta、整块 LZ4/Zstd 都行），压缩率不受点查需求的拖累；
- chunk 的元数据极小（每块只记录压缩后大小和值数量，12bit + 4bit 量级），列表类型再加一个可选的 repetition index 用于"行号 → chunk"的翻译。

论文里给出的账很直观：支撑十亿行点查所需的常驻"查找缓存"，mini-block 方案最坏约 **1.3GB**，而 Parquet 若想靠缩小页 + 页索引达到类似的定位精度，同样规模需要约 **20GB** 的页索引缓存——在大值列上完全不可行。

权衡：点查一个 8 字节的值要读回 4KB，是 512 倍的读放大。但在"每次 IO 至少 4KB"的现代硬件上，这个放大是免费的——这正是"小值"的定义：**小到读放大不构成成本**。

### 4.3 Full-Zip Layout：大值的选择

适用于宽类型：embedding 向量、图片 bytes、长文本等（阈值在 128～256B 量级，写入器按值宽自动选择）。大值不能再整块打包了——4KB 的块塞不下一个 3KB 的向量，读放大也不再免费。核心思想反过来：**把每一行自己"拉链"成自包含的一段，用一个行级索引直达**。

- 每行的数据由三部分**按行主序 zip 在一起**：控制字（rep/def levels 位打包，通常 1 字节）＋ 长度（变宽类型）＋ 值本身；
- 另存一个 **repetition index**：每行一个 u64，记录该行在数据 buffer 里的字节偏移；
- 点查路径：变宽类型 2 次 IO（查 repetition index → 读值），定宽类型偏移可以直接算出来，1 次 IO；
- 约束：值只能用 **transparent 压缩**（FSST、bitpacking、逐值 LZ4），不允许 delta 或整块通用压缩——否则"直达一行"就失效了。

代价是本节最"极端"的设计：**为了点查，null 也占满空间**。一个 null 的 3KB 定宽向量，磁盘上真实躺着 3KB——因为只有这样，第 N 行的位置才是可计算的。这是"为随机访问预留空间"哲学的极致体现，也是 Lance 与 Parquet（只存非 null 值）压缩率差距的主要来源。稀疏 null 场景的补救方案要等到 2.3 的 sparse layout（见第 8 节）。

除了这两种主力，还有几个配角布局：**Constant**（整页全常量或全 null，直接把值内联进元数据）、**Packed Struct**（struct 多字段行存打包，论文实测 5 字段整行点查提速 2 倍，代价是单字段扫描线性变慢——这就是 mwish 文中提到的 Zipped 行存方案，注意它不支持 RLE 这类编码，本质是行存结构）、**Blob**（1MiB 以上大对象，见第 7 节）。

### 4.4 压缩编码清单

结构定了之后，叶子 buffer 上可以叠的压缩编码如下（兼容性以 [lance.org 规范](https://lance.org/format/file/encoding/)为准）：

| 编码 | 透明？ | Mini-Block | Full-Zip | 说明 |
|------|--------|-----------|----------|------|
| Flat / Variable | ✅ | ✅ | ✅ | 定宽 / 变宽原样存储 |
| Bitpacking | ✅ | ✅ | ✅ | 去掉用不到的高位 bit，1024 值一组 |
| FSST | ✅ | ✅ | ✅ | 字符串子串表压缩，解压极快 |
| Dictionary | ✅ | ✅ | — | 满足条件自动触发，字典放元数据 |
| RLE | 部分 | ✅ | ❌ | 游程编码，run 比例低于阈值时启用 |
| BSS | — | ✅ | ❌ | byte stream split，浮点友好 |
| LZ4 / Zstd | ❌ opaque | ✅ 整块 | 仅逐值 | 通用压缩 |

可以看到规则和第 2 节的概念完全对得上：mini-block 里百无禁忌（整块解码，opaque 无妨），full-zip 里只允许 transparent。用户可以通过列级配置干预：

```
lance-encoding:compression           # lz4 / zstd / none
lance-encoding:compression-level
lance-encoding:rle-threshold         # 默认 0.5
lance-encoding:bss                   # off / on / auto
lance-encoding:packed                # struct 行存打包
lance-encoding:structural-encoding   # miniblock / fullzip
```

### 4.5 一个例子：`List<String>` 的点查

用一个具体类型把本节串起来。`List<String>` 在 Arrow 内存格式里需要 list offsets、list validity、string offsets、string validity、string values 五组 buffer——如果照搬到磁盘（Lance 2.0 早期就是这么干的），点查一行最坏要 **5 次串行 IO**：每层 offsets 都要先读回来才知道下一层去哪。

Lance 2.1 的处理：两层 validity 压进 definition levels，list 边界压进 repetition levels，string offsets 转成长度。若元素较短、整体走 mini-block，rep/def/长度/值都在同一个 chunk 里——**1 次 IO**；若元素很长、走 full-zip，rep/def 进控制字、和长度值 zip 在一起，repetition index 直达行首——**2 次 IO**。论文实测这类 string-list 负载上 2.1 的点查吞吐是 2.0（Arrow 式布局）的 **3.3 倍**。

多层嵌套同理：`List<List<int32>>` 压平后只有一个叶子列加两层 levels，处理列数量与嵌套深度解耦，与 ORC 式"每层一列"的方案形成对比，实现了 mwish 文中提到的 O(1) lookup。

## 5. 与 Parquet 的对比：设计哲学与实测数字

把前两节的线索收拢，Lance 与 Parquet 的差异可以浓缩成一张表：

| 维度 | Parquet | Lance 2.1 |
|------|---------|-----------|
| 行组织 | row group（固定行数） | 无 row group，各列独立分页 |
| 页大小 | ~1MB，面向压缩 | ≥8MB，面向 IO |
| 元数据 | footer 集中，thrift | 按列独立 protobuf，编码可利用 |
| 嵌套类型 | rep/def levels，页内顺序解析 | rep/def levels，编进结构布局可直达 |
| null | 只存非 null 值 | 点查路径上 null 占位 |
| 压缩 | 页级，不分透明/不透明 | 按布局区分 transparent / opaque |
| 点查 | 页为最小解码单元，多级定位 | 1～2 次 IO 直达 |

**点查性能**：LanceDB 早期的 benchmark（1 亿行 × 1KB 字符串，每查询随机取 20～50 行）实测约 **2000 倍**于 Parquet。论文给出了更严谨的口径：Parquet 默认配置点查约 5.5K rows/s；把 row group 调小、开页索引深度调优后能到 350K rows/s（60 倍），但代价是元数据爆炸和扫描性能受损，且对大值列（页索引缓存 20GB/十亿行）根本不可行。Lance 不需要在这道题里做选择——这是"结构性优势"和"参数调优"的区别。

**扫描性能**：论文的归一化对比中，Lance 在 embeddings、images 等大值负载上约为 Parquet 的 1.8～1.9 倍（大页 + 更好的 IO 调度，更接近盘的带宽上限），文本类负载 1.3～1.4 倍，个别负载（如日期列）打平或略逊。

**压缩率**：两者总体相当（典型负载 3～8 倍），但结构性差异真实存在：Parquet 只存非 null 值、编码不受"透明性"约束，在高 null 比例或 delta 友好的列上更省；Lance 的 null 占位和 full-zip 的 transparent 约束是拿空间换 IO 的明账。

**Parquet 仍然赢的地方**要写清楚，避免本文变成软文：纯批式 OLAP 扫描加高压缩归档的场景，Parquet 依旧是正确答案；它的生态（Spark / Trino / Iceberg / 一切）无人能敌；格式规范久经考验、实现遍地。结论不是替代，而是 **workload 分工**：扫描密集、点查罕见 → Parquet；点查/shuffle/多模态 → Lance。值得一提的是，"后 Parquet 时代"已是行业共识——Meta 的 Nimble、Vortex、BtrBlocks 都在重做文件格式，Lance 的差异化在于把随机访问和多模态做到了最彻底。

## 6. IO 调度与读写流程

格式设计只回答了"数据在哪"，真正把 IOPS 打满还需要运行时配合。Lance 的 Rust 读取器（`rust/lance-file/src/v2`）在这块下了不少功夫，官方有一个 *Columnar File Readers in Depth* 系列博客专门展开，这里给出骨架。

**两层 IO 调度**。全局层是 `EncodingsIo`（实现为 `FileScheduler`）：所有读请求先进队列，做类似 Linux IO 调度器的**请求合并（coalescing）与优先级排序**，相邻的小请求合并成大请求提交。文件层由 `SchedulerDecoderConfig` 配置，`DecodeBatchScheduler` 持有每列的 `FieldScheduler`（IO 调度的基本单元，各自负责 List、String 等类型的取数计划）。

**调度与解码分离**。这是读取器架构的关键决策（官方博客 *Splitting scheduling from decoding*）：scheduler 只负责"算出要读哪些字节范围、按什么优先级"，产出 `DecodeMessage` 投进一个 mpmc 队列；decoder 在消费端异步地把读回的 buffer 解成 Arrow batch。两者解耦带来两个好处：IO 可以大胆地乱序、合并、预取，而交付顺序由优先级保证；队列天然形成 **backpressure**，读得快解得慢时不会内存失控。

回头看第 3 节就能理解为什么页要 8MB、buffer 位置要灵活——**格式层的"buffer 摆放自由"和运行时的"IO 合并"是一对组合拳**，前者让相关数据可以物理相邻，后者把相邻请求真正合成大 IO。

**写入流程**：每列一个 encoder 独立攒数据，攒到 8～32MB 产出一个 page 并异步提交写任务（所以列与列的页才会乱序交错）；全部数据写完后，依次落 column metadata → 两张 offset table → footer。

**读取（打开文件）流程**：

1. 读文件尾部一个 block（默认 4KB，footer 只占最后 40B，多读的部分经常顺手把 offset table 也带回来了）；
2. 解析 footer，规划需要的元数据：global buffer offset table（拿 schema）、按需的 column metadata；
3. 之后进入上面的调度体系按行范围取数。

冷启动最坏 3 轮 IO；元数据缓存热了之后，点查就只剩数据页本身的 1～2 次 IO——与第 4 节的分析闭环。

## 7. 特殊设计：Blob 与索引

**Blob**。图片、音频、视频帧这类 MB 级大对象，即使 full-zip 也不合适——它们大到不应该和普通列混在同一套页布局里。Lance 的 blob 编码把描述与数据分离：列里存的是 `struct(position, size)` 描述符，真实字节放在文件的独立区域，读取时按描述符间接访问，还可以在 dataset 层暴露成文件对象供延迟物化（late materialization）——查询计划里 blob 列一路只是轻量引用，真正要用时才取回字节。2.2 版本的 Blob v2 进一步优化了这条路径，官方给出的数字是 blob 读取最高提升 68 倍。

**索引**。Lance 支持标量索引（BTree、Bitmap、LabelList、NGram）、全文索引和向量索引（IVF_PQ、HNSW 等）。有趣的设计是：**V2 之后的索引文件本身就是 Lance 数据文件**——一个 IVF 分区表、一张倒排表，本质都是"若干列数据"，完全可以复用同一套页布局、编码和读取器，索引查询的产出统一是指回数据的 row id。dogfooding 自己的文件格式，也侧面说明这套容器的表达力足够通用。

## 8. 版本演进：2.0 → 2.1 → 2.2 / 2.3

把时间线捋一遍，也顺便标注本文信息相对 2025 年资料的更新点：

- **2.0**（2024，["Lance v2" 博客](https://www.lancedb.com/blog/lance-v2)）：确立无 row group 的容器结构、40B footer、可扩展编码框架。但结构编码还是 Arrow 式的多 buffer 照搬，`List<String>` 点查最坏 5 次 IO，压缩也基本缺席；
- **2.1**（2025 年 10 月[宣布 stable](https://www.lancedb.com/blog/lance-file-2-1-stable)）：本文主要描述的版本。引入 mini-block / full-zip 双结构编码、repetition index，补齐压缩体系（bitpacking / FSST / RLE / BSS / 字典 / 通用压缩），官方口径"体积减半、速度不减"；
- **2.2**（开发中，[规划 issue](https://github.com/lance-format/lance/issues/3353)）：Blob v2、更激进的存储缩减，具体特性以 changelog 为准；
- **2.3**（规范起草中）：**sparse layout**——针对高 null 比例列，用稀疏的位置/计数映射替代稠密 rep/def，补上 full-zip"null 占满空间"的短板。

生态側 2026 年的大事是 DuckDB 官方[试驾了 Lance lakehouse](https://duckdb.org/2026/05/21/test-driving-lance)，SQL 引擎直接读 Lance 表的路径已经打通。

## 9. 上手与选型

十几行代码就能体验点查性能（`pip install pylance`）：

```python
import lance
import numpy as np
import pyarrow as pa

# 写一个带 embedding 列的 dataset
n, dim = 1_000_000, 768
tbl = pa.table({
    "id": pa.array(range(n)),
    "text": pa.array([f"doc-{i}" for i in range(n)]),
    "embedding": pa.FixedSizeListArray.from_arrays(
        pa.array(np.random.rand(n * dim).astype(np.float32)), dim),
})
lance.write_dataset(tbl, "demo.lance")

ds = lance.dataset("demo.lance")
# 点查：按行号随机取行 —— Lance 的看家本领
rows = ds.take([1, 42, 1024, 999_999])
```

同样的数据写成 Parquet 再用行号 take 一次，对比会非常直观。生态集成方面：LanceDB（向量检索）、Ray Data（分布式训练数据管道）、DuckDB、Spark connector、Trino 等都有官方或社区支持。

选型 checklist：

- **用 Lance**：向量检索召回后回表取数、多模态训练集（图片/音频 + 特征混存）、需要随机 shuffle 的 DataLoader、频繁加列回填的特征表、需要数据版本管理的实验场景；
- **用 Parquet**：纯批式 OLAP 扫描、冷数据归档、与现有 Hive / Iceberg / Spark 生态深度绑定的管道。

## 10. 总结

回看全文，Lance 的所有设计几乎都能从一个目标推导出来：**让点查稳定在每列 1～2 次 IO，且不为此牺牲扫描**。

- 为了点查不被"解压一大片"拖累 → 区分 transparent / opaque 压缩，划清各自的地盘；
- 为了消灭多级定位 → 去掉 row group，元数据按列独立、编码可利用；
- 小值的地盘 → mini-block：整块读回，1 次 IO，压缩百无禁忌；
- 大值的地盘 → full-zip：行级拉链 + repetition index，2 次 IO，null 也占位；
- 为了把 IOPS 真正打满 → 大页、buffer 摆放自由、调度与解码分离的异步读取器。

代价同样清晰：写入内存更高、null 占位、部分场景压缩率略逊、生态远不如 Parquet 成熟。工程上没有免费的午餐，Lance 只是把天平从"扫描与压缩"往"随机访问"拨了一格——而 AI workload 恰好站在天平的这一端。

留两个坑给后续文章：Lance 的 table format（fragment 组织、stable row id 与 MVCC）值得单独一篇；以及站在 Iceberg 社区的视角，表格式与文件格式的边界正在如何被这类"AI-native lakehouse"重新划定。

## 参考资料

- mwish, [Lance "File" Format](https://blog.mwish.me/2025/04/16/Lance-file-format/)——中文源码级分析，本文结构的重要参考
- 论文：[Lance: Efficient Random Access in Columnar Storage through Adaptive Structural Encodings](https://arxiv.org/abs/2504.15247)（arXiv 2504.15247）
- 官方规范：[格式总览](https://lance.org/format/) / [File Format Spec](https://lance.org/format/file/) / [Encoding Strategy](https://lance.org/format/file/encoding/)
- 官方博客：[Lance v2: A New Columnar Container Format](https://www.lancedb.com/blog/lance-v2)、[Lance File 2.1: Smaller and Simpler](https://lancedb.com/blog/lance-file-2-1-smaller-and-simpler/)、[Lance File 2.1 is Now Stable](https://www.lancedb.com/blog/lance-file-2-1-stable)、[Benchmarking Random Access in Lance](https://www.lancedb.com/blog/benchmarking-random-access-in-lance)、[The Case for Random Access I/O](https://blog.lancedb.com/the-case-for-random-access-i-o/)
- 读取器系列：[Splitting Scheduling from Decoding](https://blog.lancedb.com/splitting-scheduling-from-decoding/)、[Backpressure](https://blog.lancedb.com/columnar-file-readers-in-depth-backpressure/)、[Parallelism without Row Groups](https://blog.lancedb.com/file-readers-in-depth-parallelism-without-row-groups/)
- 代码仓库：[lance-format/lance](https://github.com/lance-format/lance)（含 [2.2 规划 issue](https://github.com/lance-format/lance/issues/3353)、[mini-block RFC](https://github.com/lance-format/lance/issues/2859)）
- 生态视角：[DuckDB: Test-Driving the Lance Lakehouse Format](https://duckdb.org/2026/05/21/test-driving-lance)
