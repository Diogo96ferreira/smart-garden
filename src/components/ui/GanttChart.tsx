'use client';

import React from 'react';
import { Sprout, Shovel, ShoppingBasket } from 'lucide-react';
import { usePathname } from 'next/navigation';

export type Month =
  | 'Janeiro'
  | 'Fevereiro'
  | 'Março'
  | 'Abril'
  | 'Maio'
  | 'Junho'
  | 'Julho'
  | 'Agosto'
  | 'Setembro'
  | 'Outubro'
  | 'Novembro'
  | 'Dezembro'
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December';

export type ActionKey = 'Semeadura' | 'Transplante' | 'Colheita';
export type CropEntry = Partial<
  Record<ActionKey | 'Sowing' | 'Transplant' | 'Transplanting' | 'Harvest', string[]>
>;
export type ZoneData = Record<string, CropEntry>;
type StickyMode = 'inside' | 'page';

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

// Helper: dado um array de meses, devolve um array de 12 booleanos
const maskFor = (months: Month[], locale: 'pt' | 'en') => {
  const monthsList =
    locale === 'en'
      ? [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ]
      : [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ];

  const m = Array(12).fill(false);
  months.forEach((mm) => {
    const idx = monthsList.indexOf(mm);
    if (idx !== -1) m[idx] = true;
  });
  return m;
};

const onlyMonths = (arr: string[] | undefined, locale: 'pt' | 'en' = 'pt'): Month[] => {
  if (!arr) return [];
  const validMonths =
    locale === 'en'
      ? [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ]
      : [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ];
  return arr.filter((m): m is Month => validMonths.includes(m as Month));
};

const todayLeftPx = (nameColWidth: number, cellWidth: number) => {
  const now = new Date();
  const m = now.getMonth();
  const first = new Date(now.getFullYear(), m, 1);
  const next = new Date(now.getFullYear(), m + 1, 1);
  const frac = (now.getTime() - first.getTime()) / (next.getTime() - first.getTime());
  return nameColWidth + m * cellWidth + frac * cellWidth;
};

type Props = {
  data: ZoneData;
  actions: ActionKey[];
  search?: string;
  nameColWidth?: number;
  cellWidth?: number;
  rowHeight?: number;
  stickyFirstRow?: boolean;
  stickyMode?: StickyMode;
  maxHeight?: number;
  className?: string;
};

