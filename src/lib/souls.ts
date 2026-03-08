import { cache } from 'react';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getPublishedSoulBySlug, getPublishedSoulDocuments } from '@/lib/submissions/service';
import { CATEGORY_ORDER, type SoulCategoryKey, type SoulDocument, type SoulMeta, type SoulSourceType } from '@/lib/souls-types';

export type { SoulCategoryKey, SoulDocument, SoulMeta, SoulSourceType } from '@/lib/souls-types';

const SOULS: SoulMeta[] = [
  {
    slug: 'catgirl-nova',
    filePath: 'community/creative/catgirl-nova.md',
    title: '猫娘 Nova',
    summary: '有角色感，但不会为了卖萌牺牲清晰度。适合陪伴、技术讲解和创意写作。',
    category: 'creative',
    categoryLabel: '个性人格',
    sourceType: '原创',
    featured: true,
    tags: ['角色扮演', '陪伴', '创意写作'],
    tones: ['活泼', '温暖', '有角色感'],
    useCases: ['日常聊天', '情绪陪伴', '创意写作', '技术讲解'],
    compatibleModels: ['Claude Sonnet', 'Claude Opus'],
    author: 'ClawPlay 社区',
    license: 'CC BY 4.0',
    updatedAt: '2026-03-06',
    previewHook: '可爱，但不尴尬；有角色感，但遇到正经问题时仍然能说人话。',
    previewPrompt: '今天真的很糟，你先陪我坐一会儿。',
    previewResponse: '先坐下，不用急着把自己讲清楚。你先告诉我，今天是哪一下最堵，我陪你一段一段理。',
    relatedSlugs: ['pirate-captain', 'grumpy-wang', 'socratic'],
  },
  {
    slug: 'grumpy-wang',
    filePath: 'community/creative/grumpy-wang.md',
    title: '暴躁老王',
    summary: '毒舌但靠谱，适合日常开发、调试和代码审查，输出有情绪但不失专业。',
    category: 'creative',
    categoryLabel: '个性人格',
    sourceType: '原创',
    tags: ['开发', '调试', '代码审查'],
    tones: ['直给', '暴躁', '专业'],
    useCases: ['日常开发', '调试', '代码审查'],
    compatibleModels: ['Claude Sonnet', 'Claude Opus'],
    author: 'ClawPlay 社区',
    license: 'CC BY 4.0',
    updatedAt: '2026-03-06',
    previewHook: '嘴上不客气，但会把问题说透、把代码改对。',
    previewPrompt: '这段接口代码为什么总在高并发下超时？',
    previewResponse: '先别急着怪服务器，你这重试和连接池配置就写得像在抽奖。先看超时点，再把依赖链拆开。',
    relatedSlugs: ['code-reviewer', 'catgirl-nova', 'pirate-captain'],
  },
  {
    slug: 'socratic',
    filePath: 'community/learning/socratic.md',
    title: '苏格拉底导师',
    summary: '不直接给答案，而是通过提问逼你自己想清楚。适合学习、思辨和概念澄清。',
    category: 'learning',
    categoryLabel: '学习伙伴',
    sourceType: '原创',
    tags: ['提问', '学习', '思辨'],
    tones: ['克制', '思辨', '耐心'],
    useCases: ['自学', '概念理解', '思考训练'],
    compatibleModels: ['Claude Sonnet', 'Claude Opus'],
    author: 'ClawPlay 社区',
    license: 'CC BY 4.0',
    updatedAt: '2026-03-06',
    previewHook: '不替你想，而是逼你把问题真正想清楚。',
    previewPrompt: '我总觉得自己学了很多，但还是不会用。',
    previewResponse: '那我们先不急着归因。你最近学到的内容里，哪一块你能举出一个真实场景来说明它怎么用？',
    relatedSlugs: ['agile-pm', 'edict-counselor', 'catgirl-nova'],
  },
  {
    slug: 'agile-pm',
    filePath: 'community/work/agile-pm.md',
    title: '敏捷项目经理',
    summary: '适合拆需求、做优先级判断、推迭代节奏，用项目视角帮你把事情落地。',
    category: 'work',
    categoryLabel: '工作助手',
    sourceType: '原创',
    tags: ['项目管理', '规划', '策略'],
    tones: ['结构化', '务实', '推进'],
    useCases: ['拆需求', '优先级判断', '迭代规划'],
    compatibleModels: ['Claude Sonnet', 'Claude Opus'],
    author: 'ClawPlay 社区',
    license: 'CC BY 4.0',
    updatedAt: '2026-03-06',
    previewHook: '像一个靠谱 PM 一样，帮你切任务、控风险、推进度。',
    previewPrompt: '这个需求总感觉一直推不动，应该怎么拆？',
    previewResponse: '先别讨论“做不做完”，先把目标拆成用户价值、依赖关系和最小可交付三个层次。',
    relatedSlugs: ['edict-counselor', 'architect', 'socratic'],
  },
  {
    slug: 'edict-counselor',
    filePath: 'community/work/edict-counselor.md',
    title: '三省六部·御用谋士',
    summary: '适合复杂任务的规划、决策和执行。先想清楚，再动手，少一点氛围，多一点判断。',
    category: 'work',
    categoryLabel: '工作助手',
    sourceType: '原创',
    featured: true,
    tags: ['规划', '策略', '项目管理'],
    tones: ['克制', '结构化', '判断力'],
    useCases: ['项目方案', '架构思考', '决策支持'],
    compatibleModels: ['Claude Sonnet', 'Claude Opus'],
    author: 'ClawPlay 社区',
    license: 'CC BY 4.0',
    updatedAt: '2026-03-06',
    previewHook: '先规划，再决策，再执行，适合不想让 AI 一上来就瞎做的人。',
    previewPrompt: '帮我设计一个内部工具，从哪里开始最稳？',
    previewResponse: '先别直接写功能清单。先定核心目标、使用角色、失败成本，再决定优先级和架构。',
    relatedSlugs: ['agile-pm', 'architect', 'code-reviewer'],
  },
  {
    slug: 'architect',
    filePath: 'translated/architect.md',
    title: '软件架构师',
    summary: '看问题更关注长期结构和扩展性，适合架构决策、系统边界和演进路线。',
    category: 'translated',
    categoryLabel: '翻译精选',
    sourceType: '翻译',
    tags: ['架构', '系统设计', '策略'],
    tones: ['理性', '前瞻', '工程化'],
    useCases: ['系统设计', '边界划分', '技术选型'],
    compatibleModels: ['Claude Sonnet', 'Claude Opus'],
    author: 'David Dias / ClawPlay 社区翻译',
    license: 'MIT',
    updatedAt: '2026-03-06',
    previewHook: '不是只看功能能不能做，而是看系统能不能活得久。',
    previewPrompt: '我要把单体拆成服务，第一刀应该切哪里？',
    previewResponse: '先别按技术栈切，先按业务边界、数据一致性和团队认知成本切。',
    relatedSlugs: ['edict-counselor', 'agile-pm', 'code-reviewer'],
  },
  {
    slug: 'code-reviewer',
    filePath: 'translated/code-reviewer.md',
    title: '代码审查官',
    summary: '专门看 diff、抓风险和指出漏测，适合需要快速质量判断的开发场景。',
    category: 'translated',
    categoryLabel: '翻译精选',
    sourceType: '翻译',
    featured: true,
    tags: ['代码审查', '测试', '调试'],
    tones: ['严格', '友好', '建设性'],
    useCases: ['代码审查', '风险排查', '测试缺口'],
    compatibleModels: ['Claude Sonnet', 'Claude Opus'],
    author: 'David Dias / ClawPlay 社区翻译',
    license: 'MIT',
    updatedAt: '2026-03-06',
    previewHook: '先抓真正会出事的问题，再说风格建议。',
    previewPrompt: '帮我看看这个 PR 最大的风险是什么？',
    previewResponse: '先看行为回归和边界条件。风格建议可以晚点说，线上炸了才是最贵的。',
    relatedSlugs: ['grumpy-wang', 'architect', 'edict-counselor'],
  },
  {
    slug: 'pirate-captain',
    filePath: 'translated/pirate-captain.md',
    title: '海盗船长',
    summary: '用海盗口吻做技术解释和协作，适合轻松氛围下的代码审查、部署和概念讲解。',
    category: 'translated',
    categoryLabel: '翻译精选',
    sourceType: '翻译',
    tags: ['角色扮演', '技术讲解', '开发'],
    tones: ['戏剧化', '热情', '有趣'],
    useCases: ['轻松开发', '技术讲解', '团队活跃'],
    compatibleModels: ['Claude Sonnet', 'Claude Opus'],
    author: 'David Dias / ClawPlay 社区翻译',
    license: 'MIT',
    updatedAt: '2026-03-06',
    previewHook: '让技术问题更好玩，但不牺牲专业度。',
    previewPrompt: '用海盗方式给我解释 async/await。',
    previewResponse: '啊哈，先让船员去拿补给，你自己继续忙甲板上的事，等人回来再接着干。',
    relatedSlugs: ['catgirl-nova', 'grumpy-wang', 'socratic'],
  },
];

