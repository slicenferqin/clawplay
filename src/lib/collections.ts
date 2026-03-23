import 'server-only';

import type { PublicPersonaDimensionKey } from '@/lib/persona/constants';
import { buildPersonaProfile } from '@/lib/persona/profile';
import { getHotlist } from '@/lib/analytics/hotlist';
import { buildAbsoluteUrl } from '@/lib/seo';
import { SITE_NAME } from '@/lib/site-config';
import { getAllSouls, type SoulDocument } from '@/lib/souls';

export type CollectionKind = 'growth' | 'persona';
export type GrowthCollectionKey = 'starter' | 'developer' | 'hot' | 'latest';
export type PersonaCollectionKey = 'strategist' | 'warm' | 'sharp' | 'roleplay';
export type CollectionKey = GrowthCollectionKey | PersonaCollectionKey;

export interface CollectionShareTemplate {
  key: 'short' | 'long';
  title: string;
  description: string;
  text: string;
}

export interface CollectionSection {
  kind: CollectionKind;
  key: CollectionKey;
  eyebrow: string;
  title: string;
  summary: string;
  note: string;
  pageHref: string;
  browseLabel: string;
  browseHref: string;
  detailLead: string;
  highlights: string[];
  fitFor: string[];
  shareBadges: string[];
  shareTemplates: CollectionShareTemplate[];
  souls: SoulDocument[];
}

export interface CollectionGroup {
  key: CollectionKind;
  eyebrow: string;
  title: string;
  description: string;
  collections: CollectionSection[];
}

type CollectionSeed = Omit<CollectionSection, 'shareTemplates'>;

type PersonaCollectionSeed = Omit<CollectionSeed, 'kind' | 'souls'> & {
  preferredSlugs: string[];
  minimumScore: number;
  rankSoul: (soul: SoulDocument) => number;
};

const STARTER_SLUGS = ['edict-counselor', 'catgirl-nova', 'socratic'];
const DEVELOPER_SLUGS = ['code-reviewer', 'architect', 'grumpy-wang'];
const COLLECTION_LIMIT = 3;
const GROWTH_COLLECTION_KEYS: GrowthCollectionKey[] = ['starter', 'developer', 'hot', 'latest'];
const PERSONA_COLLECTION_KEYS: PersonaCollectionKey[] = ['strategist', 'warm', 'sharp', 'roleplay'];
const COLLECTION_KEYS: CollectionKey[] = [...GROWTH_COLLECTION_KEYS, ...PERSONA_COLLECTION_KEYS];

function getDateValue(dateText: string) {
  return new Date(`${dateText}T00:00:00.000Z`).getTime();
}

function uniqueSouls(items: SoulDocument[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) {
      return false;
    }

    seen.add(item.slug);
    return true;
  });
}

function compareSoulDisplay(left: SoulDocument, right: SoulDocument) {
  if (left.featured && !right.featured) {
    return -1;
  }

  if (!left.featured && right.featured) {
    return 1;
  }

  return left.title.localeCompare(right.title, 'zh-Hans-CN');
}

function pickSoulsBySlugs(slugs: string[], soulsBySlug: Map<string, SoulDocument>, limit = COLLECTION_LIMIT) {
  return slugs
    .map((slug) => soulsBySlug.get(slug))
    .filter((item): item is SoulDocument => Boolean(item))
    .slice(0, limit);
}

function getLatestSouls(souls: SoulDocument[]) {
  return [...souls]
    .sort((left, right) => {
      const dateGap = getDateValue(right.updatedAt) - getDateValue(left.updatedAt);
      if (dateGap !== 0) {
        return dateGap;
      }

      return compareSoulDisplay(left, right);
    })
    .slice(0, COLLECTION_LIMIT);
}

