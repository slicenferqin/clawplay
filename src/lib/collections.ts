import 'server-only';

import { getHotlist } from '@/lib/analytics/hotlist';
import { getAllSouls, type SoulDocument } from '@/lib/souls';

export interface GrowthCollectionSection {
  key: string;
  eyebrow: string;
  title: string;
  summary: string;
  note: string;
  ctaLabel: string;
  ctaHref: string;
  souls: SoulDocument[];
}

const STARTER_SLUGS = ['edict-counselor', 'catgirl-nova', 'socratic'];
const DEVELOPER_SLUGS = ['code-reviewer', 'architect', 'grumpy-wang'];
const COLLECTION_LIMIT = 3;

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
      ctaLabel: '先去灵魂库继续挑',
      ctaHref: '/souls',
      souls: pickSoulsBySlugs(STARTER_SLUGS, soulsBySlug),
    },
    {
      key: 'developer',
      eyebrow: '偏工程工作流',
      title: '开发首选',
      summary: '适合写代码、做 review、想拆需求和想看系统边界的人，优先收口到真正能进工作流的几位。',
      note: '这组不是“会写代码的人设”，而是更适合真正拿来做开发判断和工程协作。',
      ctaLabel: '去开发向灵魂继续看',
      ctaHref: '/souls?category=dev',
      souls: pickSoulsBySlugs(DEVELOPER_SLUGS, soulsBySlug),
    },
    {
      key: 'hot',
      eyebrow: '近 30 天行为信号',
      title: '当前热门',
      summary: '如果你不想分析太多，直接先看最近被更多人查看、复制安装或下载原文的 Soul。',
      note: hotSection.note,
      ctaLabel: '去灵魂库继续浏览',
      ctaHref: '/souls',
      souls: hotSection.souls,
    },
    {
      key: 'latest',
      eyebrow: '想尝鲜就看这里',
      title: '最近新增',
      summary: '优先展示最近更新的 Soul。对已经装过几轮、想看看站里最近加了什么的人更友好。',
      note: '当前按更新时间排序，后续如果新增量更大，再升级成独立的最近发布流。',
      ctaLabel: '回到灵魂库继续看',
      ctaHref: '/souls',
      souls: getLatestSouls(souls),
    },
  ];
}
