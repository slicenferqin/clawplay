# 22 Persona Analysis Foundation Technical Design

- Status: Ready
- Depends On: `docs/execution/20-soul-as-persona-vnext.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 子项边界与关键决策

### 1.0 子项定位

这份文档只覆盖 `P7 / N2 + N3` 中与人格分析、雷达图、AI 打分、后台确认相关的基础设施部分。

它不覆盖：

- N1：全站定位与文案重构
- N4：Soul Pack manifest 草案
- N5：人格导向合集

完整版本规划见：`docs/execution/20-soul-as-persona-vnext.md`。

### 1.1 人格分析单独建存储层，不直接绑在某一种 Soul 来源上

当前站内 Soul 来源有两种：

- 仓库内静态 Soul（`community/`、`translated/`）
- 后台审核发布后的数据库 Soul（`published_souls`）

如果把人格分析直接写死在 `published_souls` 表里，会导致静态 Soul 很难统一接入；如果写回 markdown / ts 常量，又不适合 AI 后台动态更新。

**因此本版本采用独立存储层：**

- `persona_analyses`
- `persona_analysis_jobs`

这样可以同时支持：

- `submission`
- `soul`

两类主体。

### 1.2 AI 分析结果默认是建议，不直接自动生效

为了防止误判，本版本坚持：

- AI 负责生成初始分析建议
- 管理员可以接受、重跑、覆盖
- 前台默认展示“已确认”版本

如果没有已确认版本，可根据配置选择：

- 展示 AI 建议版（带未校对标记）
- 或暂时不展示人格模块

V1 建议：**前台只展示已确认版本**，后台保留 AI 草稿。

### 1.3 雷达图使用自绘 SVG，不引入图表库

当前项目依赖很轻，没有图表库。

为了避免：

- 增加不必要依赖体积
- 样式不统一
- 只为一个雷达图引入整套图表系统

本版本采用轻量 SVG 组件实现人格雷达图。

## 2. 数据结构设计

### 2.1 公开人格维度常量

新增统一维度定义模块，例如：

- `src/lib/persona/constants.ts`

建议结构：

```ts
export const PUBLIC_PERSONA_DIMENSIONS = [
  { key: 'initiative', label: '主动性' },
  { key: 'warmth', label: '温度感' },
  { key: 'sharpness', label: '锋利度' },
  { key: 'roleplay', label: '角色感' },
  { key: 'boundaries', label: '边界感' },
  { key: 'structure', label: '结构感' },
] as const;
```

### 2.2 `persona_analyses` 表

新增表：

```sql
CREATE TABLE IF NOT EXISTS persona_analyses (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  public_scores_json TEXT NOT NULL,
  public_reasons_json TEXT NOT NULL,
  public_confidence_json TEXT NOT NULL,
  internal_review_json TEXT NOT NULL,
  source TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TEXT,
  raw_response_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(subject_type, subject_key)
);

CREATE INDEX IF NOT EXISTS idx_persona_analyses_subject
  ON persona_analyses (subject_type, subject_key);
