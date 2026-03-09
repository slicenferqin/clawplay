# 10 Tag Governance Closed Loop Implementation

- Status: Done
- Depends On: `docs/execution/10-tag-governance-closed-loop.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 本次实施范围

本次完成了 P3 的第一刀，把标签治理从“表单提示 + 人工记忆”推进到“投稿建议 + 后台处理动作”。

具体包括：

1. 新增 `proposedTags` 数据字段
2. 投稿端增加“新标签建议”输入
3. 修订页带回并继续编辑这组建议
4. 后台详情页增加标签治理面板
5. 新增管理员标签处理接口：归并 / 收录 / 驳回

## 2. 关键实现

### 2.1 数据层新增 `proposedTags`

在 `soul_submissions` 中新增 `proposed_tags_json` 列，历史数据自动回填为空数组。

这样首稿、补稿、后台审核都能围绕同一份标签建议数据工作。

### 2.2 投稿端分离“正式标签”和“新标签建议”

修改：`src/components/soul-submission-form.tsx`

核心调整：

- 原 `tags` 字段保留为正式标签输入
- 新增 `proposedTags` 字段，明确承接词表外的新标签建议
- 如果用户把词表外标签填进正式标签，会收到更明确的引导

### 2.3 后台详情页新增标签治理面板

修改：`src/app/admin/submissions/[id]/page.tsx`

管理员现在可以直接在详情页看到：

- 当前正式标签
- 待处理的新标签建议
- 标签词表检查提示

### 2.4 新增管理员标签处理动作

新增：`src/components/admin-tag-governance-form.tsx`
新增：`src/app/api/admin/submissions/[id]/tags/route.ts`

支持三类动作：

1. 归并到已有标签
2. 收录为正式标签
3. 驳回标签建议

每次动作都会更新投稿记录，并写入管理员 revision，保证后续能追溯。

### 2.5 内容检查补充标签治理提示

标签建议不会阻断发布，但会作为警告项提醒管理员处理。

这样发布底线仍然稳定，同时后台也不会忽略未处理的标签治理事项。

## 3. 取舍说明

这次没有直接做“全站动态标签词表后台”。

当前“收录为正式标签”只落到稿件级 canonical tags，后续如果要把它同步进入全站推荐词表，再做下一轮扩展即可。

这是有意控制范围的结果，不是遗漏。

## 4. 验证方式

本次验证包括：

1. `npm run build`
2. 投稿页 / 私密修订页表单回归
3. 后台详情页标签治理面板回归
4. 管理员标签动作接口回归

## 5. 结果

现在 ClawPlay 的标签治理已经有了第一版闭环：

- 用户可以提建议
- 管理员可以处理建议
- 前台仍然只依赖正式标签

这为下一步继续做标签词表扩展、同义词收敛和治理审计打下了真正可执行的基础。
