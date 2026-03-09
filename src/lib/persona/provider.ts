import 'server-only';

import {
  PUBLIC_PERSONA_DIMENSIONS,
  clampPersonaConfidence,
  clampPersonaScore,
  getPersonaDimensionDescriptor,
  getPersonaScoreBand,
  type PublicPersonaDimensionKey,
} from '@/lib/persona/constants';
import { buildPersonaAnalysisSystemPrompt, buildPersonaAnalysisUserPrompt } from '@/lib/persona/prompt';
import {
  createDefaultInternalReview,
  normalizePersonaPublicConfidence,
  normalizePersonaPublicReasons,
  normalizePersonaPublicScores,
  normalizePersonaSummary,
  type PersonaInternalReview,
  type PersonaProviderResult,
  type PersonaPublicConfidence,
  type PersonaPublicReasons,
  type PersonaPublicScores,
  type PersonaSnapshot,
} from '@/lib/persona/schema';

const POSITIVE_HINTS: Record<PublicPersonaDimensionKey, string[]> = {
  initiative: ['主动', '推进', '拆解', '下一步', '建议', '计划', '优先', '落地', '收口'],
  warmth: ['温暖', '陪伴', '安抚', '亲近', '柔和', '耐心', '可爱', '体贴', '陪我'],
  sharpness: ['直给', '犀利', '毒舌', '暴躁', '挑错', '批判', '审查', '别急', '不客气'],
  roleplay: ['角色', '猫娘', '船长', '谋士', '导师', '审查官', '老王', '人格', '语气'],
  boundaries: ['原则', '边界', '限制', '拒绝', '必须', '不能', '严格', '约束', '规范'],
  structure: ['结构', '框架', '步骤', '清单', '拆解', '层次', '优先级', '计划', '架构'],
};

const NEGATIVE_HINTS: Record<PublicPersonaDimensionKey, string[]> = {
  initiative: ['等待', '陪我坐', '先听你说', '提问', '慢慢来'],
  warmth: ['冷静', '克制', '审查', '架构', '规则'],
  sharpness: ['温柔', '圆润', '委婉', '安抚', '陪伴'],
  roleplay: ['中性', '工具', '助手', '理性分析'],
  boundaries: ['随和', '灵活', '自由发挥', '适配', '不设限'],
  structure: ['发散', '灵感', '闲聊', '随便聊'],
};

function normalizeText(value: string) {
  return value.toLowerCase();
}

function collectEvidence(snapshot: PersonaSnapshot) {
  const sections = [
    snapshot.title,
    snapshot.summary,
    snapshot.previewHook,
    snapshot.previewPrompt,
    snapshot.previewResponse,
    snapshot.intro,
    snapshot.rawSoul,
    snapshot.tags.join(' '),
    snapshot.tones.join(' '),
    snapshot.useCases.join(' '),
    snapshot.features.join(' '),
    snapshot.suggestions.join(' '),
  ];

  return normalizeText(sections.join('\n'));
}

function countMatches(text: string, hints: string[]) {
  const matched: string[] = [];

  for (const hint of hints) {
    if (text.includes(normalizeText(hint))) {
      matched.push(hint);
    }
  }

  return matched;
}

function inferArchetype(snapshot: PersonaSnapshot, scores: PersonaPublicScores) {
  const title = `${snapshot.title} ${snapshot.summary}`;

  if (/审查|review|代码审查|挑错/i.test(title)) {
    return '审查型';
  }

  if (/猫娘|陪伴|温柔|陪我|日常聊天/i.test(title)) {
    return '陪伴型';
  }

  if (/谋士|策略|朝堂|顾问/i.test(title)) {
    return '谋士型';
  }

  if (/项目|经理|规划|优先级/i.test(title)) {
    return '推进型';
  }

  if (/架构|结构|系统设计/i.test(title)) {
    return '架构型';
  }

  if (/导师|提问|学习|苏格拉底/i.test(title)) {
    return '引导型';
  }

  if (/船长|海盗|角色/i.test(title) || scores.roleplay >= 80) {
    return '角色扮演型';
  }

  return '人格型';
}

