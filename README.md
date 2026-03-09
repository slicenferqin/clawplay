# ClawPlay

ClawPlay 是一个面向 OpenClaw 的中文 `SOUL.md` 目录与分享站。

它把零散的 Soul 内容整理成一个可浏览、可比较、可安装、可投稿的站点：先看简介、标签、预览和原文，再决定要不要装进自己的 OpenClaw。

## 当前定位

- 中文 Soul 目录站，而不是单纯文件堆放仓库
- 内容分享与审核平台，而不是自由生长的标签市场
- 站内投稿优先，GitHub PR 作为代码与文档协作入口

## 当前能力

- 浏览 Soul 列表、标签、分类与来源类型
- 查看 Soul 详情、原文、下载与一键安装命令
- 用户投稿 Soul，支持直接上传 `.md` 文件
- 管理后台审核、修订、发布与标签治理
- 基础 SEO、OG 图、`robots.txt`、`sitemap.xml`
- 基础分析、热度榜与域名 smoke 检查

## 在线入口

- 正式域名：<https://clawplay.club>
- 仓库：<https://github.com/slicenferqin/clawplay>

说明：域名以线上实际可访问状态为准；在备案或网络切换期间，GitHub 仓库仍是最稳定的公开入口。

## 快速感知 ClawPlay

如果你是第一次接触 ClawPlay，最简单的理解方式是：

1. 到网站浏览 Soul
2. 打开详情页看简介、标签、预览和原文
3. 复制安装命令，替换自己的 `SOUL.md`
4. 如果你调教出了更好的 Soul，再回到站内投稿分享

安装命令当前采用原始内容直链模式，例如：

```bash
curl -fsSL https://clawplay.club/api/raw/code-reviewer > ~/.openclaw/workspace/SOUL.md
```

## 本地开发

### 环境要求

- Node.js 20+
- npm 10+

### 启动步骤

```bash
npm install
cp .env.example .env.local
npm run dev
```

默认访问：<http://localhost:3000>

### 开发环境后台账号

如果未设置 `CLAWPLAY_ADMIN_PASSWORD`，非生产环境默认后台密码为：

```text
clawplay-admin
```

## 环境变量

项目当前使用的主要环境变量如下：

| 变量名 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 前端公开站点 URL，开发环境可设为 `http://localhost:3000` |
| `CLAWPLAY_SITE_URL` | 服务端用于 canonical / OG 的站点 URL |
| `CLAWPLAY_DATA_DIR` | SQLite 数据目录，默认是项目根目录下的 `data` |
| `CLAWPLAY_ANALYTICS_SALT` | 分析事件 IP hash 的盐值 |
| `CLAWPLAY_ADMIN_PASSWORD` | 后台登录密码 |
| `CLAWPLAY_ADMIN_SESSION_SECRET` | 后台 session 签名密钥 |

示例见：`.env.example`

## 常用命令

```bash
npm run dev
npm run build
npm run smoke:domain -- --host=http://127.0.0.1:3000 --expected-site-url=http://localhost:3000 --skip-dns --skip-pm2 --detail-slug=code-reviewer
npm run audit:translated-categories
npm run cleanup:translated-categories
```

## 项目结构

```text
src/                      Next.js 应用与业务逻辑
src/app/                  页面与 API 路由
src/components/           前端组件
src/lib/                  数据、SEO、安装、审核、分析等核心逻辑
docs/                     产品规划、实施记录、内容规范
community/                社区维护的静态 Soul 内容
translated/               已标注来源的翻译 Soul 内容
examples/                 模板与示例
scripts/                  运维与内容治理脚本
```

## 贡献方式

ClawPlay 现在有两条明确的贡献路径：

### 1. 内容投稿

如果你想分享自己调教的 Soul，优先使用站内投稿页：

- 网站投稿页：<https://clawplay.club/submit>
- 支持直接上传 `.md` 文件
- 支持补充标题、简介、标签、来源与授权说明
- 投稿后进入后台审核与发布流程

### 2. 代码 / 文档 / 规范贡献

如果你想修复 bug、改 UI、补文档、完善规范，请走 GitHub PR。

开始前建议先阅读：

- `CONTRIBUTING.md`
- `docs/execution/08-filing-wait-priority-roadmap.md`
- `docs/execution/README.md`

## 文档索引

### 规划与实施

- `docs/execution/08-filing-wait-priority-roadmap.md`
- `docs/execution/11-prelaunch-content-assets.md`
- `docs/execution/12-open-source-repo-polish.md`

### 内容治理

- `docs/content/metadata-spec.md`
- `docs/content/tag-dictionary.md`
- `docs/content/prelaunch-asset-pack.md`
- `docs/content/translated-category-audit.md`

### 原型与设计

- `docs/clawplay-mvp-ia-schema.md`
- `docs/clawplay-wireframes.md`

## 当前状态

当前主链路已经打通：

- P1 上线工程化：已完成
- P2 后台审核效率优化：已完成
- P3 标签治理闭环：已完成
- P4 发布前内容资产准备：已完成第一刀
- P5 站点可信度补强：待推进
- P6 增长侧准备：待推进

路线图见：`docs/execution/08-filing-wait-priority-roadmap.md`

## 开源与安全

- 协议：`MIT`
- 安全反馈：见 `SECURITY.md`

## 致谢

ClawPlay 参考并借鉴了许多已有实践，包括 OpenClaw 社区与 `souls.directory` 在目录化、可分享化上的思路。
