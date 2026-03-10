import type { SoulPackOverride } from '@/lib/soul-pack/schema';

export const SOUL_PACK_OVERRIDES: Record<string, SoulPackOverride> = {
  'code-reviewer': {
    recommendedSkillsOrTools: ['diff 查看', '代码审查清单', '回归检查流程'],
    installNotes: ['更适合 review / debug / code smell 排查，不建议把它当成强陪伴型人格。'],
  },
  architect: {
    recommendedSkillsOrTools: ['架构评审清单', '系统设计草图', '约束条件记录'],
    installNotes: ['适合中大型系统设计讨论，先给清晰上下文会更稳。'],
  },
  'agile-pm': {
    recommendedSkillsOrTools: ['需求拆解清单', '优先级矩阵', '里程碑看板'],
    installNotes: ['更适合需求规划和迭代推进，不适合纯陪聊场景。'],
  },
  'catgirl-nova': {
    recommendedSkillsOrTools: ['创意写作提纲', '情绪陪伴脚本', '轻量知识讲解'],
    installNotes: ['如果你要它承担严肃工程判断，最好明确给任务边界。'],
  },
  'grumpy-wang': {
    recommendedSkillsOrTools: ['报错上下文', '日志片段', '复现步骤'],
    installNotes: ['它会更直给、更不拐弯；如果你介意被“怼”，谨慎导入。'],
  },
};
