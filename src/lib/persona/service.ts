import 'server-only';

import { randomUUID } from 'node:crypto';

import { getAnalyticsDatabase } from '@/lib/analytics/db';
import { PERSONA_VERSION } from '@/lib/persona/constants';
import { getBootstrapPersonaAnalyses } from '@/lib/persona/bootstrap';
import {
  normalizePersonaAnalysisInput,
  normalizePersonaInternalReview,
  normalizePersonaPublicConfidence,
  normalizePersonaPublicReasons,
  normalizePersonaPublicScores,
  type PersonaAnalysisRecord,
  type PersonaAnalysisUpsertInput,
  type PersonaJobRecord,
  type PersonaJobStatus,
  type PersonaSubjectType,
} from '@/lib/persona/schema';

interface PersonaAnalysisRow {
  id: string;
  subject_type: PersonaSubjectType;
  subject_key: string;
  version: string;
  status: string;
  summary: string;
  public_scores_json: string;
  public_reasons_json: string;
  public_confidence_json: string;
  internal_review_json: string;
  source: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  raw_response_json: string | null;
  created_at: string;
  updated_at: string;
}

interface PersonaJobRow {
  id: string;
  subject_type: PersonaSubjectType;
  subject_key: string;
  status: PersonaJobStatus;
  attempts: number;
  priority: number;
  last_error: string | null;
  queued_by: string | null;
  run_after: string | null;
  created_at: string;
  updated_at: string;
}

let bootstrapEnsured = false;

function database() {
  return getAnalyticsDatabase();
}

