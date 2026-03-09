import 'server-only';

import { getHotlist } from '@/lib/analytics/hotlist';
import { getAllSouls, type SoulDocument } from '@/lib/souls';

export type GrowthCollectionKey = 'starter' | 'developer' | 'hot' | 'latest';

export interface GrowthCollectionSection {
  key: GrowthCollectionKey;
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
  souls: SoulDocument[];
}

const STARTER_SLUGS = ['edict-counselor', 'catgirl-nova', 'socratic'];
const DEVELOPER_SLUGS = ['code-reviewer', 'architect', 'grumpy-wang'];
const COLLECTION_LIMIT = 3;
const COLLECTION_KEYS: GrowthCollectionKey[] = ['starter', 'developer', 'hot', 'latest'];

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

function pickSoulsBySlugs(slugs: string[], soulsBySlug: Map<string, SoulDocument>) {
  return slugs
    .map((slug) => soulsBySlug.get(slug))
    .filter((item): item is SoulDocument => Boolean(item));
}

function getLatestSouls(souls: SoulDocument[]) {
  return [...souls]
    .sort((left, right) => {
      const dateGap = getDateValue(right.updatedAt) - getDateValue(left.updatedAt);
      if (dateGap !== 0) {
        return dateGap;
      }

      if (left.featured && !right.featured) {
        return -1;
      }

      if (!left.featured && right.featured) {
        return 1;
      }

      return left.title.localeCompare(right.title, 'zh-Hans-CN');
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
      ? '优先按近 30 天查看 / 安装 / 原文行为生成；当前样本不足时，用精选 Soul 回填。'
      : '按近 30 天查看 / 安装 / 原文行为加权生成，适合直接看站内最近更受欢迎的 Soul。',
  };
}

export function getGrowthCollectionPath(key: GrowthCollectionKey) {
  return `/collections/${key}`;
}

export function getGrowthCollectionKeys() {
  return [...COLLECTION_KEYS];
}

export async function getGrowthCollections(): Promise<GrowthCollectionSection[]> {
  const souls = await getAllSouls();
  const soulsBySlug = new Map(souls.map((soul) => [soul.slug, soul]));
  const featuredSouls = souls.filter((soul) => soul.featured);
  const hotSection = await getHotSouls(soulsBySlug, featuredSouls);

  return [
    {
      key: 'starter',
      eyebrow: '第一次来先看这里',
      title: '新手首选',
      summary: '适合第一次装 Soul、还没形成明确偏好的人。先从风格清晰、用途广、踩坑少的几位开始。',
      note: '这组偏“上手成本低、预期稳定”，更适合作为第一次替换和试跑。',
      pageHref: getGrowthCollectionPath('starter'),
      browseLabel: '先去灵魂库继续挑',
      browseHref: '/souls',
      detailLead: '如果你刚接触 ClawPlay，最容易卡住的不是“没有 Soul”，而是“候选太多，不知道先装哪个”。这组优先帮你降低第一次试错成本。',
      highlights: ['风格更稳定，第一次上手不容易装到太偏门的角色。', '覆盖聊天、学习、规划三类常见起步场景。', '更适合先建立对 Soul 的使用预期，再决定后续偏好。'],
      fitFor: ['第一次替换本地 SOUL.md 的用户', '想先体验站内代表性 Soul 的用户', '还没形成明确角色偏好的用户'],
      shareBadges: ['新手首选', '低门槛', '先试这组'],
      souls: pickSoulsBySlugs(STARTER_SLUGS, soulsBySlug),
    },
    {
      key: 'developer',
      eyebrow: '偏工程工作流',
      title: '开发首选',
      summary: '适合写代码、做 review、想拆需求和想看系统边界的人，优先收口到真正能进工作流的几位。',
      note: '这组不是“会写代码的人设”，而是更适合真正拿来做开发判断和工程协作。',
      pageHref: getGrowthCollectionPath('developer'),
      browseLabel: '去开发向灵魂继续看',
      browseHref: '/souls?category=dev',
      detailLead: '如果你来 ClawPlay 主要是为了代码审查、技术判断、架构拆解或项目推进，这组比“随机挑一个聪明人设”更适合直接进入工作流。',
      highlights: ['更偏工程判断，而不是单纯陪聊或角色感。', '适合 review、架构、需求拆解、风险分析。', '更容易拿来做真正的工作输入，而不是一次性试玩。'],
      fitFor: ['开发者 / 独立开发者', '需要代码审查与架构辅助的人', '希望把 Soul 直接嵌进工作流的人'],
      shareBadges: ['开发首选', '工程工作流', '代码审查'],
      souls: pickSoulsBySlugs(DEVELOPER_SLUGS, soulsBySlug),
    },
    {
      key: 'hot',
      eyebrow: '近 30 天行为信号',
      title: '当前热门',
      summary: '如果你不想分析太多，直接先看最近被更多人查看、复制安装或下载原文的 Soul。',
      note: hotSection.note,
      pageHref: getGrowthCollectionPath('hot'),
      browseLabel: '去灵魂库继续浏览',
      browseHref: '/souls',
      detailLead: '这组不是编辑拍脑袋说“热门”，而是尽量复用站内真实行为信号。它更适合想快速跟上当前站内偏好的用户。',
      highlights: ['优先参考详情查看、安装复制、原文下载等真实行为。', '样本不足时用精选 Soul 回填，避免空页或伪热门。', '适合作为“我先看看最近大家在装什么”的快捷入口。'],
      fitFor: ['不想花太多时间比较的人', '想直接看近期更受欢迎选择的人', '准备先装一个试试的用户'],
      shareBadges: ['当前热门', '行为信号', '近期趋势'],
      souls: hotSection.souls,
    },
    {
      key: 'latest',
      eyebrow: '想尝鲜就看这里',
      title: '最近新增',
      summary: '优先展示最近更新的 Soul。对已经装过几轮、想看看站里最近加了什么的人更友好。',
      note: '当前按更新时间排序，后续如果新增量更大，再升级成独立的最近发布流。',
      pageHref: getGrowthCollectionPath('latest'),
      browseLabel: '回到灵魂库继续看',
      browseHref: '/souls',
      detailLead: '如果你已经装过几轮 Soul，或者会定期回来逛一圈，那么“最近新增”往往比“继续翻全部列表”更有效率。',
      highlights: ['优先让老用户看到站里最近的新内容。', '更适合尝鲜，而不是稳定上手。', '为后续真正的“最近发布流”做结构铺垫。'],
      fitFor: ['已经使用过 ClawPlay 的回访用户', '喜欢尝鲜、想看最近变化的人', '准备做二次替换和比较的人'],
      shareBadges: ['最近新增', '想尝鲜', '新内容'],
      souls: getLatestSouls(souls),
    },
  ];
}

export async function getGrowthCollectionByKey(key: string) {
  const collections = await getGrowthCollections();
  return collections.find((collection) => collection.key === key) ?? null;
}
