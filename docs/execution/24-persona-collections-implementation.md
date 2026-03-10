# 24 Persona Collections Implementation Design

- Status: Done
- Depends On: `docs/execution/24-persona-collections.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-10

## 1. 实现目标

把现有合集能力从单一入口集合，升级成：

- 入口型合集
- 人格型合集

并保持：

- `/collections` 总览页继续稳定可读
- `/collections/[key]` 详情页与 OG / metadata / 分享文案继续复用
- 实现成本尽量低，不引入新表，不打乱现有路由

## 2. 涉及模块

### 数据层

- `src/lib/collections.ts`

### 页面层

- `src/app/collections/page.tsx`
- `src/app/collections/[key]/page.tsx`
- `src/app/collections/[key]/opengraph-image.tsx`
- `src/app/sitemap.ts`

### 样式层

- `src/app/globals.css`

### 文档层

- `README.md`
- `docs/execution/20-soul-as-persona-vnext.md`
- `docs/execution/24-persona-collections.md`

## 3. 数据结构调整

把原本只面向 `GrowthCollection` 的结构，升级为通用 `CollectionSection`：

```ts
export type CollectionKind = 'growth' | 'persona';
export type CollectionKey = GrowthCollectionKey | PersonaCollectionKey;

export interface CollectionSection {
  kind: CollectionKind;
  key: CollectionKey;
  eyebrow: string;
  title: string;
  summary: string;
  note: string;
  pageHref: string;
  browseLabel: string;
  browseHref: string;
  detailLead: string;
  highlights: string[];
  fitFor: string[];
  shareBadges: string[];
  shareTemplates: CollectionShareTemplate[];
  souls: SoulDocument[];
}
```

再新增：

```ts
export interface CollectionGroup {
  key: CollectionKind;
  eyebrow: string;
  title: string;
  description: string;
  collections: CollectionSection[];
}
```

作用：

- 页面层不用再假定所有合集都只有一种来源
- 总览页可以显式分组渲染
- 详情页仍然只消费统一的 `CollectionSection`

## 4. 人格专题生成规则

### 4.1 不建新表，直接用现有人格分析结果

直接消费：

- `soul.personaAnalysis.publicScores`
- `buildPersonaProfile(soul).archetype`
- `title / summary / tags / tones / useCases`

### 4.2 使用“维度分数 + 文本语义 + 轻 curated 优先级”混合策略

原因：

- 只靠分数会把当前 8 个 Soul 分得太机械
- 只靠 slug 硬编码会失去扩展性

所以第一版采用：

1. 维度分数做主判断
2. 标题 / 摘要 / 标签做语义加权
3. `preferredSlugs` 做当前内容量较小时的轻修正

### 4.3 具体专题规则

#### 谋士系

主要参考：

- `structure`
- `boundaries`
- `initiative`
- archetype: `谋士 / 架构师 / 推进者`

#### 温润陪伴系

主要参考：

- `warmth`
- `sharpness` 反向
- archetype: `陪伴者`
- 文本特征：陪伴 / 温暖 / 安抚 / 耐心

#### 毒舌直给系

主要参考：

- `sharpness`
- `boundaries`
- `structure`
- archetype: `毒舌派 / 审查官`
- 文本特征：毒舌 / 暴躁 / 直给 / 审查 / 挑错

#### 角色感拉满

主要参考：

- `roleplay`
- `warmth`
- archetype: `角色派 / 陪伴者`
- 文本特征：猫娘 / 海盗 / 角色扮演 / 冒险

## 5. 页面改造策略

### 5.1 `/collections`

原页面是平铺所有合集。

这次改为：

1. Hero 保留
2. 总览卡片区同时展示所有合集
3. 新增两组内容块：
   - 入口型合集
   - 人格专题
4. 每组内部继续展示专题说明 + 3 张 Soul 卡片

这样既保留熟悉路径，也让用户一眼看懂“现在可以按人格来挑”。

### 5.2 `/collections/[key]`

继续复用原详情页结构，只补一处关键语义：

- breadcrumb 增加 `起步合集 / 人格专题` 区分

其余结构不重做，避免 N5 变成一轮大 UI 改版。

## 6. 分享与 SEO

本次继续复用现有分享基础设施：

- metadata
- canonical
- OG 图
- shareTemplates
- sitemap

但要把 `generateStaticParams`、`metadata`、`sitemap` 的集合来源都切到通用 collection API，确保新专题被索引。

## 7. 样式改造原则

遵循现有米白阅读风格，不新开风格分支。

新增样式只做：

- 合集分组 header
- 组内专题块分隔
- 总览卡片上显示“起步合集 / 人格专题”元信息

避免：

- 新增复杂视觉容器
- 做成标签云或筛选器形态
- 让 `/collections` 再次变拥挤

## 8. 验证项

### 构建验证

- `npm run build`

### 页面验证

- `/collections` 可见两大分组
- `/collections/strategist`
- `/collections/warm`
- `/collections/sharp`
- `/collections/roleplay`

### 结果验证

- 新人格专题都有 Soul 卡片
- 详情页 metadata / OG / 分享文案不报错
- sitemap 收到新专题地址

## 9. 结果记录

- 已完成 `src/lib/collections.ts` 的通用合集模型升级
- 已完成 `/collections` 的双分组展示
- 已完成 4 个第一版人格专题
- 已完成详情页、OG、sitemap 的同步接线