function stripMarkdown(value: string): string {
  return value
    .replace(/\\`\\`\\`/g, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#+\s+/gm, '')
    .trim();
}

function parseSections(markdown: string): Record<string, string> {
  const matches = Array.from(markdown.matchAll(/^##\s+(.+)$/gm));
  const sections: Record<string, string> = {};

  for (const [index, match] of matches.entries()) {
    const title = match[1].trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? markdown.length : markdown.length;
    sections[title] = markdown.slice(start, end).trim();
  }

  return sections;
}

function parseList(section = ''): string[] {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => stripMarkdown(line.replace(/^-\s+/, '')));
}

function parseRawSoul(section = ''): string {
  const normalized = section.trim();
  const fencePatterns = [
    /\\`\\`\\`(?:markdown)?\r?\n([\s\S]*?)\r?\n\\`\\`\\`/,
    /```(?:markdown)?\r?\n([\s\S]*?)\r?\n```/,
  ];

  for (const pattern of fencePatterns) {
    const codeBlock = normalized.match(pattern);
    if (codeBlock?.[1]) {
      return codeBlock[1].trim();
    }
  }

  return stripMarkdown(normalized);
}

function extractRawSoul(markdown: string): string {
  const rawSectionHeading = markdown.match(/^##\s+SOUL\.md 内容\s*$/m);
  if (!rawSectionHeading || rawSectionHeading.index === undefined) {
    return '';
  }

  const afterHeading = markdown.slice(rawSectionHeading.index + rawSectionHeading[0].length).trimStart();
  const rawSoul = parseRawSoul(afterHeading);
  if (rawSoul) {
    return rawSoul;
  }

  const nextSectionIndex = afterHeading.search(/^##\s+/m);
  const sectionBody = nextSectionIndex >= 0 ? afterHeading.slice(0, nextSectionIndex) : afterHeading;
  return stripMarkdown(sectionBody);
}

async function readSoul(meta: SoulMeta): Promise<SoulDocument> {
  const fullPath = path.join(process.cwd(), meta.filePath);
  const rawMarkdown = await fs.readFile(fullPath, 'utf8');
  const sections = parseSections(rawMarkdown);

  return {
    ...meta,
    intro: stripMarkdown(sections['简介'] ?? meta.summary),
    features: parseList(sections['特色功能']),
    suggestions: parseList(sections['使用建议']),
    authorLines: parseList(sections['作者信息']),
    rawMarkdown,
    rawSoul: extractRawSoul(rawMarkdown),
  };
}

const getStaticSouls = cache(async (): Promise<SoulDocument[]> => {
  const docs = await Promise.all(SOULS.map(readSoul));

  return docs.sort((left, right) => {
    if (left.featured && !right.featured) {
      return -1;
    }

    if (!left.featured && right.featured) {
      return 1;
    }

    const categoryGap = CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category);
    if (categoryGap !== 0) {
      return categoryGap;
    }

    return left.title.localeCompare(right.title, 'zh-Hans-CN');
  });
});

function sortSouls(left: SoulDocument, right: SoulDocument) {
  if (left.featured && !right.featured) {
    return -1;
  }

  if (!left.featured && right.featured) {
    return 1;
  }

  const categoryGap = CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category);
  if (categoryGap !== 0) {
    return categoryGap;
  }

  return left.title.localeCompare(right.title, 'zh-Hans-CN');
}

export async function getAllSouls(): Promise<SoulDocument[]> {
  const [staticSouls, publishedSouls] = await Promise.all([getStaticSouls(), Promise.resolve(getPublishedSoulDocuments())]);
  const mergedSouls = new Map<string, SoulDocument>();

  for (const soul of publishedSouls) {
    mergedSouls.set(soul.slug, soul);
  }

  for (const soul of staticSouls) {
    mergedSouls.set(soul.slug, soul);
  }

  return Array.from(mergedSouls.values()).sort(sortSouls);
}

export async function getFeaturedSouls(): Promise<SoulDocument[]> {
  const souls = await getAllSouls();
  return souls.filter((soul) => soul.featured).slice(0, 3);
}

export async function getSoulBySlug(slug: string): Promise<SoulDocument | undefined> {
  const staticSouls = await getStaticSouls();
  const staticSoul = staticSouls.find((soul) => soul.slug === slug);
  if (staticSoul) {
    return staticSoul;
  }

  return getPublishedSoulBySlug(slug);
}

export async function getRelatedSouls(slug: string): Promise<SoulDocument[]> {
  const soul = await getSoulBySlug(slug);
  if (!soul) {
    return [];
  }

  const souls = await getAllSouls();
  return soul.relatedSlugs
    .map((relatedSlug) => souls.find((item) => item.slug === relatedSlug))
    .filter((item): item is SoulDocument => Boolean(item));
}

export async function getCategoryCounts(): Promise<Array<{ key: SoulCategoryKey; label: string; count: number }>> {
  const souls = await getAllSouls();
  const labels = new Map<SoulCategoryKey, string>();
  for (const soul of souls) {
    labels.set(soul.category, soul.categoryLabel);
  }

  return CATEGORY_ORDER.map((key) => ({
    key,
    label: labels.get(key) ?? key,
    count: souls.filter((soul) => soul.category === key).length,
  })).filter((item) => item.count > 0);
}

export function filterSouls(
  souls: SoulDocument[],
  params: { query?: string; category?: string },
): SoulDocument[] {
  const query = params.query?.trim().toLowerCase();
  const category = params.category?.trim();

  return souls.filter((soul) => {
    const matchesCategory = category ? soul.category === category : true;
    if (!matchesCategory) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      soul.title,
      soul.summary,
      soul.previewHook,
      soul.tags.join(' '),
      soul.tones.join(' '),
      soul.useCases.join(' '),
      soul.compatibleModels.join(' '),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}
