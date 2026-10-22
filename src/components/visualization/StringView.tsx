import { cn } from 'cn';
import type { StringState } from '@/algorithms/string/types';
import { COLORS } from '@/utils/colors';

const CELL_W = 34;
const CELL_H = 40;

/**
 * 字符串视图：主串与模式串按偏移对齐，字符格子可高亮，
 * 展示匹配位置与 KMP 的 next 数组。
 */
export function StringView({ state }: { state: StringState }) {
  const { text, pattern, offset, textHighlight, patternHighlight, matchedPositions, nextArray, nextHighlight, info } = state;

  const textCells = [...text];
  const patternCells = [...pattern];

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

      {/* 主串 */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground">主串 text</span>
        <div className="flex">
          {textCells.map((ch, i) => {
            const isHl = textHighlight.includes(i);
            const isMatched = matchedPositions.includes(i);
            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center border font-mono-code text-base',
                    isHl && 'border-yellow-500 bg-yellow-500/20 text-foreground',
                    !isHl && isMatched && 'border-green-500 bg-green-500/15 text-foreground',
                    !isHl && !isMatched && 'border-border text-foreground',
                  )}
                  style={{ width: CELL_W, height: CELL_H }}
                >
                  {ch}
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 模式串（偏移对齐） */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground">模式串 pattern（偏移 {offset}）</span>
        <div className="flex" style={{ marginLeft: offset * CELL_W }}>
          {patternCells.map((ch, i) => {
            const isHl = patternHighlight.includes(i);
            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center border font-mono-code text-base',
                    isHl && 'border-orange-500 bg-orange-500/20 text-foreground',
                    !isHl && 'border-primary bg-primary/10 text-foreground',
                  )}
                  style={{ width: CELL_W, height: CELL_H, borderColor: isHl ? COLORS.comparing : undefined }}
                >
                  {ch}
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* next 数组 */}
      {nextArray && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground">next 数组</span>
          <div className="flex gap-1">
            {nextArray.map((v, i) => {
              const isHl = nextHighlight?.includes(i);
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md border font-mono-code text-sm',
                      isHl ? 'border-orange-500 bg-orange-500/20' : 'border-border text-foreground',
                    )}
                  >
                    {v}
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{i}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
