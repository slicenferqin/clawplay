#!/usr/bin/env node

import dns from 'node:dns/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const DEFAULT_HOST = 'https://clawplay.club';
const DEFAULT_EXPECTED_SITE_URL = 'https://clawplay.club';
const DEFAULT_EXPECTED_IP = '115.191.64.165';
const DEFAULT_DETAIL_SLUG = 'code-reviewer';
const DEFAULT_PM2_APP = 'clawplay';
const DEFAULT_TIMEOUT_MS = 8000;

function parseArgs(argv) {
  const options = {};

  for (const rawArg of argv) {
    if (!rawArg.startsWith('--')) {
      continue;
    }

    const normalizedArg = rawArg.slice(2);
    if (!normalizedArg.includes('=')) {
      options[normalizedArg] = 'true';
      continue;
    }

    const [key, ...valueParts] = normalizedArg.split('=');
    options[key] = valueParts.join('=');
  }

  return options;
}

function printHelp() {
  console.log(`ClawPlay domain smoke check

Usage:
  node scripts/ops/domain-smoke-check.mjs [options]

Options:
  --host=<url>                 Active host to probe. Default: ${DEFAULT_HOST}
  --expected-site-url=<url>    Canonical site URL expected in metadata. Default: ${DEFAULT_EXPECTED_SITE_URL}
  --expected-ip=<ip>           Expected A record target. Default: ${DEFAULT_EXPECTED_IP}
  --detail-slug=<slug>         Soul detail slug for detail-page checks. Default: ${DEFAULT_DETAIL_SLUG}
  --pm2-app=<name>             PM2 app name to verify. Default: ${DEFAULT_PM2_APP}
  --timeout-ms=<ms>            HTTP timeout in milliseconds. Default: ${DEFAULT_TIMEOUT_MS}
  --skip-dns                   Skip DNS resolution check
  --skip-pm2                   Skip PM2 process check
  --help                       Print this help message

Examples:
  npm run smoke:domain -- --host=http://127.0.0.1:3010 --expected-site-url=https://clawplay.club --skip-dns
  npm run smoke:domain -- --host=https://clawplay.club --expected-ip=115.191.64.165 --pm2-app=clawplay
`);
}

const options = parseArgs(process.argv.slice(2));
if (options.help === 'true') {
  printHelp();
  process.exit(0);
}

const activeHost = normalizeUrl(options.host ?? DEFAULT_HOST);
const expectedSiteUrl = normalizeUrl(options['expected-site-url'] ?? DEFAULT_EXPECTED_SITE_URL);
const expectedIp = options['expected-ip'] ?? DEFAULT_EXPECTED_IP;
const detailSlug = options['detail-slug'] ?? DEFAULT_DETAIL_SLUG;
const pm2App = options['pm2-app'] ?? DEFAULT_PM2_APP;
const timeoutMs = Number.parseInt(options['timeout-ms'] ?? String(DEFAULT_TIMEOUT_MS), 10) || DEFAULT_TIMEOUT_MS;
const skipDns = options['skip-dns'] === 'true';
const skipPm2 = options['skip-pm2'] === 'true';

const results = [];

function normalizeUrl(value) {
  return value.replace(/\/$/, '');
}

function isIpAddress(hostname) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function isLocalHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function getOrigin(url) {
  return new URL(url).origin;
}

function buildActiveUrl(pathname) {
  return new URL(pathname, `${activeHost}/`).toString();
}

function buildExpectedUrl(pathname) {
  return new URL(pathname, `${expectedSiteUrl}/`).toString();
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1]) : '';
}

function extractCanonical(html) {
  const match = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"[^>]*>/i);
  return match?.[1] ? normalizeUrl(match[1]) : '';
}

function extractMetaContent(html, attribute, key) {
  const pattern = new RegExp(`<meta[^>]+${attribute}="${key}"[^>]+content="([^"]+)"[^>]*>`, 'i');
  const match = html.match(pattern);
  return match?.[1] ? decodeHtml(match[1]) : '';
}

