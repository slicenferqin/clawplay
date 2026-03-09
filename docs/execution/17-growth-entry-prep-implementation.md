# 17 Growth Entry Prep Implementation

- Status: Done
- Depends On: `docs/execution/17-growth-entry-prep.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 关键决策收口

### 1.1 先做可传播的合集页，而不是分散堆入口

本次没有把推荐入口零散塞进多个页面，而是先把“合集”做成一个真正可访问、可传播、可索引的页面。

这样好处是：

- 导航语义终于和实际页面对齐
- 用户分享时有明确落点
- 后续继续扩更多合集时，有统一承载位置

### 1.2 热门入口采用“行为信号 + 精选回填”混合策略

冷启动阶段，真实站内行为可能还不够稳定，因此本次规则是：

- 优先用近 30 天热度数据
- 如果合格样本不足，补精选 Soul

这样既不空页面，也不滥用“热门”表达。

## 2. 文件落点

本次修改 / 新增：

- `src/lib/collections.ts`
- `src/app/collections/page.tsx`
- `src/components/site-header.tsx`
- `src/components/site-footer.tsx`
- `src/app/page.tsx`
- `src/app/souls/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/globals.css`
- `scripts/ops/domain-smoke-check.mjs`
- `README.md`
- `docs/execution/17-growth-entry-prep.md`
- `docs/execution/17-growth-entry-prep-implementation.md`

## 3. 具体实现

### 3.1 合集 helper

新增服务端 helper，输出四组入口：

- 新手首选
- 开发首选
- 当前热门
- 最近新增

其中热门入口直接复用现有热榜能力。

### 3.2 合集页

新增 `/collections` 页面：

- 顶部概览卡
- 四组分区
- 每组直接展示推荐 Soul 卡片
- 每组都有说明文案和继续浏览入口

### 3.3 站内导流回填

新增或调整入口：

- 顶部导航“合集”改为真实页面
- 页脚补“合集”入口
- 首页“按用途浏览”区块增加合集入口
- 灵魂库页工具栏增加“看推荐合集”入口

### 3.4 SEO 与验收

- `/collections` 已加入 sitemap
- `robots` 允许抓取 `/collections`
- smoke check 新增合集页检查

## 4. 验证结果

本次本地已验证：

- `npm run build` 通过
- `/collections` 页面可访问
- `smoke:domain` 已覆盖合集页

线上已验证：

- 新页面部署成功
- smoke check 全通过

## 5. 后续建议

P6 第一刀完成后，下一步最值得继续的两件事是：

1. 给合集页补“最适合新手 / 最适合开发 / 最近新增 / 当前热门”的分享素材
2. 继续扩展为专题合集页，例如“翻译精选”“工作流首选”“陪伴聊天首选”
