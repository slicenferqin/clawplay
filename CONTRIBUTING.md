# Contributing to ClawPlay

感谢你关注 ClawPlay。

ClawPlay 是一个面向 OpenClaw 的中文 `SOUL.md` 目录与分享站。当前贡献路径分为两类：

1. **内容投稿**：通过站内投稿页提交 Soul
2. **代码 / 文档 / 规范协作**：通过 GitHub PR 提交改动

## 先选对贡献路径

### 适合站内投稿的内容

如果你要做的是下面这些，优先使用网站投稿：

- 分享原创 Soul
- 提交翻译 Soul
- 提交改编 Soul
- 上传原始 `.md` 文件
- 补充预览、标签、简介、来源和授权信息

投稿入口：<https://clawplay.club/submit>

### 适合 GitHub PR 的内容

如果你要做的是下面这些，走 GitHub PR：

- 修复 bug
- 改进前端页面或后台体验
- 补文档、脚本、规范
- 改进内容治理、审核流程、SEO、部署脚本
- 修复仓库内静态示例或模板

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 准备环境变量

```bash
cp .env.example .env.local
```

### 3. 启动开发环境

```bash
npm run dev
```

默认地址：<http://localhost:3000>

如果你没有设置 `CLAWPLAY_ADMIN_PASSWORD`，开发环境默认后台密码为：

```text
clawplay-admin
```

## 提交代码 PR 的建议流程

### 1. 先理解当前路线图和文档

建议先看：

- `README.md`
- `docs/execution/README.md`
- `docs/execution/08-filing-wait-priority-roadmap.md`

如果你的改动属于一个新阶段或新主题，建议先补规划文档，再做实现。

### 2. 创建分支

```bash
git checkout -b your-change-name
```

### 3. 开发与自检

至少执行与你改动相关的最小验证，例如：

```bash
npm run build
```

如涉及域名、SEO、部署与路由校验，可执行：

```bash
npm run smoke:domain -- --host=http://127.0.0.1:3000 --expected-site-url=http://localhost:3000 --skip-dns --skip-pm2 --detail-slug=code-reviewer
```

### 4. 提交 PR

PR 描述建议包含：

- 改了什么
- 为什么改
- 怎么验证的
- 是否影响页面、审核流程、SEO 或内容治理

## 内容与版权要求

### 原创内容

- 需要明确使用场景和目标用户
- 需要有清晰的个性与能力边界
- 需要经过实际使用或最少自测

### 翻译 / 改编内容

- 必须标注原作者与原链接
- 必须说明来源类型
- 必须确认原内容的许可协议或授权条件
- 不要把无授权内容伪装成原创内容

## 标签与内容治理

ClawPlay 当前不开放“用户创建即公开生效”的正式标签机制。

- 用户可以提议标签
- 后台会归并、收录或驳回标签建议
- 前台展示 canonical tags

如果你要修改标签词表或内容规范，请同步查看：

- `docs/content/tag-dictionary.md`
- `docs/content/metadata-spec.md`
- `docs/execution/10-tag-governance-closed-loop.md`

## 行为与协作预期

- 尊重原创者、翻译者和维护者
- 对版权、来源和授权保持谨慎
- 保持讨论具体、克制、建设性
- 尽量提交聚焦、易审阅的小改动

## 不建议的贡献方式

- 未经说明的大范围重构
- 顺手修一堆无关问题的大杂烩 PR
- 未标来源的翻译内容
- 把敏感配置、真实生产数据提交进仓库

## 需要帮助

- 一般问题：GitHub Issues
- 方案讨论：GitHub Discussions 或先开 issue 对齐方向
- 安全问题：见 `SECURITY.md`
