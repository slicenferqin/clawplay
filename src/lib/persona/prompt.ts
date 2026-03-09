import type { PersonaSnapshot } from '@/lib/persona/schema';

function renderList(title: string, values: string[]) {
  if (values.length === 0) {
    return `${title}: 无`;
  }

  return `${title}: ${values.join(' / ')}`;
}

export function buildPersonaAnalysisSystemPrompt() {
  return [
    '你是 ClawPlay 的 Soul 人格分析器。',
    '你的目标不是评价好坏，而是提炼一个 OpenClaw Soul 的人格轮廓。',
    '只输出 JSON，不输出解释性前后缀。',
    '不要给总分，不要做排行榜式结论。',
    'publicScores 必须包含 initiative、warmth、sharpness、roleplay、boundaries、structure 六个键，值为 0-100 整数。',
    'publicReasons 必须为每个维度给一句中文理由。',
    'publicConfidence 必须为每个维度给 0-1 小数。',
    'internalReview 必须包含 completeness、consistency、publishability、risk 四个键，值为 0-100 整数。',
    'summary 必须是一句中文人格总结。',
  ].join('\n');
}

export function buildPersonaAnalysisUserPrompt(snapshot: PersonaSnapshot) {
  return [
    `标题: ${snapshot.title}`,
    `摘要: ${snapshot.summary}`,
    renderList('标签', snapshot.tags),
    renderList('语气', snapshot.tones),
    renderList('适用场景', snapshot.useCases),
    renderList('兼容模型', snapshot.compatibleModels),
    `预览钩子: ${snapshot.previewHook || '无'}`,
    `示例提问: ${snapshot.previewPrompt || '无'}`,
    `示例回复: ${snapshot.previewResponse || '无'}`,
    `简介: ${snapshot.intro || '无'}`,
    renderList('特色功能', snapshot.features),
    renderList('使用建议', snapshot.suggestions),
    `来源类型: ${snapshot.sourceType ?? snapshot.submissionType ?? '未知'}`,
    `作者: ${snapshot.author ?? '未知'}`,
    `协议: ${snapshot.license ?? '未知'}`,
    `来源链接: ${snapshot.sourceUrl ?? '无'}`,
    `原作者: ${snapshot.sourceAuthor ?? '无'}`,
    '以下是原始 SOUL.md 内容，请优先基于它判断人格轮廓：',
    snapshot.rawSoul || '无原始内容',
  ].join('\n\n');
}
