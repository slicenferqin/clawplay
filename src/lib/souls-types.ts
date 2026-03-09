export type PublicSoulCategoryKey = 'work' | 'dev' | 'learning' | 'creative';
export type SoulCategoryKey = PublicSoulCategoryKey | 'translated';
export type SoulSourceType = '原创' | '翻译' | '改编';

export interface SoulMeta {
  slug: string;
  filePath: string;
  title: string;
  summary: string;
  category: SoulCategoryKey;
  categoryLabel: string;
  sourceType: SoulSourceType;
  featured?: boolean;
  tags: string[];
  tones: string[];
  useCases: string[];
  compatibleModels: string[];
  author: string;
  license: string;
  updatedAt: string;
  previewHook: string;
  previewPrompt: string;
  previewResponse: string;
  relatedSlugs: string[];
}

export interface SoulDocument extends SoulMeta {
  intro: string;
  features: string[];
  suggestions: string[];
  authorLines: string[];
  rawMarkdown: string;
  rawSoul: string;
}

export const CATEGORY_ORDER: PublicSoulCategoryKey[] = ['work', 'creative', 'learning', 'dev'];

export const CATEGORY_LABELS: Record<SoulCategoryKey, string> = {
  work: '工作助手',
  creative: '个性人格',
  learning: '学习伙伴',
  dev: '开发专家',
  translated: '翻译精选',
};

export const SOURCE_TYPE_ORDER: SoulSourceType[] = ['原创', '翻译', '改编'];

export const PUBLIC_CATEGORY_OPTIONS: Array<{ key: PublicSoulCategoryKey; label: string }> = CATEGORY_ORDER.map((key) => ({
  key,
  label: CATEGORY_LABELS[key],
}));

export function getCategorySortIndex(category: SoulCategoryKey) {
  const index = CATEGORY_ORDER.indexOf(category as PublicSoulCategoryKey);
  return index === -1 ? CATEGORY_ORDER.length : index;
}
