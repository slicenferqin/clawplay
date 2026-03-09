import type { SoulCategoryKey, SoulDocument, SoulSourceType } from '@/lib/souls-types';

export const submissionStatuses = ['pending_review', 'needs_revision', 'approved', 'published', 'rejected'] as const;
export const submissionTypes = ['原创', '翻译', '改编'] as const;
export const contactMethods = ['github', 'email', 'wechat', 'other'] as const;

export type SubmissionStatus = (typeof submissionStatuses)[number];
export type SubmissionType = (typeof submissionTypes)[number];
export type ContactMethod = (typeof contactMethods)[number];

export interface SubmissionInput {
  submissionType: SubmissionType;
  title: string;
  summary: string;
  category: SoulCategoryKey;
  tags: string[];
  proposedTags: string[];
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
  authorName: string;
  contactMethod?: ContactMethod | null;
  contactValue?: string | null;
  license: string;
  sourceUrl?: string | null;
  sourceAuthor?: string | null;
  rightsStatement: string;
  submitterNote?: string | null;
}

export interface SubmissionRecord {
  id: string;
  publicId: string;
  status: SubmissionStatus;
  submissionType: SubmissionType;
  title: string;
  summary: string;
  category: SoulCategoryKey;
  tags: string[];
  proposedTags: string[];
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
  authorName: string;
  contactMethod: ContactMethod | null;
  contactValue: string | null;
  license: string;
  sourceUrl: string | null;
  sourceAuthor: string | null;
  rightsStatement: string;
  submitterNote: string | null;
  latestReviewerNote: string | null;
  publishedSoulId: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
}

export interface SubmissionRevisionRecord {
  id: string;
  submissionId: string;
  revisionNo: number;
  payload: SubmissionInput;
  actorType: 'submitter' | 'admin';
  createdAt: string;
}

export interface SubmissionStatusLogRecord {
  id: string;
  submissionId: string;
  fromStatus: SubmissionStatus | null;
  toStatus: SubmissionStatus;
  actorType: 'submitter' | 'admin' | 'system';
  note: string | null;
  createdAt: string;
}

export interface PublishedSoulRecord extends SoulDocument {
  submissionId: string;
  publishedAt: string;
}

export interface SubmissionDetailRecord {
  submission: SubmissionRecord;
  revisions: SubmissionRevisionRecord[];
  statusLogs: SubmissionStatusLogRecord[];
}

export interface SubmissionListResult {
  items: SubmissionRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PublicSubmissionView {
  submission: SubmissionRecord;
  revisions: SubmissionRevisionRecord[];
  statusLogs: SubmissionStatusLogRecord[];
}

export interface PublishSubmissionResult {
  submission: SubmissionRecord;
  publishedSoul: PublishedSoulRecord;
}

export interface PublishedSoulRowShape {
  slug: string;
  title: string;
  summary: string;
  category: SoulCategoryKey;
  categoryLabel: string;
  sourceType: SoulSourceType;
  featured: boolean;
  tags: string[];
  tones: string[];
  useCases: string[];
  compatibleModels: string[];
  author: string;
  license: string;
  updatedAt: string;
  previewHook: string;
  previewPrompt: string;
  previewResponse: string;
  intro: string;
  features: string[];
  suggestions: string[];
  authorLines: string[];
  rawMarkdown: string;
  rawSoul: string;
  relatedSlugs: string[];
}
