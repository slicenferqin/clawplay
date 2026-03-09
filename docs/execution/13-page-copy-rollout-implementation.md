# 13 Page Copy Rollout Implementation

- Status: Done
- Depends On: `docs/execution/13-page-copy-rollout.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 关键决策收口

### 1.1 不重做结构，优先增强承接

这次不重构页面骨架，而是在现有结构上增强：

- 首页增加“为什么先来这里”的路径说明
- 安装页补足“先备份、可回滚、常见问题”
- 投稿页补足“首稿低门槛 + 审核重点”说明

### 1.2 以资产包为单一文案母稿

本次页面文案直接对齐：

- `docs/content/prelaunch-asset-pack.md`

避免页面、仓库、对外传播三套口径分裂。

## 2. 文件落点

本次修改：

- `src/components/hero-showcase.tsx`
- `src/app/page.tsx`
- `src/app/install/page.tsx`
- `src/app/submit/page.tsx`
- `src/components/soul-submission-form.tsx`
- `src/app/globals.css`

## 3. 具体实现

### 3.1 首页

- Hero 文案更聚焦“先看预览，再决定要不要装”
- 新增路径说明区，强调浏览 / 比较 / 安装 / 投稿闭环
- 强化首页 CTA 与安装引导条

### 3.2 安装页

- 增加装前建议卡
- 增加回滚与手动安装说明
- 增加简短 FAQ 与后续入口

### 3.3 投稿页

- 增加“首稿要做什么 / 审核会看什么”引导块
- 优化表单内低门槛提示与来源规则提示
- 强化支持 `.md` 文件导入的感知

## 4. 验证结果

- 页面结构与现有交互兼容
- 文案口径已与资产包对齐
- 未改动数据结构和提交流程

## 5. 后续建议

P4 第二刀完成后，继续推进：

1. P5 站点可信度补强
2. P6 增长侧准备
