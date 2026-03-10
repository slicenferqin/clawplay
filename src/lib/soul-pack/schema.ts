export const SOUL_PACK_VERSION = 'v1' as const;
export const SOUL_PACK_INSTALL_METHOD = 'curl-raw-soul' as const;

export interface SoulPackManifest {
  version: typeof SOUL_PACK_VERSION;
  packSlug: string;
  soulSlug: string;
  title: string;
  summary: string;
  soul: {
    fileName: 'SOUL.md';
    rawUrl: string;
    downloadUrl: string;
    integrity: {
      algorithm: 'sha256';
      value: string;
    };
  };
  persona: {
    archetype: string;
    tagline: string;
    traitChips: string[];
    fitFor: string[];
    notFitFor: string[];
  };
  runtime: {
    recommendedModels: string[];
    recommendedSkillsOrTools: string[];
  };
  install: {
    method: typeof SOUL_PACK_INSTALL_METHOD;
    command: string;
    installNotes: string[];
  };
  preview: {
    sampleDialogues: Array<{
      user: string;
      assistant: string;
    }>;
  };
  provenance: {
    sourceType: string;
    author: string;
    license: string;
    sourceUrl?: string | null;
    sourceAuthor?: string | null;
    generatedFrom: 'soul+persona+override';
    generatedAt: string;
  };
  extensions?: Record<string, unknown>;
}

export interface SoulPackOverride {
  recommendedSkillsOrTools?: string[];
  installNotes?: string[];
  extensions?: Record<string, unknown>;
}
