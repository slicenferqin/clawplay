# 14 Site Trust Foundation Implementation

- Status: Done
- Depends On: `docs/execution/14-site-trust-foundation.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 关键决策收口

### 1.1 先做最小可信度页面，而不是重型帮助中心

本次以最小可信度页面为主，优先解决“站内没有公开规则和反馈入口”的问题。

### 1.2 可信度入口放到导航和页脚

原因：

- 用户第一次访问时更容易发现
- 不依赖用户先去 GitHub 看文档
- 对 SEO 与信任感都有正向作用

## 2. 文件落点

本次修改 / 新增：

- `src/app/about/page.tsx`
- `src/components/site-footer.tsx`
- `src/components/site-header.tsx`
- `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/globals.css`

## 3. 具体实现

### 3.1 关于页

新增站内 `about` 页面，公开说明：

- 项目定位
- 非目标边界
- 来源与授权原则
- 投稿审核原则
- 联系与安全反馈入口

### 3.2 全局页脚

新增轻量全局页脚，补充：

- 站点主入口
- 关于页
- 安装页
- 投稿页
- GitHub 仓库链接

### 3.3 基础索引更新

- `about` 纳入 sitemap
- `robots` 允许抓取 `about`

## 4. 验证结果

- 新页面为纯静态内容页，无数据迁移风险
- 页面入口对普通访问者可见
- SEO 基础入口已同步更新

## 5. 后续建议

P5 后续仍可继续补：

1. 更完整的错误态 / 空状态检查
2. 备份与回滚方案文档化
3. 轻量健康检查页或运营值班清单
