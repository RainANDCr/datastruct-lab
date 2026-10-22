import type { MemorySnapshot } from '@/engine/types';
import { useElementSize } from '@/hooks/useElementSize';

const STACK_Y = 10;
const STACK_H = 74;
const HEAP_TITLE_Y = 108;
const HEAP_Y = 122;
const HEAP_H = 92;
const VAR_W = 120;
const OBJ_W = 128;
const GAP = 14;

/**
 * 内存结构视图：展示 C/C++ 中「栈帧局部指针变量 ↔ 堆内存节点」的关系。
 * 核心特色组件：指针变量用蓝色高亮，next 指针域指向下一节点。
 */
export function MemoryView({ snapshot }: { snapshot: MemorySnapshot }) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const stack = snapshot.stack[0];
  const vars = stack?.variables ?? [];
  const heap = snapshot.heap;

  const contentW = Math.max(width, 320);
  const heapW = Math.max(heap.length * (OBJ_W + GAP) + 20, 200);
  const svgW = Math.max(contentW, heapW);
  const svgH = HEAP_Y + HEAP_H + 20;

  const addrX = new Map<string, number>();
  heap.forEach((o, i) => {
    addrX.set(o.address, 10 + i * (OBJ_W + GAP) + OBJ_W / 2);
  });

  const pointerVars = vars.filter((v) => v.pointsTo);

  return (
    <div ref={ref} className="h-full w-full overflow-x-auto">
      <svg width={svgW} height={svgH} className="block">
        <defs>
          <marker
            id="mem-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
          </marker>
        </defs>

        {/* 栈帧 */}
        <rect
          x={10}
          y={STACK_Y}
          width={Math.max(contentW - 20, 200)}
          height={STACK_H}
          rx={8}
          className="fill-muted/40 stroke-border"
          strokeWidth={1}
        />
        <text x={22} y={STACK_Y + 18} fontSize={12} className="fill-muted-foreground">
          {stack?.function ?? 'main'} 栈帧 · 局部变量
        </text>
        {vars.map((v, i) => {
          const x = 22 + i * VAR_W;
          const isPtr = Boolean(v.pointsTo);
          return (
            <g key={v.name}>
              <rect
                x={x}
                y={STACK_Y + 28}
                width={VAR_W - 14}
                height={36}
                rx={6}
                className="fill-card stroke-border"
                strokeWidth={1}
              />
              <text x={x + 8} y={STACK_Y + 44} fontSize={11} className="fill-muted-foreground">
                {v.name} · {v.type}
              </text>
              <text
                x={x + 8}
                y={STACK_Y + 59}
                fontSize={11}
                className={isPtr ? 'fill-primary font-semibold' : 'fill-foreground'}
              >
                {v.value}
              </text>
            </g>
          );
        })}

        {/* 堆 */}
        <text x={10} y={HEAP_TITLE_Y} fontSize={12} className="fill-muted-foreground">
          堆内存 · 动态分配结点
        </text>
        {heap.map((o, i) => {
          const x = 10 + i * (OBJ_W + GAP);
          return (
            <g key={o.address}>
              <rect
                x={x}
                y={HEAP_Y}
                width={OBJ_W}
                height={HEAP_H}
                rx={8}
                className={o.freed ? 'fill-muted/30 stroke-border' : 'fill-card stroke-border'}
                strokeWidth={1}
                strokeDasharray={o.freed ? '4 3' : undefined}
              />
              <text
                x={x + 8}
                y={HEAP_Y + 18}
                fontSize={11}
                className="fill-muted-foreground font-mono"
              >
                {o.address}
              </text>
              <text x={x + OBJ_W / 2} y={HEAP_Y + 36} fontSize={12} textAnchor="middle" className="fill-foreground font-semibold">
                {o.label}
              </text>
              {o.fields.map((f, j) => {
                const fy = HEAP_Y + 56 + j * 16;
                const isPtr = Boolean(f.pointsTo);
                return (
                  <g key={f.name}>
                    <text x={x + 8} y={fy} fontSize={10.5} className="fill-muted-foreground">
                      {f.name}
                    </text>
                    <text
                      x={x + OBJ_W - 8}
                      y={fy}
                      fontSize={10.5}
                      textAnchor="end"
                      className={isPtr ? 'fill-primary font-semibold' : 'fill-foreground'}
                    >
                      {f.value}
                    </text>
                  </g>
                );
              })}
              {o.freed && (
                <text
                  x={x + OBJ_W / 2}
                  y={HEAP_Y + HEAP_H - 8}
                  fontSize={10}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                >
                  已释放 free
                </text>
              )}
            </g>
          );
        })}

        {/* 箭头：栈指针变量 → 堆对象 */}
        {pointerVars.map((v) => {
          const targetX = addrX.get(v.pointsTo as string);
          if (targetX === undefined) return null;
          const idx = vars.indexOf(v);
          const sx = 22 + idx * VAR_W + (VAR_W - 14) / 2;
          const sy = STACK_Y + STACK_H;
          const d = `M ${sx} ${sy} C ${sx} ${sy + 24}, ${targetX} ${HEAP_Y - 20}, ${targetX} ${HEAP_Y}`;
          return (
            <path key={`var-${v.name}`} d={d} fill="none" className="stroke-primary" strokeWidth={1.5} markerEnd="url(#mem-arrow)" />
          );
        })}

        {/* 箭头：堆字段 next → 下一节点 */}
        {heap.map((o) =>
          o.fields
            .filter((f) => f.pointsTo)
            .map((f) => {
              const targetX = addrX.get(f.pointsTo as string);
              if (targetX === undefined) return null;
              const srcX = addrX.get(o.address) as number;
              const sy = HEAP_Y + 54;
              const d = `M ${srcX} ${sy} C ${srcX + 60} ${sy}, ${targetX - 60} ${sy}, ${targetX - 64} ${HEAP_Y}`;
              return (
                <path key={`${o.address}-${f.name}`} d={d} fill="none" className="stroke-foreground" strokeWidth={1.5} markerEnd="url(#mem-arrow)" />
              );
            }),
        )}
      </svg>
    </div>
  );
}
