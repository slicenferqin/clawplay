export const PERSONA_VERSION = 'persona-v1' as const;

export const PUBLIC_PERSONA_DIMENSIONS = [
  {
    key: 'initiative',
    label: '主动性',
    lowLabel: '偏被动',
    mediumLabel: '适中',
    highLabel: '偏主动',
    lowDescription: '更像响应式陪跑，通常等你先开题。',
    highDescription: '会主动拆解问题、推进下一步并尝试收口。',
  },
  {
    key: 'warmth',
    label: '温度感',
    lowLabel: '偏冷静',
    mediumLabel: '克制温和',
    highLabel: '偏温暖',
    lowDescription: '情绪陪伴较弱，更偏冷静、理性与克制。',
    highDescription: '带安抚感、亲近感和更强的陪伴氛围。',
  },
  {
    key: 'sharpness',
    label: '锋利度',
    lowLabel: '偏圆润',
    mediumLabel: '直率适中',
    highLabel: '偏锋利',
    lowDescription: '表达更委婉，更少直接挑错或施压。',
    highDescription: '表达更直给、犀利，指出问题时不太绕弯。',
  },
  {
    key: 'roleplay',
    label: '角色感',
    lowLabel: '偏工具型',
    mediumLabel: '轻角色',
    highLabel: '角色鲜明',
    lowDescription: '更像中性的工具助手，角色氛围感较弱。',
    highDescription: '人格语气和角色氛围很明显，容易被感知到。',
  },
  {
    key: 'boundaries',
    label: '边界感',
    lowLabel: '偏随和',
    mediumLabel: '有原则',
    highLabel: '边界明确',
    lowDescription: '更愿意贴合上下文调整，自我原则感较弱。',
    highDescription: '会坚持设定、原则或限制，拒绝边界更清晰。',
  },
  {
    key: 'structure',
    label: '结构感',
    lowLabel: '偏发散',
    mediumLabel: '有层次',
    highLabel: '结构稳定',
    lowDescription: '输出更像灵感流或陪聊，层次感较弱。',
    highDescription: '输出更有框架、清单感和稳定秩序。',
  },
] as const;

export const INTERNAL_PERSONA_REVIEW_DIMENSIONS = [
  { key: 'completeness', label: '完整度' },
  { key: 'consistency', label: '一致性' },
  { key: 'publishability', label: '可发布性' },
  { key: 'risk', label: '风险度' },
] as const;

export type PublicPersonaDimensionKey = (typeof PUBLIC_PERSONA_DIMENSIONS)[number]['key'];
export type InternalPersonaReviewKey = (typeof INTERNAL_PERSONA_REVIEW_DIMENSIONS)[number]['key'];

export function clampPersonaScore(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampPersonaConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return 0.55;
  }

  return Math.min(0.98, Math.max(0.05, Number(value.toFixed(2))));
}

export function getPersonaDimensionMeta(key: PublicPersonaDimensionKey) {
  return PUBLIC_PERSONA_DIMENSIONS.find((dimension) => dimension.key === key);
}

export function getInternalPersonaReviewMeta(key: InternalPersonaReviewKey) {
  return INTERNAL_PERSONA_REVIEW_DIMENSIONS.find((dimension) => dimension.key === key);
}

export function getPersonaScoreBand(score: number) {
  if (score >= 68) {
    return 'high';
  }

  if (score <= 33) {
    return 'low';
  }

  return 'medium';
}

export function getPersonaDimensionDescriptor(key: PublicPersonaDimensionKey, score: number) {
  const meta = getPersonaDimensionMeta(key);
  if (!meta) {
    return '未定义';
  }

  const band = getPersonaScoreBand(score);
  if (band === 'high') {
    return meta.highLabel;
  }

  if (band === 'low') {
    return meta.lowLabel;
  }

  return meta.mediumLabel;
}

export function getPersonaDimensionDescription(key: PublicPersonaDimensionKey, score: number) {
  const meta = getPersonaDimensionMeta(key);
  if (!meta) {
    return '';
  }

  return getPersonaScoreBand(score) === 'high' ? meta.highDescription : meta.lowDescription;
}
