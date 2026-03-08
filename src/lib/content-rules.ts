import type { SubmissionInput, SubmissionRecord, SubmissionType } from '@/lib/submissions/schema';

export const CONTENT_RULES = {
  title: { recommendedMin: 4, recommendedMax: 28 },
  summary: { recommendedMin: 24, recommendedMax: 100 },
  tags: { recommendedMin: 3, recommendedMax: 6 },
  tones: { recommendedMin: 1, recommendedMax: 4 },
  useCases: { recommendedMin: 1, recommendedMax: 4 },
  compatibleModels: { recommendedMin: 1, recommendedMax: 4 },
  features: { recommendedMin: 2, recommendedMax: 6 },
  suggestions: { recommendedMin: 1, recommendedMax: 5 },
  previewHookMinLength: 12,
  previewPromptMinLength: 10,
  previewResponseMinLength: 24,
  rawSoulMinLengthForPublish: 80,
  rightsStatementMinLength: 12,
} as const;

export const RECOMMENDED_TAGS = [
  '规划', '策略', '项目管理', '代码审查', '调试', '架构', '学习', '提问', '陪伴', '创意写作', '翻译', '角色扮演',
] as const;

export type SubmissionContentCheckStatus = 'pass' | 'warning' | 'blocking';

export interface SubmissionContentCheck {
  id: string;
  label: string;
  description: string;
  status: SubmissionContentCheckStatus;
}

export interface SubmissionContentAssessment {
  checks: SubmissionContentCheck[];
  blockingCount: number;
  warningCount: number;
  passCount: number;
  readyForPublish: boolean;
}

type SubmissionContentSource = Pick<
  SubmissionInput,
  | 'submissionType'
  | 'title'
  | 'summary'
  | 'tags'
  | 'tones'
  | 'useCases'
  | 'compatibleModels'
  | 'previewHook'
  | 'previewPrompt'
  | 'previewResponse'
  | 'intro'
  | 'features'
  | 'suggestions'
  | 'rawSoul'
  | 'license'
  | 'sourceUrl'
  | 'sourceAuthor'
  | 'rightsStatement'
>;

function addCheck(checks: SubmissionContentCheck[], check: SubmissionContentCheck) {
  checks.push(check);
}

function isLengthInRange(value: string, minimum: number, maximum: number) {
  return value.length >= minimum && value.length <= maximum;
}

function hasRecommendedArrayCount(values: string[], minimum: number, maximum: number) {
  return values.length >= minimum && values.length <= maximum;
}

function isLicensePlaceholder(value: string) {
  return /待确认|待补充|unknown|未知|tbd/i.test(value);
}

function needsSourceAttribution(type: SubmissionType) {
  return type === '翻译' || type === '改编';
}

