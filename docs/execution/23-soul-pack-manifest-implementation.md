# 23 Soul Pack Manifest Implementation Design

- Status: Done
- Depends On: `docs/execution/23-soul-pack-manifest.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-10

## 1. 设计目标

这份文档只覆盖 `P7 / N4` 中与 `Soul Pack Manifest v1` 相关的技术实现设计。

它不覆盖：

- 完整 Agent Template
- 本地一键部署
- 复杂工具安装器
- 用户自由上传完整 pack 文件

完整版本规划见：`docs/execution/20-soul-as-persona-vnext.md`。

## 2. 核心设计决策

### 2.1 V1 先做“派生 manifest”，不做“用户上传 pack”

V1 的 pack 最适合从现有 Soul 数据派生得到。

原因：

- 当前已有 `SoulDocument`
- 已有 `personaAnalysis`
- 已有导入命令、原始 `SOUL.md`、来源信息
- 当前最缺的是“结构化打包层”，不是“另一个上传入口”

因此 V1 设计为：

- `manifest = SoulDocument + personaProfile + packOverrides`

### 2.2 Manifest 使用 JSON，不用 YAML / ZIP

推荐格式：

- API 返回：`application/json`
- 下载文件名：`<slug>.soul-pack.json`

原因：

- 和当前 Next.js / TypeScript / API 层最一致
- 更适合做 schema 校验
- 更适合后续机器读取
- 避免用户误解成“压缩安装包”

### 2.3 V1 采用“派生层 + 轻 override”模式

建议字段来源优先级：

1. `packOverrides`
2. `personaProfile`
3. `SoulDocument`
4. 系统派生值（URL、命令、时间戳等）

这能保证：

- 默认情况下无需人工补齐全部字段
- 后续如果某些 Soul 需要更精确的推荐模型 / 技能 / 说明，也能局部 override

### 2.4 Override 先走代码层，不急着建表

V1 建议先新增：

- `src/lib/soul-pack/overrides.ts`

结构类似：

```ts
export const SOUL_PACK_OVERRIDES = {
  'code-reviewer': {
    recommendedSkillsOrTools: ['diff 查看', '代码审查清单'],
    installNotes: ['更适合 review / debug 场景，不建议拿去做强陪伴人格。'],
  },
};
```

原因：

- 当前 pack 还在定义阶段
- 还没有足够多数据证明需要后台编辑器
- 先用代码层 override，最快、最稳、最容易回滚

如果后面这个层真的稳定，再考虑迁移到 DB / 后台管理。

## 3. 类型与 Schema 设计

### 3.1 目标模块

建议新增：

- `src/lib/soul-pack/schema.ts`
- `src/lib/soul-pack/service.ts`
- `src/lib/soul-pack/overrides.ts`
- `src/lib/soul-pack/examples.ts`

### 3.2 Schema v1

建议类型：

```ts
export interface SoulPackManifest {
  version: 'v1';
  packSlug: string;
  soulSlug: string;
  title: string;
  summary: string;
  soul: {
    fileName: 'SOUL.md';
    rawUrl: string;
    downloadUrl: string;
    integrity?: {
      algorithm: 'sha256';
      value: string;
    };
  };
  persona: {
    archetype: string;
    tagline: string;
    traitChips: string[];
    fitFor: string[];
    notFitFor: string[];
  };
  runtime: {
    recommendedModels: string[];
    recommendedSkillsOrTools: string[];
  };
  install: {
    method: 'curl-raw-soul';
    command: string;
    installNotes: string[];
  };
  preview: {
    sampleDialogues: Array<{
      user: string;
      assistant: string;
    }>;
  };
  provenance: {
    sourceType: string;
    author: string;
    license: string;
    sourceUrl?: string | null;
    sourceAuthor?: string | null;
    generatedFrom: 'soul+persona+override';
    generatedAt: string;
  };
  extensions?: Record<string, unknown>;
}
```

### 3.3 为什么保留 `extensions`

因为后续大概率会加：

- recommendedModel 之外的 provider 建议
- `skills`
- `tools`
- `workflowHints`
- `agentTemplateRef`

先留 `extensions`，可以避免 v1 一开始就把结构写死。

## 4. 字段来源规则

### 4.1 `SoulDocument`

提供：

- `title`
- `summary`
- `compatibleModels`
- `previewPrompt`
- `previewResponse`
- `author`
- `license`
- `sourceType`

### 4.2 `personaProfile`

提供：

- `archetype`
- `tagline`
- `traitChips`
- `fitFor`
- `notFitFor`

### 4.3 系统派生字段

提供：

- `packSlug`
- `rawUrl`
- `downloadUrl`
- `command`
- `generatedAt`
- `integrity`（如果 V1 同步实现 hash）

### 4.4 `packOverrides`

提供：

- `recommendedSkillsOrTools`
- `installNotes`
- 后续 `workflowHints`
- 未来更细的 pack 元数据

## 5. 服务层设计

### 5.1 目标模块

- `src/lib/soul-pack/service.ts`

### 5.2 核心函数建议

```ts
export function getSoulPackManifestBySlug(slug: string): SoulPackManifest | null;
export function buildSoulPackManifest(soul: SoulDocument): SoulPackManifest;
export function getSoulPackDownloadFileName(slug: string): string;
```

### 5.3 构建流程

1. 读取 `SoulDocument`
2. 读取 `personaProfile`
3. 读取 `packOverrides`
4. 拼出 manifest
5. 校验 schema
6. 返回 JSON

### 5.4 为什么不落数据库

V1 没必要引入单独 DB 表，因为：

- pack 还只是描述层
- 当前大部分字段都可派生
- 真正需要人工维护的字段还很少

如果后面验证下来：

- override 数量明显增加
- 后台运营要经常编辑 pack 元数据

再考虑引入独立存储层。

## 6. API 与页面接入

### 6.1 JSON API

建议新增：

- `src/app/api/packs/[slug]/route.ts`

返回：

- `200 application/json`
- 文件内容为 `SoulPackManifest`

支持：

- `?download=1`
  - 走附件下载
- 不带参数
  - 直接 JSON 预览

### 6.2 Soul 详情页

建议新增轻量组件：

- `src/components/soul-pack-panel.tsx`

展示：

- 这是什么
- 推荐模型
- 推荐技能 / 工具
- 导入备注
- `查看 JSON`
- `下载 Pack`

放置位置建议：

- 详情页右侧导入面板附近
- 或原始 `SOUL.md` 区块之前

### 6.3 为什么不先单做 `/packs/[slug]`

因为 V1 最重要的是：

- 定义结构
- 验证导出链路
- 让用户知道它存在

独立 pack 页面不是当前最优先事项。

## 7. 与现有模块的关系

### 7.1 依赖现有模块

- `src/lib/souls.ts`
- `src/lib/persona/profile.ts`
- `src/lib/install.ts`
- `src/lib/site-config.ts`

### 7.2 不应修改的主链路

以下链路在 N4 中不应被破坏：

- `/api/raw/[slug]`
- 详情页导入命令
- 投稿页 / 后台审核 / 发布流程

N4 必须是叠加层，而不是改写当前主链路。

## 8. 实施顺序

### 阶段 A：schema 与 service

1. 新增 `schema.ts`
2. 新增 `overrides.ts`
3. 新增 `service.ts`
4. 本地用一两个 Soul 生成 manifest 样例

### 阶段 B：API 导出

5. 新增 `/api/packs/[slug]`
6. 支持 inline / download 两种模式
7. 验证 JSON 可读性与字段完整性

### 阶段 C：前台最小落点

 8. 新增 detail 页 `Soul Pack` 面板
 9. 显示推荐模型 / 技能 / 备注
10. 提供“查看 JSON / 下载 Pack”按钮

### 阶段 D：文档与示例

11. README 增加 pack 说明
12. 增加 manifest example
13. 记录非目标，防止外部误解为镜像包

## 9. 验证路径

### 9.1 本地验证

至少覆盖：

1. `npm run build`
2. 任意一个 Soul 可成功生成 manifest
3. `/api/packs/[slug]` 返回合法 JSON
4. `?download=1` 正常下载
5. 详情页 pack 面板显示正确

### 9.2 内容验证

至少检查：

1. 推荐模型是否与 Soul 当前内容一致
2. `fitFor / notFitFor` 是否来自结构化人格层
3. `installNotes` 是否不会夸大导入能力
4. 文案是否明确说明“这不是完整环境包”

## 10. 风险与后续扩展位

### 风险 1：manifest 字段与未来 template 字段冲突

**缓解：**

- 保持 v1 聚焦在人格层
- 使用 `extensions` 预留扩展位
- 不提前引入环境 / secret / workflow runtime 等重字段

### 风险 2：override 长期留在代码里会变重

**缓解：**

- V1 接受代码层 override
- 如果后面数量明显增加，再迁移到 DB / 后台 UI

### 风险 3：用户把 pack 当部署包

**缓解：**

- API / 页面命名统一使用 `manifest`
- 页面描述必须强调“结构化资产描述文件”
- 不使用“运行 / 启动 / 一键部署”措辞

## 11. 建议交付包

- `docs/execution/23-soul-pack-manifest.md`
- `docs/execution/23-soul-pack-manifest-implementation.md`
- `src/lib/soul-pack/schema.ts`
- `src/lib/soul-pack/service.ts`
- `src/lib/soul-pack/overrides.ts`
- `src/app/api/packs/[slug]/route.ts`
- `src/components/soul-pack-panel.tsx`

## 12. 结果记录

- 已新增 `src/lib/soul-pack/schema.ts`
- 已新增 `src/lib/soul-pack/service.ts`
- 已新增 `src/lib/soul-pack/overrides.ts`
- 已新增 `src/app/api/packs/[slug]/route.ts`
- 已新增 `src/components/soul-pack-panel.tsx`
- 对应 PRD：`docs/execution/23-soul-pack-manifest.md`