async function getHotSouls(soulsBySlug: Map<string, SoulDocument>, featuredSouls: SoulDocument[]) {
  const hotlist = await getHotlist({ days: 30, limit: 6 });
  const qualifiedHotSouls = hotlist.items
    .filter((item) => item.isQualified)
    .map((item) => soulsBySlug.get(item.slug))
    .filter((item): item is SoulDocument => Boolean(item));

  const souls = uniqueSouls([...qualifiedHotSouls, ...featuredSouls]).slice(0, COLLECTION_LIMIT);
  const fallbackUsed = qualifiedHotSouls.length < COLLECTION_LIMIT;

  return {
    souls,
    note: fallbackUsed
      ? '优先按近 30 天查看 / 导入复制 / 原文行为生成；当前样本不足时，用精选 Soul 回填。'
      : '按近 30 天查看 / 导入复制 / 原文行为加权生成，适合直接看站内最近更受欢迎的 Soul。',
  };
}

function getSearchText(soul: SoulDocument) {
  return [soul.title, soul.summary, soul.tags.join(' '), soul.tones.join(' '), soul.useCases.join(' '), soul.previewHook].join(' ');
}

function matchesPattern(soul: SoulDocument, pattern: RegExp) {
  return pattern.test(getSearchText(soul));
}

function getScore(soul: SoulDocument, key: PublicPersonaDimensionKey) {
  return soul.personaAnalysis?.publicScores[key] ?? 50;
}

function rankStrategistSoul(soul: SoulDocument) {
  const archetype = buildPersonaProfile(soul).archetype;
  let score = 0;

  if (['谋士', '架构师', '推进者'].includes(archetype)) {
    score += 58;
  } else if (archetype === '审查官') {
    score += 34;
  }

  if (matchesPattern(soul, /规划|策略|架构|项目|决策|推进|拆解|边界/i)) {
    score += 24;
  }

  score += getScore(soul, 'structure') * 0.34;
  score += getScore(soul, 'boundaries') * 0.18;
  score += getScore(soul, 'initiative') * 0.12;

  return score;
}

function rankWarmSoul(soul: SoulDocument) {
  const archetype = buildPersonaProfile(soul).archetype;
  let score = 0;

  if (archetype === '陪伴者') {
    score += 56;
  }

  if (matchesPattern(soul, /陪伴|温暖|温柔|安抚|耐心|聊天|亲近/i)) {
    score += 24;
  }

  score += getScore(soul, 'warmth') * 0.42;
  score += getScore(soul, 'roleplay') * 0.1;
  score += (100 - getScore(soul, 'sharpness')) * 0.16;

  if (getScore(soul, 'sharpness') >= 78) {
    score -= 14;
  }

  return score;
}

function rankSharpSoul(soul: SoulDocument) {
  const archetype = buildPersonaProfile(soul).archetype;
  let score = 0;

  if (archetype === '毒舌派') {
    score += 58;
  } else if (archetype === '审查官') {
    score += 48;
  }

  if (matchesPattern(soul, /毒舌|暴躁|直给|严格|审查|挑错|调试|review|风险/i)) {
    score += 26;
  }

  score += getScore(soul, 'sharpness') * 0.44;
  score += getScore(soul, 'boundaries') * 0.16;
  score += getScore(soul, 'structure') * 0.12;

  return score;
}

function rankRoleplaySoul(soul: SoulDocument) {
  const archetype = buildPersonaProfile(soul).archetype;
  let score = 0;

  if (archetype === '角色派') {
    score += 58;
  } else if (archetype === '陪伴者' || archetype === '谋士') {
    score += 34;
  }

  if (matchesPattern(soul, /猫娘|海盗|船长|角色扮演|冒险|戏剧|角色感/i)) {
    score += 28;
  }

  score += getScore(soul, 'roleplay') * 0.48;
  score += getScore(soul, 'warmth') * 0.08;

  return score;
}

