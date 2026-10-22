import { cn } from 'cn';
import type { HashState } from '@/algorithms/search/types';
import { COLORS } from '@/utils/colors';

function slotColor(status?: string): string {
  switch (status) {
    case 'current':
      return COLORS.current;
    case 'comparing':
      return COLORS.comparing;
    case 'error':
      return COLORS.error;
    case 'done':
      return COLORS.done;
    default:
      return COLORS.default;
  }
}

/**
 * 散列表视图：按槽位渲染，支持高亮与状态着色，展示冲突探测过程。
 */
export function HashView({ state }: { state: HashState }) {
  const { slots, highlighted, status, info } = state;

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
        {slots.map((slot, i) => {
          const isEmpty = slot === null;
          const isHl = highlighted.includes(i);
          const color = slotColor(status?.[i]);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-14 w-11 items-center justify-center rounded-md border font-mono-code text-base',
                  isEmpty && 'border-dashed text-muted-foreground',
                  !isEmpty && 'text-foreground',
                  isHl && 'bg-orange-500/15',
                )}
                style={{ borderColor: isHl ? color : undefined }}
              >
                {isEmpty ? '' : slot}
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{i}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
