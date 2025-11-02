// lib/settings.ts
export type AIProfile = 'tia-adelia' | 'eng-agronomo' | 'mestre-horta' | 'professor-paciente';
export type ReportRange = '1w' | '2w' | '1m' | 'all';

export type Settings = {
  locale: 'pt-PT' | 'en-US';
  theme: 'system' | 'light' | 'dark';

  userLocation?: { distrito?: string; municipio?: string };
  zoneOverride?: `ZONA ${1 | 2 | 3 | 4 | 5}` | null;

  showTodayLine: boolean;
  stickyNameCol: boolean;
  stickyHeader: boolean;
  stickyFirstRow: boolean;
  nameColWidth: number;
  cellWidth: number;
  rowHeight: number;
  actionsDefault: { Semeadura: boolean; Transplante: boolean; Colheita: boolean };

  initialSearch?: string;
  lockZoneAfterDetect: boolean;

  highContrast: boolean;
  iconSize: number;

  // 👇 novos
  aiProfile?: AIProfile;
  reportRange?: ReportRange;
};

export const DEFAULT_SETTINGS: Settings = {
  locale: 'pt-PT',
  theme: 'system',
  userLocation: { distrito: '', municipio: '' },
  zoneOverride: null,

  showTodayLine: true,
  stickyNameCol: true,
  stickyHeader: true,
  stickyFirstRow: false,
  nameColWidth: 180,
  cellWidth: 64,
  rowHeight: 44,
  actionsDefault: { Semeadura: true, Transplante: true, Colheita: true },

  initialSearch: '',
  lockZoneAfterDetect: false,

  highContrast: false,
  iconSize: 14,

  // 👇 defaults dos novos
  aiProfile: 'tia-adelia',
  reportRange: '1w',
};

export const SETTINGS_KEY = 'garden.settings.v1';