function selectPersonaSouls(seed: PersonaCollectionSeed, souls: SoulDocument[], soulsBySlug: Map<string, SoulDocument>) {
  const ranked = souls
    .map((soul) => {
      let score = seed.rankSoul(soul);
      const preferredIndex = seed.preferredSlugs.indexOf(soul.slug);

      if (preferredIndex >= 0) {
        score += 24 - preferredIndex * 4;
      }

      return { soul, score };
    })
    .filter((item) => item.score >= seed.minimumScore)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return compareSoulDisplay(left.soul, right.soul);
    })
    .map((item) => item.soul)
    .slice(0, COLLECTION_LIMIT);

  if (ranked.length >= COLLECTION_LIMIT) {
    return ranked;
  }

  const fallback = pickSoulsBySlugs(seed.preferredSlugs, soulsBySlug).filter(
    (soul) => !ranked.some((item) => item.slug === soul.slug),
  );

  return uniqueSouls([...ranked, ...fallback]).slice(0, COLLECTION_LIMIT);
}

function buildCollectionShareTemplates(collection: CollectionSeed): CollectionShareTemplate[] {
  const collectionUrl = buildAbsoluteUrl(collection.pageHref);
  const soulTitles = collection.souls.map((soul) => soul.title).join('、');

  switch (collection.key) {
    case 'starter':
      return [
        {
          key: 'short',
          title: '短文案',
          description: '适合发群、私聊或评论区，先把链接丢出去。',
          text: `第一次替换 SOUL.md 不知道先从谁开始？可以先看${SITE_NAME}的「${collection.title}」专题：3 个更稳妥、低门槛的中文 Soul，适合先建立使用预期。\n${collectionUrl}`,
        },
        {
          key: 'long',
          title: '长文案',
          description: '适合发帖、写推荐说明，顺手把“为什么值得看”讲清楚。',
          text: `如果你第一次尝试 OpenClaw / ${SITE_NAME}，最容易卡住的通常不是“没有 Soul”，而是候选太多、不知道先导入哪个。这个「${collection.title}」专题先帮你收口到 3 个更容易上手的入口：${soulTitles}。可以先看简介、人格预览和原始 SOUL，再决定要不要替换。\n${collectionUrl}`,
        },
      ];
    case 'developer':
      return [
        {
          key: 'short',
          title: '短文案',
          description: '适合技术群 / 朋友圈，直接点明“能进工作流”。',
          text: `如果你是拿 Soul 真做开发协作，不想只看人设，可以直接看${SITE_NAME}的「${collection.title}」专题：更偏代码审查、架构判断和需求拆解。\n${collectionUrl}`,
        },
        {
          key: 'long',
          title: '长文案',
          description: '适合写推荐贴，强调工程价值而不是角色氛围。',
          text: `很多 Soul 看起来聪明，但未必真的适合开发工作流。${SITE_NAME}这组「${collection.title}」专题优先收口到更适合 review、架构拆解、需求判断的几个入口：${soulTitles}。如果你想找的是能进真实工作流的 Soul，可以先从这组开始。\n${collectionUrl}`,
        },
      ];
    case 'hot':
      return [
        {
          key: 'short',
          title: '短文案',
          description: '适合跟朋友说“最近大家都在看什么”。',
          text: `不想自己慢慢挑的话，可以先看${SITE_NAME}的「${collection.title}」专题：优先参考站内最近的查看、导入复制和原文下载信号。\n${collectionUrl}`,
        },
        {
          key: 'long',
          title: '长文案',
          description: '适合强调这不是主观推荐，而是站内行为信号。',
          text: `如果你只想先看“最近大家更常点开的那些 Soul”，可以直接看${SITE_NAME}的「${collection.title}」专题。这组尽量复用站内真实行为信号，不是编辑拍脑袋说热门；当前收口到 ${soulTitles} 这几位，适合先快速比较一轮。\n${collectionUrl}`,
        },
      ];
    case 'latest':
      return [
        {
          key: 'short',
          title: '短文案',
          description: '适合回访用户或老玩家互相安利。',
          text: `最近想看看${SITE_NAME}又收了什么新 Soul，可以直接翻「${collection.title}」专题。对已经替换过几轮的人会比继续翻全库更高效。\n${collectionUrl}`,
        },
        {
          key: 'long',
          title: '长文案',
          description: '适合发更新通知，突出“新内容”价值。',
          text: `如果你已经装过几轮 Soul，继续从全量列表里翻会很慢。${SITE_NAME}现在把最近更新的内容先收在「${collection.title}」专题里，当前这组可以先从 ${soulTitles} 这些入口开始，适合回访、尝鲜和做第二轮人格比较。\n${collectionUrl}`,
        },
      ];
    case 'strategist':
      return [
        {
          key: 'short',
          title: '短文案',
          description: '适合发给想找“谋士型人格”的朋友。',
          text: `如果你挑 Soul 更看重判断力、结构感和边界感，可以先看${SITE_NAME}的「${collection.title}」专题。更像先想清楚再动手的那一类人格。\n${collectionUrl}`,
        },
        {
          key: 'long',
          title: '长文案',
          description: '适合做人格向推荐，强调不是“陪聊型”。',
          text: `${SITE_NAME}现在不只按用途分 Soul，也开始按人格气质做专题了。如果你更喜欢“先规划、再判断、最后执行”的灵魂，可以直接看「${collection.title}」这组：${soulTitles}。这一组不是来给情绪价值的，而是帮你把问题收口、把边界说清楚。\n${collectionUrl}`,
        },
      ];
    case 'warm':
      return [
        {
          key: 'short',
          title: '短文案',
          description: '适合发给想找温和陪伴型人格的人。',
          text: `想找更温润、更容易把人接住的 Soul，可以先看${SITE_NAME}的「${collection.title}」专题。适合先感受对话温度，而不是一上来就被怼。\n${collectionUrl}`,
        },
        {
          key: 'long',
          title: '长文案',
          description: '适合发帖说明“这组更温和”。',
          text: `如果你不是来找最锋利、最硬的 Soul，而是更在意温度感、陪伴感和对话舒适度，可以直接看${SITE_NAME}的「${collection.title}」专题。当前这组先收口到 ${soulTitles} 这些更容易让人放松、也更容易长期相处的入口。\n${collectionUrl}`,
        },
      ];
    case 'sharp':
      return [
        {
          key: 'short',
          title: '短文案',
          description: '适合发给能接受直给反馈的人。',
          text: `如果你能接受被直说、不想绕弯，可以先看${SITE_NAME}的「${collection.title}」专题。这组更适合 review、挑错和快速收口。\n${collectionUrl}`,
        },
        {
          key: 'long',
          title: '长文案',
          description: '适合发技术向人格推荐贴。',
          text: `很多人挑 Soul 时其实不是想被哄，而是想尽快把问题说透。${SITE_NAME}这组「${collection.title}」专题会优先收口更锋利、更直给、更敢指出问题的几位：${soulTitles}。如果你要的是“把错挑出来”，这组更对味。\n${collectionUrl}`,
        },
      ];
    case 'roleplay':
      return [
        {
          key: 'short',
          title: '短文案',
          description: '适合发给想找鲜明人格而非中性工具的人。',
          text: `如果你不想跟一个中性工具说话，而是想明显感受到“它是谁”，可以先看${SITE_NAME}的「${collection.title}」专题。\n${collectionUrl}`,
        },
        {
          key: 'long',
          title: '长文案',
          description: '适合强调 Soul 的人格辨识度。',
          text: `${SITE_NAME}下一步最有意思的一件事，不只是收更多 Soul，而是让你能比较不同人格气质。如果你更在意角色氛围和记忆点，可以直接看「${collection.title}」这组：${soulTitles}。这一组更容易让你感受到“导入的是谁”，而不是只装了个功能助手。\n${collectionUrl}`,
        },
      ];
    default:
      return [];
  }
}

