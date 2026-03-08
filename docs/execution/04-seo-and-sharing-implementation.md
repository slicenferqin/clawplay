# 04 SEO and Sharing Implementation

- Status: Done
- Depends On: `docs/execution/04-seo-and-sharing.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-08

## 1. 这份文档解决什么问题

`04-seo-and-sharing.md` 负责定义为什么现在要补 SEO 与分享能力，以及边界在哪里。

这份实施细化文档继续收口 6 个问题：

1. 正式域名如何在代码里统一管理。
2. sitemap / robots 到底由哪些页面和内容组成。
3. 静态 Soul 与动态发布 Soul 如何共用 metadata builder。
4. 哪些页面需要 noindex，在哪一层实现。
5. OG 图是走动态生成还是默认静态模板。
6. 如何在上线后验证分享结果和抓取行为。

## 2. 关键决策

### 决策 1：站点正式域名统一由一个 helper 输出

不要在多个页面手写 `https://clawplay.club`。

建议增加统一站点配置：

- `siteName`
- `siteUrl`
- `siteDescription`
- `defaultOgImage`

后续 canonical、sitemap、robots、metadata 全部从这里读取。

### 决策 2：静态 Soul 与动态 Soul 共用一套 SEO 数据装配逻辑

SEO 不应该关心数据来自 Markdown 还是 SQLite。

建议 metadata builder 只吃统一的 Soul 读取层输出，避免出现：

- 静态 Soul metadata 完整
- 动态 Soul metadata 缺字段

### 决策 3：OG 图第一版优先模板化、服务端生成

建议采用 Next.js 的 `opengraph-image.tsx` / `ImageResponse` 路线，优先做模板化卡片，而不是预生成图片文件。

原因：

- 方便动态 Soul 接入
- 不需要额外图片存储流程
- 模板统一，维护成本低

### 决策 4：noindex 不能只依赖 robots

robots 只是抓取建议，不等于索引控制。

建议：

- robots 层限制后台和私密路径
- 页面 metadata 层显式加 `robots: { index: false }`

## 3. 模块与文件落点

建议新增 / 调整：

- `src/lib/site-config.ts`
- `src/lib/seo.ts`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/og/route.ts` 或每页 `opengraph-image.tsx`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/souls/page.tsx`
- `src/app/souls/[slug]/page.tsx`
- `src/app/install/page.tsx`
- `src/app/submit/page.tsx`
- `src/app/submissions/[publicId]/page.tsx`
- `src/app/admin/*`

## 4. 数据契约

### 4.1 site config

建议统一结构：

```ts
{
  siteName: 'ClawPlay',
  siteUrl: 'https://clawplay.club',
  siteDescription: '...',
  defaultOgImage: '/og/default'
}
```

### 4.2 metadata builder

建议至少提供：

- `buildCanonicalUrl(pathname: string)`
- `buildDefaultMetadata(...)`
- `buildSoulMetadata(soul)`
- `buildNoIndexMetadata(...)`

### 4.3 sitemap builder

建议输出来源：

1. 固定静态页面数组
2. `getAllSouls()` 的公开 Soul 列表

## 5. 页面策略

### 5.1 应被索引页面

- `/`
- `/souls`
- `/souls/[slug]`
- `/install`
- `/submit`
- 可选：`/?category=...` 不单独作为 canonical 目标

### 5.2 不应被索引页面

- `/admin/login`
- `/admin/submissions`
- `/admin/submissions/[id]`
- `/submissions/[publicId]`
- 所有 `/api/*`

### 5.3 Soul 详情页 title / description 生成规则

建议：

- title：`{title} · {categoryLabel} · ClawPlay`
- description：`{summary} 适用于 {useCases/compatibleModels/tags 中最有价值的 1~2 项}`

不要：

- 塞过多关键词
- 直接复用原始 SOUL 正文的大段内容

## 6. OG 图策略

第一版模板字段：

- 大标题：Soul title
- 副标题：summary
- 辅助标签：category + 2 tags
- 右下：ClawPlay brand

第一版不做：

- 多模板 A/B
- 用户头像
- 热度值
- 动态图表

## 7. 实施顺序

建议顺序：

1. 建 `site-config` 与 `seo helper`
2. 补 `layout metadata`
3. 补 `sitemap.ts` 与 `robots.ts`
4. 补 Soul 详情页 metadata
5. 补首页 / 列表页 / 安装页 / 投稿页 metadata
6. 补 noindex 页面 metadata
7. 补 OG 图模板
8. 生产验证分享链接与抓取输出

## 8. 验证路径

最少验证：

1. 本地检查 `/sitemap.xml`
2. 本地检查 `/robots.txt`
3. 抓取任意 Soul 详情页 HTML，确认 metadata 正确
4. 检查后台和投稿状态页是否 `noindex`
5. 检查 OG 图 URL 是否可访问
6. 域名恢复后，用真实域名再次验证 canonical 与分享卡片

## 9. 风险控制

### 风险 1：域名未恢复前 canonical 无法完全实测

处理：

- 代码里先固化正式域名
- 待域名恢复后再做最终线上验收

### 风险 2：OG 图动态生成性能波动

处理：

- 第一版卡片模板尽量简洁
- 必要时可退回默认静态图

### 风险 3：私密页 metadata 漏配

处理：

- 将 noindex 做成 helper
- 对 admin / submission status 页面统一接入

## 10. 结果记录

本轮已落地：

- `src/lib/site-config.ts`
- `src/lib/seo.ts`
- `src/lib/og-image.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/opengraph-image.tsx`
- `src/app/souls/[slug]/opengraph-image.tsx`
- 公开页 metadata 与私密页 noindex 接入

已验证：

- `npm run build` 通过
- 本地 `robots.txt` / `sitemap.xml` 输出正确
- Soul 详情页 canonical / OG metadata 输出正确
- 默认 OG 图与 Soul OG 图可正常生成