function parseJson<T>(value: string, fallback: T) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapPersonaAnalysisRow(row: PersonaAnalysisRow): PersonaAnalysisRecord {
  return {
    id: row.id,
    subjectType: row.subject_type,
    subjectKey: row.subject_key,
    version: PERSONA_VERSION,
    status: row.status as PersonaAnalysisRecord['status'],
    summary: row.summary,
    publicScores: normalizePersonaPublicScores(parseJson(row.public_scores_json, null)),
    publicReasons: normalizePersonaPublicReasons(parseJson(row.public_reasons_json, null)),
    publicConfidence: normalizePersonaPublicConfidence(parseJson(row.public_confidence_json, null)),
    internalReview: normalizePersonaInternalReview(parseJson(row.internal_review_json, null)),
    source: row.source as PersonaAnalysisRecord['source'],
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    rawResponseJson: row.raw_response_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPersonaJobRow(row: PersonaJobRow): PersonaJobRecord {
  return {
    id: row.id,
    subjectType: row.subject_type,
    subjectKey: row.subject_key,
    status: row.status,
    attempts: row.attempts,
    priority: row.priority,
    lastError: row.last_error,
    queuedBy: row.queued_by,
    runAfter: row.run_after,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function ensureBootstrapPersonaAnalyses() {
  if (bootstrapEnsured) {
    return;
  }

  const db = database();
  const now = new Date().toISOString();
  const bootstrapEntries = getBootstrapPersonaAnalyses();

  const transaction = db.transaction(() => {
    const existingRows = db.prepare("SELECT subject_key FROM persona_analyses WHERE subject_type = 'soul'").all() as Array<{ subject_key: string }>;
    const existingKeys = new Set(existingRows.map((row) => row.subject_key));
    const insertStatement = db.prepare(`
      INSERT INTO persona_analyses (
        id, subject_type, subject_key, version, status, summary,
        public_scores_json, public_reasons_json, public_confidence_json, internal_review_json,
        source, reviewed_by, reviewed_at, raw_response_json, created_at, updated_at
      ) VALUES (
        @id, @subject_type, @subject_key, @version, @status, @summary,
        @public_scores_json, @public_reasons_json, @public_confidence_json, @internal_review_json,
        @source, @reviewed_by, @reviewed_at, @raw_response_json, @created_at, @updated_at
      )
    `);

    for (const entry of bootstrapEntries) {
      if (existingKeys.has(entry.subjectKey)) {
        continue;
      }

      const normalized = normalizePersonaAnalysisInput(entry);
      insertStatement.run({
        id: randomUUID(),
        subject_type: normalized.subjectType,
        subject_key: normalized.subjectKey,
        version: PERSONA_VERSION,
        status: normalized.status,
        summary: normalized.summary,
        public_scores_json: JSON.stringify(normalized.publicScores),
        public_reasons_json: JSON.stringify(normalized.publicReasons),
        public_confidence_json: JSON.stringify(normalized.publicConfidence),
        internal_review_json: JSON.stringify(normalized.internalReview),
        source: normalized.source,
        reviewed_by: normalized.reviewedBy,
        reviewed_at: normalized.reviewedAt,
        raw_response_json: normalized.rawResponseJson,
        created_at: now,
        updated_at: now,
      });
    }
  });

  transaction();
  bootstrapEnsured = true;
}

export function getPersonaAnalysisBySubject(subjectType: PersonaSubjectType, subjectKey: string) {
  ensureBootstrapPersonaAnalyses();
  const row = database().prepare('SELECT * FROM persona_analyses WHERE subject_type = ? AND subject_key = ?').get(subjectType, subjectKey) as PersonaAnalysisRow | undefined;
  return row ? mapPersonaAnalysisRow(row) : null;
}

export function getConfirmedPersonaAnalysisBySubject(subjectType: PersonaSubjectType, subjectKey: string) {
  ensureBootstrapPersonaAnalyses();
  const row = database().prepare("SELECT * FROM persona_analyses WHERE subject_type = ? AND subject_key = ? AND status = 'confirmed'").get(subjectType, subjectKey) as PersonaAnalysisRow | undefined;
  return row ? mapPersonaAnalysisRow(row) : null;
}

export function getConfirmedPersonaAnalysesForSoulSlugs(slugs: string[]) {
  ensureBootstrapPersonaAnalyses();
  if (slugs.length === 0) {
    return new Map<string, PersonaAnalysisRecord>();
  }

  const placeholders = slugs.map(() => '?').join(', ');
  const rows = database()
    .prepare(`SELECT * FROM persona_analyses WHERE subject_type = 'soul' AND status = 'confirmed' AND subject_key IN (${placeholders})`)
    .all(...slugs) as PersonaAnalysisRow[];

  return new Map(rows.map((row) => {
    const analysis = mapPersonaAnalysisRow(row);
    return [analysis.subjectKey, analysis] as const;
  }));
}

export function upsertPersonaAnalysis(input: PersonaAnalysisUpsertInput) {
  const normalized = normalizePersonaAnalysisInput(input);
  const db = database();
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, created_at FROM persona_analyses WHERE subject_type = ? AND subject_key = ?').get(normalized.subjectType, normalized.subjectKey) as { id: string; created_at: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE persona_analyses
      SET
        version = @version,
        status = @status,
        summary = @summary,
        public_scores_json = @public_scores_json,
        public_reasons_json = @public_reasons_json,
        public_confidence_json = @public_confidence_json,
        internal_review_json = @internal_review_json,
        source = @source,
        reviewed_by = @reviewed_by,
        reviewed_at = @reviewed_at,
        raw_response_json = @raw_response_json,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: existing.id,
      version: PERSONA_VERSION,
      status: normalized.status,
      summary: normalized.summary,
      public_scores_json: JSON.stringify(normalized.publicScores),
      public_reasons_json: JSON.stringify(normalized.publicReasons),
      public_confidence_json: JSON.stringify(normalized.publicConfidence),
      internal_review_json: JSON.stringify(normalized.internalReview),
      source: normalized.source,
      reviewed_by: normalized.reviewedBy,
      reviewed_at: normalized.reviewedAt,
      raw_response_json: normalized.rawResponseJson,
      updated_at: now,
    });
  } else {
    db.prepare(`
      INSERT INTO persona_analyses (
        id, subject_type, subject_key, version, status, summary,
        public_scores_json, public_reasons_json, public_confidence_json, internal_review_json,
        source, reviewed_by, reviewed_at, raw_response_json, created_at, updated_at
      ) VALUES (
        @id, @subject_type, @subject_key, @version, @status, @summary,
        @public_scores_json, @public_reasons_json, @public_confidence_json, @internal_review_json,
        @source, @reviewed_by, @reviewed_at, @raw_response_json, @created_at, @updated_at
      )
    `).run({
      id: randomUUID(),
      subject_type: normalized.subjectType,
      subject_key: normalized.subjectKey,
      version: PERSONA_VERSION,
      status: normalized.status,
      summary: normalized.summary,
      public_scores_json: JSON.stringify(normalized.publicScores),
      public_reasons_json: JSON.stringify(normalized.publicReasons),
      public_confidence_json: JSON.stringify(normalized.publicConfidence),
      internal_review_json: JSON.stringify(normalized.internalReview),
      source: normalized.source,
      reviewed_by: normalized.reviewedBy,
      reviewed_at: normalized.reviewedAt,
      raw_response_json: normalized.rawResponseJson,
      created_at: now,
      updated_at: now,
    });
  }

  const saved = getPersonaAnalysisBySubject(normalized.subjectType, normalized.subjectKey);
  if (!saved) {
    throw new Error('persona_analysis_upsert_failed');
  }

  return saved;
}

export function createPersonaAnalysisJob(subjectType: PersonaSubjectType, subjectKey: string, options?: { priority?: number; queuedBy?: string | null; runAfter?: string | null }) {
  const now = new Date().toISOString();
  const id = randomUUID();
  database().prepare(`
    INSERT INTO persona_analysis_jobs (
      id, subject_type, subject_key, status, attempts, priority, last_error, queued_by, run_after, created_at, updated_at
    ) VALUES (?, ?, ?, 'queued', 0, ?, NULL, ?, ?, ?, ?)
  `).run(id, subjectType, subjectKey, options?.priority ?? 100, options?.queuedBy ?? null, options?.runAfter ?? null, now, now);

  return getPersonaAnalysisJobById(id);
}

export function getPersonaAnalysisJobById(id: string) {
  const row = database().prepare('SELECT * FROM persona_analysis_jobs WHERE id = ?').get(id) as PersonaJobRow | undefined;
  return row ? mapPersonaJobRow(row) : null;
}

export function getLatestPersonaAnalysisJob(subjectType: PersonaSubjectType, subjectKey: string) {
  const row = database().prepare('SELECT * FROM persona_analysis_jobs WHERE subject_type = ? AND subject_key = ? ORDER BY created_at DESC LIMIT 1').get(subjectType, subjectKey) as PersonaJobRow | undefined;
  return row ? mapPersonaJobRow(row) : null;
}

export function updatePersonaAnalysisJobStatus(id: string, status: PersonaJobStatus, options?: { attempts?: number; lastError?: string | null }) {
  const now = new Date().toISOString();
  database().prepare(`
    UPDATE persona_analysis_jobs
    SET status = @status, attempts = COALESCE(@attempts, attempts), last_error = @last_error, updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    status,
    attempts: options?.attempts ?? null,
    last_error: options?.lastError ?? null,
    updated_at: now,
  });

  return getPersonaAnalysisJobById(id);
}

export function cloneConfirmedSubmissionPersonaToSoul(submissionId: string, soulSlug: string) {
  const analysis = getConfirmedPersonaAnalysisBySubject('submission', submissionId);
  if (!analysis) {
    return null;
  }

  return upsertPersonaAnalysis({
    subjectType: 'soul',
    subjectKey: soulSlug,
    status: 'confirmed',
    summary: analysis.summary,
    publicScores: analysis.publicScores,
    publicReasons: analysis.publicReasons,
    publicConfidence: analysis.publicConfidence,
    internalReview: analysis.internalReview,
    source: analysis.source,
    reviewedBy: analysis.reviewedBy,
    reviewedAt: analysis.reviewedAt,
    rawResponseJson: analysis.rawResponseJson,
  });
}