export default function GanttChart({
  data,
  actions,
  search = '',
  nameColWidth = 180,
  cellWidth = 64,
  rowHeight = 44,
  stickyFirstRow = false,
  stickyMode = 'inside',
  maxHeight = 70 * 16,
  className = '',
}: Props) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1]?.startsWith('en') ? 'en' : 'pt';

  const MONTHS =
    locale === 'en'
      ? [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ]
      : [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ];

  const crops = React.useMemo(
    () =>
      Object.keys(data)
        .sort((a, b) => a.localeCompare(b, locale))
        .filter((n) => !search || n.toLowerCase().includes(search.toLowerCase())),
    [data, search, locale],
  );

  const HEADER_H = 34;
  const todayLeft = todayLeftPx(nameColWidth, cellWidth);
  const minWidthPx = nameColWidth + MONTHS.length * cellWidth;

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = Math.max(
      0,
      Math.min(todayLeft - el.clientWidth / 2, el.scrollWidth - el.clientWidth),
    );
    el.scrollTo({ left: target, behavior: 'smooth' });
  }, [todayLeft]);

  const HeaderGrid = ({ transparent = false }: { transparent?: boolean }) => (
    <div
      className={`grid ${transparent ? 'text-transparent select-none' : 'text-[color:var(--color-text)]'} bg-[var(--color-surface)] text-xs font-medium`}
      style={{ gridTemplateColumns: `${nameColWidth}px repeat(12, ${cellWidth}px)` }}
    >
      <div
        className={`sticky left-0 z-[90] bg-[var(--color-surface)] px-3 py-2 shadow-[1px_0_0_0_rgba(0,0,0,0.08)]`}
        style={{ width: nameColWidth }}
      >
        {locale === 'en' ? 'Crop' : 'Cultura'}
      </div>
      {MONTHS.map((m) => (
        <div key={m} className="z-[60] px-2 py-2 text-center">
          {m.slice(0, 3)}
        </div>
      ))}
    </div>
  );

  if (stickyMode === 'inside') {
    const containerStyle: CSSVars = { minWidth: `${minWidthPx}px` };

    return (
      <div
        className={`relative w-full max-w-[93vw] rounded-xl border border-[color:var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)] shadow-sm ${className}`}
      >
        <div
          ref={scrollRef}
          className="relative overflow-x-auto overflow-y-auto"
          style={{ maxHeight }}
        >
          <div className="relative bg-[var(--color-surface)]" style={containerStyle}>
            <div
              className="sticky top-0 isolate z-[75] border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/90 backdrop-blur"
              style={{ height: HEADER_H }}
            >
              <HeaderGrid />
            </div>

            {/* Linha Hoje */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-[20] transition-[left] duration-700 ease-out"
              style={{ left: todayLeft }}
            >
              <div className="h-full w-0 border-l-2 border-[var(--color-primary)]"></div>
              <div className="absolute -top-3 -left-1 h-5 w-5 animate-pulse rounded-full bg-rose-500"></div>
            </div>

            <Rows
              data={data}
              crops={crops}
              actions={actions}
              rowHeight={rowHeight}
              nameColWidth={nameColWidth}
              cellWidth={cellWidth}
              stickyFirstRow={stickyFirstRow}
              headerH={HEADER_H}
              locale={locale}
              MONTHS={MONTHS}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function Rows({
  data,
  crops,
  actions,
  rowHeight,
  nameColWidth,
  cellWidth,
  stickyFirstRow,
  headerH,
  locale,
  MONTHS,
}: {
  data: ZoneData;
  crops: string[];
  actions: ActionKey[];
  rowHeight: number;
  nameColWidth: number;
  cellWidth: number;
  stickyFirstRow: boolean;
  headerH: number;
  locale: 'pt' | 'en';
  MONTHS: string[];
}) {
  return (
    <div className="z-[40] divide-y divide-[color:var(--color-border)]">
      {crops.map((crop, idx) => {
        const entry = data[crop] || {};
        // Permitir que leia tanto PT quanto EN no JSON
        const masks = {
          Semeadura: maskFor(onlyMonths(entry.Semeadura ?? entry.Sowing, locale), locale),
          Transplante: maskFor(
            onlyMonths(entry.Transplante ?? entry.Transplant ?? entry.Transplanting, locale),
            locale,
          ),
          Colheita: maskFor(onlyMonths(entry.Colheita ?? entry.Harvest, locale), locale),
        };

        const isStickyRow = stickyFirstRow && idx === 0;
        const rowStickyClass = isStickyRow ? 'sticky bg-[var(--color-surface)]' : '';
        const rowStickyStyle = isStickyRow ? ({ top: headerH } as React.CSSProperties) : undefined;

        return (
          <div
            key={crop}
            className="grid items-center"
            style={{ gridTemplateColumns: `${nameColWidth}px repeat(12, ${cellWidth}px)` }}
          >
            <div
              className={`sticky left-0 z-[40] flex items-center bg-[var(--color-surface)] px-3 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] ${rowStickyClass}`}
              style={{ height: rowHeight, width: nameColWidth, ...rowStickyStyle }}
            >
              <span className="text-xs font-medium whitespace-pre-wrap text-[color:var(--color-text)]">
                {' '}
                {locale === 'en' ? crop : crop}
              </span>
            </div>

            {MONTHS.map((m, colIdx) => {
              const hasS = actions.includes('Semeadura') && masks.Semeadura[colIdx];
              const hasT = actions.includes('Transplante') && masks.Transplante[colIdx];
              const hasC = actions.includes('Colheita') && masks.Colheita[colIdx];
              return (
                <div
                  key={m}
                  className={`relative border-l border-[color:var(--color-border)] ${rowStickyClass}`}
                  style={{ height: rowHeight, ...rowStickyStyle }}
                >
                  {hasS && (
                    <div className="absolute top-[4px] right-1 left-1 flex h-[10px] items-center justify-center rounded-full bg-emerald-200 ring-1 ring-emerald-400/50">
                      <Sprout className="h-3 w-3 text-emerald-900" />
                    </div>
                  )}
                  {hasT && (
                    <div className="absolute top-[17px] right-1 left-1 flex h-[10px] items-center justify-center rounded-full bg-sky-200 ring-1 ring-sky-400/50">
                      <Shovel className="h-3 w-3 text-sky-900" />
                    </div>
                  )}
                  {hasC && (
                    <div className="absolute top-[30px] right-1 left-1 flex h-[10px] items-center justify-center rounded-full bg-amber-200 ring-1 ring-amber-400/50">
                      <ShoppingBasket className="h-3 w-3 text-amber-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
