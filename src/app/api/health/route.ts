import { stat } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { getAnalyticsDatabase, getAnalyticsDatabasePath } from '@/lib/analytics/db';
import { getSiteUrl } from '@/lib/seo';
import { PUBLIC_SITE_URL } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

type HealthCheckStatus = 'pass' | 'fail';

interface HealthCheckItem {
  name: string;
  status: HealthCheckStatus;
  message: string;
  details?: Record<string, unknown>;
}

function buildPassCheck(name: string, message: string, details?: Record<string, unknown>): HealthCheckItem {
  return { name, status: 'pass', message, details };
}

function buildFailCheck(name: string, error: unknown, details?: Record<string, unknown>): HealthCheckItem {
  return {
    name,
    status: 'fail',
    message: error instanceof Error ? error.message : String(error),
    details,
  };
}

function readTableCount(tableName: string) {
  const database = getAnalyticsDatabase();
  const row = database.prepare(`SELECT COUNT(*) AS total FROM ${tableName}`).get() as { total: number };
  return row.total;
}

async function checkSiteUrlConfig() {
  try {
    const canonicalSiteUrl = getSiteUrl();
    const publicSiteUrl = PUBLIC_SITE_URL;
    const siteUrl = new URL(canonicalSiteUrl);
    const publicUrl = new URL(publicSiteUrl);

    return buildPassCheck('site_url', '站点 URL 配置可解析。', {
      canonicalSiteUrl: siteUrl.toString(),
      publicSiteUrl: publicUrl.toString(),
    });
  } catch (error) {
    return buildFailCheck('site_url', error);
  }
}

async function checkDatabaseBootstrap() {
  try {
    getAnalyticsDatabase();
    return buildPassCheck('database_bootstrap', 'SQLite 连接初始化正常。', {
      databasePath: getAnalyticsDatabasePath(),
    });
  } catch (error) {
    return buildFailCheck('database_bootstrap', error, {
      databasePath: getAnalyticsDatabasePath(),
    });
  }
}

async function checkDataDirectory() {
  try {
    const databasePath = getAnalyticsDatabasePath();
    const dataDirectory = path.dirname(databasePath);
    const info = await stat(dataDirectory);

    if (!info.isDirectory()) {
      return buildFailCheck('data_directory', '数据路径存在，但不是目录。', {
        dataDirectory,
      });
    }

    return buildPassCheck('data_directory', '数据目录可访问。', {
      dataDirectory,
      isDirectory: true,
    });
  } catch (error) {
    return buildFailCheck('data_directory', error, {
      dataDirectory: path.dirname(getAnalyticsDatabasePath()),
    });
  }
}

async function checkDatabaseFile() {
  try {
    const databasePath = getAnalyticsDatabasePath();
    const info = await stat(databasePath);

    if (!info.isFile()) {
      return buildFailCheck('database_file', 'SQLite 路径存在，但不是文件。', {
        databasePath,
      });
    }

    return buildPassCheck('database_file', 'SQLite 数据文件可读取。', {
      databasePath,
      sizeBytes: info.size,
      modifiedAt: info.mtime.toISOString(),
    });
  } catch (error) {
    return buildFailCheck('database_file', error, {
      databasePath: getAnalyticsDatabasePath(),
    });
  }
}

async function checkDatabaseQuery() {
  try {
    const database = getAnalyticsDatabase();
    const ping = database.prepare('SELECT 1 AS ok').get() as { ok: number };
    const tableCounts = {
      analyticsEvents: readTableCount('analytics_events'),
      submissions: readTableCount('soul_submissions'),
      publishedSouls: readTableCount('published_souls'),
    };

    return buildPassCheck('database_query', '核心表查询正常。', {
      ping: ping.ok,
      journalMode: database.pragma('journal_mode', { simple: true }),
      tableCounts,
    });
  } catch (error) {
    return buildFailCheck('database_query', error, {
      databasePath: getAnalyticsDatabasePath(),
    });
  }
}

export async function GET() {
  const checks = [await checkSiteUrlConfig()];
  const bootstrapCheck = await checkDatabaseBootstrap();
  checks.push(bootstrapCheck);

  if (bootstrapCheck.status === 'pass') {
    checks.push(await checkDataDirectory());
    checks.push(await checkDatabaseFile());
    checks.push(await checkDatabaseQuery());
  } else {
    checks.push(buildFailCheck('data_directory', '数据库初始化失败，未继续检查数据目录。'));
    checks.push(buildFailCheck('database_file', '数据库初始化失败，未继续检查数据库文件。'));
    checks.push(buildFailCheck('database_query', '数据库初始化失败，未继续检查核心查询。'));
  }

  const failedChecks = checks.filter((item) => item.status === 'fail').length;
  const passedChecks = checks.length - failedChecks;
  const databasePath = getAnalyticsDatabasePath();
  const dataDirectory = path.dirname(databasePath);

  return NextResponse.json(
    {
      status: failedChecks > 0 ? 'degraded' : 'ok',
      generatedAt: new Date().toISOString(),
      summary: {
        passedChecks,
        failedChecks,
        databasePath,
        dataDirectory,
      },
      checks,
    },
    {
      status: failedChecks > 0 ? 503 : 200,
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    },
  );
}
