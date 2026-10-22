import { motion } from 'framer-motion';
import { cn } from 'cn';
import type { SortState } from '@/algorithms/sorting/types';
import { useElementSize } from '@/hooks/useElementSize';
import { COLORS } from '@/utils/colors';

interface BarsCanvasProps {
  state: SortState;
}

/** 顶部数值标签 + 底部索引标签的预留高度 */
const LABEL_SPACE = 44;

/**
 * 排序柱状图画布：颜色语义遵循统一规范
 * 默认=蓝、比较=橙、交换=黄、基准=紫、已排序=绿；分区区间带浅色背景。
 */
export function BarsCanvas({ state }: BarsCanvasProps) {
  const [ref, { height }] = useElementSize<HTMLDivElement>();
  const { values, comparing, swapping, sortedIndices, pivotIndex, range, comparisons, swaps, auxArray, digit, step } =
    state;
  const max = Math.max(...values, 1);
  const barArea = Math.max(height - LABEL_SPACE - (auxArray ? 56 : 0), 40);
  // 柱多时（≥16）降级为轻量 tween 过渡，避免大量 spring 物理计算造成卡顿
  const manyBars = values.length >= 16;

  return (
    <div ref={ref} className="relative h-full w-full">
      <div className="flex h-full w-full items-end justify-center gap-1.5 px-4 pb-1 sm:gap-2">
        {values.map((value, index) => {
          const inRange = range ? index >= range[0] && index <= range[1] : false;
          const isPivot = pivotIndex === index;
          const color = sortedIndices.includes(index)
            ? COLORS.done
            : isPivot
              ? COLORS.pivot
              : swapping?.includes(index)
                ? COLORS.current
                : comparing?.includes(index)
                  ? COLORS.comparing
                  : COLORS.default;
          const barHeight = (value / max) * barArea;

          return (
            <div
              key={index}
              className={cn(
                'flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-md',
                inRange && 'bg-muted/40',
              )}
            >
              <span className="text-xs tabular-nums text-muted-foreground">{value}</span>
              <motion.div
                className="w-full max-w-[52px] rounded-t-sm"
                style={{ backgroundColor: color, willChange: 'height' }}
                initial={false}
                animate={{ height: Math.max(barHeight, 6) }}
                transition={
                  manyBars
                    ? { duration: 0.18, ease: 'easeOut' }
                    : { type: 'spring', stiffness: 320, damping: 30 }
                }
              />
              <span className="text-xs tabular-nums text-muted-foreground">{index}</span>
            </div>
          );
        })}
      </div>

      {/* 统计信息 */}
      <div className="pointer-events-none absolute right-3 top-2 flex gap-2 text-xs tabular-nums">
        <span className="rounded-md bg-background/80 px-2 py-0.5 text-muted-foreground shadow-sm">
          比较 {comparisons}
        </span>
        <span className="rounded-md bg-background/80 px-2 py-0.5 text-muted-foreground shadow-sm">
          交换/移动 {swaps}
        </span>
        {step !== undefined && (
          <span className="rounded-md bg-background/80 px-2 py-0.5 text-muted-foreground shadow-sm">
            增量 {step}
          </span>
        )}
        {digit !== undefined && (
          <span className="rounded-md bg-background/80 px-2 py-0.5 text-muted-foreground shadow-sm">
            当前位 {['个位', '十位', '百位', '千位'][digit] ?? digit}
          </span>
        )}
      </div>

      {/* 辅助数组（归并排序临时数组） */}
      {auxArray && (
        <div className="pointer-events-none absolute bottom-1 left-4 right-4 flex items-end gap-1.5 border-t border-dashed pt-1">
          <span className="shrink-0 text-[10px] text-muted-foreground">临时</span>
          {auxArray.map((v, i) => (
            <div
              key={i}
              className="flex h-8 w-full max-w-[40px] items-center justify-center rounded-sm bg-muted/50 text-[10px] tabular-nums text-muted-foreground"
            >
              {v}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
