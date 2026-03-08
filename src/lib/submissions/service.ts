import 'server-only';

import { randomUUID } from 'node:crypto';

import { getAnalyticsDatabase } from '@/lib/analytics/db';
import { CATEGORY_LABELS, type SoulDocument, type SoulSourceType } from '@/lib/souls-types';
import { STATIC_SOUL_SLUGS } from '@/lib/static-soul-refs';
import { createManageToken, createPublicId, hashManageToken } from '@/lib/submissions/auth';
import {
  contactMethods,
  submissionStatuses,
  submissionTypes,
  type ContactMethod,
  type PublicSubmissionView,
  type PublishSubmissionResult,
  type PublishedSoulRecord,
  type PublishedSoulRowShape,
  type SubmissionDetailRecord,
  type SubmissionInput,
  type SubmissionListResult,
  type SubmissionRecord,
  type SubmissionRevisionRecord,
  type SubmissionStatus,
  type SubmissionStatusLogRecord,
  type SubmissionType,
} from '@/lib/submissions/schema';
import type { SoulCategoryKey } from '@/lib/souls-types';

interface SubmissionRow {
  id: string;
  public_id: string;
  manage_token_hash: string;
  status: SubmissionStatus;
  submission_type: SubmissionType;
  title: string;
  summary: string;
  category: SoulCategoryKey;
  tags_json: string;
  tones_json: string;
  use_cases_json: string;
  compatible_models_json: string;
  preview_hook: string;
  preview_prompt: string;
  preview_response: string;
  intro: string;
  features_json: string;
  suggestions_json: string;
  raw_soul: string;
  author_name: string;
  contact_method: ContactMethod | null;
  contact_value: string | null;
  license: string;
  source_url: string | null;
  source_author: string | null;
  rights_statement: string;
  submitter_note: string | null;
  latest_reviewer_note: string | null;
  published_soul_id: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  published_at: string | null;
}

interface RevisionRow {
  id: string;
  submission_id: string;
  revision_no: number;
  payload_json: string;
  actor_type: 'submitter' | 'admin';
  created_at: string;
}

interface StatusLogRow {
  id: string;
  submission_id: string;
  from_status: SubmissionStatus | null;
  to_status: SubmissionStatus;
  actor_type: 'submitter' | 'admin' | 'system';
  note: string | null;
  created_at: string;
}

interface PublishedSoulRow {
  id: string;
  slug: string;
  submission_id: string;
  title: string;
  summary: string;
  category: SoulCategoryKey;
  category_label: string;
  source_type: SoulSourceType;
  tags_json: string;
  tones_json: string;
  use_cases_json: string;
  compatible_models_json: string;
  author: string;
  license: string;
  preview_hook: string;
  preview_prompt: string;
  preview_response: string;
  intro: string;
  features_json: string;
  suggestions_json: string;
  author_lines_json: string | null;
  raw_markdown: string | null;
  raw_soul: string;
  featured: number;
  published_at: string;
  updated_at: string;
}

interface SubmissionListOptions {
  status?: SubmissionStatus;
  query?: string;
  page?: number;
  pageSize?: number;
}

const submissionStatusSet = new Set<string>(submissionStatuses);
const submissionTypeSet = new Set<string>(submissionTypes);
const contactMethodSet = new Set<string>(contactMethods);

function database() {
  return getAnalyticsDatabase();
}

function stringifyArray(values: string[]) {
  return JSON.stringify(values);
}

function parseArray(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeOptionalText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureNonEmptyText(value: unknown, fieldName: string) {
  if (typeof value !== 'string') {
    throw new Error(`invalid_${fieldName}`);
  }

  const normalized = normalizeText(value);
  if (!normalized) {
    throw new Error(`missing_${fieldName}`);
  }

  return normalized;
}

function normalizeStringArray(value: unknown, fieldName: string, minimumLength = 1) {
  if (!Array.isArray(value)) {
    throw new Error(`invalid_${fieldName}`);
  }

  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length < minimumLength) {
    throw new Error(`missing_${fieldName}`);
  }

  return Array.from(new Set(items));
}

