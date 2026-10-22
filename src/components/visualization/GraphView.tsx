import { Fragment } from 'react';
import type { GraphState } from '@/algorithms/graph/types';
import { useElementSize } from '@/hooks/useElementSize';
import { COLORS } from '@/utils/colors';

interface GraphViewProps {
  state: GraphState;
}

function elemColor(status?: string): string {
  switch (status) {
    case 'new':
      return COLORS.comparing;
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

const NODE_R = 18;

/**
 * 图视图：顶点按圆形布局均匀分布，边用连线（有向图带箭头）+ 权重标签。
 * 展示顶点/边的高亮与状态着色，以及访问顺序与辅助栈/队列。
 */
export function GraphView({ state }: GraphViewProps) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const { vertices, edges, directed, highlightedVertices, highlightedEdges, vertexStatus, edgeStatus, visitOrder, aux, vertexLabels, info, matrix } = state;

  const ids = Object.keys(vertices);
  const n = ids.length;

  const cx = Math.max(width, 280) / 2;
  const cy = Math.max(height, 280) / 2;
  const R = Math.max(40, Math.min(cx, cy) - 56);

  const posOf = (id: string) => {
    const idx = ids.indexOf(id);
    const angle = -Math.PI / 2 + (2 * Math.PI * idx) / Math.max(n, 1);
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  };

  return (
    <div ref={ref} className="flex h-full w-full flex-col">
      {/* 信息面板 */}
      {info && Object.keys(info).length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 px-3 py-2">
          {Object.entries(info).map(([k, v]) => (
            <span key={k} className="rounded-md bg-muted px-2 py-0.5 text-xs">
              <span className="text-muted-foreground">{k}</span>
              <span className="mx-1 text-muted-foreground/50">=</span>
              <span className="font-mono-code font-semibold">{v}</span>
            </span>
          ))}
        </div>
      )}

      {/* 距离矩阵（Floyd） */}
      {matrix && (
        <div className="overflow-x-auto px-3 py-2">
          <table className="mx-auto border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="px-1.5 py-1 text-muted-foreground">dist</th>
                {matrix.labels.map((l) => (
                  <th key={l} className="px-2 py-1 font-semibold text-foreground">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.cells.map((row, i) => (
                <tr key={i}>
                  <td className="px-1.5 py-1 font-semibold text-foreground">{matrix.labels[i]}</td>
                  {row.map((cell, j) => {
                    const hl = matrix.highlightedCells?.some((c) => c.row === i && c.col === j);
                    return (
                      <td
                        key={j}
                        className={
                          'px-2 py-1 font-mono-code ' + (hl ? 'bg-yellow-500/25 font-bold text-foreground' : 'text-foreground/80')
                        }
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 访问顺序 */}
      {visitOrder && visitOrder.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2">
          <span className="shrink-0 text-xs text-muted-foreground">访问顺序</span>
          <span className="text-xs text-muted-foreground/50">→</span>
          {visitOrder.map((v, i) => (
            <span key={`${v}-${i}`} className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono-code text-xs text-foreground">
              {v}
            </span>
          ))}
        </div>
      )}

      {/* 图 */}
      <div className="min-h-0 flex-1">
        <svg width="100%" height="100%" className="block">
          <defs>
            <marker id="graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-foreground" />
            </marker>
          </defs>

          {n === 0 ? (
            <text x={cx} y={cy} textAnchor="middle" fontSize={13} className="fill-muted-foreground">
              空图（请先 build 顶点或添加 edge）
            </text>
          ) : (
            <Fragment>
              {/* 边 */}
              {Object.values(edges).map((e) => {
                const p1 = posOf(e.from);
                const p2 = posOf(e.to);
                const color = elemColor(edgeStatus?.[e.id]);
                const isHl = highlightedEdges.includes(e.id);
                const mx = (p1.x + p2.x) / 2;
                const my = (p1.y + p2.y) / 2;
                return (
                  <g key={e.id}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={color}
                      strokeWidth={isHl ? 3 : 2}
                      markerEnd={directed ? 'url(#graph-arrow)' : undefined}
                    />
                    <text
                      x={mx}
                      y={my - 6}
                      textAnchor="middle"
                      fontSize={11}
                      className="fill-muted-foreground font-semibold"
                    >
                      {e.weight !== 1 ? e.weight : ''}
                    </text>
                  </g>
                );
              })}

              {/* 顶点 */}
              {ids.map((id) => {
                const p = posOf(id);
                const color = elemColor(vertexStatus?.[id]);
                const isHl = highlightedVertices.includes(id);
                return (
                  <g key={id}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={NODE_R}
                      className="fill-card"
                      stroke={color}
                      strokeWidth={isHl ? 3 : 2}
                    />
                    <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={14} className="fill-foreground font-semibold">
                      {id}
                    </text>
                    {vertexLabels?.[id] !== undefined && (
                      <text x={p.x} y={p.y + NODE_R + 15} textAnchor="middle" fontSize={11} className="fill-muted-foreground font-mono">
                        {vertexLabels[id]}
                      </text>
                    )}
                  </g>
                );
              })}
            </Fragment>
          )}
        </svg>
      </div>

      {/* 辅助结构 */}
      {aux && (
        <div className="flex items-center gap-1.5 border-t px-3 py-2">
          <span className="shrink-0 text-xs text-muted-foreground">{aux.label}</span>
          <span className="text-xs text-muted-foreground/50">[</span>
          {aux.ids.length === 0 ? (
            <span className="text-xs text-muted-foreground">空</span>
          ) : (
            aux.ids.map((v, i) => (
              <span key={`${v}-${i}`} className="rounded bg-muted px-1.5 py-0.5 font-mono-code text-xs">
                {v}
              </span>
            ))
          )}
          <span className="text-xs text-muted-foreground/50">]</span>
        </div>
      )}
    </div>
  );
}
