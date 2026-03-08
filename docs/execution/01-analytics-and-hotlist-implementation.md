# 01 Analytics and Hotlist Implementation

- Status: Ready
- Depends On: `docs/execution/01-analytics-and-hotlist.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-08

## 1. 这份文档解决什么问题

上一份文档已经回答了“为什么现在要先做埋点和热门榜”，这份文档继续往下走，专门回答 5 个实施问题：

1. 第一版到底选什么存储，不再摇摆。
2. 具体要新增哪些接口、模块和数据结构。
3. 哪些事件由前端上报，哪些事件由服务端兜底记录。
4. 热门榜第一版怎么计算，先服务内部判断，还是直接驱动首页。
5. 本轮开发应该按什么顺序落地，如何验收，如何回滚。

这份文档写完后，开发阶段就不再讨论方向，直接按这里的约束实施。

## 2. 核心决策摘要

### 决策 1：第一版使用 SQLite，不用 JSONL

选择 SQLite，原因如下：

1. 当前 ClawPlay 部署在自有服务器 `tm-prod`，不是无状态 Serverless，具备本地持久化文件条件。
2. 第 1 步虽然只做埋点和热门榜，但第 2 步就是投稿闭环，后面还会涉及注册登录、审核、状态流转，继续堆 JSONL 很快会失控。
3. 热门榜需要按事件、slug、时间窗口聚合，SQLite 的查询和维护成本明显低于 JSONL 二次扫描。
4. 用户量在早期不会大，SQLite 足够承接，而且迁移到更正式数据库时也比从 JSONL 迁移更顺。

结论：

- 第一版直接落 SQLite。
- 不再做 JSONL 过渡层。
- 后续如需升级 PostgreSQL，再做正式迁移。

### 决策 2：首页 Hero 第一版不自动接入热榜

当前首页 Hero 已经做得比较稳，且带有明确的品牌表达。如果现在就让热门榜直接控制首页推荐，会有两个问题：

1. 数据样本太少，波动会很大。
2. 首页推荐会从“精选”变成“随流量漂移”，损伤站点气质。

结论：

- 本阶段先产出热门榜数据。
- 热门榜先作为“内部参考能力”和后续可视化入口。
- 首页 Hero 先继续使用人工精选列表。
- 等满足阈值后，再评估是否切到“人工精选 + 热榜校准”的混合模式。

### 决策 3：采用“前端主动上报 + 服务端关键链路兜底”

不是所有事件都应该只靠前端，也不是所有事件都应该只靠服务端。

结论：

- 交互型事件：前端上报。
- 资源访问型事件：服务端记录。
- 页面浏览：前端上报，但做轻量去重。

这样能兼顾实现成本、准确性和后续维护性。

## 3. 当前代码与部署约束

### 3.1 当前代码约束

从现有仓库看，当前是一个非常轻的 Next.js 站点：

- 没有数据库层
- 没有 ORM
- 没有认证系统
- 只有一个资源型 API：`src/app/api/raw/[slug]/route.ts`
- 关键交互主要分布在：
  - `src/components/hero-showcase.tsx`
  - `src/components/featured-soul-card.tsx`
  - `src/components/install-command.tsx`
  - `src/components/copy-button.tsx`
  - `src/app/souls/[slug]/page.tsx`

这意味着第一版不能上来就引入很重的架构，而是要尽量：

- 模块清楚
- 依赖克制
- 接入点少但稳

### 3.2 当前部署约束

当前线上环境：

- 服务器：`tm-prod`
- 应用目录：`/root/apps/clawplay`
- 进程：`pm2` / `clawplay`
- 端口：`3010`

这意味着：

- 本地文件写入是可行的
- 部署时需要保证数据文件不被覆盖
- 数据目录应从代码目录结构中“逻辑隔离”，不要直接散落在源码树里

## 4. 第一版总体架构

### 4.1 数据目录

新增环境变量：

- `CLAWPLAY_DATA_DIR`

规则：

- 本地开发默认值：`<repo>/data`
- 生产建议值：`/root/apps/clawplay/data`

SQLite 文件：

- `analytics.sqlite`

最终路径示例：

- 本地：`/Users/slicenfer/Development/projects/self/clawplay/data/analytics.sqlite`
- 线上：`/root/apps/clawplay/data/analytics.sqlite`

注意：

- `data/` 目录加入 `.gitignore`
- 应用启动前如果目录不存在，自动创建
- 数据文件不纳入 Git 管理

### 4.2 模块拆分

第一版建议新增以下模块：

- `src/lib/analytics/db.ts`
  - 负责打开 SQLite、初始化表结构
- `src/lib/analytics/schema.ts`
  - 负责事件名、来源、字段类型等常量与类型定义
- `src/lib/analytics/track.ts`
  - 负责写入事件
- `src/lib/analytics/hotlist.ts`
  - 负责热门聚合与排序
- `src/lib/analytics/session.ts`
  - 负责生成和读取匿名会话标识
- `src/lib/analytics/client.ts`
  - 前端统一埋点调用入口

如需最小化文件数，也可以把 `session.ts` 并入 `client.ts`，但不建议把所有逻辑塞进一个文件里。

### 4.3 接口层

第一版只新增两个新接口，并增强一个旧接口：

1. `POST /api/events`
   - 前端交互事件上报入口
2. `GET /api/hotlist`
   - 输出热门榜数据，先服务内部使用
3. `GET /api/raw/[slug]`
   - 在现有 raw 接口中补齐访问埋点

## 5. 数据模型

### 5.1 事件表

第一版只建立一张明细表：`analytics_events`

建议字段如下：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | TEXT | 是 | 事件主键，UUID |
| `event_name` | TEXT | 是 | 事件名 |
| `slug` | TEXT | 否 | 关联 soul slug |
| `source` | TEXT | 是 | 来源页面或模块 |
| `placement` | TEXT | 否 | 具体触发位置 |
| `path` | TEXT | 否 | 当前页面路径 |
| `session_id` | TEXT | 否 | 匿名会话标识 |
| `user_agent` | TEXT | 否 | 服务端从请求头提取 |
| `referer` | TEXT | 否 | 来源页 |
| `ip_hash` | TEXT | 否 | IP 哈希，明文 IP 不落库 |
| `meta_json` | TEXT | 否 | 扩展字段 JSON |
| `created_at` | TEXT | 是 | 服务端写入时间 |

说明：

- `created_at` 一律由服务端写入，不接受客户端自带时间戳。
- `ip_hash` 只用于后续去重或简单防刷判断，不存原始 IP。
- `meta_json` 只放少量补充信息，不做杂物堆放。

### 5.2 索引

第一版建立以下索引即可：

1. `idx_analytics_events_created_at`
   - 按时间查询
2. `idx_analytics_events_slug_created_at`
   - 按 soul 聚合
3. `idx_analytics_events_name_slug_created_at`
   - 按事件名 + slug + 时间窗口聚合

第一版不建立复杂复合索引，先保持维护简单。

### 5.3 事件枚举

第一版只允许以下事件入库：

1. `home_hero_view`
2. `hero_soul_preview_click`
3. `hero_install_copy`
4. `soul_detail_view`
5. `detail_install_copy`
6. `detail_raw_open`
7. `detail_raw_download`
8. `detail_raw_copy`

如果后面需要加事件，先改 `schema.ts` 和文档，再加实现，不允许在业务代码里随手写字符串。

### 5.4 source 枚举

第一版建议统一收敛到以下来源值：

- `home_hero`
- `soul_detail`
- `soul_detail_raw_panel`
- `unknown`

说明：

- `source` 用于区分“页面/模块级来源”。
- `placement` 用于区分“同一页面内的具体按钮位置”。
- 不要把这两个维度混在一起。

## 6. 事件生产规则

### 6.1 前端上报的事件

以下事件由前端触发 `POST /api/events`：

1. `home_hero_view`
2. `hero_soul_preview_click`
3. `hero_install_copy`
4. `soul_detail_view`
5. `detail_install_copy`
6. `detail_raw_copy`

原因：

- 这些都属于明确交互，前端最容易知道用户是否真的完成了动作。
- 尤其是复制动作，必须以前端成功执行为准。

### 6.2 服务端记录的事件

以下事件由服务端在资源接口层直接记录：

1. `detail_raw_open`
2. `detail_raw_download`

落点：

- `src/app/api/raw/[slug]/route.ts`

原因：

- 这是资源访问行为，服务端最清楚请求是否真的发生。
- 即使用户禁用了前端脚本，也不会漏记。

### 6.3 浏览类事件的去重规则

第一版只对浏览类事件做非常轻的去重：

### `home_hero_view`

规则：

- 同一浏览器 tab 生命周期内，只记录一次。
- 使用 `sessionStorage` 做前端去重。

### `soul_detail_view`

规则：

- 同一浏览器 tab 内，同一 `slug` 只记录一次。
- 使用 `sessionStorage`，key 中带上 `slug`。

说明：

- 第一版不做跨设备、跨浏览器、跨天精确去重。
- 目标不是“广告监测级精确”，而是拿到稳定趋势。

### 6.4 动作类事件的规则

以下动作不做额外去重：

- 复制安装命令
- 复制原文
- 点击看预览
- 打开 raw
- 下载 raw

原因：

- 这些都是高意图动作。
- 早期流量小，过早做复杂去重会拉高实现成本。
- 真的出现异常噪音时，再追加简单时间窗口限流。

## 7. 热门榜计算规则

### 7.1 统计窗口

第一版热门榜默认统计最近 30 天。

接口支持通过 query 覆盖：

- `days=7`
- `days=30`
- `days=90`

但首页和内部默认都使用 `30`。

### 7.2 计分公式

第一版继续沿用上一份文档的加权思想，并做一个小收口：

```text
hot_score =
  soul_detail_view * 1