export function assessSubmissionContent(submission: SubmissionContentSource | SubmissionRecord): SubmissionContentAssessment {
  const checks: SubmissionContentCheck[] = [];

  addCheck(checks, {
    id: 'title-length',
    label: '标题长度',
    description: isLengthInRange(submission.title, CONTENT_RULES.title.recommendedMin, CONTENT_RULES.title.recommendedMax)
      ? '标题长度适中，适合在列表页和分享卡片里展示。'
      : `建议控制在 ${CONTENT_RULES.title.recommendedMin}-${CONTENT_RULES.title.recommendedMax} 个字符内，当前为 ${submission.title.length}。`,
    status: isLengthInRange(submission.title, CONTENT_RULES.title.recommendedMin, CONTENT_RULES.title.recommendedMax) ? 'pass' : 'warning',
  });

  addCheck(checks, {
    id: 'summary-length',
    label: '摘要质量',
    description: isLengthInRange(submission.summary, CONTENT_RULES.summary.recommendedMin, CONTENT_RULES.summary.recommendedMax)
      ? '摘要长度适合搜索结果、列表卡片和分享描述。'
      : `建议控制在 ${CONTENT_RULES.summary.recommendedMin}-${CONTENT_RULES.summary.recommendedMax} 个字符内，当前为 ${submission.summary.length}。`,
    status: isLengthInRange(submission.summary, CONTENT_RULES.summary.recommendedMin, CONTENT_RULES.summary.recommendedMax) ? 'pass' : 'warning',
  });

  addCheck(checks, {
    id: 'tag-count',
    label: '标签数量',
    description: hasRecommendedArrayCount(submission.tags, CONTENT_RULES.tags.recommendedMin, CONTENT_RULES.tags.recommendedMax)
      ? '标签数量合理，适合搜索和筛选。'
      : `建议保持 ${CONTENT_RULES.tags.recommendedMin}-${CONTENT_RULES.tags.recommendedMax} 个标签，当前为 ${submission.tags.length}。`,
    status: hasRecommendedArrayCount(submission.tags, CONTENT_RULES.tags.recommendedMin, CONTENT_RULES.tags.recommendedMax) ? 'pass' : 'warning',
  });

  addCheck(checks, {
    id: 'preview-pack',
    label: '预览三件套',
    description:
      submission.previewHook.length >= CONTENT_RULES.previewHookMinLength
      && submission.previewPrompt.length >= CONTENT_RULES.previewPromptMinLength
      && submission.previewResponse.length >= CONTENT_RULES.previewResponseMinLength
        ? '预览钩子、示例 Prompt 和示例 Response 都达到可展示的最小质量。'
        : `预览钩子 / Prompt / Response 至少要达到 ${CONTENT_RULES.previewHookMinLength} / ${CONTENT_RULES.previewPromptMinLength} / ${CONTENT_RULES.previewResponseMinLength} 字。`,
    status:
      submission.previewHook.length >= CONTENT_RULES.previewHookMinLength
      && submission.previewPrompt.length >= CONTENT_RULES.previewPromptMinLength
      && submission.previewResponse.length >= CONTENT_RULES.previewResponseMinLength
        ? 'pass'
        : 'blocking',
  });

  addCheck(checks, {
    id: 'raw-soul-length',
    label: '原始 SOUL',
    description: submission.rawSoul.length >= CONTENT_RULES.rawSoulMinLengthForPublish
      ? '原始 SOUL 内容长度达到最低发布要求。'
      : `原始 SOUL 过短，至少建议 ${CONTENT_RULES.rawSoulMinLengthForPublish} 字，当前为 ${submission.rawSoul.length}。`,
    status: submission.rawSoul.length >= CONTENT_RULES.rawSoulMinLengthForPublish ? 'pass' : 'blocking',
  });

  addCheck(checks, {
    id: 'feature-completeness',
    label: '亮点与建议',
    description:
      hasRecommendedArrayCount(submission.features, CONTENT_RULES.features.recommendedMin, CONTENT_RULES.features.recommendedMax)
      && hasRecommendedArrayCount(submission.suggestions, CONTENT_RULES.suggestions.recommendedMin, CONTENT_RULES.suggestions.recommendedMax)
        ? '亮点和使用建议数量都比较完整。'
        : `建议亮点保持 ${CONTENT_RULES.features.recommendedMin}-${CONTENT_RULES.features.recommendedMax} 条，建议使用建议保持 ${CONTENT_RULES.suggestions.recommendedMin}-${CONTENT_RULES.suggestions.recommendedMax} 条。`,
    status:
      hasRecommendedArrayCount(submission.features, CONTENT_RULES.features.recommendedMin, CONTENT_RULES.features.recommendedMax)
      && hasRecommendedArrayCount(submission.suggestions, CONTENT_RULES.suggestions.recommendedMin, CONTENT_RULES.suggestions.recommendedMax)
        ? 'pass'
        : 'warning',
  });

  addCheck(checks, {
    id: 'license-quality',
    label: '协议说明',
    description: submission.license && !isLicensePlaceholder(submission.license)
      ? '协议字段明确，可用于公开展示。'
      : '协议仍是占位或待确认状态，发布前应补齐清晰的 license 说明。',
    status: submission.license && !isLicensePlaceholder(submission.license) ? 'pass' : 'blocking',
  });

  addCheck(checks, {
    id: 'rights-statement',
    label: '权利声明',
    description: submission.rightsStatement.length >= CONTENT_RULES.rightsStatementMinLength
      ? '投稿权利声明已补充。'
      : `权利声明过短，建议至少 ${CONTENT_RULES.rightsStatementMinLength} 字。`,
    status: submission.rightsStatement.length >= CONTENT_RULES.rightsStatementMinLength ? 'pass' : 'blocking',
  });

  if (needsSourceAttribution(submission.submissionType)) {
    addCheck(checks, {
      id: 'source-url',
      label: '来源链接',
      description: submission.sourceUrl
        ? '翻译 / 改编内容已提供来源链接。'
        : '翻译或改编内容发布前必须补齐原始来源链接。',
      status: submission.sourceUrl ? 'pass' : 'blocking',
    });

    addCheck(checks, {
      id: 'source-author',
      label: '原作者署名',
      description: submission.sourceAuthor
        ? '已提供原作者署名。'
        : '建议补齐原作者署名；若确实未知，也应在说明里明确标注。',
      status: submission.sourceAuthor ? 'pass' : 'warning',
    });
  }

  const blockingCount = checks.filter((check) => check.status === 'blocking').length;
  const warningCount = checks.filter((check) => check.status === 'warning').length;
  const passCount = checks.filter((check) => check.status === 'pass').length;

  return {
    checks,
    blockingCount,
    warningCount,
    passCount,
    readyForPublish: blockingCount === 0,
  };
}
