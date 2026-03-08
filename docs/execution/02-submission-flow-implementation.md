# 02 Submission Flow Implementation

- Status: Ready
- Depends On: `docs/execution/02-submission-flow.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-08

## 1. 这份文档解决什么问题

`02-submission-flow.md` 已经定义了“为什么做投稿闭环、这一轮做到哪里、不做到哪里”。

这份实施细化文档继续往下收口，解决 6 个问题：

1. 投稿、审核、发布到底落哪些数据库表。
2. 公共投稿页、状态页、管理页分别是什么结构。
3. 当前没有账号体系的前提下，用户如何安全回看和补交资料。
4. 管理员审核如何鉴权，如何避免一开始就把后台做太重。
5. 已发布投稿如何进入现有 Soul 读取层，而不影响当前 8 个静态 Soul。
6. 本轮实现应该按什么顺序推进，才能在风险最低的情况下完成闭环。

## 2. 核心决策摘要

### 决策 1：用户侧使用“publicId + manageToken”而不是账号登录

第一版不做普通用户账号体系，用户投稿成功后获得：

- 一个公开编号：`publicId`
- 一个私密管理令牌：`manageToken`

使用方式：

- 状态页路径使用：`/submissions/[publicId]?token=...`
- 服务端只保存 `manageTokenHash`
- 原始 token 只在首次提交成功时返回给用户一次

原因：

1. 不引入账号体系，但依然保留“可回看、可补交”的能力。
2. 不需要邮件服务也能闭环。
3. 风险和实现复杂度比账号体系低很多。

### 决策 2：管理员侧采用“单管理员密码 + Cookie Session”

第一版管理员入口采用轻鉴权：

- 环境变量配置管理员密码
- 登录成功后写入签名 Cookie
- 暂不做多管理员、角色权限、操作审计系统

建议环境变量：

- `CLAWPLAY_ADMIN_PASSWORD`
- `CLAWPLAY_ADMIN_SESSION_SECRET`

原因：

1. 当前是单站长 / 小团队场景，没必要一开始做复杂后台权限模型。
2. 审核流的核心问题是“有没有统一队列”，不是“有没有 RBAC”。
3. 后续若接入正式账号体系，可平滑替换后台登录层。

### 决策 3：投稿库与已发布库分离，不把所有东西塞一张表

第一版至少拆成两类核心表：

1. 投稿表：保存用户原始投稿、状态、版权信息、修订版本
2. 已发布 Soul 表：保存真正进入站点展示的数据

这样做的好处：

- 审核中的脏数据不会污染线上展示库
- 发布结果和投稿原始版本可以分开追踪
- 后续支持“编辑后重新发布”也更容易扩展

## 3. 当前仓库与数据层约束

### 3.1 当前内容源现状

当前 Soul 站点数据来自两部分：

1. Markdown 文件：`community/`、`translated/`
2. 静态元数据：`src/lib/souls.ts`

这意味着：

- 现有 Soul 是“代码内置内容”
- 新投稿如果想即时上线，不能继续沿用“改数组 + 发版”路径
- 必须在 `src/lib/souls.ts` 周边做一层数据库适配

### 3.2 当前数据库基础

第 1 步已经引入：

- `better-sqlite3`
- `CLAWPLAY_DATA_DIR`
- `data/analytics.sqlite`

第 2 步建议继续使用同一个 SQLite 文件，新增投稿和发布相关表，而不是再开新数据库文件。

原因：

- 当前站点规模小，一个 SQLite 足够
- 便于备份和运维
- 避免在早期引入多库管理负担

## 4. 数据模型

### 4.1 `soul_submissions`

保存投稿主记录。

建议字段：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | TEXT | 是 | 内部主键 UUID |
| `public_id` | TEXT | 是 | 对外展示编号 |
| `manage_token_hash` | TEXT | 是 | 用户回看 / 修订令牌哈希 |
| `status` | TEXT | 是 | 投稿状态 |
| `submission_type` | TEXT | 是 | 原创 / 翻译 / 改编 |
| `title` | TEXT | 是 | 标题 |
| `summary` | TEXT | 是 | 一句话简介 |
| `category` | TEXT | 是 | 分类键 |
| `tags_json` | TEXT | 是 | 标签数组 |
| `tones_json` | TEXT | 是 | 语气数组 |
| `use_cases_json` | TEXT | 是 | 场景数组 |
| `compatible_models_json` | TEXT | 是 | 模型数组 |
| `preview_hook` | TEXT | 是 | 预览钩子 |
| `preview_prompt` | TEXT | 是 | 示例 prompt |
| `preview_response` | TEXT | 是 | 示例 response |
| `intro` | TEXT | 是 | 简介正文 |
| `features_json` | TEXT | 是 | 功能列表 |
| `suggestions_json` | TEXT | 是 | 使用建议列表 |
| `raw_soul` | TEXT | 是 | 原始 `SOUL.md` |
| `author_name` | TEXT | 是 | 作者名 |
| `contact_method` | TEXT | 否 | 联系方式类型 |
| `contact_value` | TEXT | 否 | 联系方式内容 |
| `license` | TEXT | 是 | 协议 |
| `source_url` | TEXT | 否 | 翻译 / 改编来源 |
| `source_author` | TEXT | 否 | 原作者 |
| `rights_statement` | TEXT | 是 | 投稿人版权声明 |
| `submitter_note` | TEXT | 否 | 投稿补充说明 |
| `latest_reviewer_note` | TEXT | 否 | 最近一次审核备注 |
| `published_soul_id` | TEXT | 否 | 对应已发布 Soul |
| `created_at` | TEXT | 是 | 提交时间 |
| `updated_at` | TEXT | 是 | 更新时间 |
| `reviewed_at` | TEXT | 否 | 最近审核时间 |
| `published_at` | TEXT | 否 | 发布时间 |

### 4.2 `submission_revisions`

保存修订历史。

建议字段：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | TEXT | 是 | UUID |
| `submission_id` | TEXT | 是 | 关联投稿 |
| `revision_no` | INTEGER | 是 | 修订序号 |
| `payload_json` | TEXT | 是 | 当时整份投稿快照 |
| `actor_type` | TEXT | 是 | submitter / admin |
| `created_at` | TEXT | 是 | 修订时间 |

说明：

- 不需要把所有字段做成列级版本化
- 第一版直接保存整份 JSON 快照即可
- 重点是能追踪“用户后来补交了什么”

### 4.3 `submission_status_logs`

保存状态流转记录。

建议字段：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | TEXT | 是 | UUID |
| `submission_id` | TEXT | 是 | 关联投稿 |
| `from_status` | TEXT | 否 | 原状态 |
| `to_status` | TEXT | 是 | 新状态 |
| `actor_type` | TEXT | 是 | submitter / admin / system |
| `note` | TEXT | 否 | 备注 |
| `created_at` | TEXT | 是 | 变更时间 |

### 4.4 `published_souls`

保存真正进入站点展示的动态 Soul。

建议字段：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | TEXT | 是 | UUID |
| `slug` | TEXT | 是 | 站点 slug |
| `submission_id` | TEXT | 是 | 来源投稿 |
| `title` | TEXT | 是 | 标题 |
| `summary` | TEXT | 是 | 摘要 |
| `category` | TEXT | 是 | 分类键 |
| `category_label` | TEXT | 是 | 分类名 |
| `source_type` | TEXT | 是 | 原创 / 翻译 / 改编 |
| `tags_json` | TEXT | 是 | 标签 |
| `tones_json` | TEXT | 是 | 语气 |
| `use_cases_json` | TEXT | 是 | 场景 |
| `compatible_models_json` | TEXT | 是 | 模型 |
| `author` | TEXT | 是 | 作者展示文案 |
| `license` | TEXT | 是 | 协议 |
| `preview_hook` | TEXT | 是 | 预览钩子 |
| `preview_prompt` | TEXT | 是 | 示例 prompt |
| `preview_response` | TEXT | 是 | 示例 response |
| `intro` | TEXT | 是 | 简介 |
| `features_json` | TEXT | 是 | 功能 |
| `suggestions_json` | TEXT | 是 | 建议 |
| `author_lines_json` | TEXT | 否 | 作者信息行 |
| `raw_markdown` | TEXT | 否 | 原始投稿 Markdown |
| `raw_soul` | TEXT | 是 | `SOUL.md` |
| `featured` | INTEGER | 否 | 是否精选，默认 0 |
| `published_at` | TEXT | 是 | 发布时间 |
| `updated_at` | TEXT | 是 | 更新时间 |

### 4.5 索引建议

第一版最少建立：

1. `soul_submissions(public_id)` 唯一索引
2. `soul_submissions(status, created_at)`
3. `published_souls(slug)` 唯一索引
4. `published_souls(published_at)`
5. `submission_revisions(submission_id, revision_no)`
6. `submission_status_logs(submission_id, created_at)`

## 5. 状态机与业务规则

### 5.1 状态枚举

第一版状态固定为：

- `pending_review`
- `needs_revision`
- `approved`
- `published`
- `rejected`

说明：

- 用户正式提交后直接进入 `pending_review`
- 第一版不做用户草稿箱
- `approved` 和 `published` 分开，是为了给管理员保留最后检查空间

### 5.2 状态流转规则

允许的流转：

```text
pending_review -> needs_revision
pending_review -> approved
pending_review -> rejected
needs_revision -> pending_review
approved -> published
approved -> rejected
published -> approved
```

解释：

- `needs_revision -> pending_review`：用户补交后回到待审
- `published -> approved`：如需临时下线展示但保留内容，可先回退到已通过

### 5.3 发布规则

执行“发布”操作前，必须满足：

1. 状态为 `approved`
2. `slug` 通过唯一性校验
3. 必填展示字段齐全
4. 原始 `SOUL.md` 非空
5. 协议与来源信息符合站点要求

发布后行为：

- 新增或更新 `published_souls`
- `soul_submissions.status` 变为 `published`
- `published_at` 写入当前时间
- 站点读取层可以立即读到该 Soul

## 6. 页面与交互设计

### 6.1 `/submit`

结构建议：

1. 页面说明区
   - 投稿价值
   - 审核周期预期
   - 支持原创 / 翻译 / 改编
2. 表单区
   - 基本信息
   - 风格与适用场景
   - 示例对话
   - 原始 `SOUL.md`
   - 来源与版权
   - 联系方式
3. 提交前确认区
   - 声明与勾选
4. 提交按钮

交互要求：

- 分组明显，但先用单页表单，不做多步骤 wizard
- 必填项清晰标注
- 出错信息贴近字段
- 移动端也要可读，不横向溢出
- 按钮提交期间禁用，避免重复提交

### 6.2 `/submit/success`

成功页必须明确告诉用户：

1. 投稿已进入队列
2. 当前状态：`待审核`
3. 请保存私密管理链接
4. 丢失后第一版无法找回

成功页应提供：

- 复制私密链接按钮
- 直达状态页按钮
- 返回灵魂库按钮

### 6.3 `/submissions/[publicId]`

功能：

- 展示当前状态
- 展示最近一次审核备注
- 当状态为 `needs_revision` 时，允许重新提交修订
- 展示基础投稿摘要，方便用户确认自己投的是哪一份内容

注意：

- 必须校验 token
- token 错误时，不泄露投稿详情
- 页面提示语要克制，不要像后台

### 6.4 `/admin/login`

第一版只做：

- 单密码登录
- 成功后设置 HttpOnly Cookie
- 失败时给出通用错误提示

不做：

- 账号名
- 二次验证
- 找回密码

### 6.5 `/admin/submissions`

列表建议至少支持：

- 按状态筛选
- 按时间排序
- 搜索标题 / publicId
- 查看是否原创 / 翻译 / 改编
- 标记最近更新时间

优先展示维度：

1. 状态
2. 标题
3. 投稿类型
4. 作者
5. 提交时间
6. 最近更新时间

### 6.6 `/admin/submissions/[id]`

详情页应包含：

1. 投稿完整内容
2. 原始 `SOUL.md`
3. 来源 / 协议 / 联系方式
4. 修订历史
5. 状态流转记录
6. 审核操作区：
   - 待补充
   - 拒绝
   - 通过
   - 发布

审核备注应支持：

- 给投稿人看的备注
- 内部使用的管理员备注（第一版可以先只做一类备注）

## 7. API 契约

### 7.1 `POST /api/submissions`

作用：创建新投稿。

请求体建议包含：

```json
{
  "submissionType": "原创",
  "title": "测试灵魂",
  "summary": "一句话简介",
  "category": "creative",
  "tags": ["陪伴", "创作"],
  "tones": ["温暖", "克制"],
  "useCases": ["日常聊天", "创意写作"],
  "compatibleModels": ["Claude Sonnet"],
  "previewHook": "一句预览钩子",
  "previewPrompt": "用户会怎么问",
  "previewResponse": "Soul 会怎么答",
  "intro": "详细介绍",
  "features": ["功能 1", "功能 2"],
  "suggestions": ["建议 1", "建议 2"],
  "rawSoul": "# SOUL ...",
  "authorName": "提交者",
  "contactMethod": "github",
  "contactValue": "slicenferqin",
  "license": "CC BY 4.0",
  "sourceUrl": "",
  "sourceAuthor": "",
  "rightsStatement": "我确认自己有权投稿",
  "submitterNote": "补充说明"
}
```

响应：

```json
{
  "ok": true,
  "publicId": "sub_9f3k2h",
  "manageUrl": "/submissions/sub_9f3k2h?token=..."
}
```

### 7.2 `GET /api/submissions/[publicId]?token=...`

作用：读取投稿状态页数据。

返回内容应控制在“用户自己应看到的信息”范围内，不暴露后台内部字段。

### 7.3 `PATCH /api/submissions/[publicId]`

作用：当状态为 `needs_revision` 时，用户提交修订版。

规则：

- 必须带 token
- 只允许在 `needs_revision` 状态下提交
- 提交后自动回到 `pending_review`
- 生成一条 revision 记录

### 7.4 `POST /api/admin/login`

作用：管理员登录。

成功后：

- 设置 HttpOnly Cookie
- 后续访问后台接口靠该 Cookie 鉴权

### 7.5 `GET /api/admin/submissions`

作用：获取审核列表。

支持：

- `status`
- `q`
- `page`
- `pageSize`

### 7.6 `GET /api/admin/submissions/[id]`

作用：获取单篇投稿详情、修订历史、状态日志。

### 7.7 `POST /api/admin/submissions/[id]/decision`

作用：执行审核操作。

请求体示例：

```json
{
  "action": "needs_revision",
  "note": "请补充原始来源链接和协议说明"
}
```

可选 `action`：

- `needs_revision`
- `reject`
- `approve`
- `publish`

## 8. 站点读取层改造

### 8.1 `src/lib/souls.ts` 的改造方向

当前 `src/lib/souls.ts` 主要负责：

- 静态元数据
- 读取本地 Markdown
- 解析详情字段

本阶段建议拆成三层：

1. `static souls adapter`
   - 保留当前静态 Soul 读取
2. `published souls adapter`
   - 读取 `published_souls`
3. `merge layer`
   - 合并输出统一 `SoulMeta` / `SoulDocument`

### 8.2 slug 冲突规则

第一版建议：

- 动态发布 Soul 的 slug 不允许与静态 Soul 冲突
- 如果冲突，管理员在发布前手工调整 slug
- 不做自动覆盖静态 Soul

### 8.3 列表与详情页行为

改造后应满足：

- `/souls` 可以同时列出静态 Soul 与动态已发布 Soul
- `/souls/[slug]` 能读取两类内容
- `/api/raw/[slug]` 能返回两类内容的 `raw_soul`
- 安装命令对两类内容都保持一致

## 9. 防刷与安全

### 9.1 第一版防刷策略

1. 基于 IP hash / session 的提交速率限制
2. honeypot 隐藏字段
3. 文本长度上限
4. `rawSoul` 内容最小长度校验
5. token 哈希存储，不存明文

### 9.2 后台安全要求

1. 后台 Cookie 使用 `HttpOnly`
2. 生产环境加 `Secure`
3. 管理员密码不写死代码
4. 所有后台接口先鉴权再返回数据

## 10. 埋点接入建议

基于已完成的 analytics 基础，建议新增：

- `submission_page_view`
- `submission_started`
- `submission_submitted`
- `submission_success_view`
- `submission_status_view`
- `submission_revision_submitted`
- `admin_submission_reviewed`
- `admin_submission_published`

并统一放进：

- `src/lib/analytics/schema.ts`
- 相关页面与接口中

## 11. 实施顺序

### Task A：补齐数据库表与服务层

涉及：

- `src/lib/submissions/db.ts`
- `src/lib/submissions/schema.ts`
- `src/lib/submissions/service.ts`
- 在现有 SQLite 初始化中增加投稿相关表

目标：

- 能创建投稿、读取投稿、变更状态、写 revision / log

### Task B：实现公开投稿接口与提交页

涉及：

- `/submit`
- `POST /api/submissions`
- `/submit/success`

目标：

- 普通用户能完成提交并拿到管理链接

### Task C：实现状态页与修订能力

涉及：

- `/submissions/[publicId]`
- `GET /api/submissions/[publicId]`
- `PATCH /api/submissions/[publicId]`

目标：

- 待补充状态下，用户能继续补交

### Task D：实现后台审核入口

涉及：

- `/admin/login`
- `/admin/submissions`
- `/admin/submissions/[id]`
- 后台相关 API

目标：

- 管理员能看队列、写备注、改状态、执行发布

### Task E：改造 Soul 读取层并接入动态已发布内容

涉及：

- `src/lib/souls.ts`
- 详情页、列表页、raw 接口

目标：

- 已发布投稿真正进入站点展示

### Task F：补埋点、验证与部署文档

目标：

- 投稿漏斗可观测
- 审核主流程可回归验证
- 文档齐全，方便上线

## 12. 验证方案

### 12.1 提交链路验证

至少验证：

1. 成功提交一篇原创 Soul
2. 成功提交一篇翻译 Soul
3. 必填字段缺失时提示正确
4. 重复提交按钮不会触发双写
5. 成功页能看到私密管理链接

### 12.2 状态链路验证

至少验证：

1. 正确 token 可看到状态页
2. 错误 token 不返回详情
3. `needs_revision` 时用户可以补交
4. 补交后状态回到 `pending_review`

### 12.3 审核与发布验证

至少验证：

1. 管理员能登录后台
2. 能查看待审列表
3. 能执行待补充、拒绝、通过、发布
4. 发布后能在 `/souls` 里找到对应内容
5. 发布后 `/souls/[slug]` 与 `/api/raw/[slug]` 正常可用

### 12.4 回归验证

至少验证：

1. 现有 8 个静态 Soul 不受影响
2. 首页 Hero 不受新投稿数据影响
3. 安装命令依然正确
4. 热榜埋点不被新流程破坏

## 13. 上线与回滚

### 13.1 上线前准备

上线前确认：

1. SQLite 表迁移脚本已覆盖投稿表
2. 管理员密码与 session secret 已配置
3. 数据目录具备写权限
4. 后台入口不被公开导航暴露

### 13.2 上线步骤

1. 部署代码
2. 初始化新表
3. 先用一篇测试投稿跑完整闭环
4. 确认能发布到 `/souls`
5. 再把 `/submit` 对外打开

### 13.3 回滚策略

如出现严重问题：

1. 关闭 `/submit` 提交能力
2. 保留投稿数据库数据
3. 暂时停用动态已发布内容读取
4. 站点回到“静态 Soul only”模式

## 14. 暂不纳入第一版的事项

- 普通用户注册登录
- 邮件通知
- 多管理员权限
- 投稿人公开主页
- 公开投稿排行榜
- 评论、点赞、收藏
- 自动内容审核模型
- 自动版权抓取

## 15. 结果记录

### 实际提交

- 待补充

### 实际偏差

- 待补充

### 后续优化项

- 待补充
