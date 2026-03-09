# 18 Shareable Collection Pages

- Status: Ready
- Depends On: `docs/execution/17-growth-entry-prep.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 背景

P6 第一刀已经把“合集”做成真正页面，但它还是偏总览页：

- 适合站内导航承接
- 不够适合外部直接分享
- 用户打开后仍然需要在同一页继续判断自己该看哪组

如果想让后续传播更顺，下一步应该把每个合集入口升级成可单独分享的专题页。

## 2. 目标

本阶段目标：

1. 为每个合集入口提供独立 URL。
2. 为专题页补齐 metadata 与 OG 分享卡。
3. 让合集总览页与专题页形成总分结构。
4. 提前准备好后续外部传播落点。

## 3. 非目标

本阶段不做：

- 给每个专题做复杂筛选器
- 做动态专题编辑器
- 做运营后台
- 做几十个长尾专题页

## 4. 交付范围

1. `/collections/[key]` 专题页
2. `/collections/[key]/opengraph-image` 分享卡
3. 合集总览页回填专题入口
4. sitemap / smoke check / README 同步
5. 一份实施记录文档

## 5. 方案设计

### 5.1 总页负责导航，专题页负责传播

- `/collections`：给站内用户快速总览
- `/collections/[key]`：给站外链接、社群分享、后续传播物料承接

### 5.2 专题页结构比总页更聚焦

每个专题页只回答四个问题：

- 这组是什么
- 为什么从这组开始
- 适合谁
- 具体先装哪几个 Soul

### 5.3 分享卡复用现有 OG 渲染体系

避免重复造样式系统，专题页 OG 直接复用当前 `renderOgCard` 体系，保证视觉一致性。

## 6. 验收标准

1. `/collections/starter` 等专题页可访问
2. 专题页有独立 canonical 与 OG 图片
3. `/collections` 总览页能进入专题页
4. smoke check 已覆盖至少一个专题页
5. sitemap 已收录专题页

## 7. 结果记录

- 实施结果见：`docs/execution/18-shareable-collection-pages-implementation.md`
