import { assessSubmissionContent } from '@/lib/content-rules';
import { listAllSubmissions } from '@/lib/submissions/service';
import type { SubmissionRecord, SubmissionStatus, SubmissionType } from '@/lib/submissions/schema';

export const adminQuickViews = ['all', 'missing_source', 'blocking', 'ready_to_publish'] as const;

export type AdminQuickView = (typeof adminQuickViews)[number];
export type AdminQueueTone = 'critical' | 'warning' | 'ready' | 'neutral';
export type AdminSourceTone = 'neutral' | 'warning' | 'ready';

export interface SubmissionSourceState {
  label: string;
  tone: AdminSourceTone;
  description: string;
}

export interface SubmissionQueueInsight {
  sourceState: SubmissionSourceState;
  blockingCount: number;
  warningCount: number;
  passCount: number;
  readyForPublish: boolean;
  missingSource: boolean;
  missingSourceAuthor: boolean;
  blockerLabels: string[];
  priorityScore: number;
  priorityLabel: string;
  priorityTone: AdminQueueTone;
  priorityDescription: string;
  nextStep: string;
  riskSummary: string;
}

export interface AdminQueueItem {
  submission: SubmissionRecord;
  insight: SubmissionQueueInsight;
}

export interface AdminQueueSummary {
  total: number;
  missingSource: number;
  blocking: number;
  readyToPublish: number;
}

export interface AdminQueueFilters {
  status?: SubmissionStatus;
  submissionType?: SubmissionType;
  query?: string;
  view?: AdminQuickView;
  page?: number;
  pageSize?: number;
}

export interface AdminQueueResult {
  items: AdminQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  summary: AdminQueueSummary;
}

function normalizeOptionalText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function needsSourceAttribution(type: SubmissionType) {
  return type === '翻译' || type === '改编';
}

function getStatusPriorityBoost(status: SubmissionStatus) {
  switch (status) {
    case 'pending_review':
      return 36;
    case 'needs_revision':
      return 26;
    case 'approved':
      return 18;
    case 'published':
      return 6;
    case 'rejected':
      return 0;
    default:
      return 0;
  }
}

export function getSubmissionSourceState(submission: SubmissionRecord): SubmissionSourceState {
  if (submission.submissionType === '原创') {
    return {
      label: '原创稿',
      tone: 'neutral',
      description: '原创稿无需补外部来源，优先核作者信息与协议说明。',
    };
  }

  if (normalizeOptionalText(submission.sourceUrl) && normalizeOptionalText(submission.sourceAuthor)) {
    return {
      label: '来源完整',
      tone: 'ready',
      description: '原始来源链接与原作者信息都已附上，可继续核内容质量。',
    };
  }

  if (normalizeOptionalText(submission.sourceUrl)) {
    return {
      label: '已附来源',
      tone: 'ready',
      description: '来源链接已提供，建议再补齐原作者信息，方便公开展示与版权说明。',
    };
  }

  return {
    label: '待补来源',
    tone: 'warning',
    description: '翻译或改编稿件还没有原始来源链接，发布前需要优先补齐。',
  };
}

