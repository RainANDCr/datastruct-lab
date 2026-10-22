import { Fragment } from 'react';
import type { LinkedListState } from '@/algorithms/linear-list/types';
import type { MemorySnapshot } from '@/engine/types';
import { useElementSize } from '@/hooks/useElementSize';
import { COLORS } from '@/utils/colors';
import { MemoryView } from './MemoryView';

interface LinkedListViewProps {
  state: LinkedListState;
  memory?: MemorySnapshot;
}

function nodeColor(status?: string): string {
  switch (status) {
    case 'new':
      return COLORS.comparing;
    case 'current':
      return COLORS.current;
    case 'error':
      return COLORS.error;
    case 'done':
      return COLORS.done;
    default:
      return COLORS.default;
  }
}

const NODE_W = 46;
const NODE_H = 44;
const GAP = 64; // 节点中心距
const LIST_H = 172;
const nodeTopY = 52;
const CY = nodeTopY + NODE_H / 2; // 节点垂直中心
const CHIP_H = 28;
const HEAD_X = 10;
const HEAD_W = 48;
const FIRST_X = HEAD_X + HEAD_W + 30; // 第一个节点中心 x

/**
 * 链表视图（SVG）：上半部分为逻辑链表，下半部分为内存结构视图。
 * 支持单向 / 双向 / 循环三种链表，以及 head / tail 指针标签。
 */
