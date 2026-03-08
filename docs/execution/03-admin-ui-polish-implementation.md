# 03 Admin UI Polish Implementation

- Status: Ready
- Depends On: `docs/execution/03-admin-ui-polish.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-08

## 1. 本次落地概览

本次实现针对管理员后台做了一轮专门的 UI 精修，目标不是扩功能，而是把已有投稿审核闭环整理成更成熟的后台体验。

本轮落地包含：

1. 列表页加入状态概览与搜索工具栏
2. 列表表格增加摘要、分类与分页信息
3. 详情页重做为“审核工作台 + 内容判断区 + 资料侧栏”
4. 审核表单拆分为“审核流转”和“发布动作”两组
5. 全局样式补齐后台专属 spacing / card / timeline 规则

## 2. 代码落点

### 2.1 列表页

文件：`src/app/admin/submissions/page.tsx`

改动要点：

- 增加后台顶部 Hero 区
- 新增状态概览卡片
- 新增搜索表单，支持标题 / 作者 / 投稿编号检索
- 把筛选 pills 放入独立工具栏卡片
- 为表格补充摘要、分类标签与分页导航

### 2.2 详情页

文件：`src/app/admin/submissions/[id]/page.tsx`

改动要点：

- 增加顶部摘要区，展示标题、状态与关键时间
- 左主区拆成 4 张卡：审核工作台、展示信息、预览内容、原始 SOUL
- 右侧栏拆成 3 张卡：版权与联系、状态记录、修订历史
- 展示信息从原来的纯文本改成 chips / list / note card 混合结构
- 状态记录改为更清楚的状态流转呈现

### 2.3 审核动作区

文件：`src/components/admin-decision-form.tsx`

改动要点：

- 增加“处理说明”头部
- 把备注和 slug 输入包进独立表单卡片
- 将动作拆成“审核流转”和“发布动作”两段
- 为拒绝 / 通过 / 发布增加更明确的视觉层级
- 按提交中的动作显示“处理中 / 发布中”状态文案

### 2.4 样式层

文件：`src/app/globals.css`

改动要点：

- 新增 admin hero / KPI / tools card / pagination / detail hero / timeline / decision panel 样式
- 拉开 admin 页面卡片间距与容器 padding
- 优化表格 hover、行摘要、meta pills
- 优化详情页字段组、时间线、备注卡
- 补充后台专属响应式规则，避免窄屏溢出和按钮拥挤

### 2.5 服务层辅助

文件：`src/lib/submissions/service.ts`

改动要点：

- 新增 `getSubmissionStatusSummary()`
- 供列表页状态概览区读取各状态计数

## 3. 结果预期

落地后，后台体验会从“简陋可用”提升为“结构稳定、可连续处理任务”：

1. 列表页先看概览，再筛选，再查看明细
2. 详情页先处理审核动作，再判断内容质量，再看上下文资料
3. 长时间审核时，界面不再显得紧、挤、散
4. 多种状态与操作之间的关系更容易被快速理解

## 4. 验证方式

建议按以下顺序验证：

1. `npm run build`
2. 本地打开后台列表与详情页，检查：
   - 列表页状态概览、筛选、搜索、表格层级是否清晰
   - 详情页操作区与侧栏是否有足够呼吸感
   - 时间线是否清楚
   - 窄屏下是否有溢出
3. 如通过，再部署到 `tm-prod` 做线上回归
