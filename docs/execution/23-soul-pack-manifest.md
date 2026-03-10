# 23 Soul Pack Manifest PRD

- Status: Ready
- Depends On: `docs/execution/20-soul-as-persona-vnext.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-10

## 1. 背景

ClawPlay 已经完成：

- `N1`：全站从“目录站 / 安装”叙事切到“人格分享平台 / 导入”叙事
- `N2`：人格分析基础设施、雷达图、后台人格分析卡片
- `N3`：Soul 详情页从“目录详情”升级到“结构化人格详情页”

但 `Soul as Persona` 版本还有一个关键缺口：

**用户已经能理解一个 Soul 是什么人格，却还看不清“把它带回自己本地时，到底应该带走哪些结构化资产”。**

如果只停留在：

- 原始 `SOUL.md`
- 详情页文案
- 当前这次对话里的解释

那么 Soul 仍然更像“一个站内条目”，还不够像“一个可以被迁移、分享、复用、演化的资产单元”。

`N4` 的目标，就是先定义这个更稳定的中间层：

**Soul Pack**

它不是完整 Agent 镜像，也不是一键部署包。

它是一个围绕 Soul 的**结构化 manifest**，把“原始 Soul + 人格摘要 + 推荐模型 + 推荐技能 / 工具 + 导入说明 + 示例对话”收口成一个可导出、可传播、可继续升级的数据对象。

## 2. 目标

本子项目标：

1. 为每个 Soul 定义一个最小可行的 `Soul Pack Manifest v1`。
2. 让 Soul 从“站内展示页”进一步升级成“可导出、可复用的结构化人格资产”。
3. 给未来的 `Agent Template / Mirror` 留出清晰接口，但不提前进入重型打包和本地部署问题。
4. 统一 ClawPlay 内部对“什么是 pack、什么不是 pack”的认知，避免后续实现继续摇摆。
5. 为未来导出 JSON、分享卡片、模板市场、技能推荐等能力打基础。

## 3. 非目标

本子项不做：

- 完整 workspace 打包
- 一键本地部署 / 一键恢复运行环境
- 用户上传 ZIP / tar / 完整镜像
- secrets、环境变量、API key 的打包与分发
- 模型 provider 配置导出
- 技能 / 工具的真实安装器
- 声称“有 Soul Pack 就等于能完整复刻一个 Agent”

## 4. 用户价值 / 业务价值

### 4.1 用户价值

- 用户不再只带走一份 `SOUL.md`，而是带走一份“这个人格该怎么理解和使用”的结构化说明。
- 用户能更快判断：“这个 Soul 如果导入我本地，推荐搭什么模型、适合什么场景、注意什么边界”。
- 分享链路更完整：别人看到的不是一段孤立文本，而是一份更接近可复用资产的 manifest。

### 4.2 业务价值

- ClawPlay 能进一步摆脱“目录站”心智，进入“人格资产平台”心智。
- 未来做 `Soul Pack JSON` 导出、分享页、模板比较、生态合作时，有统一底层结构。
- 后续如果要继续往 `Agent Template` 走，不需要再从零讨论 pack 的定义。

## 5. 子项定位

这一子项对应 `P7 / N4`。

它只负责：

- 定义 `Soul Pack Manifest v1`
- 定义 pack 与当前 Soul 页面 / 数据层的关系
- 明确 pack 的字段边界、来源与导出方式
- 规划 pack 在前台详情页与 API 层的最小落点

它不负责：

- `Agent Template`
- 完整镜像
- 本地一键部署
- 用户自由上传复杂打包资产

完整版本规划见：`docs/execution/20-soul-as-persona-vnext.md`。

## 6. 交付范围

本子项交付内容：

1. 一份 `Soul Pack Manifest v1` 产品定义
2. 一份 `Soul Pack Manifest v1` 技术设计文档
3. 一套稳定的 manifest 字段清单
4. 一套字段来源与优先级规则
5. 一套最小导出 / 读取 / 展示边界
6. README / 版本总文档的路线同步

## 7. 方案设计

### 7.1 Soul Pack 的产品定义

当前阶段的 `Soul Pack` 定义为：

> 围绕一个 Soul 的结构化人格资产描述文件。

它的核心作用不是“把环境也一起打包”，而是：

- 定义这是什么人格
- 这个人格适合什么 / 不适合什么
- 原始 Soul 在哪里
- 推荐怎么导入
- 推荐配什么模型 / 技能 / 工具
- 给用户一个清晰、稳定、可导出的最小资产单元

### 7.2 Soul Pack 与当前 Soul 的关系

`Soul Pack` 不是替代 `SOUL.md`。

关系应明确为：

- `SOUL.md`：人格定义正文，是核心原始资产
- `Soul Detail Page`：给人读的产品页
- `Soul Pack Manifest`：给系统读 / 给导出读 / 给未来模板层读的结构化资产描述

也就是说：

**Soul Pack 是围绕 `SOUL.md` 的结构层，不是新的正文格式。**

### 7.3 Manifest v1 的最小结构

建议 `Soul Pack Manifest v1` 至少包含以下字段：

1. `version`
2. `packSlug`
3. `soulSlug`
4. `title`
5. `summary`
6. `soul`
   - 原始 `SOUL.md` 入口与校验信息
7. `persona`
   - archetype
   - tagline
   - traitChips
   - fitFor
   - notFitFor
8. `runtime`
   - recommendedModels
   - recommendedSkillsOrTools
9. `install`
   - method
   - rawSoulUrl
   - command
   - installNotes
10. `preview`
    - sampleDialogues
11. `provenance`
    - sourceType
    - author
    - license
    - sourceUrl / sourceAuthor
12. `extensions`
    - 为未来扩展保留开放位

### 7.4 Manifest 不是压缩包

为了防止产品认知再次滑向“镜像市场”，V1 必须明确：

- manifest 是 **JSON 描述文件**
- manifest 可以被下载、查看、复制
- manifest 可以引用原始 `SOUL.md`
- manifest 不负责把模型、工具、环境、技能真正打进包里

也就是说：

**V1 的 pack 是“描述层”，不是“部署层”。**

### 7.5 数据来源原则

manifest 字段不要求全部人工手填。

V1 建议按如下顺序自动生成：

- `Soul 基础字段`
  - title
  - summary
  - tags
  - compatibleModels
  - previewPrompt / previewResponse
- `N2 / N3` 结构化人格层
  - persona summary
  - archetype
  - fitFor / notFitFor
  - traitChips
- `N4` 专属 override 字段
  - recommendedSkillsOrTools
  - installNotes
  - workflowHints

这意味着：

- pack 能先由现有 Soul 自动派生
- 后面再逐步补人工增强字段
- 不会因为缺少全部字段而卡死上线

### 7.6 前台最小落点

`N4` 不要求先做一个完整“Pack 页面”，但至少需要明确未来会落在哪里。

建议最小落点：

#### A. Soul 详情页

增加一个轻量 `Soul Pack` 区块：

- 说明“这不是完整镜像，是一份结构化人格资产清单”
- 展示：
  - 推荐模型
  - 推荐技能 / 工具
  - 导入备注
- 提供：
  - 下载 manifest
  - 查看 manifest JSON

#### B. JSON API

为每个 Soul 提供一个稳定的 manifest 读取地址。

这样未来：

- 外部工具可以直接拉 manifest
- 用户可以保存本地
- 后续做 pack 比较、导出、分享卡片都会更容易

### 7.7 与未来 Agent Template 的关系

`Soul Pack` 是中间层，不是终点层。

未来关系建议明确为：

- `SOUL.md`
  - 人格正文
- `Soul Pack`
  - 人格资产描述
- `Agent Template`
  - 更完整的技能 / 工具 / 工作流模板
- `Mirror`
  - 可能再往后的一整套环境复刻层

这个分层很关键，因为它能让 ClawPlay 保持节奏感：

- 现在先把人格层做深
- 不提前承诺模板层和镜像层
- 但接口已经留好

## 8. 风险与取舍

### 风险 1：用户误解 Soul Pack 就是“一键部署包”

如果命名和展示不收口，很容易再次滑向“镜像 / 复刻 / 一键跑起来”。

**取舍：**

- 页面必须明确写：这是一份 manifest，不是完整环境包
- 不提供“部署成功”的承诺文案
- 不把下载按钮写成“立即运行”

### 风险 2：字段太多，变成另一套重投稿表单

如果 pack 字段要求投稿人手填，会明显劝退。

**取舍：**

- V1 以派生 + override 为主
- 不把 pack 字段纳入投稿首稿门槛
- 后台后补优先于前台强制填写

### 风险 3：过早引入数据库复杂度

如果一上来为 pack 做重型表结构，可能超出当前阶段需要。

**取舍：**

- V1 先定义 schema 和派生规则
- override 优先考虑轻量存储
- 是否进入独立 DB 表，实施时再看是否必要

### 风险 4：manifest 太轻，价值感不足

如果 manifest 只是把已有字段搬运一遍，用户感受不到它存在的必要性。

**取舍：**

- manifest 必须包含“结构化人格层 + 推荐运行层 + 导入说明”
- 不能只做 `title + summary + rawSoulUrl` 的薄封装

## 9. 实施拆解

### 9.1 规划阶段

- 锁定 manifest 边界
- 锁定字段清单
- 锁定数据来源优先级

### 9.2 第一阶段实施

- 新增 `SoulPackManifest` 类型定义
- 新增 pack service
- 新增 manifest JSON API
- 新增 detail 页轻量 pack 区块

### 9.3 第二阶段实施

- 增加 override 机制
- 增加推荐技能 / 工具字段
- 增加 manifest 下载按钮

### 9.4 后续阶段

- 再讨论 pack 与 Agent Template 的衔接
- 再讨论是否需要独立 pack 页面 / 页面集合

## 10. 验收标准

满足以下条件即可视为本子项完成：

1. `Soul Pack Manifest v1` 有正式 schema 定义
2. 至少一个 Soul 能稳定导出 manifest JSON
3. Manifest 字段来源与优先级清晰可查
4. 页面上能解释清楚 pack 是什么、不是完整环境包
5. README 与 P7 总文档都同步到 N4

## 11. 上线与回滚

### 上线方式

- 先上线 manifest schema + API
- 再灰度前台 pack 区块
- 不影响当前原始 `SOUL.md` 导入链路

### 回滚方式

- 如 manifest 结构不稳定，可隐藏 pack 区块
- 保留 API 为实验接口，或直接回滚新增 route
- 不影响现有 Soul 浏览、详情、导入、投稿主链路

## 12. 结果记录

- 待实施
- 对应技术设计：`docs/execution/23-soul-pack-manifest-implementation.md`