export function parseSubmissionInput(payload: Record<string, unknown>): SubmissionInput {
  const submissionType = ensureNonEmptyText(payload.submissionType, 'submission_type');
  if (!submissionTypeSet.has(submissionType)) {
    throw new Error('invalid_submission_type');
  }

  const category = ensureNonEmptyText(payload.category, 'category') as SoulCategoryKey;
  if (!(category in CATEGORY_LABELS)) {
    throw new Error('invalid_category');
  }

  const contactMethod = normalizeOptionalText(typeof payload.contactMethod === 'string' ? payload.contactMethod : null);
  if (contactMethod && !contactMethodSet.has(contactMethod)) {
    throw new Error('invalid_contact_method');
  }

  const rawSoul = ensureNonEmptyText(payload.rawSoul, 'raw_soul');
  if (rawSoul.length < 40) {
    throw new Error('raw_soul_too_short');
  }

  return {
    submissionType: submissionType as SubmissionType,
    title: ensureNonEmptyText(payload.title, 'title'),
    summary: ensureNonEmptyText(payload.summary, 'summary'),
    category,
    tags: normalizeStringArray(payload.tags, 'tags'),
    tones: normalizeStringArray(payload.tones, 'tones'),
    useCases: normalizeStringArray(payload.useCases, 'use_cases'),
    compatibleModels: normalizeStringArray(payload.compatibleModels, 'compatible_models'),
    previewHook: ensureNonEmptyText(payload.previewHook, 'preview_hook'),
    previewPrompt: ensureNonEmptyText(payload.previewPrompt, 'preview_prompt'),
    previewResponse: ensureNonEmptyText(payload.previewResponse, 'preview_response'),
    intro: ensureNonEmptyText(payload.intro, 'intro'),
    features: normalizeStringArray(payload.features, 'features'),
    suggestions: normalizeStringArray(payload.suggestions, 'suggestions'),
    rawSoul,
    authorName: ensureNonEmptyText(payload.authorName, 'author_name'),
    contactMethod: contactMethod as ContactMethod | null,
    contactValue: normalizeOptionalText(typeof payload.contactValue === 'string' ? payload.contactValue : null),
    license: ensureNonEmptyText(payload.license, 'license'),
    sourceUrl: normalizeOptionalText(typeof payload.sourceUrl === 'string' ? payload.sourceUrl : null),
    sourceAuthor: normalizeOptionalText(typeof payload.sourceAuthor === 'string' ? payload.sourceAuthor : null),
    rightsStatement: ensureNonEmptyText(payload.rightsStatement, 'rights_statement'),
    submitterNote: normalizeOptionalText(typeof payload.submitterNote === 'string' ? payload.submitterNote : null),
  };
}

function mapSubmissionRow(row: SubmissionRow): SubmissionRecord {
  return {
    id: row.id,
    publicId: row.public_id,
    status: row.status,
    submissionType: row.submission_type,
    title: row.title,
    summary: row.summary,
    category: row.category,
    tags: parseArray(row.tags_json),
    tones: parseArray(row.tones_json),
    useCases: parseArray(row.use_cases_json),
    compatibleModels: parseArray(row.compatible_models_json),
    previewHook: row.preview_hook,
    previewPrompt: row.preview_prompt,
    previewResponse: row.preview_response,
    intro: row.intro,
    features: parseArray(row.features_json),
    suggestions: parseArray(row.suggestions_json),
    rawSoul: row.raw_soul,
    authorName: row.author_name,
    contactMethod: row.contact_method,
    contactValue: row.contact_value,
    license: row.license,
    sourceUrl: row.source_url,
    sourceAuthor: row.source_author,
    rightsStatement: row.rights_statement,
    submitterNote: row.submitter_note,
    latestReviewerNote: row.latest_reviewer_note,
    publishedSoulId: row.published_soul_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at,
    publishedAt: row.published_at,
  };
}

