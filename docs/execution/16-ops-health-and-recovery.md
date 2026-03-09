# 16 Ops Health And Recovery

- Status: Ready
- Depends On: `docs/execution/08-filing-wait-priority-roadmap.md`, `docs/execution/14-site-trust-foundation.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 背景

P5 第一刀已经把站内可信度入口补上了，但“可信”不只是有关于页。

当前还缺两块非常实际的运维能力：

- 应用出问题时，能不能快速知道是页面挂了、数据目录坏了，还是数据库本身有问题
- 发布前后，能不能低成本做一次数据备份，并有明确的回滚抓手

在域名备案等待期，这类工作比继续堆新页面更值得先补。

## 2. 目标

本阶段目标：

1. 提供一个轻量、可脚本化的健康检查入口。
2. 提供一个最小可用的数据备份命令。
3. 把备份与回滚流程写成明确文档，而不是只靠口头记忆。
4. 让现有 `smoke:domain` 把健康检查纳入标准验收链路。

## 3. 非目标

本阶段不做：

- 监控平台
- 告警系统
- 自动定时备份服务
- 多机房容灾
- 复杂运维后台

目标是“足够稳、足够可排障”，不是把 ClawPlay 做成运维平台。

## 4. 交付范围

1. `GET /api/health` 健康检查接口
2. `npm run backup:data` 数据备份脚本
3. `smoke:domain` 接入健康检查
4. 一份备份 / 回滚 / 验证执行文档
5. README 状态与文档索引更新

## 5. 方案设计

### 5.1 健康检查接口只回答最关键的问题

接口最少回答：

- 站点 URL 配置是否可解析
- 数据目录是否可访问
- SQLite 主文件是否可读取
- 核心表查询是否正常

返回 JSON，适合：

- 运维脚本调用
- smoke check 调用
- 人工排障查看

### 5.2 备份脚本只备“真正关键的数据”

当前 ClawPlay 的关键运行数据集中在：

- `data/analytics.sqlite`
- `data/analytics.sqlite-wal`
- `data/analytics.sqlite-shm`

脚本按时间戳生成备份目录，并写入 `manifest.json`，确保备份结果可追溯。

### 5.3 回滚以“人工可执行”为原则

不做自动一键回滚系统，采用清晰的手动回滚路径：

1. 先备份当前线上数据
2. 停应用或进入低流量窗口
3. 用备份文件覆盖数据库文件
4. 重启 PM2
5. 跑 `smoke:domain`

## 6. 实施拆解

1. 新增健康检查 API
2. 新增数据备份脚本
3. 扩展 smoke check
4. 补执行与回滚文档
5. README 更新

## 7. 验收标准

满足以下条件即可视为完成：

1. `GET /api/health` 可返回结构化 JSON
2. 健康检查失败时返回非 `200`
3. `npm run backup:data` 能生成时间戳备份目录与 `manifest.json`
4. `smoke:domain` 默认纳入健康检查
5. 文档里写清备份、恢复、发布后验证步骤

## 8. 上线与回滚

### 上线顺序

1. 先发健康检查和备份脚本
2. 再更新 smoke check
3. 最后补 README 与执行文档

### 回滚策略

- 健康检查 API / smoke 脚本回滚不影响核心业务
- 备份脚本是离线工具，可独立回滚
- 如果本次发布出现异常，优先使用最近一次数据备份恢复，再回滚代码版本

## 9. 结果记录

- 实施结果见：`docs/execution/16-ops-health-and-recovery-implementation.md`
