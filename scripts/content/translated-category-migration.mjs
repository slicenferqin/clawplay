#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import Database from 'better-sqlite3';

import { CATEGORY_LABELS, LEGACY_TRANSLATED_CATEGORY_MAPPINGS } from './translated-category-migration-config.mjs';

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has('--write');
const shouldWriteReport = !args.has('--no-report');
const projectRoot = process.cwd();
const databasePath = path.join(projectRoot, 'data', 'analytics.sqlite');
const reportPath = path.join(projectRoot, 'docs', 'content', 'translated-category-audit.md');
const staticSoulsPath = path.join(projectRoot, 'src', 'lib', 'souls.ts');

function collectStaticTranslatedEntries() {
  const source = fs.readFileSync(staticSoulsPath, 'utf8');
  const entries = [];
  const pattern = /slug:\s*'([^']+)'[\s\S]*?category:\s*'translated'/g;

  for (const match of source.matchAll(pattern)) {
    entries.push({ slug: match[1] });
  }

  return entries;
}

function getSubmissionRows(db) {
  return db.prepare(`
    SELECT id, public_id, status, title, submission_type, category, summary, created_at
    FROM soul_submissions
    WHERE category = 'translated'
    ORDER BY created_at DESC
  `).all();
}

function getRevisionRows(db) {
  return db.prepare(`
    SELECT r.id, r.submission_id, r.revision_no, s.public_id, s.title,
      json_extract(r.payload_json, '$.category') AS category
    FROM submission_revisions r
    JOIN soul_submissions s ON s.id = r.submission_id
    WHERE json_extract(r.payload_json, '$.category') = 'translated'
    ORDER BY r.created_at DESC
  `).all();
}

function getPublishedRows(db) {
  return db.prepare(`
    SELECT id, slug, title, source_type, category, category_label, published_at
    FROM published_souls
    WHERE category = 'translated'
    ORDER BY published_at DESC
  `).all();
}

function resolveSubmissionMapping(row) {
  return LEGACY_TRANSLATED_CATEGORY_MAPPINGS.submissions[row.public_id] ?? null;
}

function resolvePublishedMapping(row) {
  return LEGACY_TRANSLATED_CATEGORY_MAPPINGS.publishedSouls[row.slug] ?? null;
}

function formatList(values) {
  return values.length > 0 ? values.map((value) => `- ${value}`).join('\n') : '- 无';
}

function buildReport({ generatedAt, staticEntries, submissionRows, revisionRows, publishedRows, unresolvedSubmissions, unresolvedPublished, cleaned }) {
  const staticLines = staticEntries.map((entry) => `静态 Soul 仍包含 legacy 分类：\`${entry.slug}\``);
  const submissionLines = submissionRows.map((row) => {
    const mapping = resolveSubmissionMapping(row);
    const target = mapping ? ` -> \`${mapping.nextCategory}\`` : ' -> 未配置迁移';
    return `投稿 \`${row.public_id}\`《${row.title}》${target}`;
  });
  const revisionLines = revisionRows.map((row) => `修订记录 \`${row.id}\`（投稿 \`${row.public_id}\` 第 ${row.revision_no} 版）仍为 legacy 分类`);
  const publishedLines = publishedRows.map((row) => {
    const mapping = resolvePublishedMapping(row);
    const target = mapping ? ` -> \`${mapping.nextCategory}\`` : ' -> 未配置迁移';
    return `已发布 Soul \`${row.slug}\`《${row.title}》${target}`;
  });
  const cleanedLines = cleaned.map((item) => `${item.kind} \`${item.key}\` 已迁移到 \`${item.nextCategory}\`：${item.reason}`);

  return `# Translated Category Audit\n\n- Generated At: ${generatedAt}\n- Database: \`data/analytics.sqlite\`\n- Mode: ${shouldWrite ? 'write' : 'audit'}\n\n## 当前结果\n\n- 静态数据残留：${staticEntries.length}\n- 投稿主表残留：${submissionRows.length}\n- 修订记录残留：${revisionRows.length}\n- 已发布数据残留：${publishedRows.length}\n- 未配置迁移映射的投稿：${unresolvedSubmissions.length}\n- 未配置迁移映射的已发布 Soul：${unresolvedPublished.length}\n\n## 静态数据\n\n${formatList(staticLines)}\n\n## 投稿主表\n\n${formatList(submissionLines)}\n\n## 修订记录\n\n${formatList(revisionLines)}\n\n## 已发布数据\n\n${formatList(publishedLines)}\n\n## 本次清洗动作\n\n${formatList(cleanedLines)}\n`;
}

