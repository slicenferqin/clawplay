# 06 Domain Launch Checklist

- Status: Ready
- Depends On: `docs/execution/04-seo-and-sharing.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 这份清单解决什么问题

ClawPlay 现在应用本身已经可运行、可部署，但正式域名链路仍可能受到：

- 备案 / 合规状态
- DNS 生效
- 边缘层拦截
- HTTPS 证书
- 反向代理配置
- 正式域名与 IP 行为不一致

等因素影响。

这份文档的目标不是讲“怎么开发”，而是确保域名一旦可放开，就不会出现：

- 打得开 IP，打不开域名
- 能打开站点，但分享卡片错误
- 主站正常，后台登录态异常
- 发布后没有标准检查命令，出问题了也不知道从哪查

## 2. 标准执行方式

域名上线检查现在已经不只是文档，而是**文档 + 脚本 + 命令**。

标准命令：

```bash
npm run smoke:domain -- --host=https://clawplay.club --expected-ip=115.191.64.165 --pm2-app=clawplay
```

这个命令默认覆盖：

- DNS 解析
- 首页 / 列表 / 详情 / 投稿 / 后台登录页
- `robots.txt`
- `sitemap.xml`
- canonical
- OG 图
- PM2 进程状态
- 最终 `PASS / WARN / FAIL` 汇总

## 3. 推荐运行模式

### 备案未放开时

用当前可访问地址先校验应用本身：

```bash
npm run smoke:domain -- --host=http://127.0.0.1:3010 --expected-site-url=https://clawplay.club --skip-dns
```

或者：

```bash
npm run smoke:domain -- --host=http://115.191.64.165:3010 --expected-site-url=https://clawplay.club --skip-dns --skip-pm2
```

这时脚本会：

- 用当前 IP / 本地地址检查页面路由和 OG 路由是否正常
- 同时校验 metadata 是否仍然指向正式域名 `https://clawplay.club`

### 域名正式放开后

用正式域名跑完整检查：

```bash
npm run smoke:domain -- --host=https://clawplay.club --expected-ip=115.191.64.165 --pm2-app=clawplay
```

这是上线当天最标准的一条验收命令。

## 4. 启用前检查

### 域名与链路

- `A` 记录确认指向 `115.191.64.165`
- `www` 是否需要启用，是否与主域统一
- 正式域名是否唯一，是否决定为 `https://clawplay.club`
- 边缘层 / 云厂商是否存在 `webblock` 或其他合规拦截

### Nginx / 反代

- `server_name clawplay.club www.clawplay.club` 正确
- `proxy_pass http://127.0.0.1:3010` 正确
- `Host` / `X-Forwarded-Proto` / `X-Forwarded-For` 正确透传
- 大文件上传限制满足投稿场景

### HTTPS

- 证书已申请并安装
- 80 → 443 跳转策略确认
- HTTP 与 HTTPS 下后台 Cookie `Secure` 行为正确

## 5. 功能回归

### 主站

- 首页打开正常
- 灵魂库列表正常
- Soul 详情页正常
- 原文下载 / 复制安装命令正常
- 投稿页正常提交

### 后台

- `/admin/login` 正常
- 登录后 `/admin/submissions` 正常
- 审核详情页正常
- 状态流转 / 发布动作正常

### SEO / 分享

- `sitemap.xml` 正常可访问
- `robots.txt` 正常可访问
- canonical 指向正式域名
- Soul 详情页 metadata 正确
- OG 图可访问

## 6. 运维兜底

### 监控

最少应有：

- `pm2 status` 健康
- 最近错误日志可查
- 首页和后台登录页健康检查

### 数据

- SQLite 数据文件定期备份
- 发布前后保留可回滚版本
- `.env.production.local` 安全保留

### 回滚

- 记录最近稳定 commit
- 保留 `git reset --hard <stable_commit>` + 重建 + `pm2 restart` 路径

## 7. 验收信号

域名正式放开后，至少满足：

1. 浏览器可通过正式域名访问主站。
2. 主站与后台功能可正常使用。
3. 分享卡片和搜索抓取入口都正常。
4. 服务器可快速判断应用、反代还是域名链路出了问题。
5. Smoke check 可以通过一条标准命令完成。
