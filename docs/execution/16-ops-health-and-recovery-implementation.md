# 16 Ops Health And Recovery Implementation

- Status: Done
- Depends On: `docs/execution/16-ops-health-and-recovery.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 关键决策收口

### 1.1 健康检查只覆盖最关键基础项

本次没有做复杂监控，而是把真正能帮助排障的几个点收口为统一接口：

- 站点 URL 配置
- 数据目录可访问性
- SQLite 主文件可读取
- 核心表查询可执行

### 1.2 备份先聚焦 SQLite 数据文件

ClawPlay 当前最关键的运行数据都在 SQLite 文件组里，因此本次备份脚本只覆盖：

- `analytics.sqlite`
- `analytics.sqlite-wal`
- `analytics.sqlite-shm`

这样交付足够小，也能真正用于恢复。

## 2. 文件落点

本次修改 / 新增：

- `src/app/api/health/route.ts`
- `scripts/ops/backup-data.mjs`
- `scripts/ops/domain-smoke-check.mjs`
- `package.json`
- `README.md`
- `docs/execution/16-ops-health-and-recovery.md`
- `docs/execution/16-ops-health-and-recovery-implementation.md`

## 3. 具体实现

### 3.1 健康检查接口

新增 `GET /api/health`：

- 返回 `status: ok | degraded`
- 返回每项检查结果
- 返回数据目录与数据库路径摘要
- 失败时返回 `503`

### 3.2 数据备份脚本

新增：

- `npm run backup:data`

行为：

- 在 `backups/` 下生成时间戳目录
- 复制现有 SQLite 文件组
- 生成 `manifest.json`
- 可选 `--include-env=true` 一并备份 `.env.production.local`

### 3.3 Smoke Check 接入

`smoke:domain` 现在会把 `/api/health` 纳入标准检查，避免“页面 200，但数据层已经坏掉”这类情况漏检。

## 4. 运维执行口径

### 4.1 备份命令

```bash
npm run backup:data
```

可选：

```bash
npm run backup:data -- --output-dir=/root/backups/clawplay --include-env=true
```

### 4.2 恢复建议顺序

1. 先备份当前线上数据
2. 用目标备份覆盖 `analytics.sqlite` 及其 `-wal` / `-shm`
3. 重启 `pm2 restart clawplay --update-env`
4. 跑 `npm run smoke:domain`

### 4.3 发布后最小验证

```bash
npm run smoke:domain -- --host=https://clawplay.club
```

## 5. 验证结果

本次本地已验证：

- `npm run build` 通过
- `npm run backup:data -- --output-dir=/tmp/clawplay-backups` 通过
- `/api/health` 返回 `200` 且结构正确
- `smoke:domain` 已纳入健康检查

## 6. 后续建议

P5 经过这一刀后，已经从“站内可信入口”推进到“最小可运维能力”。

后续如果继续补，只建议做两类：

1. 错误态 / 空状态的系统化巡检
2. 轻量定时备份与值班清单工程化
