import { getPersonaDimensionDescriptor, getPersonaScoreBand, type PublicPersonaDimensionKey } from '@/lib/persona/constants';
import type { SoulDocument } from '@/lib/souls-types';

export interface PersonaProfileViewModel {
  archetype: string;
  tagline: string;
  traitChips: string[];
  fitFor: string[];
  notFitFor: string[];
  coreTruths: string[];
  boundaries: string[];
  vibe: string[];
  continuity: string[];
  recommendedModel: string | null;
}

function unique(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function getScore(soul: SoulDocument, key: PublicPersonaDimensionKey) {
  return soul.personaAnalysis?.publicScores[key] ?? 50;
}

function inferArchetype(soul: SoulDocument) {
  const text = `${soul.title} ${soul.summary} ${soul.tags.join(' ')} ${soul.tones.join(' ')}`;

  if (/审查|review|代码审查|挑错/i.test(text)) {
    return '审查官';
  }

  if (/谋士|顾问|策略|朝堂/i.test(text)) {
    return '谋士';
  }

  if (/架构|系统设计|结构/i.test(text)) {
    return '架构师';
  }

  if (/项目经理|项目|推进|优先级/i.test(text)) {
    return '推进者';
  }

  if (/导师|苏格拉底|提问|学习/i.test(text)) {
    return '引导者';
  }

  if (/猫娘|陪伴|安抚|温柔/i.test(text)) {
    return '陪伴者';
  }

  if (/船长|海盗|冒险|角色扮演/i.test(text)) {
    return '角色派';
  }

  if (/暴躁|毒舌|直给/i.test(text)) {
    return '毒舌派';
  }

  return '人格型';
}

function buildTraitChips(soul: SoulDocument) {
  const candidates = [
    { key: 'initiative', score: getScore(soul, 'initiative') },
    { key: 'warmth', score: getScore(soul, 'warmth') },
    { key: 'sharpness', score: getScore(soul, 'sharpness') },
    { key: 'roleplay', score: getScore(soul, 'roleplay') },
    { key: 'boundaries', score: getScore(soul, 'boundaries') },
    { key: 'structure', score: getScore(soul, 'structure') },
  ] satisfies Array<{ key: PublicPersonaDimensionKey; score: number }>;

  candidates.sort((left, right) => Math.abs(right.score - 50) - Math.abs(left.score - 50));

  return unique([
    inferArchetype(soul),
    ...candidates.slice(0, 3).map((item) => getPersonaDimensionDescriptor(item.key, item.score)),
  ]);
}

function buildFitFor(soul: SoulDocument) {
  const values = [...soul.useCases.slice(0, 2).map((item) => `想把它用于「${item}」的人`)].filter(Boolean);

  if (getScore(soul, 'initiative') >= 68) {
    values.push('希望它主动推进、主动给出下一步建议的人');
  }
  if (getScore(soul, 'warmth') >= 68) {
    values.push('想要陪伴感、安抚感或更贴近情绪互动的人');
  }
  if (getScore(soul, 'sharpness') >= 68) {
    values.push('能接受直给反馈、希望它直接指出问题的人');
  }
  if (getScore(soul, 'structure') >= 68) {
    values.push('需要清单、框架和稳定结构输出来协助思考的人');
  }
  if (getScore(soul, 'roleplay') >= 68) {
    values.push('喜欢鲜明角色气质，不想只跟一个中性工具说话的人');
  }

  return unique(values).slice(0, 4);
}

function buildNotFitFor(soul: SoulDocument) {
  const values: string[] = [];

  if (getScore(soul, 'sharpness') >= 68) {
    values.push('只想被轻柔安抚、不希望被直接指出问题的人');
  }
  if (getScore(soul, 'warmth') <= 33) {
    values.push('期待它承担强情绪陪伴，而不是冷静判断的人');
  }
  if (getScore(soul, 'initiative') <= 33) {
    values.push('希望它全程带节奏、频繁主动推进的人');
  }
  if (getScore(soul, 'roleplay') >= 68) {
    values.push('只想要完全中性的工具口吻，不想感受到角色氛围的人');
  }
  if (getScore(soul, 'boundaries') >= 68) {
    values.push('希望它无限迎合、没有设定边界和原则的人');
  }
  if (getScore(soul, 'structure') <= 33) {
    values.push('强依赖严格条目式、步骤式输出的人');
  }

  return unique(values).slice(0, 4);
}

function buildCoreTruths(soul: SoulDocument) {
  return unique([
    soul.features[0] ? `它最稳定的价值通常体现在：${soul.features[0]}。` : '',
    soul.features[1] ? `如果你会反复用它，往往是因为它能持续提供：${soul.features[1]}。` : '',
    soul.summary ? `这份 Soul 的核心承诺不是“万能”，而是：${soul.summary}` : '',
  ]).slice(0, 3);
}

function buildBoundaries(soul: SoulDocument) {
  const values = [
    soul.suggestions[0] ? `使用前最好记住：${soul.suggestions[0]}。` : '',
  ];

  if (getScore(soul, 'boundaries') >= 68) {
    values.push('它会更坚持自己的角色设定、表达原则或互动边界，而不是无限迎合。');
  } else {
    values.push('它的边界感不算特别强，更偏向在上下文里灵活适配。');
  }

  if (getScore(soul, 'sharpness') >= 68) {
    values.push('如果你把它当成纯安抚型人格，体感可能会偏硬。');
  }

  return unique(values).slice(0, 3);
}

function buildVibe(soul: SoulDocument) {
  const toneSummary = soul.tones.length > 0 ? soul.tones.join(' / ') : soul.tags.join(' / ');

  return unique([
    toneSummary ? `整体语气大致是：${toneSummary}。` : '',
    getScore(soul, 'roleplay') >= 68 ? '它不是把角色感藏起来的类型，互动里会明显感受到“它是谁”。' : '它更接近功能型人格，角色感不会压过任务本身。',
    soul.previewHook ? `一句话感受它的气质：${soul.previewHook}` : '',
  ]).slice(0, 3);
}

function buildContinuity(soul: SoulDocument) {
  const initiativeBand = getPersonaScoreBand(getScore(soul, 'initiative'));
  const structureBand = getPersonaScoreBand(getScore(soul, 'structure'));

  return unique([
    initiativeBand === 'high'
      ? '如果你连续对话几轮，它通常会继续主动推进，而不是只停在眼前这一轮。'
      : initiativeBand === 'low'
        ? '如果你连续对话几轮，最好由你来持续给上下文和方向，它更像稳态响应者。'
        : '连续对话时，它会在响应与推进之间保持相对均衡。',
    structureBand === 'high'
      ? '多轮使用时，它的输出结构通常比较稳，适合做长期协作型人格。'
      : '多轮使用时，它的结构感不会特别强，更适合轻量互动或阶段性使用。',
    soul.suggestions[1] ? `长期使用时可以重点记住：${soul.suggestions[1]}。` : '',
  ]).slice(0, 3);
}

export function buildPersonaProfile(soul: SoulDocument): PersonaProfileViewModel {
  return {
    archetype: inferArchetype(soul),
    tagline: soul.personaAnalysis?.summary ?? soul.summary,
    traitChips: buildTraitChips(soul),
    fitFor: buildFitFor(soul),
    notFitFor: buildNotFitFor(soul),
    coreTruths: buildCoreTruths(soul),
    boundaries: buildBoundaries(soul),
    vibe: buildVibe(soul),
    continuity: buildContinuity(soul),
    recommendedModel: soul.compatibleModels[0] ?? null,
  };
}
