import { cn } from 'cn';
import type { ArrayState } from '@/algorithms/linear-list/types';

/**
 * 通用数组视图（顺序表 / 顺序栈 / 循环队列共用）。
 * 支持空位、高亮与指针标记（top / front / rear）。
 */
export function ArrayView({ state }: { state: ArrayState }) {
  const { items, highlighted, markers, info } = state;

  const markerByIndex = new Map<number, string[]>();
  for (const m of markers) {
    const list = markerByIndex.get(m.index) ?? [];
    list.push(m.label);
    markerByIndex.set(m.index, list);
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-auto p-4">
      {info && Object.keys(info).length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(info).map(([k, v]) => (
            <span key={k} className="rounded-md bg-muted px-2 py-0.5 text-xs">
              <span className="text-muted-foreground">{k}</span>
              <span className="mx-1 text-muted-foreground/50">=</span>
              <span className="font-mono-code font-semibold">{v}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5">
        {items.map((item, i) => {
          const labels = markerByIndex.get(i) ?? [];
          const isHighlighted = highlighted.includes(i);
          const isEmpty = item === null;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex h-6 items-end gap-1">
                {labels.map((label) => (
                  <span key={label} className="text-[10px] font-bold text-primary">
                    {label}
                  </span>
                ))}
              </div>
              <div
                className={cn(
                  'flex h-14 w-11 items-center justify-center rounded-md border font-mono-code text-base',
                  isEmpty && 'border-dashed text-muted-foreground',
                  !isEmpty && 'text-foreground',
                  isHighlighted && 'border-orange-500 bg-orange-500/15',
                )}
              >
                {isEmpty ? '' : item}
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{i}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
