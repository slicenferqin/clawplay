# 18 Shareable Collection Pages Implementation

- Status: Done
- Depends On: `docs/execution/18-shareable-collection-pages.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 关键决策收口

### 1.1 不拆掉合集总页，而是做总分结构

本次没有把 `/collections` 替换掉，而是保留它作为导航总页，再把每一组入口补成独立专题页。

这样：

- 站内总览不丢
- 站外分享有单独落点
- 后续继续扩更多专题也更自然

### 1.2 专题页优先回答“为什么看这组”

专题页不是简单复制 Soul 卡片，而是补充：

- 为什么先看这组
- 适合谁
- 推荐理由

这样外部打开时，不需要先理解整站结构，也能直接明白这条链接的价值。

## 2. 文件落点

本次修改 / 新增：

- `src/lib/collections.ts`
- `src/app/collections/page.tsx`
- `src/app/collections/[key]/page.tsx`
- `src/app/collections/[key]/opengraph-image.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `scripts/ops/domain-smoke-check.mjs`
- `src/app/globals.css`
- `README.md`
- `docs/execution/18-shareable-collection-pages.md`
- `docs/execution/18-shareable-collection-pages-implementation.md`

## 3. 具体实现

### 3.1 合集模型升级

为每组合集新增：

- `pageHref`
- `detailLead`
- `highlights`
- `fitFor`
- `shareBadges`

这样同一份数据可同时支持：

- 总览页
- 专题页
- OG 分享卡

### 3.2 专题页

新增 `/collections/[key]`：

- 顶部说明与返回路径
- 推荐理由卡片
- 适合人群
- 推荐 Soul 列表

### 3.3 OG 分享卡

新增 `/collections/[key]/opengraph-image`，可直接作为专题页分享图使用。

### 3.4 SEO 与验收

- 专题页加入 sitemap
- smoke check 覆盖 `/collections/starter`
- 总览页 overview 卡和区块动作都能进入专题页

## 4. 验证结果

本次本地已验证：

- `npm run build` 通过
- `/collections/starter` 可访问
- `/collections/starter/opengraph-image` 可访问
- smoke check 全通过

线上已验证：

- 专题页已部署成功
- smoke check 全通过

## 5. 后续建议

专题页打通后，下一步最值的是：

1. 给每个专题页补 1-2 条外发文案模板
2. 继续扩成更明确的专题，例如“翻译精选”“陪伴聊天首选”“工作流首选”
