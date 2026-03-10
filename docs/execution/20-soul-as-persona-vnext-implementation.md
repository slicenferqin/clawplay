# 20 Soul as Persona vNext Technical Design

- Status: Ready
- Depends On: `docs/execution/20-soul-as-persona-vnext.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 关键决策收口

### 1.1 `20` 是版本总规划，`21 / 22` 是后续子项基础设施

本次文档层级明确分成两层：

- `20-soul-as-persona-vnext.md`
  - 负责定义下一版本的整体方向、工作流、边界与优先级
- `21-positioning-and-copy-reset.md`
  - 负责定义 N1 的定位与文案重构
- `22-persona-analysis-foundation.md`
  - 负责定义人格分析、雷达图、AI 评分、后台确认这条子能力链路

这样：

- 版本前瞻不会被某一个子能力绑架
- 实施时又能按模块推进

### 1.2 `P7` 不是单点功能，而是一个“语义 + 数据 + 页面 + 模板 + 传播”的组合版本

这一版的成功，不取决于某一个按钮或接口，而取决于下面 5 条工作流能否形成闭环：

- N1：定位与文案重构
- N2：Schema v2
- N3：详情页重构
- N4：Soul Pack 草案
- N5：新版合集

### 1.3 技术实现分层要跟产品语义分层一致

本版本必须避免把所有内容重新塞回一个大对象里。

建议从技术上保持 4 层：

1. **Soul 原始内容层**：原始 `SOUL.md`
2. **Soul 展示层**：标题、摘要、标签、预览等目录字段
3. **Soul 人格层**：人格结构字段、人格分析结果
4. **Soul Pack 预留层**：manifest、推荐模型、技能、安装说明

## 2. 工作流与模块映射

### N1：定位与文案重构

#### 子项文档

- `docs/execution/21-positioning-and-copy-reset.md`
- `docs/execution/21-positioning-and-copy-reset-implementation.md`

#### 目标模块

- `src/app/page.tsx`
- `src/app/about/page.tsx`
- `src/app/submit/page.tsx`
- `src/app/install/page.tsx`
- `README.md`

#### 实现重点

- 收口“安装 / 下载 / 提示词”等表达
- 强化“灵魂 / 人格 / 导入 / 替换 / preset”表达
- 首页与 About 页要明确讲出：
  - ClawPlay 不是普通 prompt 站
  - 它是 OpenClaw 的 Soul 人格分享平台

#### 推荐顺序

先做文案，不等数据层。

原因：

- 这是整个版本的认知基座
- 可以最早统一团队判断标准

### N2：Schema v2

#### 目标模块

- `src/lib/souls-types.ts`
- `src/lib/submissions/schema.ts`
- `src/lib/submissions/service.ts`
- `src/lib/souls.ts`
- `src/lib/analytics/db.ts`
- `src/lib/persona/*`

#### 数据设计建议

将人格层拆成两类：

##### A. 静态 / 结构化 metadata 字段

适合成为 Soul 长期属性：

- `archetype`
- `fitFor`
- `notFitFor`
- `coreTruthsSummary`
- `boundariesSummary`
- `vibeSummary`
- `continuitySummary`
- `recommendedModel`
- `recommendedSkillsOrTools`

##### B. 动态 / 计算型人格分析字段

适合由 AI + 后台维护：

- `initiative`
- `warmth`
- `aggression`
- `clinginess`
- 以及 `20` 中定义的 6 维雷达人格结果

这里允许存在“前台展示维度”和“底层结构字段”不完全一致。

#### 设计原则

- 不要求投稿人手填全部人格结构字段
- 允许字段为空，后台后补
- 静态 Soul 与数据库 Soul 必须能共用同一套读取接口

### N3：Soul 详情页重构

#### 目标模块

- `src/app/souls/[slug]/page.tsx`
- `src/components/persona-radar.tsx`
- `src/components/persona-profile.tsx`
- `src/components/persona-fit-panel.tsx`
- `src/app/globals.css`

#### 页面结构建议

新详情页结构建议切成 6 个区块：

1. `Hero`
   - 一句话人格定位
   - archetype / 核心人格标签
2. `Fit`
   - 适合谁 / 不适合谁
3. `Persona`
   - 雷达图 / 性格维度条
4. `Structure`
   - `Core Truths / Boundaries / Vibe / Continuity`
5. `Preview`
   - 示例对话 / 行为预期
6. `Raw`
   - 原始 `SOUL.md` + 下载 / 复制 / 导入说明

#### 设计原则

- 用户先理解人格，再决定是否查看原文
- 原文仍保留，但不再占据第一信息层
- 前台视觉要强调“人格画像”，不是“代码块下载页”

### N4：Soul Pack 草案

#### 目标模块

- `docs/content/` 或 `docs/execution/` 下的 manifest 规范文档
- `src/lib/soul-pack/schema.ts`（如果直接落类型）

#### 最小 manifest 建议

```ts
interface SoulPackManifest {
  version: 'v1';
  soulSlug: string;
  title: string;
  soulFile: 'SOUL.md';
  metadata: {
    archetype?: string;
    summary: string;
    fitFor: string[];
    notFitFor: string[];
  };
  recommendedModel?: string;
  recommendedSkillsOrTools?: string[];
  installNotes?: string[];
  sampleDialogues?: Array<{
    user: string;
    assistant: string;
  }>;
}
```

#### 设计原则

- 先有 manifest 概念
- 暂不承诺一键导入
- 为后续 `Agent Template` 留扩展位

### N5：新版合集

#### 目标模块

- `src/lib/collections.ts`
- `src/app/collections/page.tsx`
- `src/app/collections/[key]/page.tsx`

#### 结构策略

合集继续保留两类：

##### A. 入口型合集

- 新手首选
- 开发首选
- 当前热门
- 最近新增

##### B. 人格型合集

- 暴躁系
- 温润系
- 谋士系
- 陪伴系
- 毒舌系

#### 设计原则

- 入口型合集服务新用户
- 人格型合集服务传播与比较
- 两类合集不冲突，而是前后衔接

## 3. 与 `20` 子项的关系

### 3.1 `21` 覆盖的内容

`22-persona-analysis-foundation.md` 负责覆盖：

- 人格分析结果存储
- AI provider
- worker 任务机制
- 后台审核确认
- 雷达图基础展示

### 3.2 `20` 仍需要覆盖的内容

即使 `20` 完成，`21` 仍然有大量内容不自动完成：

- 首页 / About / 投稿页 / 安装页的文案语义重构
- Schema v2 中的静态人格字段设计
- 详情页的信息架构重组
- Soul Pack manifest 草案
- 人格型合集

因此实施时必须避免把 `P7` 误收敛成“只做雷达图和 AI 评分”。

## 4. 推荐实施顺序

### 阶段 A：认知和结构先行

1. N1 文案重构
2. N2 Schema v2 结构定义

### 阶段 B：人格基础设施

3. 落 `20` 子项（AI 分析、worker、后台确认、雷达图组件）

### 阶段 C：详情页重构

4. 基于 Schema v2 + `20` 的结果，完成新详情页结构

### 阶段 D：模板层铺地基

5. 定义 Soul Pack manifest

### 阶段 E：传播层升级

6. 扩新版人格型合集

## 5. 交付拆解建议

### 交付包 A：N1

- `docs/execution/21-positioning-and-copy-reset.md`
- `docs/execution/21-positioning-and-copy-reset-implementation.md`
- 新版文案基线
- 统一术语词表
- 首页 / About / 投稿页 / 安装页改稿

### 交付包 B：N2 + `20`

- Schema v2
- AI 人格分析基础设施
- 后台分析卡片
- 雷达图组件

### 交付包 C：N3

- 新版 Soul 详情页
- 结构化人格区块
- 适合谁 / 不适合谁 / 四段摘要

### 交付包 D：N4

- Soul Pack manifest 草案
- 文档与类型定义

### 交付包 E：N5

- 人格型合集
- 对应分享文案

## 6. 验证路径

### 6.1 版本级验证

应至少回答这几个问题：

1. 用户是否能明显感知 ClawPlay 不再只是目录站？
2. 新详情页是否先讲人格，再讲原文？
3. 投稿 / 审核 / 发布链路是否能承载人格结构字段？
4. 人格型合集是否已经比旧合集更有传播感？
5. Soul Pack 是否已具备最小规范，而不是空口概念？

### 6.2 技术级验证

应至少覆盖：

- `npm run build`
- 投稿、审核、发布主链路不回归
- 新详情页可访问
- 人格分析结果可读取
- README、路线图、文档索引已同步

## 7. 风险与取舍

### 风险 1：语义改了，但数据没跟上

如果只改文案，不改 schema 和详情页，产品会显得“说得很大，实际还是老样子”。

**取舍：**
- N1 必须和 N2 / N3 联动推进

### 风险 2：只做人格分析，不做详情页重构

如果只补了雷达图，没有改页面结构，用户仍然会先掉进原文块里。

**取舍：**
- `20` 不是版本完成，N3 必须单独推进

### 风险 3：太早追求 Soul Pack 完整导入

这会把版本拖回“镜像 / 一键部署”的重模式。

**取舍：**
- N4 只做 manifest 草案
- 不做完整打包和导入器

## 8. 结果记录

- 版本 PRD：`docs/execution/20-soul-as-persona-vnext.md`
- 人格分析子项：`docs/execution/22-persona-analysis-foundation.md`
- Soul Pack 子项：`docs/execution/23-soul-pack-manifest.md`