function buildSummary(snapshot: PersonaSnapshot, scores: PersonaPublicScores) {
  const keyOrder = [...PUBLIC_PERSONA_DIMENSIONS]
    .map((dimension) => ({ key: dimension.key, score: scores[dimension.key] }))
    .sort((left, right) => right.score - left.score);

  const topTraits = keyOrder.slice(0, 3).map((item) => {
    if (item.score >= 70) {
      return `高${PUBLIC_PERSONA_DIMENSIONS.find((dimension) => dimension.key === item.key)?.label ?? item.key}`;
    }

    if (item.score <= 35) {
      return `低${PUBLIC_PERSONA_DIMENSIONS.find((dimension) => dimension.key === item.key)?.label ?? item.key}`;
    }

    return `${PUBLIC_PERSONA_DIMENSIONS.find((dimension) => dimension.key === item.key)?.label ?? item.key}适中`;
  });

  return `${normalizePersonaSummary(`一个${topTraits.slice(0, 2).join('、')}，${getPersonaDimensionDescriptor('structure', scores.structure)}的${inferArchetype(snapshot, scores)} Soul。`)}`;
}

function buildReason(key: PublicPersonaDimensionKey, score: number, positiveMatches: string[], negativeMatches: string[]) {
  const label = PUBLIC_PERSONA_DIMENSIONS.find((dimension) => dimension.key === key)?.label ?? key;
  const band = getPersonaScoreBand(score);
  const evidence = positiveMatches.length > 0 ? positiveMatches.slice(0, 3).join('、') : negativeMatches.slice(0, 2).join('、');

  if (band === 'high') {
    return evidence
      ? `从原文和预览里能看到“${evidence}”这类明显信号，所以 ${label} 偏高。`
      : `原文持续体现出更鲜明的${label}特征，因此该维度偏高。`;
  }

  if (band === 'low') {
    return evidence
      ? `文本里更常出现“${evidence}”这类信号，而不是强烈的${label}表达，所以该维度偏低。`
      : `原文没有持续强化${label}，整体更偏克制或弱化，因此该维度偏低。`;
  }

  return evidence
    ? `文本里既有“${evidence}”这类线索，也没有把 ${label} 推到极端，所以整体落在中段。`
    : `${label}表现比较稳定，但没有明显冲到极高或极低，适合作为中段判断。`;
}

function deriveInternalReview(snapshot: PersonaSnapshot, scores: PersonaPublicScores): PersonaInternalReview {
  const review = createDefaultInternalReview();
  const rawSoulLength = snapshot.rawSoul.trim().length;
  const previewFields = [snapshot.previewHook, snapshot.previewPrompt, snapshot.previewResponse].filter((value) => value.trim().length > 0).length;
  const structureBoost = scores.structure >= 70 ? 8 : 0;

  review.completeness = clampPersonaScore(38 + Math.min(44, Math.round(rawSoulLength / 40)) + previewFields * 5);
  review.consistency = clampPersonaScore(54 + Math.round(((scores.structure + scores.boundaries) / 2 - 50) * 0.2) + previewFields * 4);
  review.publishability = clampPersonaScore(58 + previewFields * 6 + Math.min(snapshot.summary.length, 48) / 4 + structureBoost);

  let risk = 12;
  if ((snapshot.sourceType ?? snapshot.submissionType) && !['原创'].includes(String(snapshot.sourceType ?? snapshot.submissionType))) {
    risk += snapshot.sourceUrl?.trim() ? 10 : 26;
    risk += snapshot.sourceAuthor?.trim() ? 0 : 8;
  }
  if (!snapshot.license?.trim()) {
    risk += 20;
  }
  if (!snapshot.rawSoul.trim()) {
    risk += 30;
  }

  review.risk = clampPersonaScore(risk);
  return review;
}

