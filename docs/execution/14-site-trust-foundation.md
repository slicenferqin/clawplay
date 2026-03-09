# 14 Site Trust Foundation

- Status: Ready
- Depends On: `docs/execution/08-filing-wait-priority-roadmap.md`, `docs/execution/12-open-source-repo-polish.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 背景

P5 的目标是让 ClawPlay 看起来不像“能跑的 demo”，而更像一个可信、可持续维护的项目。

现在仓库门面已经补了一刀，但网站本身还缺少一个面向普通访问者的可信度入口：

- 这个站是什么
- 这个站不是什么
- 投稿和审核按什么规则走
- 来源与授权怎么看
- 出问题或要反馈时往哪去

这些信息如果只留在 GitHub 文档里，对站内访问者来说仍然不够可见。

## 2. 目标

本阶段目标：

1. 在站内建立一个最小可信度页面。
2. 明确公开项目定位、来源规则、投稿审核原则与反馈入口。
3. 为网站补一个稳定的页脚入口，提升可发现性。
4. 同步更新 sitemap / robots 等基础入口。

## 3. 非目标

本阶段不做：

- 搭建完整帮助中心
- 做复杂工单系统
- 上监控面板可视化页面
- 公布过细的内部运维实现

## 4. 交付范围

本阶段交付：

1. `关于 ClawPlay` 页面
2. 全局页脚入口
3. `about` 页路由加入 sitemap / robots
4. 实施记录文档

## 5. 方案设计

### 5.1 最小可信度页面的内容结构

建议至少包含：

- ClawPlay 是什么
- ClawPlay 不是什么
- 来源与授权原则
- 投稿与审核规则
- 联系与安全反馈入口

### 5.2 可发现性策略

可信度页不应该藏在仓库里，因此需要：

- 顶部导航入口
- 页脚入口
- 安装页 / 投稿页可回链到该页

## 6. 验收标准

满足以下条件视为完成：

- 普通用户能在站内直接找到关于 / 规则入口
- 网站对项目定位和审核原则有明确公开说明
- 新页面已纳入 sitemap 与 robots

## 7. 结果记录

- 实施结果见：`docs/execution/14-site-trust-foundation-implementation.md`
