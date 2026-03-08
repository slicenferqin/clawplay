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
  '规划',
  '策略',
  '项目管理',
  '开发',
  '架构',
  '调试',
  '代码审查',
  '测试',
  '系统设计',
  '学习',
  '提问',
  '陪伴',
  '写作',
  '创意写作',
  '翻译',
  '文档整理',
  '角色扮演',
  '技术讲解',
  '产品分析',
  '复盘',
] as const;

export const TAG_SYNONYMS: Record<string, (typeof RECOMMENDED_TAGS)[number]> = {
  计划: '规划',
  '计划制定': '规划',
  审议: '策略',
  优先级: '项目管理',
  敏捷: '项目管理',
  编程: '开发',
  '编程搭档': '开发',
  coding: '开发',
  debug: '调试',
  '审查代码': '代码审查',
  回归: '测试',
  引导: '提问',
  陪聊: '陪伴',
  '轻技术': '技术讲解',
  趣味化: '角色扮演',
  海盗: '角色扮演',
} as const;

export type SubmissionContentCheckStatus = 'pass' | 'warning' | 'blocking';
export type SubmissionFieldHintTone = 'neutral' | SubmissionContentCheckStatus;

export interface SubmissionContentCheck {
  id: string;
  label: string;
  description: string;
  status: SubmissionContentCheckStatus;
}

export interface TagAliasMapping {
  input: string;
  canonical: string;
}

