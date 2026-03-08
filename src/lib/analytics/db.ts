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
  `);
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