export function LinkedListView({ state, memory }: LinkedListViewProps) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const { nodes, tailId, highlighted, status } = state;
  const kind = state.kind ?? 'singly';
  const headLabel = state.headLabel ?? 'head';
  const tailLabel = state.tailLabel ?? 'tail';

  const n = nodes.length;
  const xs = (i: number) => FIRST_X + i * GAP;
  const rightEdge = n > 0 ? xs(n - 1) + NODE_W / 2 : FIRST_X - NODE_W / 2;
  const needW = Math.max(rightEdge + 70, FIRST_X + 120);
  const svgW = Math.max(width, needW);

  // 尾指针 / NULL 终止符是否显示
  const showTailChip = tailId !== undefined && tailId !== null;
  const chipX = rightEdge + 24;

  const isDoubly = kind === 'doubly' || kind === 'circular-doubly';
  const isCircular = kind === 'circular' || kind === 'circular-doubly';

  const markerId = 'll-arrow';

  return (
    <div ref={ref} className="flex h-full w-full flex-col">
      {/* 逻辑链表 */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
        <svg width={svgW} height={LIST_H} className="block">
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-foreground" />
            </marker>
          </defs>

          {/* 头指针标签 */}
          <g>
            <rect
              x={HEAD_X}
              y={CY - CHIP_H / 2}
              width={HEAD_W}
              height={CHIP_H}
              rx={6}
              className="fill-primary/10 stroke-primary"
              strokeWidth={1.5}
            />
            <text
              x={HEAD_X + HEAD_W / 2}
              y={CY + 4}
              textAnchor="middle"
              fontSize={12}
              className="fill-primary font-semibold"
            >
              {headLabel}
            </text>
          </g>

          {n === 0 ? (
            <Fragment>
              <path
                d={`M ${HEAD_X + HEAD_W} ${CY} L ${FIRST_X} ${CY}`}
                fill="none"
                className="stroke-foreground"
                strokeWidth={1.5}
                markerEnd={`url(#${markerId})`}
              />
              <text x={FIRST_X + 8} y={CY + 4} fontSize={13} className="fill-muted-foreground">
                NULL
              </text>
            </Fragment>
          ) : (
            <Fragment>
              {/* head → 首节点 */}
              <path
                d={`M ${HEAD_X + HEAD_W} ${CY} L ${xs(0) - NODE_W / 2} ${CY}`}
                fill="none"
                className="stroke-foreground"
                strokeWidth={1.5}
                markerEnd={`url(#${markerId})`}
              />

              {/* 节点 */}
              {nodes.map((node, i) => {
                const color = nodeColor(status?.[node.id]);
                const isHl = highlighted.includes(node.id);
                return (
                  <g key={node.id}>
                    <rect
                      x={xs(i) - NODE_W / 2}
                      y={nodeTopY}
                      width={NODE_W}
                      height={NODE_H}
                      rx={8}
                      strokeWidth={isHl ? 3 : 2}
                      className="fill-card"
                      stroke={color}
                    />
                    <text
                      x={xs(i)}
                      y={CY + 5}
                      textAnchor="middle"
                      fontSize={16}
                      className="fill-foreground font-semibold"
                    >
                      {node.value}
                    </text>
                  </g>
                );
              })}

              {/* 相邻节点箭头 */}
              {nodes.slice(0, n - 1).map((_, i) => {
                const x1 = xs(i) + NODE_W / 2;
                const x2 = xs(i + 1) - NODE_W / 2;
                return (
                  <g key={`e${i}`}>
                    {isDoubly ? (
                      <Fragment>
                        <path
                          d={`M ${x1} ${CY - 8} L ${x2} ${CY - 8}`}
                          fill="none"
                          className="stroke-foreground"
                          strokeWidth={1.5}
                          markerEnd={`url(#${markerId})`}
                        />
                        <path
                          d={`M ${x2} ${CY + 8} L ${x1} ${CY + 8}`}
                          fill="none"
                          className="stroke-foreground"
                          strokeWidth={1.5}
                          markerEnd={`url(#${markerId})`}
                        />
                      </Fragment>
                    ) : (
                      <path
                        d={`M ${x1} ${CY} L ${x2} ${CY}`}
                        fill="none"
                        className="stroke-foreground"
                        strokeWidth={1.5}
                        markerEnd={`url(#${markerId})`}
                      />
                    )}
                  </g>
                );
              })}

              {/* 循环链表：尾结点 → 首结点回环 */}
              {isCircular && n > 1 && (
                <path
                  d={`M ${xs(n - 1) + NODE_W / 2} ${CY} C ${xs(n - 1) + NODE_W / 2 + 30} ${CY + 44}, ${xs(0)} ${CY + 44}, ${xs(0)} ${CY + NODE_H / 2}`}
                  fill="none"
                  className="stroke-orange-500"
                  strokeWidth={1.5}
                  markerEnd={`url(#${markerId})`}
                />
              )}

              {/* 循环双向链表：首结点 prev → 尾结点（反向回环） */}
              {kind === 'circular-doubly' && n > 1 && (
                <path
                  d={`M ${xs(0) - NODE_W / 2} ${CY} C ${xs(0) - NODE_W / 2 - 30} ${CY + 58}, ${xs(n - 1)} ${CY + 58}, ${xs(n - 1)} ${CY + NODE_H / 2}`}
                  fill="none"
                  className="stroke-blue-500"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  markerEnd={`url(#${markerId})`}
                />
              )}

              {/* 尾指针 / NULL 终止符 */}
              {isCircular ? (
                // 循环：尾指针标签（指向尾结点）
                showTailChip && (
                  <g>
                    <rect
                      x={chipX}
                      y={CY - CHIP_H / 2}
                      width={46}
                      height={CHIP_H}
                      rx={6}
                      className="fill-primary/10 stroke-primary"
                      strokeWidth={1.5}
                    />
                    <text x={chipX + 23} y={CY + 4} textAnchor="middle" fontSize={12} className="fill-primary font-semibold">
                      {tailLabel}
                    </text>
                    <path
                      d={`M ${chipX} ${CY} L ${xs(n - 1) + NODE_W / 2} ${CY}`}
                      fill="none"
                      className="stroke-foreground"
                      strokeWidth={1.5}
                      markerEnd={`url(#${markerId})`}
                    />
                  </g>
                )
              ) : showTailChip ? (
                // 有尾指针（链队列 / 双向链表）：尾指针标签 + 尾结点 next → NULL
                <g>
                  <rect
                    x={chipX}
                    y={CY - CHIP_H / 2 - 18}
                    width={46}
                    height={CHIP_H}
                    rx={6}
                    className="fill-primary/10 stroke-primary"
                    strokeWidth={1.5}
                  />
                  <text x={chipX + 23} y={CY - 14} textAnchor="middle" fontSize={12} className="fill-primary font-semibold">
                    {tailLabel}
                  </text>
                  <path
                    d={`M ${chipX + 23} ${CY - CHIP_H / 2} L ${xs(n - 1) + NODE_W / 2} ${CY - NODE_H / 2}`}
                    fill="none"
                    className="stroke-foreground"
                    strokeWidth={1.5}
                    markerEnd={`url(#${markerId})`}
                  />
                  <path
                    d={`M ${xs(n - 1) + NODE_W / 2} ${CY} L ${chipX + 23} ${CY}`}
                    fill="none"
                    className="stroke-foreground"
                    strokeWidth={1.5}
                    markerEnd={`url(#${markerId})`}
                  />
                  <text x={chipX + 23} y={CY + 4} textAnchor="middle" fontSize={12} className="fill-muted-foreground">
                    NULL
                  </text>
                </g>
              ) : (
                // 普通单向：next → NULL
                <g>
                  <path
                    d={`M ${xs(n - 1) + NODE_W / 2} ${CY} L ${chipX + 20} ${CY}`}
                    fill="none"
                    className="stroke-foreground"
                    strokeWidth={1.5}
                    markerEnd={`url(#${markerId})`}
                  />
                  <text x={chipX + 24} y={CY + 4} fontSize={13} className="fill-muted-foreground">
                    NULL
                  </text>
                </g>
              )}

              {/* 双向链表：head.prev → NULL（首节点下方标注） */}
              {kind === 'doubly' && (
                <g>
                  <path
                    d={`M ${xs(0) - NODE_W / 2} ${CY} L ${xs(0) - NODE_W / 2 - 14} ${CY + 20}`}
                    fill="none"
                    className="stroke-muted-foreground"
                    strokeWidth={1.2}
                    strokeDasharray="3 2"
                  />
                  <text x={xs(0) - NODE_W / 2 - 16} y={CY + 34} fontSize={11} textAnchor="end" className="fill-muted-foreground">
                    prev=NULL
                  </text>
                </g>
              )}
            </Fragment>
          )}
        </svg>
      </div>

      {/* 内存结构视图 */}
      <div className="h-[240px] shrink-0 border-t">
        {memory ? (
          <MemoryView snapshot={memory} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            （无内存快照）
          </div>
        )}
      </div>
    </div>
  );
}