function deriveHeuristicAnalysis(snapshot: PersonaSnapshot): PersonaProviderResult {
  const evidenceText = collectEvidence(snapshot);
  const publicScores = {} as PersonaPublicScores;
  const publicReasons = {} as PersonaPublicReasons;
  const publicConfidence = {} as PersonaPublicConfidence;

  for (const dimension of PUBLIC_PERSONA_DIMENSIONS) {
    const positiveMatches = countMatches(evidenceText, POSITIVE_HINTS[dimension.key]);
    const negativeMatches = countMatches(evidenceText, NEGATIVE_HINTS[dimension.key]);

    const rawScore = 50 + positiveMatches.length * 9 - negativeMatches.length * 7;
    let score = clampPersonaScore(rawScore);

    if (dimension.key === 'roleplay' && /猫娘|船长|谋士|导师|老王|审查官/i.test(snapshot.title)) {
      score = clampPersonaScore(score + 18);
    }

    if (dimension.key === 'warmth' && /陪伴|安抚|情绪|日常聊天/i.test(evidenceText)) {
      score = clampPersonaScore(score + 10);
    }

    if (dimension.key === 'sharpness' && /毒舌|暴躁|审查|批判|挑错/i.test(evidenceText)) {
      score = clampPersonaScore(score + 12);
    }

    if (dimension.key === 'structure' && /步骤|清单|拆解|架构|优先级/i.test(evidenceText)) {
      score = clampPersonaScore(score + 10);
    }

    if (dimension.key === 'initiative' && /提问|苏格拉底|先说说/i.test(evidenceText)) {
      score = clampPersonaScore(score - 10);
    }

    publicScores[dimension.key] = score;
    publicReasons[dimension.key] = buildReason(dimension.key, score, positiveMatches, negativeMatches);
    publicConfidence[dimension.key] = clampPersonaConfidence(0.56 + Math.abs(score - 50) / 120 + Math.min(positiveMatches.length + negativeMatches.length, 4) * 0.04);
  }

  return {
    summary: buildSummary(snapshot, publicScores),
    publicScores: normalizePersonaPublicScores(publicScores),
    publicReasons: normalizePersonaPublicReasons(publicReasons),
    publicConfidence: normalizePersonaPublicConfidence(publicConfidence),
    internalReview: deriveInternalReview(snapshot, publicScores),
    rawResponseJson: JSON.stringify({ mode: 'heuristic', generatedAt: new Date().toISOString() }),
    source: 'heuristic',
  };
}

async function analyzeViaOpenAICompatible(snapshot: PersonaSnapshot): Promise<PersonaProviderResult | null> {
  const baseUrl = process.env.CLAWPLAY_PERSONA_API_BASE_URL?.trim();
  const apiKey = process.env.CLAWPLAY_PERSONA_API_KEY?.trim();
  const model = process.env.CLAWPLAY_PERSONA_MODEL?.trim() || 'gpt-4.1-mini';

  if (!baseUrl || !apiKey) {
    return null;
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildPersonaAnalysisSystemPrompt() },
        { role: 'user', content: buildPersonaAnalysisUserPrompt(snapshot) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`persona_provider_http_${response.status}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('persona_provider_empty_content');
  }

  const parsed = JSON.parse(content) as Omit<PersonaProviderResult, 'source'>;

  return {
    summary: normalizePersonaSummary(parsed.summary),
    publicScores: normalizePersonaPublicScores(parsed.publicScores),
    publicReasons: normalizePersonaPublicReasons(parsed.publicReasons),
    publicConfidence: normalizePersonaPublicConfidence(parsed.publicConfidence),
    internalReview: createDefaultInternalReview(),
    rawResponseJson: JSON.stringify(parsed),
    source: 'ai',
  } satisfies PersonaProviderResult;
}

export async function analyzePersonaSnapshot(snapshot: PersonaSnapshot): Promise<PersonaProviderResult> {
  try {
    const aiResult = await analyzeViaOpenAICompatible(snapshot);
    if (aiResult) {
      return {
        ...aiResult,
        internalReview: deriveInternalReview(snapshot, aiResult.publicScores),
      };
    }
  } catch {
    return deriveHeuristicAnalysis(snapshot);
  }

  return deriveHeuristicAnalysis(snapshot);
}

export function derivePersonaAnalysisHeuristically(snapshot: PersonaSnapshot) {
  return deriveHeuristicAnalysis(snapshot);
}

export function derivePersonaInternalReview(snapshot: PersonaSnapshot, scores: PersonaPublicScores) {
  return deriveInternalReview(snapshot, scores);
}
