import type { SoulDocument } from '@/lib/souls-types';
import type { SubmissionRecord } from '@/lib/submissions/schema';
import type { PersonaSnapshot } from '@/lib/persona/schema';

export function buildPersonaSnapshotFromSubmission(submission: SubmissionRecord): PersonaSnapshot {
  return {
    title: submission.title,
    summary: submission.summary,
    tags: submission.tags,
    tones: submission.tones,
    useCases: submission.useCases,
    compatibleModels: submission.compatibleModels,
    previewHook: submission.previewHook,
    previewPrompt: submission.previewPrompt,
    previewResponse: submission.previewResponse,
    intro: submission.intro,
    features: submission.features,
    suggestions: submission.suggestions,
    rawSoul: submission.rawSoul,
    submissionType: submission.submissionType,
    sourceType: submission.submissionType,
    author: submission.authorName,
    license: submission.license,
    sourceUrl: submission.sourceUrl,
    sourceAuthor: submission.sourceAuthor,
  };
}

export function buildPersonaSnapshotFromSoul(soul: SoulDocument): PersonaSnapshot {
  return {
    title: soul.title,
    summary: soul.summary,
    tags: soul.tags,
    tones: soul.tones,
    useCases: soul.useCases,
    compatibleModels: soul.compatibleModels,
    previewHook: soul.previewHook,
    previewPrompt: soul.previewPrompt,
    previewResponse: soul.previewResponse,
    intro: soul.intro,
    features: soul.features,
    suggestions: soul.suggestions,
    rawSoul: soul.rawSoul,
    sourceType: soul.sourceType,
    author: soul.author,
    license: soul.license,
  };
}
