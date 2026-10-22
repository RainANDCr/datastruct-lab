/**
 * 链式结构共享工具：内存快照与链表逻辑状态的构建。
 *
 * 被单链表、链栈、链队列、双向链表、循环链表复用，
 * 统一产出 MemorySnapshot（栈帧指针变量 ↔ 堆内存结点）与 LinkedListState。
 */
import type { MemorySnapshot, StackVariable } from '@/engine/types';
import type { LinkedListKind, LinkedListState, LinkedNodeState } from './types';

/** 堆内存结点（数据域 + 指针域） */
export interface HeapNode {
  address: string;
  value: number;
  next: string | null;
  prev?: string | null;
  freed?: boolean;
}

/** 地址分配器：生成形如 0x100、0x110… 的堆地址 */
export function createAddrAllocator(start = 0x100, step = 0x10): () => string {
  let counter = start;
  return () => {
    const a = '0x' + counter.toString(16).toUpperCase();
    counter += step;
    return a;
  };
}

/** 构造栈帧指针变量（type 默认 Node*） */
export function ptrVar(name: string, pointsTo: string | null, type = 'Node*'): StackVariable {
  return { name, type, value: pointsTo ?? 'NULL', pointsTo: pointsTo ?? undefined };
}

/** 由结点映射构建内存快照（doubly 时结点含 prev 指针域） */
export function buildMemory(
  nodes: Map<string, HeapNode>,
  vars: StackVariable[],
  doubly = false,
): MemorySnapshot {
  const heap = [...nodes.values()].map((n) => {
    const fields = doubly
      ? [
          { name: 'prev', value: n.prev ?? 'NULL', pointsTo: n.prev ?? undefined },
          { name: 'data', value: String(n.value) },
          { name: 'next', value: n.next ?? 'NULL', pointsTo: n.next ?? undefined },
        ]
      : [
          { name: 'data', value: String(n.value) },
          { name: 'next', value: n.next ?? 'NULL', pointsTo: n.next ?? undefined },
        ];
    return { address: n.address, label: `Node(${n.value})`, fields, freed: n.freed };
  });
  return { stack: [{ function: 'main', variables: vars }], heap, links: [] };
}

export interface BuildListOptions {
  head: string | null;
  nodes: Map<string, HeapNode>;
  highlighted?: string[];
  status?: Record<string, 'default' | 'current' | 'comparing' | 'done' | 'error' | 'new'>;
  kind?: LinkedListKind;
  tailId?: string | null;
  headLabel?: string;
  tailLabel?: string;
}

/**
 * 由头指针 + 结点映射构建逻辑链表状态。
 * 从 head 出发沿 next 遍历，遇到 NULL 或再次回到已访问结点（循环链表）时停止，
 * 因此对循环链表能正确得到 [head, …, tail] 的有序节点。
 */
export function buildListState(opts: BuildListOptions): LinkedListState {
  const {
    head,
    nodes,
    highlighted = [],
    status = {},
    kind = 'singly',
    tailId,
    headLabel = 'head',
    tailLabel = 'tail',
  } = opts;

  const ordered: LinkedNodeState[] = [];
  const seen = new Set<string>();
  let cur = head;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const n = nodes.get(cur)!;
    ordered.push({ id: cur, value: n.value, nextId: n.next, prevId: n.prev ?? null });
    cur = n.next;
  }

  return {
    nodes: ordered,
    headId: head,
    tailId,
    kind,
    headLabel,
    tailLabel,
    highlighted,
    status,
  };
}
