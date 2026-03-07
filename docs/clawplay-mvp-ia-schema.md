# ClawPlay MVP IA + Schema

## 先做什么

结论：**先定义 `IA + schema`，再画低保真原型。**

原因很直接：

1. `schema` 决定每个 soul 需要展示什么信息。
2. `IA` 决定这些信息放在哪个页面、通过什么路径被找到。
3. 原型图只是把前两者可视化。如果数据字段没定，原型图很容易沦为空壳。

建议顺序：

1. `MVP IA + schema`
2. `Low-fi wireframes`
3. `Next.js` 站点骨架
4. `install` CLI 原型
5. 登录、投稿、审核后台

## MVP 目标

ClawPlay 第一阶段不是做一个完整社区，而是做一个**中文 Soul 目录站 + 安装入口**。

MVP 核心目标只有 3 个：

1. 用户能快速找到适合自己的 soul。
2. 用户能在详情页判断这个 soul 值不值得试。
3. 用户能拿到明确、低门槛的安装命令。

## 非目标

以下内容不进入第一版 MVP：

- 评论系统
- 用户关注关系
- 作者主页系统
- 付费下载
- 开放式直接发布
- 复杂推荐算法

这些都可以等有真实流量后再加。

## 核心用户

### 1. 安装型用户

诉求：快速找一个能用、好玩的 soul，复制命令就安装。

### 2. 比较型用户

诉求：比较多个 soul 的风格、适用场景、模型兼容性和示例效果。

### 3. 投稿型作者

诉求：把自己调过的 soul 提交进站点，被更多人看到。

MVP 阶段优先满足前两类，第三类先走**审核式投稿**。

## 信息架构

### 路由地图

```text
/                         首页
/souls                    Soul 列表页
/souls/[slug]             Soul 详情页
/categories/[slug]        分类页
/tags/[slug]              标签页
/install                  安装说明页
/submit                   投稿说明页（表单或引导）
/api/raw/[slug]           输出纯 SOUL.md
/api/install/[slug]       输出安装元数据
```

Phase 2 再增加：

```text
/login                    登录
/me                       我的页面
/submit/new               投稿页
/admin/review             审核后台
```

## 页面定义

### 1. 首页 `/`

目标：让用户在 10 秒内理解 ClawPlay 是什么，并进入搜索或详情。

模块：

- 顶部导航：Logo、搜索、分类、安装说明、投稿
- Hero：一句话价值主张 + 搜索框
- 精选 Soul：3-6 个卡片
- 热门分类：工作、开发、学习、创意
- 最近更新：最近新增或改版的 soul
- 安装说明入口：引导到 CLI / 手动安装

### 2. Soul 列表页 `/souls`

目标：支持浏览、筛选、搜索、比较。

模块：

- 顶部搜索框
- 筛选器：分类、标签、语气、兼容模型、来源类型
- 排序：推荐、最新、热门
- Soul 卡片列表
- 空结果态

### 3. Soul 详情页 `/souls/[slug]`

目标：让用户完成判断和安装。

模块：

- 基础信息区：标题、摘要、标签、作者、许可证、更新时间
- 预览卡片区：适合谁、风格、典型任务、兼容性
- 对话预览区：2-3 组示例对话
- 安装区：一键安装命令、手动安装说明、回滚说明
- 原始内容区：SOUL.md 摘要 / 折叠展示 / raw 链接
- 相关推荐：相似 soul

### 4. 分类页 `/categories/[slug]`

目标：服务内容发现和 SEO。

模块与列表页相近，但顶部增加分类说明。

### 5. 安装说明页 `/install`

目标：降低首次上手成本。

模块：

- OpenClaw 使用前提
- 手动安装步骤
- CLI 安装步骤
- 备份和回滚说明
- 常见问题

### 6. 投稿说明页 `/submit`

目标：先承接作者投稿意愿，不急着做复杂发布系统。

MVP 可以是：

- GitHub Issue Form
- 简单网页表单
- 邮箱 / 飞书 / Discord 引导

## 核心用户流

### 发现流

```text
首页 -> 搜索 / 分类 -> Soul 列表 -> Soul 详情 -> 复制安装命令
```

### 比较流

```text
Soul 列表 -> 多个详情页来回看 -> 安装其中一个
```

### 投稿流（MVP）

```text
首页 / submit -> 查看规范 -> 提交表单或 Issue -> 管理员审核 -> 上线
```

## Soul 内容模型

建议把现有 Markdown 升级为：**Frontmatter + Markdown 正文**。

### 文件位置建议

```text
content/souls/<slug>.md
```

过渡期也可以继续沿用当前目录，但建议最终统一到一个内容目录，避免展示逻辑和分类目录耦合。

### Frontmatter Schema

