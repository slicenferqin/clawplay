import 'server-only';

import { mkdirSync } from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

const DATABASE_FILE_NAME = 'analytics.sqlite';

declare global {
  var __clawplayAnalyticsDatabase: Database.Database | undefined;
}

function getDataDirectory() {
  const configuredPath = process.env.CLAWPLAY_DATA_DIR;
  return configuredPath ? path.resolve(configuredPath) : path.join(process.cwd(), 'data');
}

export function getAnalyticsDatabasePath() {
  return path.join(getDataDirectory(), DATABASE_FILE_NAME);
}

function ensureColumnExists(database: Database.Database, tableName: string, columnName: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function initializeAnalyticsDatabase(database: Database.Database) {
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');

  database.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      slug TEXT,
      source TEXT NOT NULL,
      placement TEXT,
      path TEXT,
      session_id TEXT,
      user_agent TEXT,
      referer TEXT,
      ip_hash TEXT,
      meta_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
      ON analytics_events (created_at);

    CREATE INDEX IF NOT EXISTS idx_analytics_events_slug_created_at
      ON analytics_events (slug, created_at);

    CREATE INDEX IF NOT EXISTS idx_analytics_events_name_slug_created_at
      ON analytics_events (event_name, slug, created_at);

    CREATE TABLE IF NOT EXISTS soul_submissions (
      id TEXT PRIMARY KEY,
      public_id TEXT NOT NULL UNIQUE,
      manage_token_hash TEXT NOT NULL,
      status TEXT NOT NULL,
      submission_type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      category TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      proposed_tags_json TEXT NOT NULL DEFAULT '[]',
      tones_json TEXT NOT NULL,
      use_cases_json TEXT NOT NULL,
      compatible_models_json TEXT NOT NULL,
      preview_hook TEXT NOT NULL,
      preview_prompt TEXT NOT NULL,
      preview_response TEXT NOT NULL,
      intro TEXT NOT NULL,
      features_json TEXT NOT NULL,
      suggestions_json TEXT NOT NULL,
      raw_soul TEXT NOT NULL,
      author_name TEXT NOT NULL,
      contact_method TEXT,
      contact_value TEXT,
      license TEXT NOT NULL,
      source_url TEXT,
      source_author TEXT,
      rights_statement TEXT NOT NULL,
      submitter_note TEXT,
      latest_reviewer_note TEXT,
      published_soul_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      reviewed_at TEXT,
      published_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_soul_submissions_status_created_at
      ON soul_submissions (status, created_at);

    CREATE INDEX IF NOT EXISTS idx_soul_submissions_public_id
      ON soul_submissions (public_id);

    CREATE TABLE IF NOT EXISTS submission_revisions (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      revision_no INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_submission_revisions_submission_id_revision_no
      ON submission_revisions (submission_id, revision_no);

    CREATE TABLE IF NOT EXISTS submission_status_logs (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_submission_status_logs_submission_id_created_at
      ON submission_status_logs (submission_id, created_at);

    CREATE TABLE IF NOT EXISTS published_souls (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      submission_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      category TEXT NOT NULL,
      category_label TEXT NOT NULL,
      source_type TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      tones_json TEXT NOT NULL,
      use_cases_json TEXT NOT NULL,
      compatible_models_json TEXT NOT NULL,
      author TEXT NOT NULL,
      license TEXT NOT NULL,
      preview_hook TEXT NOT NULL,
      preview_prompt TEXT NOT NULL,
      preview_response TEXT NOT NULL,
      intro TEXT NOT NULL,
      features_json TEXT NOT NULL,
      suggestions_json TEXT NOT NULL,
      author_lines_json TEXT,
      raw_markdown TEXT,
      raw_soul TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_published_souls_published_at
      ON published_souls (published_at);

    CREATE TABLE IF NOT EXISTS persona_analyses (
      id TEXT PRIMARY KEY,
      subject_type TEXT NOT NULL,
      subject_key TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      public_scores_json TEXT NOT NULL,
      public_reasons_json TEXT NOT NULL,
      public_confidence_json TEXT NOT NULL,
      internal_review_json TEXT NOT NULL,
      source TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT,
      raw_response_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(subject_type, subject_key)
    );

    CREATE INDEX IF NOT EXISTS idx_persona_analyses_subject
      ON persona_analyses (subject_type, subject_key);

    CREATE TABLE IF NOT EXISTS persona_analysis_jobs (
      id TEXT PRIMARY KEY,
      subject_type TEXT NOT NULL,
      subject_key TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      priority INTEGER NOT NULL DEFAULT 100,
      last_error TEXT,
      queued_by TEXT,
      run_after TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_persona_analysis_jobs_status_priority
      ON persona_analysis_jobs (status, priority, created_at);
  `);

  ensureColumnExists(database, 'soul_submissions', 'proposed_tags_json', "TEXT NOT NULL DEFAULT '[]'");
}

export function getAnalyticsDatabase() {
  if (globalThis.__clawplayAnalyticsDatabase) {
    return globalThis.__clawplayAnalyticsDatabase;
  }

  const dataDirectory = getDataDirectory();
  mkdirSync(dataDirectory, { recursive: true });

  const database = new Database(getAnalyticsDatabasePath());
  initializeAnalyticsDatabase(database);

  globalThis.__clawplayAnalyticsDatabase = database;

  return database;
}
