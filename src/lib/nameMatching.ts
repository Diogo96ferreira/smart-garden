export type Locale = 'pt' | 'en';

export function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s:./-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Aliases PT and EN for common orchard items (fruit <-> tree)
const ALIASES_PT: Record<string, string[]> = {
  figo: ['figueira'],
  figueira: ['figo'],
  laranja: ['laranjeira'],
  laranjeira: ['laranja'],
  maca: ['macieira', 'maca gala', 'maca fuji'],
  macieira: ['maca', 'maca gala', 'maca fuji'],
  pera: ['pereira'],
  pereira: ['pera'],
  ameixa: ['ameixeira'],
  ameixeira: ['ameixa'],
  pessego: ['pessegueiro', 'nectarina', 'pessegueiro/nectarina'],
  pessegueiro: ['pessego', 'nectarina'],
  nespera: ['nespereira'],
  nespereira: ['nespera'],
  roma: ['romazeira', 'romanzeira'],
  romazeira: ['roma', 'roman'],
  romanzeira: ['roma'],
  azeitona: ['oliveira', 'oliva'],
  oliveira: ['azeitona', 'oliva'],
  noz: ['nogueira'],
  nogueira: ['noz'],
  amendoa: ['amendoeira'],
  amendoeira: ['amendoa'],
  uva: ['videira', 'videira (uva de mesa)', 'uva de mesa'],
  videira: ['uva'],
  limao: ['limoeiro'],
  limoeiro: ['limao'],
  tangerina: ['tangerineira', 'mandarina', 'clementina'],
  tangerineira: ['tangerina', 'mandarina', 'clementina'],
  abacate: ['abacateiro'],
  abacateiro: ['abacate'],
  kiwi: ['actinidia', 'kiwi hardy', 'actinidia arguta'],
};

const ALIASES_EN: Record<string, string[]> = {
  fig: ['fig tree'],
  'fig tree': ['fig'],
  orange: ['orange tree'],
  'orange tree': ['orange'],
  apple: ['apple tree', 'gala apple', 'fuji apple'],
  'apple tree': ['apple', 'gala apple', 'fuji apple'],
  pear: ['pear tree'],
  'pear tree': ['pear'],
  plum: ['plum tree'],
  'plum tree': ['plum'],
  peach: ['peach tree', 'nectarine'],
  'peach tree': ['peach', 'nectarine'],
  loquat: ['loquat tree'],
  'loquat tree': ['loquat'],
  pomegranate: ['pomegranate tree'],
  'pomegranate tree': ['pomegranate'],
  olive: ['olive tree'],
  'olive tree': ['olive'],
  walnut: ['walnut tree'],
  'walnut tree': ['walnut'],
  almond: ['almond tree'],
  'almond tree': ['almond'],
  grape: ['grapevine', 'vine'],
  grapevine: ['grape', 'vine'],
  lemon: ['lemon tree'],
  'lemon tree': ['lemon'],
  tangerine: ['mandarin', 'tangerine tree'],
  'tangerine tree': ['tangerine', 'mandarin'],
  avocado: ['avocado tree'],
  'avocado tree': ['avocado'],
  kiwi: ['kiwifruit', 'kiwi vine'],
  'kiwi vine': ['kiwi', 'kiwifruit'],
};

export function expandAliases(term: string, locale: Locale): string[] {
  const base = normalize(term);
  const map = locale === 'en' ? ALIASES_EN : ALIASES_PT;
  const extras = map[base] ?? [];
  return [base, ...extras.map(normalize)];
}

export type PlantLike = { id: string; name?: string | null; species?: string | null };

export function matchPlantFromText(
  task: { title: string; description?: string | null },
  plants: PlantLike[],
  locale: Locale,
): PlantLike | null {
  const title = normalize(task.title);
  const desc = normalize(task.description ?? '');
  let best: PlantLike | null = null;
  let bestLen = 0;

  for (const p of plants) {
    const candidates = new Set<string>();
    if (p.name) expandAliases(p.name, locale).forEach((x) => candidates.add(x));
    if (p.species) expandAliases(p.species, locale).forEach((x) => candidates.add(x));

    for (const cand of candidates) {
      if (!cand) continue;
      if (title.includes(cand) || desc.includes(cand)) {
        if (cand.length > bestLen) {
          best = p;
          bestLen = cand.length;
        }
      }
    }
  }
  return best;
}

// Detect watering action for completion logic
export function isWateringTask(title: string, locale: Locale): boolean {
  const t = normalize(title);
  if (locale === 'en') return /^water[:\s]/.test(t) || t.includes('watering');
  return /^regar[:\s]/.test(t) || t.includes('rega');
}

// Parse a coarse action key from a title, for deduping
export function parseActionKey(
  title: string,
  locale: Locale,
): 'water' | 'prune' | 'fertilize' | 'inspect' | 'harvest' | 'sow' | 'transplant' | 'other' {
  const t = normalize(title);
  const has = (arr: string[]) => arr.some((w) => t.includes(w));
  if (locale === 'en') {
    if (has(['water', 'watering'])) return 'water';
    if (has(['prune', 'pruning'])) return 'prune';
    if (has(['fertilize', 'fertiliser', 'fertilizer'])) return 'fertilize';
    if (has(['inspect', 'check'])) return 'inspect';
    if (has(['harvest'])) return 'harvest';
    if (has(['sow'])) return 'sow';
    if (has(['transplant'])) return 'transplant';
    return 'other';
  }
  // pt
  if (has(['regar', 'rega'])) return 'water';
  if (has(['podar', 'poda'])) return 'prune';
  if (has(['adubar', 'fertilizar', 'adubo', 'fertilizante'])) return 'fertilize';
  if (has(['verificar', 'inspecionar'])) return 'inspect';
  if (has(['colher', 'colheita'])) return 'harvest';
  if (has(['semear', 'semeadura'])) return 'sow';
  if (has(['transplantar', 'transplante'])) return 'transplant';
  return 'other';
}
