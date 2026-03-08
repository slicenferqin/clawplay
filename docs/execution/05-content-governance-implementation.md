# 05 Content Governance Implementation

- Status: Ready
- Depends On: `docs/execution/05-content-governance.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-08

## 1. 这份文档解决什么问题

`05-content-governance.md` 定义了为什么必须在 Soul 数量增长前先立内容规范。

这份实施文档继续收口 7 个问题：

1. 哪些字段是强约束，哪些字段是软约束。
2. 分类与 `sourceType` 是否重叠，如何取舍。
3. 标签如何逐步从自由输入收敛到受控词表。
4. 翻译 / 改编内容发布前，需要哪些最小证据。
5. 规范如何进入投稿表单与后台审核。
6. 旧 Soul 如何兼容，不要求一次性全部重构。
7. 规则如何沉淀为代码常量，而不是只有文档。

## 2. 关键决策

### 决策 1：先定义“最小发布规范”，不要一开始追求完美 taxonomy

第一版重点约束：

- category
- sourceType
- tags
- license
- sourceUrl
- sourceAuthor
- rightsStatement

其他如 tones / compatibleModels 允许先保持较宽松。

### 决策 2：内容规则必须落到代码常量

建议新增统一规则层，例如：

- `src/lib/content-rules.ts`

其中维护：

- 分类定义
- 推荐标签词表
- 标签同义词映射
- 字段长度与数量限制
- 各 submission type 的最小要求

### 决策 3：投稿前台用“软约束”，后台发布用“硬约束”

原因：

- 前台投稿过严会伤害提交转化
- 后台发布必须守住质量和合规底线

也就是说：

- 投稿时允许用户自由表达
- 审核时必须补齐可发布所需信息

### 决策 4：优先处理分类架构冲突

当前最大结构问题不是标签，而是：

- `translated` 既像内容分类，又像来源属性

建议在实施前先选一个方向：

#### 方案 A：保留 `translated` 作为一级分类

优点：

- 用户容易理解
- 当前数据迁移成本低

缺点：

- 分类维度不纯
- 与 `sourceType` 重复

#### 方案 B：移除 `translated` 一级分类，统一由 `sourceType` 表达来源

优点：

- 信息架构更干净
- 搜索和 SEO 维度更清晰

缺点：

- 需要调整现有导航与数据

从长期看，我更倾向 **方案 B**，但可以分阶段迁移。

## 3. 模块与文件落点

建议新增 / 调整：

- `src/lib/content-rules.ts`
- `src/lib/souls-types.ts`
- `src/lib/submissions/schema.ts`
- `src/lib/submissions/service.ts`
- `src/app/submit/page.tsx`
- `src/components/admin-decision-form.tsx`
- `src/app/admin/submissions/[id]/page.tsx`
- 可能新增 `docs/content/metadata-spec.md`
- 可能新增 `docs/content/tag-dictionary.md`

## 4. 字段规范建议

### 4.1 title

- 建议 4~28 个中文字符范围
- 避免纯流行梗和无意义前后缀
- 能让用户在列表页直接理解角色定位

### 4.2 summary

- 建议 24~80 个中文字符范围
- 以“这个 Soul 适合做什么”开头，而不是空泛夸赞

### 4.3 tags

- 3~6 个
- 至少 2 个应描述能力 / 任务
- 不允许全是情绪词或审美词

### 4.4 preview

- `previewHook`：一句话勾起点击欲
- `previewPrompt`：代表性场景
- `previewResponse`：能体现 Soul 风格和能力

### 4.5 license / 来源

- 原创必须有 license
- 翻译 / 改编必须有 `sourceUrl`
- 翻译 / 改编必须有 `sourceAuthor` 或明确“未知原作者”说明

## 5. 审核规则建议

后台可增加审核检查项：

1. 信息完整性
2. 来源清晰度
3. 发布风险
4. 列表页可展示性
5. 安装后可用性

建议最终在后台 UI 上表现为：

- 提示清单
- 缺项警告
- 不阻断录入，但阻断发布

## 6. 实施顺序

建议顺序：

1. 先拍板分类架构
2. 新增 `content-rules.ts`
3. 把投稿和审核 schema 接入最小约束
4. 后台详情页增加内容规范检查提示
5. 逐步清洗现有静态 Soul metadata
6. 再考虑标签词表 UI 化

## 7. 兼容旧数据策略

不要要求一次性重写所有已有 Soul。

建议：

- 老数据先兼容显示
- 新投稿按新规则执行
- 已发布旧 Soul 逐步补齐

## 8. 验证路径

最少验证：

1. 新投稿能通过基础字段校验
2. 翻译 / 改编缺来源时，后台无法直接发布
3. 标签、分类、summary 能符合新规则
4. 若分类架构调整，首页 / 列表页 / SEO 不被破坏

## 9. 风险控制

### 风险 1：规则收紧影响投稿转化

处理：

- 先后台硬约束
- 前台先提示，不马上强阻断

### 风险 2：旧数据不一致导致新旧体验割裂

处理：

- 采用渐进迁移策略
- 先保证新增内容质量

### 风险 3：规范太多，执行成本高

处理：

- 只先做高价值字段
- 后续再逐步补细项