function pushResult(status, name, message) {
  results.push({ status, name, message });
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'ClawPlaySmokeCheck/1.0',
      },
    });
    const text = await response.text();
    return { response, text };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchResponse(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'ClawPlaySmokeCheck/1.0',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkDnsResolution() {
  const hostname = new URL(activeHost).hostname;

  if (skipDns) {
    pushResult('SKIP', 'DNS 解析', '已通过参数跳过 DNS 检查。');
    return;
  }

  if (isIpAddress(hostname) || isLocalHostname(hostname)) {
    pushResult('SKIP', 'DNS 解析', `当前 host 为 ${hostname}，不执行公网 DNS 检查。`);
    return;
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    const addresses = records.map((record) => record.address);

    if (expectedIp && !addresses.includes(expectedIp)) {
      pushResult('FAIL', 'DNS 解析', `${hostname} 当前解析为 ${addresses.join(', ')}，未命中预期 IP ${expectedIp}。`);
      return;
    }

    pushResult('PASS', 'DNS 解析', `${hostname} 解析结果：${addresses.join(', ')}。`);
  } catch (error) {
    pushResult('FAIL', 'DNS 解析', `DNS 查询失败：${error instanceof Error ? error.message : String(error)}`);
  }
}

async function checkHtmlPage({ name, pathname, titleIncludes, bodyIncludes = [], expectedCanonicalPath, expectedOgPath, expectedRobots }) {
  const url = buildActiveUrl(pathname);

  try {
    const { response, text } = await fetchText(url);

    if (!response.ok) {
      pushResult('FAIL', name, `${url} 返回 ${response.status}。`);
      return null;
    }

    const title = extractTitle(text);
    const canonical = extractCanonical(text);
    const robots = extractMetaContent(text, 'name', 'robots');
    const ogImage = extractMetaContent(text, 'property', 'og:image');

    if (titleIncludes && !title.includes(titleIncludes)) {
      pushResult('FAIL', name, `页面 title 异常，当前为「${title || '空'}」，未包含「${titleIncludes}」。`);
      return null;
    }

    for (const bodyMarker of bodyIncludes) {
      if (!text.includes(bodyMarker)) {
        pushResult('FAIL', name, `页面内容未命中关键标记「${bodyMarker}」。`);
        return null;
      }
    }

    if (expectedCanonicalPath) {
      const expectedCanonical = normalizeUrl(buildExpectedUrl(expectedCanonicalPath));
      if (normalizeUrl(canonical) != expectedCanonical) {
        pushResult('FAIL', name, `canonical 异常，当前为 ${canonical || '空'}，预期为 ${expectedCanonical}。`);
        return null;
      }
    }

    if (expectedRobots && robots !== expectedRobots) {
      pushResult('FAIL', name, `robots meta 异常，当前为 ${robots || '空'}，预期为 ${expectedRobots}。`);
      return null;
    }

    if (expectedOgPath) {
      const expectedOgImage = buildExpectedUrl(expectedOgPath);
      if (ogImage !== expectedOgImage) {
        pushResult('FAIL', name, `OG 图片异常，当前为 ${ogImage || '空'}，预期为 ${expectedOgImage}。`);
        return null;
      }
    }

    pushResult('PASS', name, `${url} 正常，title 与 metadata 检查通过。`);
    return { title, canonical, ogImage };
  } catch (error) {
    pushResult('FAIL', name, `${url} 访问失败：${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function checkPlainText({ name, pathname, expectedMarkers = [] }) {
  const url = buildActiveUrl(pathname);

  try {
    const { response, text } = await fetchText(url);
    if (!response.ok) {
      pushResult('FAIL', name, `${url} 返回 ${response.status}。`);
      return;
    }

    for (const marker of expectedMarkers) {
      if (!text.includes(marker)) {
        pushResult('FAIL', name, `${name} 未命中关键内容「${marker}」。`);
        return;
      }
    }

    pushResult('PASS', name, `${url} 可访问，内容符合预期。`);
  } catch (error) {
    pushResult('FAIL', name, `${url} 访问失败：${error instanceof Error ? error.message : String(error)}`);
  }
}

async function checkXml({ name, pathname, expectedMarkers = [] }) {
  return checkPlainText({ name, pathname, expectedMarkers });
}

async function checkHealthJson({ name, pathname }) {
  const url = buildActiveUrl(pathname);

  try {
    const response = await fetchResponse(url);
    if (!response.ok) {
      pushResult('FAIL', name, `${url} 返回 ${response.status}。`);
      return;
    }

    const payload = await response.json();
    if (payload?.status !== 'ok') {
      pushResult('FAIL', name, `${url} 返回 status=${payload?.status ?? '空'}。`);
      return;
    }

    const failedChecks = Number(payload?.summary?.failedChecks ?? 0);
    if (failedChecks > 0) {
      pushResult('FAIL', name, `${url} 存在 ${failedChecks} 个失败检查项。`);
      return;
    }

    pushResult('PASS', name, `${url} 正常，健康检查返回 ok。`);
  } catch (error) {
    pushResult('FAIL', name, `${url} 访问失败：${error instanceof Error ? error.message : String(error)}`);
  }
}

async function checkOgRoute(name, ogPath) {
  const expectedOgImage = buildExpectedUrl(ogPath);
  const urlToFetch = getOrigin(activeHost) === getOrigin(expectedSiteUrl)
    ? expectedOgImage
    : buildActiveUrl(new URL(expectedOgImage).pathname);

  try {
    const response = await fetchResponse(urlToFetch);
    if (!response.ok) {
      pushResult('FAIL', name, `${urlToFetch} 返回 ${response.status}。`);
      return;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      pushResult('FAIL', name, `${urlToFetch} 返回的 content-type 为 ${contentType || '空'}，不是图片。`);
      return;
    }

    pushResult(
      'PASS',
      name,
      `${urlToFetch} 可访问，OG 路由正常${urlToFetch !== expectedOgImage ? `；metadata 仍指向正式域名 ${expectedOgImage}` : ''}。`,
    );
  } catch (error) {
    pushResult('FAIL', name, `${urlToFetch} 访问失败：${error instanceof Error ? error.message : String(error)}`);
  }
}

function checkPm2Process() {
  if (skipPm2) {
    pushResult('SKIP', 'PM2 进程', '已通过参数跳过 PM2 检查。');
    return;
  }

  try {
    const raw = execFileSync('pm2', ['jlist'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const apps = JSON.parse(raw);
    const app = Array.isArray(apps) ? apps.find((item) => item?.name === pm2App) : null;

    if (!app) {
      pushResult('FAIL', 'PM2 进程', `未找到名为 ${pm2App} 的 PM2 应用。`);
      return;
    }

    const status = app.pm2_env?.status ?? 'unknown';
    if (status !== 'online') {
      pushResult('FAIL', 'PM2 进程', `${pm2App} 当前状态为 ${status}。`);
      return;
    }

    pushResult('PASS', 'PM2 进程', `${pm2App} 当前状态 online。`);
  } catch (error) {
    pushResult('WARN', 'PM2 进程', `PM2 检查失败：${error instanceof Error ? error.message : String(error)}。如在本机开发环境运行，可使用 --skip-pm2。`);
  }
}

async function main() {
  console.log(`ClawPlay domain smoke check\n- Active host: ${activeHost}\n- Expected site URL: ${expectedSiteUrl}\n- Detail slug: ${detailSlug}\n`);

  await checkDnsResolution();
  await checkHtmlPage({
    name: '首页',
    pathname: '/',
    titleIncludes: 'ClawPlay',
    bodyIncludes: ['按来源浏览'],
    expectedCanonicalPath: '/',
    expectedOgPath: '/opengraph-image',
  });
  await checkHtmlPage({
    name: '灵魂库列表',
    pathname: '/souls',
    titleIncludes: '全部灵魂',
    bodyIncludes: ['内容来源'],
    expectedCanonicalPath: '/souls',
  });
  await checkHtmlPage({
    name: '推荐合集页',
    pathname: '/collections',
    titleIncludes: '推荐合集',
    bodyIncludes: ['新手首选', '当前热门'],
    expectedCanonicalPath: '/collections',
  });
  await checkHtmlPage({
    name: '新手专题页',
    pathname: '/collections/starter',
    titleIncludes: '新手首选专题',
    bodyIncludes: ['为什么先看这组', '推荐灵魂', '分享这组'],
    expectedCanonicalPath: '/collections/starter',
    expectedOgPath: '/collections/starter/opengraph-image',
  });
  await checkHtmlPage({
    name: 'Soul 详情页',
    pathname: `/souls/${detailSlug}`,
    titleIncludes: 'ClawPlay',
    bodyIncludes: ['下载 SOUL.md'],
    expectedCanonicalPath: `/souls/${detailSlug}`,
    expectedOgPath: `/souls/${detailSlug}/opengraph-image`,
  });
  await checkHtmlPage({
    name: '投稿页',
    pathname: '/submit',
    titleIncludes: '投稿你的 Soul',
    bodyIncludes: ['投稿入口'],
    expectedCanonicalPath: '/submit',
  });
  await checkHtmlPage({
    name: '后台登录页',
    pathname: '/admin/login',
    titleIncludes: '管理员登录',
    bodyIncludes: ['管理员登录'],
    expectedRobots: 'noindex, nofollow',
  });
  await checkHealthJson({
    name: '健康检查',
    pathname: '/api/health',
  });
  await checkPlainText({
    name: 'robots.txt',
    pathname: '/robots.txt',
    expectedMarkers: [`Sitemap: ${buildExpectedUrl('/sitemap.xml')}`, `Host: ${new URL(expectedSiteUrl).host}`],
  });
  await checkXml({
    name: 'sitemap.xml',
    pathname: '/sitemap.xml',
    expectedMarkers: [buildExpectedUrl('/'), buildExpectedUrl(`/souls/${detailSlug}`)],
  });
  await checkOgRoute('首页 OG 图', '/opengraph-image');
  await checkOgRoute('Soul 详情页 OG 图', `/souls/${detailSlug}/opengraph-image`);
  await checkOgRoute('新手专题页 OG 图', '/collections/starter/opengraph-image');
  checkPm2Process();

  const summary = results.reduce(
    (accumulator, item) => {
      accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
      return accumulator;
    },
    { PASS: 0, WARN: 0, FAIL: 0, SKIP: 0 },
  );

  for (const result of results) {
    console.log(`[${result.status}] ${result.name} - ${result.message}`);
  }

  console.log(`\nSummary: PASS ${summary.PASS} / WARN ${summary.WARN} / FAIL ${summary.FAIL} / SKIP ${summary.SKIP}`);

  if (summary.FAIL > 0) {
    process.exit(1);
  }
}

await main();
