# 12 Open Source Repo Polish Implementation

- Status: Done
- Depends On: `docs/execution/12-open-source-repo-polish.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 关键决策收口

### 1.1 先做仓库门面收口，而不是继续堆功能

原因：

- 第一颗 star 已经出现，说明仓库开始承担“公开门面”职责
- 域名备案未完全放开时，GitHub 仓库仍是高权重入口
- README、CONTRIBUTING、SECURITY、环境示例的投入小，但信任收益高

### 1.2 README 采用网站优先结构

本次 README 按下面顺序组织：

1. 项目定位
2. 当前能力
3. 在线入口
4. 本地开发
5. 环境变量
6. 贡献路径
7. 文档索引

### 1.3 贡献路径从单一路径改为双路径

- 网站投稿：适合提交 Soul 内容
- GitHub PR：适合代码、文档、规范、脚本修改

## 2. 文件落点

本次修改 / 新增：

- `README.md`
- `CONTRIBUTING.md`
- `.env.example`
- `SECURITY.md`
- `docs/execution/12-open-source-repo-polish.md`
- `docs/execution/12-open-source-repo-polish-implementation.md`

## 3. 具体实现

### 3.1 README

重点调整：

- 从“SOUL 仓库介绍”改为“ClawPlay 网站项目介绍”
- 补齐本地启动、环境变量、命令、文档索引
- 强化产品现状和路线图可见性

### 3.2 CONTRIBUTING

重点调整：

- 明确站内投稿优先
- PR 聚焦代码、文档与基础设施
- 保留翻译 / 来源 / 授权要求

### 3.3 SECURITY

采用轻量安全反馈流程：

- 敏感问题不建议公开提 issue
- 优先走 GitHub 私密安全渠道或私下联系仓库 owner
- 说明基本响应预期

### 3.4 .env.example

列出当前项目真实使用的环境变量，避免本地启动靠猜。

## 4. 验证结果

本次为文档与示例文件调整，不涉及运行时代码改动。

已验证：

- 文案与当前产品定位一致
- 环境变量覆盖当前代码真实用量
- 贡献路径与现有网站投稿流程一致

## 5. 后续建议

仓库门面收口完成后，继续回到主线：

1. P4 第二刀：把内容资产回填到页面
2. P5：站点可信度补强
3. P6：增长侧准备
