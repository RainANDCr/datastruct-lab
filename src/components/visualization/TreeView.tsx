import { Fragment } from 'react';
import type { TreeNodeState, TreeState } from '@/algorithms/tree/types';
import { idsToValues } from '@/algorithms/tree/types';
import { useElementSize } from '@/hooks/useElementSize';
import { COLORS } from '@/utils/colors';

interface TreeViewProps {
  state: TreeState;
}

function nodeColor(status?: string): string {
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

const X_GAP = 54;
const Y_GAP = 68;
const R = 18;
const PAD = 44;

interface Position {
  x: number;
  y: number;
}

/**
 * 推断根节点：当 rootId 为 null（树正在逐步构建、根尚未显式指定）时，
 * 找出所有「不是任何节点左右孩子」的节点作为根。
 * 这样构建过程的中间态（如哈夫曼合并、普通树连边）也能正确布局渲染。
 */
function inferRoots(nodes: Record<string, TreeNodeState>): string[] {
  const childIds = new Set<string>();
  for (const n of Object.values(nodes)) {
    if (n.leftId) childIds.add(n.leftId);
    if (n.rightId) childIds.add(n.rightId);
  }
  return Object.keys(nodes).filter((id) => !childIds.has(id));
}

/** 中序遍历布局：x 按中序递增（叶子从左到右不重叠），y 为深度 */
function computeLayout(rootId: string | null, nodes: Record<string, TreeNodeState>): Map<string, Position> {
  const pos = new Map<string, Position>();
  let counter = 0;
  const assign = (id: string | null, depth: number) => {
    if (id === null) return;
    const n = nodes[id];
    if (!n || pos.has(id)) return;
    assign(n.leftId, depth + 1);
    pos.set(id, { x: counter++, y: depth });
    assign(n.rightId, depth + 1);
  };

  // 显式根优先；否则从推断的根（森林）依次布局
  const roots = rootId ? [rootId] : inferRoots(nodes);
  let depthOffset = 0;
  for (const r of roots) {
    const before = pos.size;
    assign(r, depthOffset);
    // 多棵子树时，下一棵放在更深一层，避免与上一棵重叠
    if (pos.size > before) depthOffset += 1;
  }
  return pos;
}

/**
 * 树视图：动态中序布局，节点用圆表示，父子节点用连线连接。
 * 展示访问顺序（visitOrder）与辅助栈/队列（aux）。
 */
export function TreeView({ state }: TreeViewProps) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const { nodes, rootId, highlighted, status, visitOrder, aux } = state;

  const pos = computeLayout(rootId, nodes);
  const entries = [...pos.entries()];
  const maxX = entries.reduce((m, [, p]) => Math.max(m, p.x), 0);
  const maxY = entries.reduce((m, [, p]) => Math.max(m, p.y), 0);

  const svgW = Math.max(width, (maxX + 1) * X_GAP + PAD * 2);
  const svgH = (maxY + 1) * Y_GAP + PAD * 2;

  const px = (x: number) => PAD + x * X_GAP;
  const py = (y: number) => PAD + y * Y_GAP;

  return (
    <div ref={ref} className="flex h-full w-full flex-col">
      {/* 访问顺序 */}
      {visitOrder && visitOrder.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2">
          <span className="shrink-0 text-xs text-muted-foreground">访问顺序</span>
          <span className="text-xs text-muted-foreground/50">→</span>
          {idsToValues(visitOrder, nodes).map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono-code text-xs text-foreground"
            >
              {v}
            </span>
          ))}
        </div>
      )}

      {/* 树 */}
      <div className="min-h-0 flex-1 overflow-auto">
        <svg width={svgW} height={svgH} className="block">
          {/* 边 */}
          {entries.map(([id]) => {
            const n = nodes[id];
            const p = pos.get(id)!;
            return (
              <Fragment key={`e-${id}`}>
                {n.leftId && pos.has(n.leftId) && (
                  <line
                    x1={px(p.x)}
                    y1={py(p.y)}
                    x2={px(pos.get(n.leftId)!.x)}
                    y2={py(pos.get(n.leftId)!.y)}
                    className="stroke-border"
                    strokeWidth={1.5}
                  />
                )}
                {n.rightId && pos.has(n.rightId) && (
                  <line
                    x1={px(p.x)}
                    y1={py(p.y)}
                    x2={px(pos.get(n.rightId)!.x)}
                    y2={py(pos.get(n.rightId)!.y)}
                    className="stroke-border"
                    strokeWidth={1.5}
                  />
                )}
              </Fragment>
            );
          })}

          {/* 节点 */}
          {entries.map(([id]) => {
            const n = nodes[id];
            const p = pos.get(id)!;
            const color = nodeColor(status?.[id]);
            const isHl = highlighted.includes(id);
            return (
              <g key={id}>
                <circle
                  cx={px(p.x)}
                  cy={py(p.y)}
                  r={R}
                  className="fill-card"
                  stroke={color}
                  strokeWidth={isHl ? 3 : 2}
                />
                <text
                  x={px(p.x)}
                  y={py(p.y) + 5}
                  textAnchor="middle"
                  fontSize={14}
                  className="fill-foreground font-semibold"
                >
                  {n.label ?? n.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 辅助结构（递归栈 / 层序队列） */}
      {aux && (
        <div className="flex items-center gap-1.5 border-t px-3 py-2">
          <span className="shrink-0 text-xs text-muted-foreground">{aux.label}</span>
          <span className="text-xs text-muted-foreground/50">[</span>
          {aux.ids.length === 0 ? (
            <span className="text-xs text-muted-foreground">空</span>
          ) : (
            idsToValues(aux.ids, nodes).map((v, i) => (
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