function mapRevisionRow(row: RevisionRow): SubmissionRevisionRecord {
  return {
    id: row.id,
    submissionId: row.submission_id,
    revisionNo: row.revision_no,
    payload: JSON.parse(row.payload_json) as SubmissionInput,
    actorType: row.actor_type,
    createdAt: row.created_at,
  };
}

function mapStatusLogRow(row: StatusLogRow): SubmissionStatusLogRecord {
  return {
    id: row.id,
    submissionId: row.submission_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actorType: row.actor_type,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapPublishedSoulRow(row: PublishedSoulRow): PublishedSoulRecord {
  return {
    slug: row.slug,
    filePath: `submitted/${row.slug}.md`,
    submissionId: row.submission_id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    categoryLabel: row.category_label,
    sourceType: row.source_type,
    featured: Boolean(row.featured),
    tags: parseArray(row.tags_json),
    tones: parseArray(row.tones_json),
    useCases: parseArray(row.use_cases_json),
    compatibleModels: parseArray(row.compatible_models_json),
    author: row.author,
    license: row.license,
    updatedAt: row.updated_at.slice(0, 10),
    previewHook: row.preview_hook,
    previewPrompt: row.preview_prompt,
    previewResponse: row.preview_response,
    relatedSlugs: [],
    intro: row.intro,
    features: parseArray(row.features_json),
    suggestions: parseArray(row.suggestions_json),
    authorLines: parseArray(row.author_lines_json),
    rawMarkdown: row.raw_markdown ?? row.raw_soul,
    rawSoul: row.raw_soul,
    publishedAt: row.published_at,
  };
}

function getSubmissionPayload(record: SubmissionRecord): SubmissionInput {
  return {
    submissionType: record.submissionType,
    title: record.title,
    summary: record.summary,
    category: record.category,
    tags: record.tags,
    tones: record.tones,
    useCases: record.useCases,
    compatibleModels: record.compatibleModels,
    previewHook: record.previewHook,
    previewPrompt: record.previewPrompt,
    previewResponse: record.previewResponse,
    intro: record.intro,
    features: record.features,
    suggestions: record.suggestions,
    rawSoul: record.rawSoul,
    authorName: record.authorName,
    contactMethod: record.contactMethod,
    contactValue: record.contactValue,
    license: record.license,
    sourceUrl: record.sourceUrl,
    sourceAuthor: record.sourceAuthor,
    rightsStatement: record.rightsStatement,
    submitterNote: record.submitterNote,
  };
}

function findSubmissionByPublicId(publicId: string) {
  const row = database().prepare('SELECT * FROM soul_submissions WHERE public_id = ?').get(publicId) as SubmissionRow | undefined;
  return row ? mapSubmissionRow(row) : null;
}

function findSubmissionById(id: string) {
  const row = database().prepare('SELECT * FROM soul_submissions WHERE id = ?').get(id) as SubmissionRow | undefined;
  return row ? mapSubmissionRow(row) : null;
}

function getSubmissionRowsForManage(publicId: string, token: string) {
  const row = database().prepare('SELECT * FROM soul_submissions WHERE public_id = ? AND manage_token_hash = ?').get(publicId, hashManageToken(token)) as SubmissionRow | undefined;
  return row ? mapSubmissionRow(row) : null;
}

function getSubmissionRevisions(submissionId: string) {
  const rows = database().prepare('SELECT * FROM submission_revisions WHERE submission_id = ? ORDER BY revision_no DESC').all(submissionId) as RevisionRow[];
  return rows.map(mapRevisionRow);
}

function getSubmissionStatusLogs(submissionId: string) {
  const rows = database().prepare('SELECT * FROM submission_status_logs WHERE submission_id = ? ORDER BY created_at DESC').all(submissionId) as StatusLogRow[];
  return rows.map(mapStatusLogRow);
}

function serializeSubmissionInput(input: SubmissionInput) {
  return {
    submission_type: input.submissionType,
    title: input.title,
    summary: input.summary,
    category: input.category,
    tags_json: stringifyArray(input.tags),
    tones_json: stringifyArray(input.tones),
    use_cases_json: stringifyArray(input.useCases),
    compatible_models_json: stringifyArray(input.compatibleModels),
    preview_hook: input.previewHook,
    preview_prompt: input.previewPrompt,
    preview_response: input.previewResponse,
    intro: input.intro,
    features_json: stringifyArray(input.features),
    suggestions_json: stringifyArray(input.suggestions),
    raw_soul: input.rawSoul,
    author_name: input.authorName,
    contact_method: input.contactMethod ?? null,
    contact_value: input.contactValue ?? null,
    license: input.license,
    source_url: input.sourceUrl ?? null,
    source_author: input.sourceAuthor ?? null,
    rights_statement: input.rightsStatement,
    submitter_note: input.submitterNote ?? null,
  };
}

function getNextRevisionNo(submissionId: string) {
  const row = database().prepare('SELECT COALESCE(MAX(revision_no), 0) AS revision_no FROM submission_revisions WHERE submission_id = ?').get(submissionId) as { revision_no: number };
  return row.revision_no + 1;
}

function writeRevision(databaseHandle: ReturnType<typeof database>, submissionId: string, input: SubmissionInput, actorType: 'submitter' | 'admin') {
  databaseHandle.prepare(`
    INSERT INTO submission_revisions (id, submission_id, revision_no, payload_json, actor_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    submissionId,
    getNextRevisionNo(submissionId),
    JSON.stringify(input),
    actorType,
    new Date().toISOString(),
  );
}

function writeStatusLog(
  databaseHandle: ReturnType<typeof database>,
  submissionId: string,
  fromStatus: SubmissionStatus | null,
  toStatus: SubmissionStatus,
  actorType: 'submitter' | 'admin' | 'system',
  note: string | null,
) {
  databaseHandle.prepare(`
    INSERT INTO submission_status_logs (id, submission_id, from_status, to_status, actor_type, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), submissionId, fromStatus, toStatus, actorType, note, new Date().toISOString());
}

export function createSubmission(input: SubmissionInput) {
  const db = database();
  const id = randomUUID();
  const publicId = createPublicId();
  const manageToken = createManageToken();
  const manageTokenHash = hashManageToken(manageToken);
  const now = new Date().toISOString();
  const serialized = serializeSubmissionInput(input);

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO soul_submissions (
        id, public_id, manage_token_hash, status,
        submission_type, title, summary, category,
        tags_json, tones_json, use_cases_json, compatible_models_json,
        preview_hook, preview_prompt, preview_response,
        intro, features_json, suggestions_json, raw_soul,
        author_name, contact_method, contact_value,
        license, source_url, source_author,
        rights_statement, submitter_note,
        latest_reviewer_note, published_soul_id,
        created_at, updated_at, reviewed_at, published_at
      ) VALUES (
        @id, @public_id, @manage_token_hash, @status,
        @submission_type, @title, @summary, @category,
        @tags_json, @tones_json, @use_cases_json, @compatible_models_json,
        @preview_hook, @preview_prompt, @preview_response,
        @intro, @features_json, @suggestions_json, @raw_soul,
        @author_name, @contact_method, @contact_value,
        @license, @source_url, @source_author,
        @rights_statement, @submitter_note,
        NULL, NULL,
        @created_at, @updated_at, NULL, NULL
      )
    `).run({
      id,
      public_id: publicId,
      manage_token_hash: manageTokenHash,
      status: 'pending_review',
      ...serialized,
      created_at: now,
      updated_at: now,
    });

    writeRevision(db, id, input, 'submitter');
    writeStatusLog(db, id, null, 'pending_review', 'submitter', null);
  });

  transaction();

  const submission = findSubmissionById(id);
  if (!submission) {
    throw new Error('submission_creation_failed');
  }

  return {
    submission,
    publicId,
    manageToken,
  };
}

export function getPublicSubmissionView(publicId: string, token: string): PublicSubmissionView | null {
  const submission = getSubmissionRowsForManage(publicId, token);
  if (!submission) {
    return null;
  }

  return {
    submission,
    revisions: getSubmissionRevisions(submission.id),
    statusLogs: getSubmissionStatusLogs(submission.id),
  };
}

export function updateSubmissionByManageToken(publicId: string, token: string, input: SubmissionInput) {
  const db = database();
  const submission = getSubmissionRowsForManage(publicId, token);
  if (!submission) {
    throw new Error('submission_not_found');
  }

  if (submission.status !== 'needs_revision') {
    throw new Error('submission_not_editable');
  }

  const serialized = serializeSubmissionInput(input);
  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE soul_submissions
      SET
        status = @status,
        submission_type = @submission_type,
        title = @title,
        summary = @summary,
        category = @category,
        tags_json = @tags_json,
        tones_json = @tones_json,
        use_cases_json = @use_cases_json,
        compatible_models_json = @compatible_models_json,
        preview_hook = @preview_hook,
        preview_prompt = @preview_prompt,
        preview_response = @preview_response,
        intro = @intro,
        features_json = @features_json,
        suggestions_json = @suggestions_json,
        raw_soul = @raw_soul,
        author_name = @author_name,
        contact_method = @contact_method,
        contact_value = @contact_value,
        license = @license,
        source_url = @source_url,
        source_author = @source_author,
        rights_statement = @rights_statement,
        submitter_note = @submitter_note,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: submission.id,
      status: 'pending_review',
      ...serialized,
      updated_at: now,
    });

    writeRevision(db, submission.id, input, 'submitter');
    writeStatusLog(db, submission.id, submission.status, 'pending_review', 'submitter', input.submitterNote ?? null);
  });

  transaction();

  const updatedSubmission = findSubmissionById(submission.id);
  if (!updatedSubmission) {
    throw new Error('submission_update_failed');
  }

  return updatedSubmission;
}

function normalizePage(value?: number) {
  return value && value > 0 ? Math.floor(value) : 1;
}

function normalizePageSize(value?: number) {
  return value && value > 0 ? Math.min(Math.floor(value), 100) : 20;
}

export function listSubmissions(options: SubmissionListOptions = {}): SubmissionListResult {
  const page = normalizePage(options.page);
  const pageSize = normalizePageSize(options.pageSize);
  const clauses: string[] = [];
  const values: Array<string | number> = [];

  if (options.status && submissionStatusSet.has(options.status)) {
    clauses.push('status = ?');
    values.push(options.status);
  }

  if (options.query?.trim()) {
    clauses.push('(title LIKE ? OR public_id LIKE ? OR author_name LIKE ?)');
    const query = `%${options.query.trim()}%`;
    values.push(query, query, query);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const totalRow = database().prepare(`SELECT COUNT(*) AS total FROM soul_submissions ${whereClause}`).get(...values) as { total: number };
  const rows = database().prepare(`
    SELECT * FROM soul_submissions
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...values, pageSize, (page - 1) * pageSize) as SubmissionRow[];

  return {
    items: rows.map(mapSubmissionRow),
    total: totalRow.total,
    page,
    pageSize,
  };
}

export function getSubmissionDetailForAdmin(id: string): SubmissionDetailRecord | null {
  const submission = findSubmissionById(id);
  if (!submission) {
    return null;
  }

  return {
    submission,
    revisions: getSubmissionRevisions(submission.id),
    statusLogs: getSubmissionStatusLogs(submission.id),
  };
}

function sourceTypeToAuthorLines(submission: SubmissionRecord) {
  const lines = [`作者：${submission.authorName}`, `投稿类型：${submission.submissionType}`, `协议：${submission.license}`];
  if (submission.sourceAuthor) {
    lines.push(`原作者：${submission.sourceAuthor}`);
  }
  if (submission.sourceUrl) {
    lines.push(`来源：${submission.sourceUrl}`);
  }
  return lines;
}

function buildAuthorDisplay(submission: SubmissionRecord) {
  if (submission.sourceAuthor) {
    return `${submission.sourceAuthor} / ${submission.authorName}`;
  }
  return submission.authorName;
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function findAvailableSlug(title: string, publicId: string, preferredSlug?: string | null) {
  const normalizedPreferredSlug = normalizeOptionalText(preferredSlug);
  const fallbackSlug = slugify(title) || `submission-${publicId.replace(/_/g, '-').toLowerCase()}`;
  const desiredSlug = normalizedPreferredSlug ?? fallbackSlug;
  let candidate = desiredSlug;
  let suffix = 2;

  while (STATIC_SOUL_SLUGS.has(candidate) || database().prepare('SELECT 1 FROM published_souls WHERE slug = ?').get(candidate)) {
    candidate = `${desiredSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function buildPublishedSoulShape(submission: SubmissionRecord, slug: string): PublishedSoulRowShape {
  return {
    slug,
    title: submission.title,
    summary: submission.summary,
    category: submission.category,
    categoryLabel: CATEGORY_LABELS[submission.category],
    sourceType: submission.submissionType,
    featured: false,
    tags: submission.tags,
    tones: submission.tones,
    useCases: submission.useCases,
    compatibleModels: submission.compatibleModels,
    author: buildAuthorDisplay(submission),
    license: submission.license,
    updatedAt: new Date().toISOString().slice(0, 10),
    previewHook: submission.previewHook,
    previewPrompt: submission.previewPrompt,
    previewResponse: submission.previewResponse,
    intro: submission.intro,
    features: submission.features,
    suggestions: submission.suggestions,
    authorLines: sourceTypeToAuthorLines(submission),
    rawMarkdown: submission.rawSoul,
    rawSoul: submission.rawSoul,
    relatedSlugs: [],
  };
}

export function decideSubmission(
  id: string,
  action: 'needs_revision' | 'reject' | 'approve' | 'publish',
  note?: string | null,
  slugInput?: string | null,
): SubmissionRecord | PublishSubmissionResult {
  const db = database();
  const submission = findSubmissionById(id);
  if (!submission) {
    throw new Error('submission_not_found');
  }

  const adminNote = normalizeOptionalText(note);
  const now = new Date().toISOString();

  if (action === 'needs_revision') {
    if (submission.status !== 'pending_review' && submission.status !== 'approved') {
      throw new Error('invalid_status_transition');
    }

    const transaction = db.transaction(() => {
      db.prepare('UPDATE soul_submissions SET status = ?, latest_reviewer_note = ?, updated_at = ?, reviewed_at = ? WHERE id = ?').run(
        'needs_revision',
        adminNote,
        now,
        now,
        id,
      );
      writeStatusLog(db, id, submission.status, 'needs_revision', 'admin', adminNote);
    });
    transaction();

    const updated = findSubmissionById(id);
    if (!updated) {
      throw new Error('submission_update_failed');
    }
    return updated;
  }

  if (action === 'reject') {
    if (submission.status === 'published') {
      throw new Error('invalid_status_transition');
    }

    const transaction = db.transaction(() => {
      db.prepare('UPDATE soul_submissions SET status = ?, latest_reviewer_note = ?, updated_at = ?, reviewed_at = ? WHERE id = ?').run(
        'rejected',
        adminNote,
        now,
        now,
        id,
      );
      writeStatusLog(db, id, submission.status, 'rejected', 'admin', adminNote);
    });
    transaction();

    const updated = findSubmissionById(id);
    if (!updated) {
      throw new Error('submission_update_failed');
    }
    return updated;
  }

  if (action === 'approve') {
    if (submission.status !== 'pending_review' && submission.status !== 'needs_revision') {
      throw new Error('invalid_status_transition');
    }

    const transaction = db.transaction(() => {
      db.prepare('UPDATE soul_submissions SET status = ?, latest_reviewer_note = ?, updated_at = ?, reviewed_at = ? WHERE id = ?').run(
        'approved',
        adminNote,
        now,
        now,
        id,
      );
      writeStatusLog(db, id, submission.status, 'approved', 'admin', adminNote);
    });
    transaction();

    const updated = findSubmissionById(id);
    if (!updated) {
      throw new Error('submission_update_failed');
    }
    return updated;
  }

  if (submission.status !== 'approved') {
    throw new Error('invalid_status_transition');
  }

  const slug = findAvailableSlug(submission.title, submission.publicId, slugInput);
  const publishedSoul = buildPublishedSoulShape(submission, slug);

  const transaction = db.transaction(() => {
    const publishedSoulId = randomUUID();
    db.prepare(`
      INSERT INTO published_souls (
        id, slug, submission_id,
        title, summary, category, category_label, source_type,
        tags_json, tones_json, use_cases_json, compatible_models_json,
        author, license, preview_hook, preview_prompt, preview_response,
        intro, features_json, suggestions_json,
        author_lines_json, raw_markdown, raw_soul,
        featured, published_at, updated_at
      ) VALUES (
        @id, @slug, @submission_id,
        @title, @summary, @category, @category_label, @source_type,
        @tags_json, @tones_json, @use_cases_json, @compatible_models_json,
        @author, @license, @preview_hook, @preview_prompt, @preview_response,
        @intro, @features_json, @suggestions_json,
        @author_lines_json, @raw_markdown, @raw_soul,
        @featured, @published_at, @updated_at
      )
    `).run({
      id: publishedSoulId,
      slug: publishedSoul.slug,
      submission_id: submission.id,
      title: publishedSoul.title,
      summary: publishedSoul.summary,
      category: publishedSoul.category,
      category_label: publishedSoul.categoryLabel,
      source_type: publishedSoul.sourceType,
      tags_json: stringifyArray(publishedSoul.tags),
      tones_json: stringifyArray(publishedSoul.tones),
      use_cases_json: stringifyArray(publishedSoul.useCases),
      compatible_models_json: stringifyArray(publishedSoul.compatibleModels),
      author: publishedSoul.author,
      license: publishedSoul.license,
      preview_hook: publishedSoul.previewHook,
      preview_prompt: publishedSoul.previewPrompt,
      preview_response: publishedSoul.previewResponse,
      intro: publishedSoul.intro,
      features_json: stringifyArray(publishedSoul.features),
      suggestions_json: stringifyArray(publishedSoul.suggestions),
      author_lines_json: stringifyArray(publishedSoul.authorLines),
      raw_markdown: publishedSoul.rawMarkdown,
      raw_soul: publishedSoul.rawSoul,
      featured: publishedSoul.featured ? 1 : 0,
      published_at: now,
      updated_at: now,
    });

    db.prepare('UPDATE soul_submissions SET status = ?, latest_reviewer_note = ?, published_soul_id = ?, updated_at = ?, reviewed_at = ?, published_at = ? WHERE id = ?').run(
      'published',
      adminNote,
      publishedSoulId,
      now,
      now,
      now,
      id,
    );
    writeStatusLog(db, id, submission.status, 'published', 'admin', adminNote);
  });

  transaction();

  const updatedSubmission = findSubmissionById(id);
  const createdPublishedRow = database().prepare('SELECT * FROM published_souls WHERE submission_id = ? ORDER BY published_at DESC LIMIT 1').get(id) as PublishedSoulRow | undefined;
  if (!updatedSubmission || !createdPublishedRow) {
    throw new Error('submission_publish_failed');
  }

  return {
    submission: updatedSubmission,
    publishedSoul: mapPublishedSoulRow(createdPublishedRow),
  };
}

export function getPublishedSoulDocuments(): SoulDocument[] {
  const rows = database().prepare('SELECT * FROM published_souls ORDER BY published_at DESC').all() as PublishedSoulRow[];
  return rows.map(mapPublishedSoulRow);
}

export function getPublishedSoulBySlug(slug: string): SoulDocument | undefined {
  const row = database().prepare('SELECT * FROM published_souls WHERE slug = ?').get(slug) as PublishedSoulRow | undefined;
  return row ? mapPublishedSoulRow(row) : undefined;
}

export function getSubmissionByPublicIdForApi(publicId: string, token: string) {
  return getPublicSubmissionView(publicId, token);
}