+ hero_soul_preview_click * 2
+ install_copy_total * 3
+ detail_raw_download * 2
+ detail_raw_copy * 1
```

其中：

```text
install_copy_total = hero_install_copy + detail_install_copy
```

说明：

- `soul_detail_view`：基础兴趣
- `hero_soul_preview_click`：从首页展示进入详情，说明吸引力较强
- `install_copy_total`：最高意图行为
- `detail_raw_download`：用户希望落到本地操作，意图较高
- `detail_raw_copy`：有一定意图，但低于安装和下载

### 7.3 不进入第一版分数的事件

`detail_raw_open` 暂时记录，但不进入第一版 `hot_score`。

原因：

- raw 打开更像“进一步查看”，介于详情浏览和下载之间。
- 在当前样本很少的阶段，把它直接纳入分数容易稀释“安装意图”的权重。

后续如果发现用户确实大量通过 raw 判断是否安装，再考虑把它加进公式。

### 7.4 排序与兜底规则

第一版排序规则：

1. 先按 `hot_score` 降序
2. 若分数相同，按 `install_copy_total` 降序
3. 若仍相同，按 `soul_detail_view` 降序
4. 若仍相同，按 `slug` 升序

另外增加一个最小阈值：

- 某个 soul 在统计窗口内总事件数 `< 3` 时，不进入“正式热门榜”
- 但接口仍可返回，只需标注 `isQualified = false`

这样可以避免零星偶然点击直接把榜单带偏。

## 8. 接口契约

### 8.1 `POST /api/events`

请求体：

```json
{
  "eventName": "detail_install_copy",
  "slug": "edict-counselor",
  "source": "soul_detail",
  "placement": "header_install",
  "path": "/souls/edict-counselor",
  "meta": {
    "variant": "light"
  }
}
```

服务端行为：

- 校验 `eventName` 是否在白名单中
- 校验 `slug` 是否存在（若该事件要求 slug）
- 自动补：
  - `created_at`
  - `user_agent`
  - `referer`
  - `ip_hash`
  - `session_id`
- 返回：

```json
{ "ok": true }
```

失败返回：

```json
{ "ok": false, "error": "invalid_event" }
```

### 8.2 `GET /api/hotlist`

Query：

- `days`：默认 `30`
- `limit`：默认 `10`

返回结构建议：

```json
{
  "windowDays": 30,
  "generatedAt": "2026-03-08T12:00:00.000Z",
  "items": [
    {
      "slug": "edict-counselor",
      "title": "三省六部·御用谋士",
      "hotScore": 18,
      "isQualified": true,
      "counts": {
        "detailView": 6,
        "heroPreviewClick": 2,
        "installCopy": 2,
        "rawDownload": 1,
        "rawCopy": 0,
        "rawOpen": 3
      }
    }
  ]
}
```

说明：

- 这个接口第一版主要给内部查看和后续首页接入预留。
- 第一版不做独立热门榜页面。
- 如果需要快速人工检查，可直接访问 JSON。

### 8.3 `GET /api/raw/[slug]`

现有 raw 接口增强后，约定增加 query 参数：

- `download=1`：下载模式
- `source=soul_detail`：来源页面
- `placement=header_raw_link`：触发位置

示例：

- 查看原文：`/api/raw/edict-counselor?source=soul_detail&placement=header_raw_link`
- 下载原文：`/api/raw/edict-counselor?download=1&source=soul_detail&placement=sidebar_download`

服务端规则：

- `download=1` -> 记录 `detail_raw_download`
- 其他情况 -> 记录 `detail_raw_open`

## 9. 组件接入细化

### 9.1 首页 Hero：`src/components/hero-showcase.tsx`

接入点：

1. 组件挂载后，触发一次 `home_hero_view`
2. 不跟随轮播的 soul 切换反复打点

原因：

- 我们要统计的是“Hero 模块被看到”，不是轮播切换次数。
- 否则动效本身会制造虚假曝光。

### 9.2 Hero 卡片：`src/components/featured-soul-card.tsx`

接入点：

1. “复制安装”按钮 -> `hero_install_copy`
   - `source=home_hero`
   - `placement=spotlight_install`
2. “看预览”链接 -> `hero_soul_preview_click`
   - `source=home_hero`
   - `placement=spotlight_preview`

### 9.3 安装命令组件：`src/components/install-command.tsx`

不要把埋点硬编码在组件内部默认逻辑里，而是做成可选参数：

建议新增可选 props：

- `analyticsEventName?`
- `analyticsSource?`
- `analyticsPlacement?`
- `analyticsSlug?`

原因：

- `InstallCommand` 现在被首页、详情页多个位置复用。
- 埋点语义依赖上下文，不应该让组件自己猜。

### 9.4 复制按钮：`src/components/copy-button.tsx`

建议也支持可选埋点参数，但只在复制成功后触发。

建议新增可选 props：

- `analyticsEventName?`
- `analyticsSource?`
- `analyticsPlacement?`
- `analyticsSlug?`
- `analyticsMeta?`

关键规则：

- 复制失败不记成功事件。
- 复制成功后异步上报，不阻塞按钮提示。

### 9.5 详情页：`src/app/souls/[slug]/page.tsx`

接入点：

1. 页面进入 -> `soul_detail_view`
2. 顶部“复制安装命令” -> `detail_install_copy`
3. 侧栏“复制命令” -> `detail_install_copy`
4. “复制原文” -> `detail_raw_copy`
5. “查看原始 SOUL” 与 “打开原始 SOUL” -> 使用带 query 的 raw 链接，由服务端记录 `detail_raw_open`
6. “下载 SOUL.md” -> 使用带 query 的 raw 下载链接，由服务端记录 `detail_raw_download`

补充说明：

- 同一页面的多个按钮，事件名可以相同，但 `placement` 要区分。
- 例如：
  - `header_install`
  - `sidebar_install`
  - `raw_panel_copy`
  - `sidebar_raw_copy`

## 10. 代码层实施顺序

### Task A：搭建 SQLite 基础设施

目标：

- 能创建数据目录
- 能创建数据库文件
- 能初始化 `analytics_events` 表和索引

涉及文件：

- `src/lib/analytics/db.ts`
- `src/lib/analytics/schema.ts`
- `.gitignore`

完成定义：

- 本地启动后数据库文件可自动建立
- 重启服务不会重复建表报错

### Task B：完成事件写入入口

目标：

- 实现 `POST /api/events`
- 实现统一的 `trackEvent()` 服务端写入方法
- 实现前端 `trackClientEvent()` 调用方法

涉及文件：

- `src/app/api/events/route.ts`
- `src/lib/analytics/track.ts`
- `src/lib/analytics/client.ts`
- `src/lib/analytics/session.ts`

完成定义：

- 浏览器交互能成功写入一条事件
- 非法事件名被拒绝

### Task C：接入首页与详情页关键事件

目标：

- 首页 Hero、Hero 卡片、详情页、复制链路全部接入
- raw 查看 / 下载改走带来源参数的链接

涉及文件：

- `src/components/hero-showcase.tsx`
- `src/components/featured-soul-card.tsx`
- `src/components/install-command.tsx`
- `src/components/copy-button.tsx`
- `src/app/souls/[slug]/page.tsx`
- `src/app/api/raw/[slug]/route.ts`

完成定义：

- 手工走一遍关键路径后，数据库里能看到完整事件链

### Task D：实现热门榜读取

目标：

- 基于事件表按窗口聚合生成热门榜
- 提供 `GET /api/hotlist`

涉及文件：

- `src/lib/analytics/hotlist.ts`
- `src/app/api/hotlist/route.ts`

完成定义：

- 能拿到按 `hot_score` 排序的 JSON 数据
- 结果包含每个 soul 的分项计数

### Task E：补充运维与验证文档

目标：

- 写明数据目录、备份方式、验证命令、部署注意项

建议补充：

- 在本文件结果记录中追加实际实现差异
- 如有必要，再新增 `docs/ops/analytics.md`

## 11. 验证方案

### 11.1 本地验证路径

开发完成后，至少手工走完以下路径：

1. 打开首页 -> 检查是否写入 `home_hero_view`
2. 首页 Hero 点击“看预览” -> 检查 `hero_soul_preview_click`
3. 首页 Hero 点击“复制安装”并复制成功 -> 检查 `hero_install_copy`
4. 打开任一详情页 -> 检查 `soul_detail_view`
5. 详情页复制安装命令 -> 检查 `detail_install_copy`
6. 详情页复制原文 -> 检查 `detail_raw_copy`
7. 详情页查看 raw -> 检查 `detail_raw_open`
8. 详情页下载 raw -> 检查 `detail_raw_download`
9. 访问 `/api/hotlist` -> 检查统计结果是否与事件明细一致

### 11.2 重点检查项

重点不是“有没有日志”，而是这几件事：

1. 页面交互有没有被上报阻塞
2. 复制失败时是否误记成功
3. `raw open` 和 `raw download` 是否被正确区分
4. 热门榜聚合是否与实际事件数量对得上
5. 数据目录权限在本地和线上是否都正常

## 12. 上线与回滚

### 12.1 上线前准备

上线前确认：

1. `CLAWPLAY_DATA_DIR` 已配置
2. 目录存在且对应用进程可写
3. `.gitignore` 已忽略 `data/`
4. 线上启动用户能正常创建 SQLite 文件

### 12.2 上线步骤

1. 合并并部署代码
2. 重启 `pm2` 进程
3. 访问首页与一个详情页
4. 直接检查数据库是否已有事件写入
5. 请求 `/api/hotlist` 校验结果结构

### 12.3 回滚策略

如果上线出现问题，按以下顺序回滚：

1. 回退本次提交
2. 保留 SQLite 文件，不删历史数据
3. 如有必要，临时让 `POST /api/events` 直接返回成功但不写入
4. 待问题定位清楚后再恢复埋点

说明：

- 埋点不应该影响主站浏览与安装流程。
- 一旦发现写库异常影响主流程，应优先保证站点可用。

## 13. 暂不纳入第一版的事项

以下内容明确延后，不在本轮实现范围内：

- 登录用户归因
- 独立运营后台
- 第三方分析平台接入
- 复杂防刷机制
- 首页 Hero 自动吃热榜
- A/B 测试
- 热门榜前台可视化页面

## 14. 结果记录

### 实际提交

- 待补充

### 实际偏差

- 待补充

### 后续优化项

- 待补充