const db = new Database(databasePath);
const cleaned = [];
const staticEntriesBefore = collectStaticTranslatedEntries();
const submissionRowsBefore = getSubmissionRows(db);
const revisionRowsBefore = getRevisionRows(db);
const publishedRowsBefore = getPublishedRows(db);
const unresolvedSubmissions = submissionRowsBefore.filter((row) => !resolveSubmissionMapping(row));
const unresolvedPublished = publishedRowsBefore.filter((row) => !resolvePublishedMapping(row));

if (shouldWrite && (unresolvedSubmissions.length > 0 || unresolvedPublished.length > 0 || staticEntriesBefore.length > 0)) {
  if (staticEntriesBefore.length > 0) {
    console.error('存在静态 Soul 仍使用 translated 分类，请先修代码数据。');
  }
  if (unresolvedSubmissions.length > 0) {
    console.error('存在未配置迁移映射的投稿：', unresolvedSubmissions.map((row) => row.public_id).join(', '));
  }
  if (unresolvedPublished.length > 0) {
    console.error('存在未配置迁移映射的已发布 Soul：', unresolvedPublished.map((row) => row.slug).join(', '));
  }
  process.exit(1);
}

if (shouldWrite) {
  const transaction = db.transaction(() => {
    for (const row of submissionRowsBefore) {
      const mapping = resolveSubmissionMapping(row);
      if (!mapping) {
        continue;
      }

      db.prepare('UPDATE soul_submissions SET category = ? WHERE id = ?').run(mapping.nextCategory, row.id);
      db.prepare(`
        UPDATE submission_revisions
        SET payload_json = json_set(payload_json, '$.category', ?)
        WHERE submission_id = ? AND json_extract(payload_json, '$.category') = 'translated'
      `).run(mapping.nextCategory, row.id);

      cleaned.push({
        kind: '投稿',
        key: row.public_id,
        nextCategory: mapping.nextCategory,
        reason: mapping.reason,
      });
    }

    for (const row of publishedRowsBefore) {
      const mapping = resolvePublishedMapping(row);
      if (!mapping) {
        continue;
      }

      db.prepare('UPDATE published_souls SET category = ?, category_label = ? WHERE id = ?').run(
        mapping.nextCategory,
        CATEGORY_LABELS[mapping.nextCategory],
        row.id,
      );

      cleaned.push({
        kind: '已发布 Soul',
        key: row.slug,
        nextCategory: mapping.nextCategory,
        reason: mapping.reason,
      });
    }
  });

  transaction();
}

const staticEntriesAfter = collectStaticTranslatedEntries();
const submissionRowsAfter = getSubmissionRows(db);
const revisionRowsAfter = getRevisionRows(db);
const publishedRowsAfter = getPublishedRows(db);

const report = buildReport({
  generatedAt: new Date().toISOString(),
  staticEntries: staticEntriesAfter,
  submissionRows: submissionRowsAfter,
  revisionRows: revisionRowsAfter,
  publishedRows: publishedRowsAfter,
  unresolvedSubmissions: submissionRowsAfter.filter((row) => !resolveSubmissionMapping(row)),
  unresolvedPublished: publishedRowsAfter.filter((row) => !resolvePublishedMapping(row)),
  cleaned,
});

if (shouldWriteReport) {
  fs.writeFileSync(reportPath, report);
}

console.log(report);
