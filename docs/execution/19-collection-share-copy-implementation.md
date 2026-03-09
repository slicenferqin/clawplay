# 19 Collection Share Copy Implementation

- Status: Done
- Depends On: `docs/execution/19-collection-share-copy.md`
- Owner: Codex + slicenfer
- Last Updated: 2026-03-09

## 1. 关键决策收口

### 1.1 不接平台 SDK，先收口成“复制即可发”

这次没有去做微信、X、Telegram 等平台级一键分享，因为当前阶段最影响真实转发率的不是“按钮数量”，而是用户是否能马上拿走一份可用内容。

所以这刀优先把：

- 专题链接
- 分享图入口
- 外发文案模板

集中放到专题页同一区块里。

### 1.2 文案不做完全自动生成，而是按合集人工收口

自动拼装当然更快，但当前合集只有 4 组，人工写一版能明显提升中文表达质量。

这样做的好处是：

- 推荐理由更自然
- 用户拿去外发时不显得像模板机翻
- 后续扩专题时也有一套可复用范式

## 2. 文件落点

本次修改 / 新增：

- `src/lib/collections.ts`
- `src/app/collections/[key]/page.tsx`
- `src/app/globals.css`
- `scripts/ops/domain-smoke-check.mjs`
- `README.md`
- `docs/execution/19-collection-share-copy.md`
- `docs/execution/19-collection-share-copy-implementation.md`

## 3. 具体实现

### 3.1 合集模型新增分享模板

为每个合集补了两条模板：

- 短文案
- 长文案

并统一在 server helper 中生成最终可复制文本，默认带正式域名链接。

### 3.2 专题页新增“分享这组”区块

该区块包含：

- 复制专题链接
- 打开分享图
- 两条可直接复制的外发文案

这样用户看完推荐理由后，可以顺手直接带着链接去外发。

### 3.3 smoke check 回填传播区校验

把 `/collections/starter` 的 body 校验从“只有推荐结构”升级成“也包含分享区”，避免后续回归时把这块悄悄删掉。

## 4. 验证结果

本次本地已验证：

- `npm run build` 通过
- `/collections/starter` 可访问
- “分享这组”区块正常展示
- 本地 smoke check 通过

线上已验证：

- 站点已部署成功
- 线上 smoke check 通过

## 5. 后续建议

这刀完成后，P6 下一步最值的是：

1. 补更细的专题，例如“翻译精选”“陪伴聊天首选”“工作流首选”
2. 给每个专题再补 1 张更明确的长图物料，方便外部帖子配图
