import { cn } from 'cn';
import type { MatrixState } from '@/algorithms/array/types';

/**
 * 矩阵视图：展示二维矩阵 + 压缩存储的一维数组，高亮映射关系。
 */
export function MatrixView({ state }: { state: MatrixState }) {
  const { matrix, highlighted, storage, storageHighlight, storageLabels, labels, info } = state;

  const isHl = (r: number, c: number) => highlighted.some(([hr, hc]) => hr === r && hc === c);

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

      {/* 矩阵 */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground">{labels ? '邻接矩阵' : '矩阵'}</span>
        {labels && (
          <div className="flex gap-1 pl-6">
            {labels.map((l, c) => (
              <span key={c} className="w-11 text-center text-xs font-semibold text-foreground">{l}</span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-1">
          {matrix.map((row, r) => (
            <div key={r} className="flex items-center gap-1">
              {labels && <span className="w-5 text-xs font-semibold text-foreground">{labels[r]}</span>}
              {row.map((cell, c) => {
                const hl = isHl(r, c);
                const isEmpty = cell === null;
                return (
                  <div
                    key={c}
                    className={cn(
                      'flex h-9 w-11 items-center justify-center border font-mono-code text-sm',
                      isEmpty && 'border-dashed text-muted-foreground/40',
                      !isEmpty && 'text-foreground',
                      hl && 'border-yellow-500 bg-yellow-500/20',
                      !hl && !isEmpty && 'border-border',
                    )}
                  >
                    {isEmpty ? '·' : cell}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 压缩存储 */}
      {storage && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground">压缩存储（一维）</span>
          <div className="flex gap-1">
            {storage.map((cell, i) => {
              const hl = storageHighlight?.includes(i);
              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div
                    className={cn(
                      'flex h-9 w-11 items-center justify-center border font-mono-code text-sm',
                      cell === null ? 'border-dashed text-muted-foreground/40' : 'text-foreground',
                      hl ? 'border-yellow-500 bg-yellow-500/20' : cell === null ? 'border-border' : 'border-border',
                    )}
                  >
                    {cell === null ? '' : cell}
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{storageLabels?.[i] ?? i}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