function createCollection(collection: CollectionSeed): CollectionSection {
  return {
    ...collection,
    shareTemplates: buildCollectionShareTemplates(collection),
  };
}

function buildGrowthCollections(souls: SoulDocument[], soulsBySlug: Map<string, SoulDocument>, hotSection: Awaited<ReturnType<typeof getHotSouls>>) {
  return [
    createCollection({
      kind: 'growth',
      key: 'starter',
      eyebrow: '第一次来先看这里',
      title: '新手首选',
      summary: '适合第一次装 Soul、还没形成明确偏好的人。先从风格清晰、用途广、踩坑少的几位开始。',
      note: '这组偏“上手成本低、预期稳定”，更适合作为第一次替换和试跑。',
      pageHref: getCollectionPath('starter'),
      browseLabel: '先去灵魂库继续挑',
      browseHref: '/souls',
      detailLead: `如果你刚接触${SITE_NAME}，最容易卡住的不是“没有 Soul”，而是“候选太多，不知道先装哪个”。这组优先帮你降低第一次试错成本。`,
      highlights: ['风格更稳定，第一次上手不容易装到太偏门的角色。', '覆盖聊天、学习、规划三类常见起步场景。', '更适合先建立对 Soul 的使用预期，再决定后续偏好。'],
      fitFor: ['第一次替换本地 SOUL.md 的用户', '想先体验站内代表性 Soul 的用户', '还没形成明确角色偏好的用户'],
      shareBadges: ['新手首选', '低门槛', '先试这组'],
      souls: pickSoulsBySlugs(STARTER_SLUGS, soulsBySlug),
    }),
    createCollection({
      kind: 'growth',
      key: 'developer',
      eyebrow: '偏工程工作流',
      title: '开发首选',
      summary: '适合写代码、做 review、想拆需求和想看系统边界的人，优先收口到真正能进工作流的几位。',
      note: '这组不是“会写代码的人设”，而是更适合真正拿来做开发判断和工程协作。',
      pageHref: getCollectionPath('developer'),
      browseLabel: '去开发向灵魂继续看',
      browseHref: '/souls?category=dev',
      detailLead: `如果你来${SITE_NAME}主要是为了代码审查、技术判断、架构拆解或项目推进，这组比“随机挑一个聪明人设”更适合直接进入工作流。`,
      highlights: ['更偏工程判断，而不是单纯陪聊或角色感。', '适合 review、架构、需求拆解、风险分析。', '更容易拿来做真正的工作输入，而不是一次性试玩。'],
      fitFor: ['开发者 / 独立开发者', '需要代码审查与架构辅助的人', '希望把 Soul 直接嵌进工作流的人'],
      shareBadges: ['开发首选', '工程工作流', '代码审查'],
      souls: pickSoulsBySlugs(DEVELOPER_SLUGS, soulsBySlug),
    }),
    createCollection({
      kind: 'growth',
      key: 'hot',
      eyebrow: '近 30 天行为信号',
      title: '当前热门',
      summary: '如果你不想分析太多，直接先看最近被更多人查看、复制导入或下载原文的 Soul。',
      note: hotSection.note,
      pageHref: getCollectionPath('hot'),
      browseLabel: '去灵魂库继续浏览',
      browseHref: '/souls',
      detailLead: '这组不是编辑拍脑袋说“热门”，而是尽量复用站内真实行为信号。它更适合想快速跟上当前站内偏好的用户。',
      highlights: ['优先参考详情查看、导入复制、原文下载等真实行为。', '样本不足时用精选 Soul 回填，避免空页或伪热门。', '适合作为“我先看看最近大家在导入什么”的快捷入口。'],
      fitFor: ['不想花太多时间比较的人', '想直接看近期更受欢迎选择的人', '准备先装一个试试的用户'],
      shareBadges: ['当前热门', '行为信号', '近期趋势'],
      souls: hotSection.souls,
    }),
    createCollection({
      kind: 'growth',
      key: 'latest',
      eyebrow: '想尝鲜就看这里',
      title: '最近新增',
      summary: '优先展示最近更新的 Soul。对已经装过几轮、想看看站里最近加了什么的人更友好。',
      note: '当前按更新时间排序，后续如果新增量更大，再升级成独立的最近发布流。',
      pageHref: getCollectionPath('latest'),
      browseLabel: '回到灵魂库继续看',
      browseHref: '/souls',
      detailLead: '如果你已经装过几轮 Soul，或者会定期回来逛一圈，那么“最近新增”往往比“继续翻全部列表”更有效率。',
      highlights: ['优先让老用户看到站里最近的新内容。', '更适合尝鲜，而不是稳定上手。', '为后续真正的“最近发布流”做结构铺垫。'],
      fitFor: [`已经使用过${SITE_NAME}的回访用户`, '喜欢尝鲜、想看最近变化的人', '准备做二次替换和比较的人'],
      shareBadges: ['最近新增', '想尝鲜', '新内容'],
      souls: getLatestSouls(souls),
    }),
  ];
}