export interface TagVocabularyReview {
  canonicalTags: string[];
  duplicateTags: string[];
  aliasMappings: TagAliasMapping[];
  offDictionaryTags: string[];
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

const RECOMMENDED_TAG_SET = new Set(RECOMMENDED_TAGS.map((tag) => normalizeTagKey(tag)));
const TAG_SYNONYM_MAP = new Map(
  Object.entries(TAG_SYNONYMS).map(([source, target]) => [normalizeTagKey(source), target]),
);

function addCheck(checks: SubmissionContentCheck[], check: SubmissionContentCheck) {
  checks.push(check);
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim();
}

function measureTextLength(value: string | null | undefined) {
  return normalizeText(value).length;
}

function isLengthInRange(value: string, minimum: number, maximum: number) {
  const length = measureTextLength(value);
  return length >= minimum && length <= maximum;
}

function hasRecommendedArrayCount(values: string[], minimum: number, maximum: number) {
  return values.length >= minimum && values.length <= maximum;
}

function isLicensePlaceholder(value: string) {
  return /待确认|待补充|unknown|未知|tbd/i.test(normalizeText(value));
}

function needsSourceAttribution(type: SubmissionType) {
  return type === '翻译' || type === '改编';
}

function normalizeTagKey(value: string) {
  return normalizeText(value).toLowerCase();
}

function normalizeTagDisplay(value: string) {
  return normalizeText(value).replace(/\s+/g, ' ');
}

function getUniqueList(values: string[]) {
  return Array.from(new Set(values));
}

export function getTextRangeHint(value: string, minimum: number, maximum: number) {
  const length = measureTextLength(value);

  if (length === 0) {
    return {
      count: 0,
      tone: 'neutral' as const,
      message: `建议控制在 ${minimum}-${maximum} 个字符内。`,
    };
  }

  if (length < minimum) {
    return {
      count: length,
      tone: 'warning' as const,
      message: `建议至少 ${minimum} 个字符，当前为 ${length}。`,
    };
  }

  if (length > maximum) {
    return {
      count: length,
      tone: 'warning' as const,
      message: `建议不超过 ${maximum} 个字符，当前为 ${length}。`,
    };
  }

  return {
    count: length,
    tone: 'pass' as const,
    message: `长度合适，当前为 ${length} 个字符。`,
  };
}

export function getTextMinimumHint(value: string, minimum: number, successMessage: string) {
  const length = measureTextLength(value);

  if (length === 0) {
    return {
      count: 0,
      tone: 'neutral' as const,
      message: `建议至少 ${minimum} 个字符。`,
    };
  }

  if (length < minimum) {
    return {
      count: length,
      tone: 'warning' as const,
      message: `建议至少 ${minimum} 个字符，当前为 ${length}。`,
    };
  }

  return {
    count: length,
    tone: 'pass' as const,
    message: `${successMessage} 当前为 ${length} 个字符。`,
  };
}

export function reviewTagVocabulary(tags: string[]): TagVocabularyReview {
  const canonicalTags: string[] = [];
  const duplicateTags: string[] = [];
  const aliasMappings: TagAliasMapping[] = [];
  const offDictionaryTags: string[] = [];
  const seenCanonical = new Set<string>();

  for (const rawTag of tags) {
    const normalizedTag = normalizeTagDisplay(rawTag);
    if (!normalizedTag) {
      continue;
    }

    const normalizedKey = normalizeTagKey(normalizedTag);
    const canonicalTag = TAG_SYNONYM_MAP.get(normalizedKey) ?? normalizedTag;
    const canonicalKey = normalizeTagKey(canonicalTag);

    if (canonicalKey !== normalizedKey) {
      aliasMappings.push({ input: normalizedTag, canonical: canonicalTag });
    }

    if (seenCanonical.has(canonicalKey)) {
      duplicateTags.push(normalizedTag);
      continue;
    }

    seenCanonical.add(canonicalKey);
    canonicalTags.push(canonicalTag);

    if (!RECOMMENDED_TAG_SET.has(canonicalKey)) {
      offDictionaryTags.push(canonicalTag);
    }
  }

  return {
    canonicalTags,
    duplicateTags: getUniqueList(duplicateTags),
    aliasMappings: aliasMappings.filter((mapping, index, list) => list.findIndex((item) => item.input === mapping.input && item.canonical === mapping.canonical) === index),
    offDictionaryTags: getUniqueList(offDictionaryTags),
  };
}

export function getTagInputHint(tags: string[]) {
  const tagReview = reviewTagVocabulary(tags);
  const count = tags.length;

  if (count === 0) {
    return {
      tone: 'neutral' as const,
      message: `建议填写 ${CONTENT_RULES.tags.recommendedMin}-${CONTENT_RULES.tags.recommendedMax} 个标签，并优先复用推荐词表。`,
      review: tagReview,
    };
  }

  const notes: string[] = [];

  if (!hasRecommendedArrayCount(tags, CONTENT_RULES.tags.recommendedMin, CONTENT_RULES.tags.recommendedMax)) {
    notes.push(`建议保持 ${CONTENT_RULES.tags.recommendedMin}-${CONTENT_RULES.tags.recommendedMax} 个标签，当前为 ${count}。`);
  }

  if (tagReview.aliasMappings.length > 0) {
    notes.push(`可收敛为：${tagReview.aliasMappings.map((item) => `${item.input}→${item.canonical}`).join('，')}。`);
  }

  if (tagReview.duplicateTags.length > 0) {
    notes.push(`存在重复或语义重叠标签：${tagReview.duplicateTags.join('，')}。`);
  }

  if (tagReview.offDictionaryTags.length > 0) {
    notes.push(`还有 ${tagReview.offDictionaryTags.length} 个标签未进入推荐词表：${tagReview.offDictionaryTags.slice(0, 4).join('，')}。`);
  }

  if (notes.length === 0) {
    return {
      tone: 'pass' as const,
      message: `标签数量与词表复用情况都不错，当前 ${count} 个。`,
      review: tagReview,
    };
  }

  return {
    tone: 'warning' as const,
    message: notes.join(' '),
    review: tagReview,
  };
}

export function assessSubmissionContent(submission: SubmissionContentSource | SubmissionRecord): SubmissionContentAssessment {
  const checks: SubmissionContentCheck[] = [];
  const titleLength = measureTextLength(submission.title);
  const summaryLength = measureTextLength(submission.summary);
  const previewHookLength = measureTextLength(submission.previewHook);
  const previewPromptLength = measureTextLength(submission.previewPrompt);
  const previewResponseLength = measureTextLength(submission.previewResponse);
  const rawSoulLength = measureTextLength(submission.rawSoul);
  const rightsStatementLength = measureTextLength(submission.rightsStatement);
  const sourceUrl = normalizeText(submission.sourceUrl ?? null);
  const sourceAuthor = normalizeText(submission.sourceAuthor ?? null);
  const tagHint = getTagInputHint(submission.tags);

  addCheck(checks, {
    id: 'title-length',
    label: '标题长度',
    description: isLengthInRange(submission.title, CONTENT_RULES.title.recommendedMin, CONTENT_RULES.title.recommendedMax)
      ? '标题长度适中，适合在列表页和分享卡片里展示。'
      : `建议控制在 ${CONTENT_RULES.title.recommendedMin}-${CONTENT_RULES.title.recommendedMax} 个字符内，当前为 ${titleLength}。`,
    status: isLengthInRange(submission.title, CONTENT_RULES.title.recommendedMin, CONTENT_RULES.title.recommendedMax) ? 'pass' : 'warning',
  });

  addCheck(checks, {
    id: 'summary-length',
    label: '摘要质量',
    description: isLengthInRange(submission.summary, CONTENT_RULES.summary.recommendedMin, CONTENT_RULES.summary.recommendedMax)
      ? '摘要长度适合搜索结果、列表卡片和分享描述。'
      : `建议控制在 ${CONTENT_RULES.summary.recommendedMin}-${CONTENT_RULES.summary.recommendedMax} 个字符内，当前为 ${summaryLength}。`,
    status: isLengthInRange(submission.summary, CONTENT_RULES.summary.recommendedMin, CONTENT_RULES.summary.recommendedMax) ? 'pass' : 'warning',
  });

  addCheck(checks, {
    id: 'tag-count',
    label: '标签数量与词表',
    description: tagHint.message,
    status: tagHint.tone === 'pass' ? 'pass' : 'warning',
  });

  addCheck(checks, {
    id: 'preview-pack',
    label: '预览三件套',
    description:
      previewHookLength >= CONTENT_RULES.previewHookMinLength
      && previewPromptLength >= CONTENT_RULES.previewPromptMinLength
      && previewResponseLength >= CONTENT_RULES.previewResponseMinLength
        ? '预览钩子、示例 Prompt 和示例 Response 都达到可展示的最小质量。'
        : `预览钩子 / Prompt / Response 至少要达到 ${CONTENT_RULES.previewHookMinLength} / ${CONTENT_RULES.previewPromptMinLength} / ${CONTENT_RULES.previewResponseMinLength} 字。`,
    status:
      previewHookLength >= CONTENT_RULES.previewHookMinLength
      && previewPromptLength >= CONTENT_RULES.previewPromptMinLength
      && previewResponseLength >= CONTENT_RULES.previewResponseMinLength
        ? 'pass'
        : 'blocking',
  });

  addCheck(checks, {
    id: 'raw-soul-length',
    label: '原始 SOUL',
    description: rawSoulLength >= CONTENT_RULES.rawSoulMinLengthForPublish
      ? '原始 SOUL 内容长度达到最低发布要求。'
      : `原始 SOUL 过短，至少建议 ${CONTENT_RULES.rawSoulMinLengthForPublish} 字，当前为 ${rawSoulLength}。`,
    status: rawSoulLength >= CONTENT_RULES.rawSoulMinLengthForPublish ? 'pass' : 'blocking',
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
    description: normalizeText(submission.license) && !isLicensePlaceholder(submission.license)
      ? '协议字段明确，可用于公开展示。'
      : '协议仍是占位或待确认状态，发布前应补齐清晰的 license 说明。',
    status: normalizeText(submission.license) && !isLicensePlaceholder(submission.license) ? 'pass' : 'blocking',
  });

  addCheck(checks, {
    id: 'rights-statement',
    label: '权利声明',
    description: rightsStatementLength >= CONTENT_RULES.rightsStatementMinLength
      ? '投稿权利声明已补充。'
      : `权利声明过短，建议至少 ${CONTENT_RULES.rightsStatementMinLength} 字。`,
    status: rightsStatementLength >= CONTENT_RULES.rightsStatementMinLength ? 'pass' : 'blocking',
  });

  if (needsSourceAttribution(submission.submissionType)) {
    addCheck(checks, {
      id: 'source-url',
      label: '来源链接',
      description: sourceUrl
        ? '翻译 / 改编内容已提供来源链接。'
        : '翻译或改编内容发布前必须补齐原始来源链接。',
      status: sourceUrl ? 'pass' : 'blocking',
    });

    addCheck(checks, {
      id: 'source-author',
      label: '原作者署名',
      description: sourceAuthor
        ? '已提供原作者署名。'
        : '建议补齐原作者署名；若确实未知，也应在说明里明确标注。',
      status: sourceAuthor ? 'pass' : 'warning',
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
