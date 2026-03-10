import 'server-only';

import { createHash } from 'node:crypto';

import { getQuickInstallCommand, getRawSoulPath } from '@/lib/install';
import { buildPersonaProfile } from '@/lib/persona/profile';
import { buildAbsoluteUrl, getSiteUrl } from '@/lib/seo';
import { getSoulBySlug } from '@/lib/souls';
import type { SoulDocument } from '@/lib/souls-types';
import { SOUL_PACK_OVERRIDES } from '@/lib/soul-pack/overrides';
import { SOUL_PACK_INSTALL_METHOD, SOUL_PACK_VERSION, type SoulPackManifest } from '@/lib/soul-pack/schema';

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildPackSlug(soulSlug: string) {
  return `${soulSlug}-pack`;
}

function buildIntegrity(rawSoul: string) {
  return createHash('sha256').update(rawSoul).digest('hex');
}

function buildInstallNotes(soul: SoulDocument, overrideNotes: string[]) {
  return unique([
    '这是一份结构化人格资产描述文件，不是完整环境包，也不承诺一键部署。',
    '真正导入前，仍建议先阅读原始 SOUL.md，并先备份当前灵魂。',
    soul.suggestions[0] ? `导入提醒：${soul.suggestions[0]}` : '',
    ...overrideNotes,
  ]);
}

function buildRecommendedSkillsOrTools(soul: SoulDocument, overrideSkills: string[]) {
  return unique([
    ...overrideSkills,
    ...soul.tags.slice(0, 2),
    ...soul.useCases.slice(0, 2),
  ]).slice(0, 6);
}

export function getSoulPackDownloadFileName(slug: string) {
  return `${slug}.soul-pack.json`;
}

export function buildSoulPackManifest(soul: SoulDocument): SoulPackManifest {
  const personaProfile = buildPersonaProfile(soul);
  const override = SOUL_PACK_OVERRIDES[soul.slug] ?? {};
  const baseUrl = getSiteUrl();
  const rawUrl = buildAbsoluteUrl(getRawSoulPath(soul.slug));
  const downloadUrl = buildAbsoluteUrl(getRawSoulPath(soul.slug, { download: true }));
  const command = getQuickInstallCommand(soul.slug, baseUrl);
  const generatedAt = new Date().toISOString();

  return {
    version: SOUL_PACK_VERSION,
    packSlug: buildPackSlug(soul.slug),
    soulSlug: soul.slug,
    title: soul.title,
    summary: soul.summary,
    soul: {
      fileName: 'SOUL.md',
      rawUrl,
      downloadUrl,
      integrity: {
        algorithm: 'sha256',
        value: buildIntegrity(soul.rawSoul),
      },
    },
    persona: {
      archetype: personaProfile.archetype,
      tagline: personaProfile.tagline,
      traitChips: personaProfile.traitChips,
      fitFor: personaProfile.fitFor,
      notFitFor: personaProfile.notFitFor,
    },
    runtime: {
      recommendedModels: soul.compatibleModels,
      recommendedSkillsOrTools: buildRecommendedSkillsOrTools(soul, override.recommendedSkillsOrTools ?? []),
    },
    install: {
      method: SOUL_PACK_INSTALL_METHOD,
      command,
      installNotes: buildInstallNotes(soul, override.installNotes ?? []),
    },
    preview: {
      sampleDialogues: [
        {
          user: soul.previewPrompt,
          assistant: soul.previewResponse,
        },
      ],
    },
    provenance: {
      sourceType: soul.sourceType,
      author: soul.author,
      license: soul.license,
      sourceUrl: null,
      sourceAuthor: null,
      generatedFrom: 'soul+persona+override',
      generatedAt,
    },
    extensions: override.extensions,
  };
}

export async function getSoulPackManifestBySlug(slug: string): Promise<SoulPackManifest | null> {
  const soul = await getSoulBySlug(slug);
  if (!soul) {
    return null;
  }

  return buildSoulPackManifest(soul);
}