function buildPersonaCollections(souls: SoulDocument[], soulsBySlug: Map<string, SoulDocument>) {
  const seeds: PersonaCollectionSeed[] = [
    {
      key: 'strategist',
      eyebrow: '先想清楚再动手',
      title: '谋士系',
      summary: '更偏规划、判断和边界，不急着哄你，也不急着抢答，适合复杂任务收口。',
      note: '这组更像复杂问题的参谋席，适合架构、决策、规划和推进，而不是纯陪聊。',
      pageHref: getCollectionPath('strategist'),
      browseLabel: '去工作 / 决策型灵魂继续看',
      browseHref: '/souls?category=work',
      detailLead: '当你真正想比较的不是“谁更好玩”，而是“谁更像一个靠谱的谋士”时，按人格专题看会比按用途标签更直接。',
      highlights: ['结构感和边界感通常更强，适合处理复杂任务。', '更容易把问题从模糊状态收口到决策状态。', '比起氛围感，这组更强调判断力与秩序感。'],
      fitFor: ['想找“先规划、再判断、最后执行”人格的人', '做项目方案、架构思考、复杂决策的人', '更在意边界、秩序与稳定输出的人'],
      shareBadges: ['谋士系', '结构判断', '复杂任务'],
      preferredSlugs: ['edict-counselor', 'architect', 'agile-pm', 'code-reviewer'],
      minimumScore: 74,
      rankSoul: rankStrategistSoul,
    },
    {
      key: 'warm',
      eyebrow: '想先被接住，再继续说',
      title: '温润陪伴系',
      summary: '更温和、更有陪伴感，也更适合轻量对话、解释和情绪缓冲。',
      note: '这组强调对话舒适度和温度感；如果你想先被理解，而不是马上被挑错，它会更顺。',
      pageHref: getCollectionPath('warm'),
      browseLabel: '去个性 / 学习型灵魂继续看',
      browseHref: '/souls?category=creative',
      detailLead: '有些人挑 Soul 时优先看的不是能力边界，而是相处体感。这组更适合先判断“你愿不愿意长期和它待在一起”。',
      highlights: ['温度感更高，更容易建立陪伴和信任感。', '锋利度通常更低，更少出现“被怼”的体感。', '适合聊天、解释、安抚和轻引导型互动。'],
      fitFor: ['想找更温和、更容易相处的人格', '在意陪伴感和解释耐心的人', '不希望一上来就被强推进或强批判的人'],
      shareBadges: ['温润陪伴系', '温度感', '更好相处'],
      preferredSlugs: ['catgirl-nova', 'socratic', 'pirate-captain'],
      minimumScore: 70,
      rankSoul: rankWarmSoul,
    },
    {
      key: 'sharp',
      eyebrow: '能接受直给，就看这组',
      title: '毒舌直给系',
      summary: '反馈更锋利、边界更清晰，适合 review、调试、挑错和快速收口。',
      note: '这组不是为了“好相处”，而是为了更快指出问题。你如果能接受被直说，体感会很爽。',
      pageHref: getCollectionPath('sharp'),
      browseLabel: '去开发向灵魂继续看',
      browseHref: '/souls?category=dev',
      detailLead: '当你要的是“把问题挑出来”，而不是“把你哄舒服”，人格差异会比用途标签更重要。',
      highlights: ['锋利度和边界感通常更高，更适合指出问题。', '更常见于 review、调试、风险排查场景。', '更适合愿意被直接反馈的人，而不是纯陪伴场景。'],
      fitFor: ['能接受被直接指出问题的人', '做代码审查、质量收口、调试的人', '不想在反馈里绕弯的人'],
      shareBadges: ['毒舌直给系', '锋利反馈', '质量收口'],
      preferredSlugs: ['grumpy-wang', 'code-reviewer', 'architect'],
      minimumScore: 76,
      rankSoul: rankSharpSoul,
    },
    {
      key: 'roleplay',
      eyebrow: '不想跟中性工具说话',
      title: '角色感拉满',
      summary: '人格辨识度更高，互动里能明显感受到“它是谁”，更适合比较气质。',
      note: '这组不是单看功能，而是看人格记忆点。适合想挑一位“有角色感的灵魂”导入的人。',
      pageHref: getCollectionPath('roleplay'),
      browseLabel: '去个性人格继续看',
      browseHref: '/souls?category=creative',
      detailLead: 'Soul 最有趣的地方，从来不只是“它能做什么”，而是“它像谁、你喜不喜欢和它相处”。这一组优先收口角色感最强的几位。',
      highlights: ['角色氛围明显，更容易形成记忆点。', '更适合做人格比较，而不是纯功能比较。', '互动里通常能明显感受到“它是谁”。'],
      fitFor: ['想导入一位人格鲜明的灵魂', '不想只和中性工具助手说话的人', '更在意气质和角色氛围的人'],
      shareBadges: ['角色感拉满', '人格鲜明', '更有记忆点'],
      preferredSlugs: ['catgirl-nova', 'pirate-captain', 'edict-counselor'],
      minimumScore: 74,
      rankSoul: rankRoleplaySoul,
    },
  ];

  return seeds.map((seed) => createCollection({ ...seed, kind: 'persona', souls: selectPersonaSouls(seed, souls, soulsBySlug) }));
}