```yaml
slug: catgirl-nova
title: 猫娘 Nova
summary: 傲娇但靠谱的猫娘助手，适合聊天、写作和轻技术问答。
category: creative
subcategories:
  - companion
tags:
  - 猫娘
  - 二次元
  - 陪伴
  - 轻技术
tone:
  - playful
  - tsundere
  - warm
use_cases:
  - 日常聊天
  - 情绪陪伴
  - 创意写作
  - 轻量编程问答
compatible_apps:
  - openclaw
compatible_models:
  - claude-sonnet
  - claude-opus
language: zh-CN
author:
  name: ClawPlay 社区
  url: https://github.com/slicenferqin/clawplay
source_type: original
source_url: null
license: CC BY 4.0
created_at: 2026-03-06
updated_at: 2026-03-06
version: 1.0.0
featured: true
draft: false
install:
  support:
    - manual
    - cli
  cli_slug: catgirl-nova
preview:
  hook: 可爱人设不降智，聊天和轻技术都顺手。
  best_for:
    - 喜欢有角色感的助手
    - 希望回答别太死板
  sample_prompts:
    - 今天心情很差，陪我聊聊
    - 帮我想一个短篇故事开头
    - 给我解释 RESTful API
  sample_outputs:
    - 带动作描写和轻微口癖，但回答仍然准确
hero_order: 10
seo:
  title: 猫娘 Nova - ClawPlay
  description: 傲娇可爱的猫娘助手 Soul，适合聊天、写作和轻技术问答。
```

### 正文区块建议

正文建议统一成以下结构，便于渲染详情页：

```md
## 简介
## 适用场景
## 特色功能
## 使用建议
## 示例对话
## SOUL.md 内容
```

## TypeScript 类型建议

```ts
export type SoulCategory =
  | "work"
  | "dev"
  | "learning"
  | "creative"
  | "translated";

export type SoulSourceType = "original" | "translated" | "remix";

export interface SoulPreview {
  hook: string;
  best_for: string[];
  sample_prompts: string[];
  sample_outputs: string[];
}

export interface SoulInstallMeta {
  support: Array<"manual" | "cli">;
  cli_slug?: string;
}

export interface SoulAuthor {
  name: string;
  url?: string;
}

export interface SoulFrontmatter {
  slug: string;
  title: string;
  summary: string;
  category: SoulCategory;
  subcategories?: string[];
  tags: string[];
  tone: string[];
  use_cases: string[];
  compatible_apps: string[];
  compatible_models: string[];
  language: string;
  author: SoulAuthor;
  source_type: SoulSourceType;
  source_url?: string | null;
  license: string;
  created_at: string;
  updated_at: string;
  version: string;
  featured?: boolean;
  draft?: boolean;
  install: SoulInstallMeta;
  preview: SoulPreview;
  hero_order?: number;
  seo?: {
    title?: string;
    description?: string;
  };
}
```

## 搜索索引字段

搜索不需要全文一开始就做很重，MVP 用前端轻搜索即可。

建议建立索引字段：

- `slug`
- `title`
- `summary`
- `category`
- `tags`
- `tone`
- `use_cases`
- `compatible_models`
- `author.name`

搜索策略：

- 标题和标签权重最高
- 摘要和 use case 次高
- 作者名低权重

## 详情页渲染字段映射

### 顶部信息

- `title`
- `summary`
- `tags`
- `author`
- `license`
- `updated_at`

### 预览卡片

- `preview.hook`
- `preview.best_for`
- `tone`
- `use_cases`
- `compatible_models`

### 安装区

- `install.support`
- `install.cli_slug`
- `slug`

### SEO

- `seo.title`
- `seo.description`

## CLI 安装契约

网站先约定好 CLI 需要的数据格式，后面做安装器会顺很多。

### `GET /api/install/[slug]`

返回示例：

```json
{
  "slug": "catgirl-nova",
  "title": "猫娘 Nova",
  "version": "1.0.0",
  "raw_url": "https://clawplay.dev/api/raw/catgirl-nova",
  "checksum": "sha256-placeholder",
  "install_command": "npx clawplay install catgirl-nova",
  "manual_install": {
    "step": "copy",
    "target": "SOUL.md"
  }
}
```

### `GET /api/raw/[slug]`

返回纯 SOUL 内容，供 CLI 或用户手动复制使用。

## 投稿模型

MVP 不建议直接公开写库。

建议投稿字段：

- `title`
- `summary`
- `category`
- `tags`
- `author_name`
- `author_contact`
- `source_type`
- `source_url`
- `license`
- `soul_content`
- `proof_of_authority`

处理方式：先进入待审核队列，再人工整理成正式 soul 文件。

## 后续数据库模型

Phase 2 再上数据库时，可拆成：

- `souls`
- `users`
- `submissions`
- `favorites`
- `copy_events`
- `install_events`

MVP 不需要先把这些表建出来。

## 成功指标

MVP 阶段只盯这几项：

- 首页到详情页点击率
- 详情页到安装命令复制率
- `api/raw` 访问量
- 搜索使用率
- 每个 soul 的安装率

## 推荐实施顺序

1. 先把现有 8 个 soul 统一成 frontmatter 结构。
2. 用 `Next.js` 直接读取 Markdown 渲染站点。
3. 做首页、列表页、详情页、安装页。
4. 加前端搜索和筛选。
5. 增加 `api/raw/[slug]` 和安装命令展示。
6. 再做 CLI 原型。
7. 最后再接登录和投稿审核。
