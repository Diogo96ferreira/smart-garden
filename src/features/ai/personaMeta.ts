import type { AIPersona } from '@/lib/aiPersonas';

export const PERSONA_META: Record<AIPersona, { name: { pt: string; en: string }; avatar: string }> =
  {
    'tia-adelia': {
      name: { pt: 'Tia Adélia', en: 'Aunt Adelia' },
      avatar: '/avatar-adelia.jpg',
    },
    'eng-pedro': {
      name: { pt: 'Engenheiro Pedro', en: 'Engineer Pedro' },
      avatar: '/avatar-pedro.jpg',
    },
    'diogo-campos': {
      name: { pt: 'Diogo Campos', en: 'Diogo Campos' },
      avatar: '/avatar-diogo.jpg',
    },
    'agro-core': {
      name: { pt: 'AGRO-CORE v1.0', en: 'AGRO-CORE v1.0' },
      avatar: '/avatar-bot.jpg',
    },
  };

export function getPersonaMeta(id: AIPersona, locale: 'pt' | 'en') {
  const m = PERSONA_META[id] ?? PERSONA_META['tia-adelia'];
  return { displayName: m.name[locale], avatar: m.avatar };
}
