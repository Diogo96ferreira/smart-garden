'use client';

import React from 'react';
import { Sprout, Shovel, ShoppingBasket } from 'lucide-react';

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
  | 'Dezembro';

export const MONTHS: Month[] = [
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

export type ActionKey = 'Semeadura' | 'Transplante' | 'Colheita';
export type CropEntry = Partial<Record<ActionKey, string[]>>;
export type ZoneData = Record<string, CropEntry>;
type StickyMode = 'inside' | 'page';

// 🔧 Tipo para permitir CSS custom properties sem usar `any`
type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

const monthIdx = (m: Month) => MONTHS.indexOf(m);
const onlyMonths = (arr?: string[]): Month[] =>
  (arr ?? []).filter((m): m is Month => MONTHS.includes(m as Month));
const maskFor = (months: Month[]) => {
  const m = Array(12).fill(false);
  months.forEach((mm) => {
    m[monthIdx(mm)] = true;
  });
  return m;
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
  const crops = React.useMemo(
    () =>
      Object.keys(data)
        .sort((a, b) => a.localeCompare(b, 'pt'))
        .filter((n) => !search || n.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const HEADER_H = 34;
  const todayLeft = todayLeftPx(nameColWidth, cellWidth);
  const minWidthPx = nameColWidth + MONTHS.length * cellWidth;

  // 👉 manter a linha de hoje sempre visível ao entrar
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Tentar centrar a linha “hoje” no viewport
    const target = Math.max(
      0,
      Math.min(todayLeft - el.clientWidth / 2, el.scrollWidth - el.clientWidth),
    );

    // Smooth scroll
    el.scrollTo({ left: target, behavior: 'smooth' });
  }, [todayLeft]);

  const HeaderGrid = ({ transparent = false }: { transparent?: boolean }) => (
    <div
      className={`grid ${transparent ? 'text-transparent select-none' : 'text-gray-700'} bg-white text-xs font-medium dark:!bg-white`}
      style={{ gridTemplateColumns: `${nameColWidth}px repeat(12, ${cellWidth}px)` }}
    >
      <div
        className={`sticky left-0 z-[90] bg-white px-3 py-2 shadow-[1px_0_0_0_rgba(0,0,0,0.08)] dark:!bg-white`}
        style={{ width: nameColWidth }}
      >
        Cultura
      </div>
      {MONTHS.map((m) => (
        <div key={m} className="z-[60] px-2 py-2 text-center">
          {m.slice(0, 3)}
        </div>
      ))}
    </div>
  );

  if (stickyMode === 'inside') {
    // 🔧 Se quiseres mesmo usar CSS vars (ex.: noutros estilos), usa o tipo CSSVars:
    const containerStyle: CSSVars = { minWidth: `${minWidthPx}px` };

    return (
      <div
        className={`relative w-full max-w-[93vw] rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm dark:!border-gray-200 dark:!bg-white dark:!text-gray-900 ${className}`}
      >
        <div
          ref={scrollRef}
          className="relative overflow-x-auto overflow-y-auto"
          style={{ maxHeight }}
        >
          <div className="relative bg-white dark:!bg-white" style={containerStyle}>
            {/* header sticky */}
            <div
              className="sticky top-0 isolate z-[75] border-b border-gray-200 bg-white/90 backdrop-blur dark:!border-gray-200 dark:!bg-white/90"
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
            />
          </div>
        </div>
      </div>
    );
  }

  // (modo "page" não usado aqui)
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
}: {
  data: ZoneData;
  crops: string[];
  actions: ActionKey[];
  rowHeight: number;
  nameColWidth: number;
  cellWidth: number;
  stickyFirstRow: boolean;
  headerH: number;
}) {
  return (
    <div className="z-[40] divide-y divide-gray-100 dark:!divide-gray-100">
      {crops.map((crop, idx) => {
        const entry = data[crop] || {};
        const masks = {
          Semeadura: maskFor(onlyMonths(entry.Semeadura)),
          Transplante: maskFor(onlyMonths(entry.Transplante)),
          Colheita: maskFor(onlyMonths(entry.Colheita)),
        };

        const isStickyRow = stickyFirstRow && idx === 0;
        const rowStickyClass = isStickyRow ? 'sticky bg-white dark:!bg-white' : '';
        const rowStickyStyle = isStickyRow ? ({ top: headerH } as React.CSSProperties) : undefined;

        return (
          <div
            key={crop}
            className="grid items-center"
            style={{ gridTemplateColumns: `${nameColWidth}px repeat(12, ${cellWidth}px)` }}
          >
            {/* 1ª coluna fixa */}
            <div
              className={`sticky left-0 z-[40] flex items-center bg-white px-3 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:!bg-white ${rowStickyClass}`}
              style={{ height: rowHeight, width: nameColWidth, ...rowStickyStyle }}
            >
              <span className="text-xs font-medium whitespace-pre-wrap text-gray-900">{crop}</span>
            </div>

            {/* células dos meses */}
            {MONTHS.map((m, colIdx) => {
              const hasS = actions.includes('Semeadura') && masks.Semeadura[colIdx];
              const hasT = actions.includes('Transplante') && masks.Transplante[colIdx];
              const hasC = actions.includes('Colheita') && masks.Colheita[colIdx];
              return (
                <div
                  key={m}
                  className={`relative border-l border-gray-200 dark:!border-gray-200 ${rowStickyClass}`}
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