```

字段说明：

- `subject_type`：`submission` / `soul`
- `subject_key`：`submission.id` 或 `soul.slug`
- `version`：评分规则版本，如 `persona-v1`
- `status`：`pending` / `generated` / `approved` / `failed`
- `summary`：一句话人格总结
- `public_scores_json`：6 维 `0-100`
- `public_reasons_json`：每维简短理由
- `public_confidence_json`：每维置信度 `0-1`
- `internal_review_json`：后台 4 维辅助结果
- `source`：`ai` / `manual`
- `raw_response_json`：保留原始模型输出，便于排障

### 2.3 `persona_analysis_jobs` 表

新增异步任务表：

```sql
CREATE TABLE IF NOT EXISTS persona_analysis_jobs (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 100,
  last_error TEXT,
  queued_by TEXT,
  run_after TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_persona_analysis_jobs_status_priority
  ON persona_analysis_jobs (status, priority, created_at);
```

状态建议：

- `queued`
- `processing`
- `succeeded`
- `failed`

### 2.4 TypeScript 类型

建议新增：

- `src/lib/persona/schema.ts`

核心类型：

```ts
export type PersonaSubjectType = 'submission' | 'soul';
export type PersonaAnalysisStatus = 'pending' | 'generated' | 'approved' | 'failed';

export interface PersonaAnalysis {
  subjectType: PersonaSubjectType;
  subjectKey: string;
  version: 'persona-v1';
  status: PersonaAnalysisStatus;
  summary: string;
  publicScores: {
    initiative: number;
    warmth: number;
    sharpness: number;
    roleplay: number;
    boundaries: number;
    structure: number;
  };
  publicReasons: Record<string, string>;
  publicConfidence: Record<string, number>;
  internalReview: {
    completeness: number;
    consistency: number;
    publishability: number;
    risk: number;
  };
  source: 'ai' | 'manual';
  reviewedBy: string | null;
  reviewedAt: string | null;
  rawResponse: unknown;
  createdAt: string;
  updatedAt: string;
}
```

## 3. 分析流程设计

### 3.1 提交后流程

#### 用户投稿 / 修订提交时

1. 保持现有投稿成功逻辑不变
2. 写入 / 更新 `soul_submissions`
3. 同时 enqueue 一条 `persona_analysis_jobs`：
   - `subject_type = 'submission'`
   - `subject_key = submission.id`
   - `status = 'queued'`

#### 管理员审核页

管理员进入详情页时可看到：

- 当前分析状态
- 最近分析时间
- 是否已人工确认
- 重新分析按钮
- 接受 AI 建议按钮
- 手工编辑按钮

### 3.2 发布时流程

当投稿从 `submission` 发布为 `published_soul` 时：

1. 如果该 `submission` 已有 `approved` 分析结果，则复制为：
   - `subject_type = 'soul'`
   - `subject_key = slug`
2. 如果只有 `generated` 而未批准，后台给出 warning，管理员可：
   - 先批准后发布
   - 或继续发布但前台不展示人格模块

V1 建议：**不强阻断发布，但发布页给 warning。**

### 3.3 静态 Soul 回填流程

对 `community/` 与 `translated/` 下的现有 Soul：

- 使用批量脚本直接 enqueue `subject_type = 'soul'`、`subject_key = slug`
- AI 分析完成后写入 `persona_analyses`
- 前台按 slug 覆盖读取

## 4. AI Provider 设计

### 4.1 选型原则

当前项目没有引入任何 AI SDK，V1 保持轻量，直接使用服务端 `fetch` 调用 **OpenAI-compatible API**。

优点：

- 不引入额外依赖
- 可兼容 OpenAI / OpenRouter / 本地兼容网关
- 后续替换 provider 成本低

### 4.2 环境变量

建议新增：

- `CLAWPLAY_PERSONA_ANALYSIS_ENABLED`
- `CLAWPLAY_PERSONA_API_BASE_URL`
- `CLAWPLAY_PERSONA_API_KEY`
- `CLAWPLAY_PERSONA_MODEL`
- `CLAWPLAY_PERSONA_TIMEOUT_MS`

### 4.3 Prompt 输入结构

模型输入分成三层：

1. 原文主输入
   - `rawSoul`
2. 展示辅助输入
   - `title`
   - `summary`
   - `tags`
   - `tones`
3. 预览校验输入
   - `previewHook`
   - `previewPrompt`
   - `previewResponse`

系统提示必须强调：

- 只分析人格轮廓，不做优劣判断
- 输出严格 JSON
- 每个维度都要给理由
- 不允许返回总分排行榜结论

### 4.4 输出契约

模型必须返回可校验 JSON，结构建议：

```json
{
  "summary": "一个高主动、偏锋利、角色感较强的审查型 Soul。",
  "publicScores": {
    "initiative": 78,
    "warmth": 24,
    "sharpness": 86,
    "roleplay": 72,
    "boundaries": 68,
    "structure": 74
  },
  "publicReasons": {
    "initiative": "原文频繁主动推进问题拆解。"
  },
  "publicConfidence": {
    "initiative": 0.84
  },
  "internalReview": {
    "completeness": 82,
    "consistency": 76,
    "publishability": 88,
    "risk": 14
  }
}
```

服务端必须对：

- 维度是否齐全
- 数值是否在范围内
- summary 是否为空

做二次校验。

## 5. Worker 设计

### 5.1 运行方式

本项目运行在自有服务器 + PM2 上，V1 推荐使用轻量 worker：

- `scripts/persona/run-worker.mjs`

运行模式：

- 每次启动后轮询 `persona_analysis_jobs`
- 拉取 `queued` 任务
- 标记 `processing`
- 调用 AI provider
- 写回 `persona_analyses`
- 更新任务状态

### 5.2 为什么不用 Next 路由里做后台任务

因为：

- 请求生命周期不适合承载异步分析
- 失败重试和排障困难
- 发布时任务不稳定

独立 worker 更符合当前 VPS / PM2 的部署方式。

### 5.3 初始上线建议

V1 可采用两段式：

1. 先做“管理员手动触发分析 + 脚本 worker”
2. 稳定后再加“投稿后自动 enqueue”

## 6. 页面与组件落点

### 6.1 前台详情页

改动文件建议：

- `src/app/souls/[slug]/page.tsx`
- `src/components/persona-radar.tsx`
- `src/components/persona-analysis-panel.tsx`

展示内容：

- 一句话人格总结
- 6 维雷达图
- 维度标签摘要
- 维度理由列表

### 6.2 后台审核详情页

改动文件建议：

- `src/app/admin/submissions/[id]/page.tsx`
- `src/components/admin-persona-analysis-card.tsx`
- `src/app/api/admin/submissions/[id]/persona-analysis/route.ts`

功能：

- 查看当前分析状态
- 触发重跑
- 接受 AI 建议
- 人工编辑数值与 summary

### 6.3 文案与 README

改动文件建议：

- `README.md`
- `src/app/about/page.tsx`
- `src/app/submit/page.tsx`
- `docs/execution/*`

目标：

- 从“目录站”表述升级为“人格分享平台”表述
- 把“安装”措辞逐步收口为“导入 / 替换起始 Soul”更准确的表达

## 7. 服务层设计

建议新增模块：

- `src/lib/persona/constants.ts`
- `src/lib/persona/schema.ts`
- `src/lib/persona/service.ts`
- `src/lib/persona/provider.ts`
- `src/lib/persona/prompt.ts`
- `src/lib/persona/worker.ts`

建议保留的现有接入点：

- `src/lib/analytics/db.ts`：建表与迁移
- `src/lib/submissions/service.ts`：提交 / 发布时 enqueue 或复制分析结果
- `src/lib/souls.ts`：为静态 / 发布 Soul 读取人格分析 overlay

## 8. 脚本与回填

建议新增脚本：

- `scripts/persona/backfill-analysis.mjs`
- `scripts/persona/run-worker.mjs`

回填顺序：

1. 先回填现有 11 个 Soul
2. 再打开新投稿 enqueue
3. 最后上线前台人格模块

这样能避免前台先出现大量空白模块。

## 9. 验证路径

### 9.1 本地验证

至少覆盖：

1. `npm run build`
2. 后台提交一条测试投稿并成功生成分析任务
3. worker 成功消费任务并写入分析结果
4. Soul 详情页正确显示雷达图
5. 管理员成功人工覆盖分析结果

### 9.2 线上验证

至少覆盖：

1. PM2 中 worker 正常运行
2. 新投稿可成功 enqueue
3. 现有一条已发布 Soul 成功展示人格画像
4. smoke check 不受新增能力影响

## 10. 分阶段实施建议

### 阶段 A：数据与服务基础

- 新表
- 新类型
- provider 封装
- worker 与 job 机制

### 阶段 B：后台审核能力

- 审核页人格分析卡片
- 重跑 / 接受 / 覆写

### 阶段 C：前台展示能力

- Soul 详情页人格画像
- SVG 雷达图
- 文案调整

### 阶段 D：存量回填与收尾

- 11 个 Soul 回填
- README / 路线图同步
- 上线检查

## 11. 当前不做但需预留的扩展位

这版先不做，但数据结构要考虑未来兼容：

- `Soul Pack` 推荐技能 / 工具
- 适合谁 / 不适合谁的结构化字段
- 多版本人格分析历史
- 不同模型分析结果对比
- 列表页按人格维度筛选

这些字段先不做成强依赖，但命名上要为后续升级留空间。
