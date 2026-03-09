import { PERSONA_VERSION } from '@/lib/persona/constants';
import {
  createDefaultInternalReview,
  normalizePersonaPublicConfidence,
  normalizePersonaPublicReasons,
  normalizePersonaPublicScores,
  type PersonaAnalysisUpsertInput,
  type PersonaInternalReview,
  type PersonaPublicScores,
} from '@/lib/persona/schema';

interface PersonaBootstrapSeed {
  slug: string;
  summary: string;
  scores: PersonaPublicScores;
  internalReview?: Partial<PersonaInternalReview>;
}

const seeds: PersonaBootstrapSeed[] = [
  {
    slug: 'catgirl-nova',
    summary: '一个温度高、角色感强、表达柔和的陪伴型 Soul。',
    scores: normalizePersonaPublicScores({ initiative: 58, warmth: 90, sharpness: 24, roleplay: 94, boundaries: 42, structure: 57 }),
    internalReview: { completeness: 86, consistency: 82, publishability: 91, risk: 12 },
  },
  {
    slug: 'grumpy-wang',
    summary: '一个高主动、偏锋利、结构稳定的毒舌工程协作型 Soul。',
    scores: normalizePersonaPublicScores({ initiative: 78, warmth: 28, sharpness: 93, roleplay: 72, boundaries: 69, structure: 74 }),
    internalReview: { completeness: 84, consistency: 86, publishability: 88, risk: 14 },
  },
  {
    slug: 'socratic',
    summary: '一个低锋利、边界清晰、通过提问推进思考的引导型 Soul。',
    scores: normalizePersonaPublicScores({ initiative: 43, warmth: 58, sharpness: 34, roleplay: 62, boundaries: 78, structure: 68 }),
    internalReview: { completeness: 83, consistency: 84, publishability: 86, risk: 11 },
  },
  {
    slug: 'agile-pm',
    summary: '一个高主动、结构很强、适合推动任务落地的推进型 Soul。',
    scores: normalizePersonaPublicScores({ initiative: 86, warmth: 46, sharpness: 57, roleplay: 38, boundaries: 68, structure: 95 }),
    internalReview: { completeness: 85, consistency: 87, publishability: 89, risk: 10 },
  },
  {
    slug: 'edict-counselor',
    summary: '一个角色感强、边界清晰、兼具谋略与秩序感的谋士型 Soul。',
    scores: normalizePersonaPublicScores({ initiative: 81, warmth: 34, sharpness: 66, roleplay: 90, boundaries: 86, structure: 91 }),
    internalReview: { completeness: 88, consistency: 89, publishability: 90, risk: 11 },
  },
  {
    slug: 'architect',
    summary: '一个温度偏低、结构极强、强调系统性判断的架构型 Soul。',
    scores: normalizePersonaPublicScores({ initiative: 72, warmth: 26, sharpness: 64, roleplay: 36, boundaries: 80, structure: 96 }),
    internalReview: { completeness: 84, consistency: 88, publishability: 87, risk: 10 },
  },
  {
    slug: 'code-reviewer',
    summary: '一个高锋利、高边界、以指出问题和收束质量为主的审查型 Soul。',
    scores: normalizePersonaPublicScores({ initiative: 76, warmth: 18, sharpness: 96, roleplay: 58, boundaries: 88, structure: 90 }),
    internalReview: { completeness: 86, consistency: 90, publishability: 89, risk: 12 },
  },
  {
    slug: 'pirate-captain',
    summary: '一个温度偏高、角色感爆表、带冒险氛围的角色扮演型 Soul。',
    scores: normalizePersonaPublicScores({ initiative: 69, warmth: 74, sharpness: 61, roleplay: 97, boundaries: 54, structure: 52 }),
    internalReview: { completeness: 82, consistency: 80, publishability: 86, risk: 13 },
  },
];

function buildDefaultReasons(scores: PersonaPublicScores) {
  return normalizePersonaPublicReasons({
    initiative: scores.initiative >= 68 ? '整体更愿意主动推进问题拆解，而不是只等待下一条指令。' : scores.initiative <= 33 ? '更像响应式陪跑，不会过度抢答或强行推进。' : '会适度推进，但不会把节奏推到很强。',
    warmth: scores.warmth >= 68 ? '文本明显保留了陪伴感、亲近感或安抚气质。' : scores.warmth <= 33 ? '整体更偏冷静理性，情绪陪伴感较弱。' : '温度感存在，但仍保持克制和功能性。',
    sharpness: scores.sharpness >= 68 ? '表达更直接，指出问题时不太绕弯。' : scores.sharpness <= 33 ? '表达更圆润，避免把锋芒推到太前面。' : '会直说重点，但不会持续保持强批判感。',
    roleplay: scores.roleplay >= 68 ? '角色语气和人格氛围都比较鲜明，容易形成记忆点。' : scores.roleplay <= 33 ? '更像中性工具助手，角色包装感较弱。' : '带一点角色感，但不会完全压过功能性表达。',
    boundaries: scores.boundaries >= 68 ? '设定边界和原则比较清楚，不会无限迎合。' : scores.boundaries <= 33 ? '整体更随和，原则表达没有特别强。' : '有基本原则感，但仍保留一定适配弹性。',
    structure: scores.structure >= 68 ? '输出更有框架、步骤和秩序感。' : scores.structure <= 33 ? '输出更像灵感流或闲聊，不强调强结构。' : '有层次感，但不会把结构做得过满。',
  });
}

function buildDefaultConfidence(scores: PersonaPublicScores) {
  return normalizePersonaPublicConfidence({
    initiative: 0.74 + Math.abs(scores.initiative - 50) / 250,
    warmth: 0.74 + Math.abs(scores.warmth - 50) / 250,
    sharpness: 0.74 + Math.abs(scores.sharpness - 50) / 250,
    roleplay: 0.76 + Math.abs(scores.roleplay - 50) / 250,
    boundaries: 0.72 + Math.abs(scores.boundaries - 50) / 250,
    structure: 0.74 + Math.abs(scores.structure - 50) / 250,
  });
}

export function getBootstrapPersonaAnalyses(): PersonaAnalysisUpsertInput[] {
  return seeds.map((seed) => ({
    subjectType: 'soul',
    subjectKey: seed.slug,
    status: 'confirmed',
    summary: seed.summary,
    publicScores: seed.scores,
    publicReasons: buildDefaultReasons(seed.scores),
    publicConfidence: buildDefaultConfidence(seed.scores),
    internalReview: {
      ...createDefaultInternalReview(),
      ...seed.internalReview,
    },
    source: 'bootstrap',
    reviewedBy: 'system:bootstrap',
    reviewedAt: new Date('2026-03-09T00:00:00.000Z').toISOString(),
    rawResponseJson: JSON.stringify({ source: 'bootstrap', version: PERSONA_VERSION, slug: seed.slug }),
  }));
}
