# 04 SEO and Sharing

- Status: Done
- Depends On: `docs/execution/01-analytics-and-hotlist.md`, `docs/execution/02-submission-flow.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-08

## 1. 背景

ClawPlay 现在已经具备：

1. 首页展示
2. Soul 详情页
3. 原始内容下载与安装路径
4. 投稿与审核发布闭环

但从“能访问”到“能传播、能被搜索、能被稳定引用”之间，还差一层基础设施。

当前风险是：

- 搜索引擎抓取入口不完整
- 详情页元信息不足，搜索结果展示弱
- 社交分享时没有稳定的标题、摘要、预览图
- 动态 Soul 发布后，搜索与分享能力没有自动跟上
- 域名放开后，站点虽然可访问，但传播效率依然很差

因此，备案等待期最适合补齐 SEO 与分享基础能力。

## 2. 目标

本阶段目标：

1. 建立完整的搜索引擎抓取入口。
2. 让每个 Soul 详情页都具备稳定、可解释、可传播的 metadata。
3. 让首页、灵魂库页、Soul 详情页在社交分享时都能显示更像“产品页面”的预览卡片。
4. 让动态发布的 Soul 与静态 Soul 统一进入 sitemap 和 metadata 流程。
5. 控制不应被索引的页面，避免把后台、管理链接、投稿状态页暴露给搜索引擎。

## 3. 非目标

本阶段不做：

- 复杂 SEO 平台接入（Ahrefs、Semrush、Search Console 大量运营动作）
- 多语言 SEO 架构
- 自动生成长篇 SEO 文案
- 程序化批量 landing page
- 分享裂变活动系统
- 复杂图片生成服务集群

本阶段聚焦“基础设施齐全、信息正确、可持续维护”。

## 4. 用户价值 / 业务价值

### 用户价值

- 搜索结果中能更快理解 Soul 是什么。
- 分享到社交平台或聊天工具时，卡片更可信、更有点击欲望。
- 访问详情页前，用户就能看到更完整的标题、摘要和预览图。

### 业务价值

- 域名放开后能直接承接自然搜索和外部分享流量。
- 每新增一个 Soul，就自动获得基础传播能力。
- 后续做内容运营、合集页、精选页时，不需要回头重补 SEO 地基。

## 5. 交付范围

本阶段计划交付：

1. `sitemap.xml`
2. `robots.txt`
3. 全站 canonical 规则
4. 首页 / 灵魂库 / 合集 / 安装页 / 投稿页基础 metadata
5. Soul 详情页动态 metadata
6. Open Graph / Twitter Card 基础配置
7. Soul 详情页 OG 图生成或模板化分享卡片
8. 明确 noindex / nofollow 策略
9. 与动态已发布 Soul 打通的抓取数据源

可能涉及的代码范围：

- `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/souls/[slug]/page.tsx`
- 可能新增 `src/app/og/` 或 `src/app/api/og/`
- 可能新增 metadata helper，如 `src/lib/seo.ts`

## 6. 方案设计

### 6.1 信息架构

建议将 SEO 分成 3 层：

1. **全站层**
   - 站点名
   - 站点描述
   - 默认 OG 图
   - 默认 canonical 根域名
2. **列表页层**
   - 首页、灵魂库、安装页、投稿页、合集页 metadata
3. **内容页层**
   - Soul 详情页动态 metadata
   - 动态生成分享卡片

### 6.2 sitemap 设计

`sitemap.xml` 至少包含：

- `/`
- `/souls`
- `/install`
- `/submit`
- 所有公开 Soul 详情页（静态 + 动态发布）

不包含：

- `/admin/*`
- `/submissions/[publicId]`
- 带管理 token 的用户回看链接
- 任何审核后台相关 API

### 6.3 robots 设计

建议：

- 允许抓取公开页面
- 禁止抓取 `/admin/`
- 禁止抓取 `/api/`
- 禁止抓取 `/submissions/`

额外建议：

- 对后台与私密状态页补 `noindex`
- 对带 token 的管理页确保不进入 sitemap，也不被 canonical 化

### 6.4 canonical 设计

canonical 的核心原则：

1. 全站只认一个正式域名，例如 `https://clawplay.club`
2. 所有 Soul 详情页 canonical 指向该 slug 的正式 URL
3. 带查询参数页面默认 canonical 到干净 URL
4. 临时 IP 访问、预览地址、带 token 链接都不应作为 canonical 来源

### 6.5 Soul 详情页 metadata

每个 Soul 详情页建议至少输出：

- `title`
- `description`
- `keywords`（可选，谨慎使用）
- `openGraph.title`
- `openGraph.description`
- `openGraph.url`
- `openGraph.images`
- `twitter.card`
- `alternates.canonical`

标题建议格式：

```text
{soul title} · {category label} · ClawPlay
```

描述建议优先使用：

1. Soul summary
2. 补充 1~2 个高价值标签 / 场景 / 兼容模型

### 6.6 分享卡片 / OG 图

第一版建议采用**程序化模板卡片**，而不是为每个 Soul 手工出图。

卡片元素建议固定：

- Soul 标题
- 一句话摘要
- 2~3 个标签
- 分类
- ClawPlay 品牌标识

设计原则：

- 风格与主站一致
- 文字优先，减少装饰
- 模板稳定，不随页面频繁变化

### 6.7 动态 Soul 接入

SEO 层必须统一读取：

- 静态 Soul
- 数据库中已发布 Soul

不能只给静态 Soul 做 metadata，否则投稿闭环上线后，动态内容的搜索与分享会断层。

### 6.8 noindex 策略

建议明确以下页面不进入索引：

- `/admin/login`
- `/admin/submissions`
- `/admin/submissions/[id]`
- `/submissions/[publicId]`
- 任何带 `token` 的 URL
- 可能的内部测试页 / 草稿页

## 7. 风险与取舍

### 风险 1：先做 SEO，但域名还没完全放开

处理：

- 先把代码层和结构层准备好
- 域名链路恢复后可直接被抓取

### 风险 2：OG 图实现过重

处理：

- 第一版优先模板化
- 不做复杂图片生成队列

### 风险 3：动态 Soul 元信息不一致

处理：

- 建统一 helper
- 静态与动态内容走同一 metadata 生成逻辑

### 风险 4：不该公开的页面被索引

处理：

- robots + noindex + sitemap 三层同时约束

## 8. 实施拆解

### Task 1：建立全站 SEO 基础配置

输出：

- 站点 metadata 基础项
- 正式域名常量
- canonical helper

### Task 2：补齐抓取入口

输出：

- `sitemap.xml`
- `robots.txt`
- 公开页面集合

### Task 3：实现 Soul 详情页动态 metadata

输出：

- 静态 / 动态 Soul 共用 metadata builder
- 详情页 title / description / OG 信息

### Task 4：实现分享图能力

输出：

- 默认 OG 图
- Soul 详情页模板化 OG 图

### Task 5：补 noindex 策略与回归

输出：

- 后台 / 私密页 noindex
- 域名 / IP / query 参数 canonical 检查

## 9. 验收标准

满足以下条件视为完成：

1. 公开页面可输出正确的 metadata。
2. `sitemap.xml` 包含全部公开 Soul 页面。
3. `robots.txt` 能正确限制后台和私密路径。
4. Soul 详情页分享时，标题、摘要、卡片图正确展示。
5. 动态已发布 Soul 与静态 Soul 都进入 SEO 流程。
6. 后台和投稿状态页不会被错误索引。

## 10. 上线与回滚

上线前：

- 确认正式域名常量
- 确认域名链路可访问
- 确认 OG 图路径在生产环境可访问

回滚方式：

- metadata 逻辑异常时，可先回退到默认全站 metadata
- OG 图异常时，可退回默认品牌图
- sitemap 异常时，可暂时只输出核心静态页面

## 11. 结果记录

最终已实现：

- 全站 metadata 基础配置与正式域名 canonical helper
- `sitemap.xml` 与 `robots.txt`
- 首页、灵魂库、安装页、投稿页 metadata
- Soul 详情页动态 metadata
- 默认 OG 图与 Soul 详情页动态 OG 图
- 后台、投稿状态页、成功页 noindex

待域名链路恢复后补充：

- 正式域名下的分享卡片外部平台验证
- 搜索引擎抓取与收录验证
