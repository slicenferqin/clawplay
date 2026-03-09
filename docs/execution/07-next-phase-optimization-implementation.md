# 07 Next-Phase Optimization Implementation

- Status: Done
- Depends On: `docs/execution/07-next-phase-optimization.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 本次实施范围

本次完成了 `P1 分类与来源解耦` 的第一阶段，并顺手把本地历史残留数据完成一次轻审计 + 定向清洗：

1. 前台不再把 `translated` 作为公开一级分类
2. 首页与列表页补上 `sourceType` 的浏览入口
3. 静态 Soul 数据从“翻译精选分类”迁回真实用途分类
4. 投稿端移除 `translated` 新建入口，但兼容历史修订稿
5. 本地 `data/analytics.sqlite` 中的历史 `translated` 残留完成审计与清洗

## 2. 实际改动

### 2.1 分类模型调整

- `src/lib/souls-types.ts`
- 公开分类收敛为：`work`、`creative`、`learning`、`dev`
- `translated` 作为兼容值保留在类型层，用于承接历史数据
- 新增来源排序与公开分类选项导出

### 2.2 静态 Soul 数据迁移

- `src/lib/souls.ts`
- `architect` -> `dev`
- `code-reviewer` -> `dev`
- `pirate-captain` -> `creative`

### 2.3 浏览 IA 调整

- `src/app/souls/page.tsx`
- 分类筛选改名为“用途分类”
- 新增“内容来源”筛选：原创 / 翻译 / 改编
- 搜索时保留当前筛选条件

### 2.4 首页承接入口

- `src/app/page.tsx`
- “按合集浏览”改为“按用途浏览”
- 新增“按来源浏览”区块，承接原“翻译精选”发现入口

### 2.5 投稿兼容策略

- `src/components/soul-submission-form.tsx`
- 新投稿不再允许选择 `translated`
- 如果历史修订稿仍是 `translated`，表单会展示旧分类提示并允许改迁

### 2.6 审计与清洗脚本

- `scripts/content/translated-category-migration.mjs`
- `scripts/content/translated-category-migration-config.mjs`
- `docs/content/translated-category-audit.md`
- `package.json`

新增命令：

- `npm run audit:translated-categories`
- `npm run cleanup:translated-categories`

### 2.7 后台来源信息强化

- `src/app/admin/submissions/page.tsx`
- `src/app/admin/submissions/[id]/page.tsx`
- `src/lib/submissions/service.ts`
- `src/app/globals.css`

新增与优化：

- 后台列表支持按投稿来源（原创 / 翻译 / 改编）筛选
- 列表页每条稿件显示来源状态：原创稿 / 已附来源 / 待补来源
- 详情页把“来源与授权”前置到主内容区，便于审核时先核来源链路
- 详情页侧栏收口为“联系与备注”，减少来源信息分散

## 3. 兼容策略

### 前台层

- 不再主动展示 `translated` 作为公开用途分类
- 老数据如仍保留该值，排序会落到公开分类之后，不影响主导航

### 投稿层

- 新建投稿无法再创建新的 `translated` 分类
- 历史稿件修订时仍能看到旧值，并被引导改成真正用途分类

### 数据层

- 目前不直接对线上数据库做强制迁移
- 本地开发库已通过脚本完成一次真实清洗
- 线上放量前，可复用同一脚本先审计再迁移

## 4. 审计与清洗结果

### 审计前

本地 `data/analytics.sqlite` 中检测到：

- `soul_submissions` 残留 1 条 `translated`
- `submission_revisions` 残留 1 条 `translated`
- `published_souls` 残留 0 条
- 静态数据残留 0 条

对应投稿：

- `sub_914bfeb012` / 《内容规范阻断测试稿》

### 清洗动作

本次采用定向映射：

- `sub_914bfeb012` -> `work`

判断依据：

- 这是内容规范阻断测试稿，更接近审核与内容治理工作流，归入“工作助手”最稳

### 清洗后

再次审计结果：

- `soul_submissions` 残留 0 条
- `submission_revisions` 残留 0 条
- `published_souls` 残留 0 条
- 静态数据残留 0 条

审计报告见：

- `docs/content/translated-category-audit.md`

## 5. 验证结果

已执行：

- `npm run audit:translated-categories`
- `npm run cleanup:translated-categories`
- `npm run build`

结果：

- 本地历史 `translated` 残留已清零
- 前台与投稿兼容逻辑正常
- 生产构建通过

## 6. 后续待做

1. 线上服务器在域名放开前，用同一脚本再跑一次发布前审计
2. 如果后台继续扩展，可补“来源缺失优先排序”或“来源问题专属队列”
3. 等线上历史数据与流程都稳定后，再考虑彻底从类型层移除 `translated`

