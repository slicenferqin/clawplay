# 06 Domain Launch Checklist Implementation

- Status: Done
- Depends On: `docs/execution/06-domain-launch-checklist.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 关键决策

本阶段不做复杂监控平台，只做一套足够稳、足够可重复执行的 smoke check 工具。

采用方案：

- Node 脚本
- 原生 `fetch`
- 原生 DNS 查询
- 可选 PM2 检查
- 支持“备案前按 IP / 本地地址检查”和“备案后按正式域名检查”两种模式

## 2. 模块与文件落点

### 新增文件

- `scripts/ops/domain-smoke-check.mjs`
- `docs/execution/06-domain-launch-checklist-implementation.md`

### 修改文件

- `package.json`
- `docs/execution/06-domain-launch-checklist.md`

## 3. 脚本能力范围

脚本当前覆盖：

1. DNS 解析检查
2. 首页检查
3. `/souls` 列表页检查
4. Soul 详情页检查
5. `/submit` 投稿页检查
6. `/admin/login` 检查
7. `robots.txt` 检查
8. `sitemap.xml` 检查
9. 首页 OG 图检查
10. Soul 详情页 OG 图检查
11. PM2 进程检查
12. 最终 `PASS / WARN / FAIL / SKIP` 汇总输出

## 4. 参数设计

支持参数：

- `--host`
- `--expected-site-url`
- `--expected-ip`
- `--detail-slug`
- `--pm2-app`
- `--timeout-ms`
- `--skip-dns`
- `--skip-pm2`

### 设计重点

#### 4.1 host 与 expected-site-url 分离

这是本次实现里最关键的一个点。

原因是备案未放开时：

- 当前可访问地址可能是 `http://127.0.0.1:3010`
- 或 `http://115.191.64.165:3010`
- 但站点 metadata 仍应指向正式域名 `https://clawplay.club`

所以脚本需要同时验证：

- 当前访问入口可用
- metadata 指向仍然正确

#### 4.2 OG 图双重校验

脚本会：

- 先校验页面里的 `og:image` 是否指向正式域名
- 再根据当前 `host` 检查实际 OG 路由是否可访问

这样在备案前，也能验证 OG 图片路由本身是否正常。

## 5. npm 命令

新增命令：

```bash
npm run smoke:domain
```

示例：

### 本地 / 服务器内部校验

```bash
npm run smoke:domain -- --host=http://127.0.0.1:3010 --expected-site-url=https://clawplay.club --skip-dns
```

### 备案前对公网 IP 校验

```bash
npm run smoke:domain -- --host=http://115.191.64.165:3010 --expected-site-url=https://clawplay.club --skip-dns --skip-pm2
```

### 域名正式放开后的标准验收

```bash
npm run smoke:domain -- --host=https://clawplay.club --expected-ip=115.191.64.165 --pm2-app=clawplay
```

## 6. 验证结果

本地已完成：

- `npm run build`
- smoke script 语法与集成接入验证

后续在域名放开前 / 放开当天，按上面的标准命令继续跑实际检查。

## 7. 后续可扩展项

如果后面还要继续加强，可以再补：

1. 登录态 Cookie / 管理后台重定向检查
2. 更多关键页面的内容命中校验
3. JSON 输出模式，方便接入 CI 或运维流水线
4. 远端一键部署 + smoke check 串联命令

