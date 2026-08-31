---
title: 项目
---

# 项目

## <img src="/img/iceberg.svg" className="school-logo" alt="Apache Iceberg logo" /> Apache Iceberg C++

[github.com/apache/iceberg-cpp](https://github.com/apache/iceberg-cpp) · 数据湖表格式事实标准 Apache Iceberg 的官方 C++ 实现，基于 C++23 构建，旨在消除 JNI 性能瓶颈，为高性能计算引擎与 AI 框架提供极致的数据交互能力。累计贡献 60+ commits / 20,000+ LOC，项目 **Top 3 Contributor**。

- **REST Catalog 模块的架构设计与实现**：完整的 Iceberg REST OpenAPI 协议栈，包括 HTTP Client 抽象层、基于 Handler 模式的错误处理层、JSON SerDe 框架与 Endpoint 发现等核心组件
- **重构 PartitionSpec / SortOrder 元数据体系**：覆盖 Unbound / Bound 设计范式，支持事务性替换变更，确保表结构演进（Table Evolution）过程中的元数据完整性
- **实现 TableRequirements 乐观并发提交协议**：通过原子性的条件检查对齐 Iceberg 的乐观并发控制语义，保障并发写入场景下的数据一致性

## 从零实现 LLM

基于 PyTorch 从零实现 BBPE Tokenizer 与 Transformer 各核心模块（Embedding、Multi-Head Self-Attention、MLP、Layer Normalization 与输出头），完成前向计算、loss 计算、反向传播与 optimizer 驱动的训练 loop，在数据集上完成语言模型训练（Stanford CS336 课程作业）。

## 本站

Next.js + MDX 静态导出的个人 wiki / 博客，样式致敬 [jyywiki.cn](https://jyywiki.cn)，支持亮暗模式、全站搜索、文章目录与 giscus 评论。[源码在 GitHub](https://github.com/HeartLinked/HeartLinked.github.io)。