export function getSubmissionQueueInsight(submission: SubmissionRecord): SubmissionQueueInsight {
  const assessment = assessSubmissionContent(submission);
  const sourceState = getSubmissionSourceState(submission);
  const missingSource = needsSourceAttribution(submission.submissionType) && !normalizeOptionalText(submission.sourceUrl);
  const missingSourceAuthor = needsSourceAttribution(submission.submissionType) && !normalizeOptionalText(submission.sourceAuthor);
  const blockerLabels = assessment.checks.filter((check) => check.status === 'blocking').map((check) => check.label);

  let priorityScore = 100 + getStatusPriorityBoost(submission.status);
  let priorityLabel = '队列跟进';
  let priorityTone: AdminQueueTone = 'neutral';
  let priorityDescription = '当前稿件可按常规顺序跟进。';
  let nextStep = '查看详情并做首轮人工判断。';

  if (missingSource) {
    priorityScore = 520 + getStatusPriorityBoost(submission.status);
    priorityLabel = '缺来源优先';
    priorityTone = 'critical';
    priorityDescription = '先补原始来源链接，再决定是否继续推进审核。';
    nextStep = missingSourceAuthor ? '先补来源链接，再补原作者署名与授权说明。' : '先补来源链接，随后复核内容质量与授权边界。';
  } else if (submission.status === 'approved' && assessment.readyForPublish) {
    priorityScore = 420 + getStatusPriorityBoost(submission.status);
    priorityLabel = '待发布';
    priorityTone = 'ready';
    priorityDescription = '内容已达到发布门槛，可安排最终 slug 与站点发布。';
    nextStep = '确认 slug 与审核备注后，可直接执行发布入站。';
  } else if (assessment.blockingCount > 0) {
    priorityScore = 320 + getStatusPriorityBoost(submission.status);
    priorityLabel = '阻断待处理';
    priorityTone = 'warning';
    priorityDescription = `当前还有 ${assessment.blockingCount} 个阻断项，建议先补齐再推进状态流转。`;
    nextStep = blockerLabels.length > 0 ? `优先处理：${blockerLabels.slice(0, 2).join('、')}。` : '先处理右侧内容检查中的阻断项。';
  } else if (submission.status === 'pending_review') {
    priorityScore = 240 + getStatusPriorityBoost(submission.status);
    priorityLabel = '待审核';
    priorityTone = 'neutral';
    priorityDescription = '基础信息已较完整，可以进入首轮审核判断。';
    nextStep = '确认是否进入待补充、通过审核或直接归档。';
  } else if (submission.status === 'needs_revision') {
    priorityScore = 210 + getStatusPriorityBoost(submission.status);
    priorityLabel = '待作者补充';
    priorityTone = 'warning';
    priorityDescription = '稿件正在等待投稿人补充材料或修订内容。';
    nextStep = '对照审核备注，确认作者是否已补齐关键内容。';
  } else if (submission.status === 'published') {
    priorityScore = 80 + getStatusPriorityBoost(submission.status);
    priorityLabel = '已发布';
    priorityTone = 'neutral';
    priorityDescription = '稿件已进入站点，当前主要用于回看记录或来源复查。';
    nextStep = '无需优先处理，保留为已发布记录。';
  } else if (submission.status === 'rejected') {
    priorityScore = 40 + getStatusPriorityBoost(submission.status);
    priorityLabel = '已归档';
    priorityTone = 'neutral';
    priorityDescription = '该稿件已结束处理，保留决策链路即可。';
    nextStep = '无需继续推进，必要时用于复盘。';
  }

  const riskSegments: string[] = [];
  if (missingSource) {
    riskSegments.push('缺原始来源链接');
  }
  if (assessment.blockingCount > 0) {
    riskSegments.push(`阻断 ${assessment.blockingCount}`);
  }
  if (assessment.warningCount > 0) {
    riskSegments.push(`警告 ${assessment.warningCount}`);
  }
  if (riskSegments.length === 0) {
    riskSegments.push('当前无阻断项');
  }

  return {
    sourceState,
    blockingCount: assessment.blockingCount,
    warningCount: assessment.warningCount,
    passCount: assessment.passCount,
    readyForPublish: assessment.readyForPublish,
    missingSource,
    missingSourceAuthor,
    blockerLabels,
    priorityScore,
    priorityLabel,
    priorityTone,
    priorityDescription,
    nextStep,
    riskSummary: riskSegments.join(' · '),
  };
}

function matchesBaseFilters(item: AdminQueueItem, filters: AdminQueueFilters) {
  const { submission } = item;

  if (filters.status && submission.status !== filters.status) {
    return false;
  }

  if (filters.submissionType && submission.submissionType !== filters.submissionType) {
    return false;
  }

  const normalizedQuery = normalizeSearchText(filters.query);
  if (!normalizedQuery) {
    return true;
  }

  const haystacks = [
    submission.title,
    submission.summary,
    submission.publicId,
    submission.authorName,
    submission.sourceAuthor,
  ].map((value) => normalizeSearchText(value));

  return haystacks.some((value) => value.includes(normalizedQuery));
}

function matchesQuickView(item: AdminQueueItem, view: AdminQuickView) {
  switch (view) {
    case 'missing_source':
      return item.insight.missingSource;
    case 'blocking':
      return item.insight.blockingCount > 0;
    case 'ready_to_publish':
      return item.submission.status === 'approved' && item.insight.readyForPublish;
    case 'all':
    default:
      return true;
  }
}

function sortQueueItems(left: AdminQueueItem, right: AdminQueueItem) {
  if (right.insight.priorityScore !== left.insight.priorityScore) {
    return right.insight.priorityScore - left.insight.priorityScore;
  }

  return new Date(right.submission.createdAt).getTime() - new Date(left.submission.createdAt).getTime();
}

function normalizePage(value: number | undefined) {
  return value && Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

function normalizePageSize(value: number | undefined) {
  if (!value || !Number.isFinite(value)) {
    return 20;
  }

  return Math.min(50, Math.max(1, Math.floor(value)));
}

export function listAdminQueue(filters: AdminQueueFilters = {}): AdminQueueResult {
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const quickView = filters.view ?? 'all';

  const baseItems = listAllSubmissions()
    .map((submission) => ({
      submission,
      insight: getSubmissionQueueInsight(submission),
    }))
    .filter((item) => matchesBaseFilters(item, filters));

  const summary: AdminQueueSummary = {
    total: baseItems.length,
    missingSource: baseItems.filter((item) => item.insight.missingSource).length,
    blocking: baseItems.filter((item) => item.insight.blockingCount > 0).length,
    readyToPublish: baseItems.filter((item) => item.submission.status === 'approved' && item.insight.readyForPublish).length,
  };

  const filteredItems = baseItems
    .filter((item) => matchesQuickView(item, quickView))
    .sort(sortQueueItems);

  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);

  return {
    items,
    total: filteredItems.length,
    page,
    pageSize,
    summary,
  };
}
