import { useElementSize } from '@/hooks/useElementSize';
import { COMPLEXITY_CURVES } from '@/algorithms/intro/curves';
import type { ComplexityState } from '@/algorithms/intro/types';

const MARGIN = { top: 14, right: 16, bottom: 30, left: 48 };
const LEGEND_HEIGHT = 92;

/** 曲线末端标签做简单防重叠错位（纯函数，独立于组件） */
function placeCurveLabels(
  yOf: (count: number) => number,
  maxN: number,
): { label: string; color: string; y: number }[] {
  const labels = COMPLEXITY_CURVES.map((c) => ({
    label: c.label,
    color: c.color,
    y: yOf(c.fn(maxN)),
  })).sort((a, b) => a.y - b.y);

  let prevY = -Infinity;
  return labels.map((l) => {
    const y = l.y - prevY < 13 ? prevY + 13 : l.y;
    prevY = y;
    return { ...l, y };
  });
}

/**
 * 时间复杂度曲线图（对数纵坐标），随游标 n 高亮当前规模下的操作次数。
 */
export function ComplexityChart({ state }: { state: ComplexityState }) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const { n, maxN, counts } = state;

  const svgH = Math.max(height - LEGEND_HEIGHT, 140);
  const plotW = Math.max(width - MARGIN.left - MARGIN.right, 40);
  const plotH = Math.max(svgH - MARGIN.top - MARGIN.bottom, 40);

  const yMax = Math.log10(Math.max(maxN * maxN, 10)); // 纵轴最大数量级
  const xOf = (nn: number) => MARGIN.left + (nn / maxN) * plotW;
  const yOf = (count: number) =>
    MARGIN.top + plotH - (Math.log10(Math.max(count, 1)) / yMax) * plotH;

  const polylinePoints = (fn: (n: number) => number) =>
    Array.from({ length: maxN }, (_, i) => {
      const nn = i + 1;
      return `${xOf(nn).toFixed(1)},${yOf(fn(nn)).toFixed(1)}`;
    }).join(' ');

  // 纵轴刻度（10 的幂）
  const yTicks: number[] = [];
  for (let e = 0; e <= Math.ceil(yMax); e++) yTicks.push(e);

  // 曲线末端标签（防重叠后夹取在绘图区内）
  const placedLabels = placeCurveLabels(yOf, maxN).map((l) => ({
    ...l,
    y: Math.max(MARGIN.top + 4, Math.min(l.y, MARGIN.top + plotH - 4)),
  }));

  return (
    <div ref={ref} className="flex h-full w-full flex-col">
      <svg width={width} height={svgH} className="block shrink-0">
        {/* 网格与纵轴刻度 */}
        {yTicks.map((e) => {
          const y = yOf(Math.pow(10, e));
          return (
            <g key={e}>
              <line
                x1={MARGIN.left}
                y1={y}
                x2={MARGIN.left + plotW}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
                strokeDasharray={e === 0 ? undefined : '3 3'}
              />
              <text
                x={MARGIN.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                className="fill-muted-foreground"
              >
                {e === 0 ? '1' : `10^${e}`}
              </text>
            </g>
          );
        })}

        {/* 坐标轴 */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top + plotH}
          x2={MARGIN.left + plotW}
          y2={MARGIN.top + plotH}
          className="stroke-border"
          strokeWidth={1}
        />
        <line
          x1={MARGIN.left}
          y1={MARGIN.top}
          x2={MARGIN.left}
          y2={MARGIN.top + plotH}
          className="stroke-border"
          strokeWidth={1}
        />
        <text
          x={MARGIN.left + plotW / 2}
          y={svgH - 8}
          textAnchor="middle"
          fontSize={10}
          className="fill-muted-foreground"
        >
          输入规模 n（线性）→ {maxN}
        </text>
        <text
          x={12}
          y={MARGIN.top + plotH / 2}
          textAnchor="middle"
          fontSize={10}
          className="fill-muted-foreground"
          transform={`rotate(-90 12 ${MARGIN.top + plotH / 2})`}
        >
          操作次数（对数）
        </text>

        {/* 曲线 */}
        {COMPLEXITY_CURVES.map((c) => (
          <polyline
            key={c.key}
            points={polylinePoints(c.fn)}
            fill="none"
            stroke={c.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* 当前 n 竖线 + 取值点 */}
        <line
          x1={xOf(n)}
          y1={MARGIN.top}
          x2={xOf(n)}
          y2={MARGIN.top + plotH}
          className="stroke-foreground"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.5}
        />
        {COMPLEXITY_CURVES.map((c) => (
          <circle
            key={c.key}
            cx={xOf(n)}
            cy={yOf(c.fn(n))}
            r={4}
            fill={c.color}
            stroke="#fff"
            strokeWidth={1}
          />
        ))}

        {/* 曲线末端标签 */}
        {placedLabels.map((l) => (
          <text
            key={l.label}
            x={MARGIN.left + plotW - 6}
            y={l.y}
            textAnchor="end"
            fontSize={11}
            fontWeight={600}
            fill={l.color}
          >
            {l.label}
          </text>
        ))}
      </svg>

      {/* 图例 + 当前取值 */}
      <div className="flex h-[88px] shrink-0 flex-col justify-center gap-2 border-t px-3">
        <div className="text-xs text-muted-foreground">
          输入规模 <span className="font-mono-code font-semibold text-foreground">n = {n}</span>
          {' · '}操作次数（约）
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {COMPLEXITY_CURVES.map((c) => {
            const item = counts.find((x) => x.label === c.label);
            return (
              <span key={c.key} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-mono-code font-semibold tabular-nums">
                  {item ? item.value.toLocaleString() : '—'}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