export function getCollectionPath(key: CollectionKey) {
  return `/collections/${key}`;
}

export function getCollectionKindLabel(kind: CollectionKind) {
  return kind === 'growth' ? '起步合集' : '人格专题';
}

export function getGrowthCollectionPath(key: GrowthCollectionKey) {
  return getCollectionPath(key);
}

export function getGrowthCollectionKeys() {
  return [...GROWTH_COLLECTION_KEYS];
}

export function getCollectionKeys() {
  return [...COLLECTION_KEYS];
}

export async function getCollections(): Promise<CollectionSection[]> {
  const souls = await getAllSouls();
  const soulsBySlug = new Map(souls.map((soul) => [soul.slug, soul]));
  const featuredSouls = souls.filter((soul) => soul.featured);
  const hotSection = await getHotSouls(soulsBySlug, featuredSouls);

  return [...buildGrowthCollections(souls, soulsBySlug, hotSection), ...buildPersonaCollections(souls, soulsBySlug)];
}

export async function getCollectionGroups(): Promise<CollectionGroup[]> {
  const collections = await getCollections();

  return [
    {
      key: 'growth',
      eyebrow: '先帮你降低第一次选择成本',
      title: '入口型合集',
      description: '适合第一次来、刚准备导入或想快速跟上站内趋势的人。它解决的是“先从哪组开始看”。',
      collections: collections.filter((collection) => collection.kind === 'growth'),
    },
    {
      key: 'persona',
      eyebrow: '当你开始按人格气质来挑',
      title: '人格专题',
      description: '适合已经知道自己偏好什么相处体感的人。这里不是严格分类，一个 Soul 也可以同时属于多种人格气质。',
      collections: collections.filter((collection) => collection.kind === 'persona'),
    },
  ];
}

export async function getCollectionByKey(key: string) {
  const collections = await getCollections();
  return collections.find((collection) => collection.key === key) ?? null;
}

export async function getGrowthCollections() {
  const collections = await getCollections();
  return collections.filter((collection): collection is CollectionSection & { kind: 'growth' } => collection.kind === 'growth');
}

export async function getGrowthCollectionByKey(key: string) {
  const collection = await getCollectionByKey(key);
  return collection?.kind === 'growth' ? collection : null;
}
