import {
  INTERNAL_PERSONA_REVIEW_DIMENSIONS,
  PERSONA_VERSION,
  PUBLIC_PERSONA_DIMENSIONS,
  clampPersonaConfidence,
  clampPersonaScore,
  type InternalPersonaReviewKey,
  type PublicPersonaDimensionKey,
} from '@/lib/persona/constants';

export type PersonaVersion = typeof PERSONA_VERSION;
export type PersonaSubjectType = 'submission' | 'soul';
export type PersonaAnalysisStatus = 'generated' | 'confirmed';
export type PersonaAnalysisSource = 'bootstrap' | 'heuristic' | 'ai' | 'manual';
export type PersonaJobStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export type PersonaPublicScores = Record<PublicPersonaDimensionKey, number>;
export type PersonaPublicReasons = Record<PublicPersonaDimensionKey, string>;
export type PersonaPublicConfidence = Record<PublicPersonaDimensionKey, number>;
export type PersonaInternalReview = Record<InternalPersonaReviewKey, number>;

export interface PersonaSnapshot {
  title: string;
  summary: string;
  tags: string[];
  tones: string[];
  useCases: string[];
  compatibleModels: string[];
  previewHook: string;
  previewPrompt: string;
  previewResponse: string;
  intro: string;
  features: string[];
  suggestions: string[];
  rawSoul: string;
  submissionType?: string | null;
  sourceType?: string | null;
  author?: string | null;
  license?: string | null;
  sourceUrl?: string | null;
  sourceAuthor?: string | null;
}

export interface PersonaAnalysisRecord {
  id: string;
  subjectType: PersonaSubjectType;
  subjectKey: string;
  version: PersonaVersion;
  status: PersonaAnalysisStatus;
  summary: string;
  publicScores: PersonaPublicScores;
  publicReasons: PersonaPublicReasons;
  publicConfidence: PersonaPublicConfidence;
  internalReview: PersonaInternalReview;
  source: PersonaAnalysisSource;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rawResponseJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaJobRecord {
  id: string;
  subjectType: PersonaSubjectType;
  subjectKey: string;
  status: PersonaJobStatus;
  attempts: number;
  priority: number;
  lastError: string | null;
  queuedBy: string | null;
  runAfter: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaAnalysisUpsertInput {
  subjectType: PersonaSubjectType;
  subjectKey: string;
  status: PersonaAnalysisStatus;
  summary: string;
  publicScores: PersonaPublicScores;
  publicReasons: PersonaPublicReasons;
  publicConfidence: PersonaPublicConfidence;
  internalReview: PersonaInternalReview;
  source: PersonaAnalysisSource;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rawResponseJson?: string | null;
}

export interface PersonaProviderResult {
  summary: string;
  publicScores: PersonaPublicScores;
  publicReasons: PersonaPublicReasons;
  publicConfidence: PersonaPublicConfidence;
  internalReview: PersonaInternalReview;
  rawResponseJson?: string | null;
  source: Extract<PersonaAnalysisSource, 'heuristic' | 'ai'>;
}

export function createDefaultPersonaPublicScores(): PersonaPublicScores {
  return PUBLIC_PERSONA_DIMENSIONS.reduce((result, dimension) => {
    result[dimension.key] = 50;
    return result;
  }, {} as PersonaPublicScores);
}

export function createDefaultPersonaReasons(): PersonaPublicReasons {
  return PUBLIC_PERSONA_DIMENSIONS.reduce((result, dimension) => {
    result[dimension.key] = '当前还没有补充这个维度的判断理由。';
    return result;
  }, {} as PersonaPublicReasons);
}

export function createDefaultPersonaConfidence(): PersonaPublicConfidence {
  return PUBLIC_PERSONA_DIMENSIONS.reduce((result, dimension) => {
    result[dimension.key] = 0.62;
    return result;
  }, {} as PersonaPublicConfidence);
}

export function createDefaultInternalReview(): PersonaInternalReview {
  return INTERNAL_PERSONA_REVIEW_DIMENSIONS.reduce((result, dimension) => {
    result[dimension.key] = dimension.key === 'risk' ? 18 : 72;
    return result;
  }, {} as PersonaInternalReview);
}

export function normalizePersonaPublicScores(value: Partial<Record<PublicPersonaDimensionKey, number>> | null | undefined): PersonaPublicScores {
  const result = createDefaultPersonaPublicScores();

  for (const dimension of PUBLIC_PERSONA_DIMENSIONS) {
    result[dimension.key] = clampPersonaScore(Number(value?.[dimension.key] ?? result[dimension.key]));
  }

  return result;
}

export function normalizePersonaPublicReasons(value: Partial<Record<PublicPersonaDimensionKey, string>> | null | undefined): PersonaPublicReasons {
  const result = createDefaultPersonaReasons();

  for (const dimension of PUBLIC_PERSONA_DIMENSIONS) {
    const nextValue = value?.[dimension.key]?.trim();
    result[dimension.key] = nextValue && nextValue.length > 0 ? nextValue : result[dimension.key];
  }

  return result;
}

export function normalizePersonaPublicConfidence(value: Partial<Record<PublicPersonaDimensionKey, number>> | null | undefined): PersonaPublicConfidence {
  const result = createDefaultPersonaConfidence();

  for (const dimension of PUBLIC_PERSONA_DIMENSIONS) {
    result[dimension.key] = clampPersonaConfidence(Number(value?.[dimension.key] ?? result[dimension.key]));
  }

  return result;
}

export function normalizePersonaInternalReview(value: Partial<Record<InternalPersonaReviewKey, number>> | null | undefined): PersonaInternalReview {
  const result = createDefaultInternalReview();

  for (const dimension of INTERNAL_PERSONA_REVIEW_DIMENSIONS) {
    result[dimension.key] = clampPersonaScore(Number(value?.[dimension.key] ?? result[dimension.key]));
  }

  return result;
}

export function normalizePersonaSummary(summary: string | null | undefined) {
  const normalized = summary?.trim() ?? '';
  if (!normalized) {
    throw new Error('invalid_persona_summary');
  }

  return normalized;
}

export function normalizePersonaAnalysisInput(input: PersonaAnalysisUpsertInput): PersonaAnalysisUpsertInput {
  return {
    ...input,
    summary: normalizePersonaSummary(input.summary),
    publicScores: normalizePersonaPublicScores(input.publicScores),
    publicReasons: normalizePersonaPublicReasons(input.publicReasons),
    publicConfidence: normalizePersonaPublicConfidence(input.publicConfidence),
    internalReview: normalizePersonaInternalReview(input.internalReview),
    reviewedBy: input.reviewedBy?.trim() ? input.reviewedBy.trim() : null,
    reviewedAt: input.reviewedAt?.trim() ? input.reviewedAt.trim() : null,
    rawResponseJson: input.rawResponseJson?.trim() ? input.rawResponseJson.trim() : null,
  };
}
