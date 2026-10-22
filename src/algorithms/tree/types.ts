/**
 * 树与二叉树共享状态类型。
 */

export type TreeNodeStatus = 'default' | 'current' | 'comparing' | 'done' | 'error' | 'new';

/** 二叉树节点 */
export interface TreeNodeState {
  id: string;
  value: number;
  /** 可选显示标签（普通树用字符标签） */
  label?: string;
  leftId: string | null;
  rightId: string | null;
}

/** 二叉树可视化状态 */
export interface TreeState {
  /** 节点映射（id → 节点），便于按 id 定位 */
  nodes: Record<string, TreeNodeState>;
  /** 根节点 id */
  rootId: string | null;
  /** 高亮节点 id（当前操作位置） */
  highlighted: string[];
  /** 节点状态（用于着色） */
  status?: Record<string, TreeNodeStatus>;
  /** 遍历访问顺序（节点 id 序列，逐步累积） */
  visitOrder?: string[];
  /** 辅助结构（递归栈 / 层序队列）展示 */
  aux?: { label: string; ids: string[] };
}

/** 由 id 列表映射为值列表（供渲染器显示访问序列） */
export function idsToValues(ids: string[], nodes: Record<string, TreeNodeState>): number[] {
  return ids.map((id) => nodes[id]?.value ?? NaN).filter((v) => !Number.isNaN(v));
}

/**
 * 深拷贝树节点映射，生成不可变状态快照。
 *
 * 关键约定：算法步骤的状态必须是「不可变快照」。若生成器在 yield 之间
 * 原地修改 nodes（如逐步连线、删除结点），由于 collectSteps 会一次性
 * 遍历完整生成器，所有步骤会共享同一个最终态对象，导致中间动画丢失。
 * 因此在 build 闭包中应调用本函数，让每一步持有独立的节点副本。
 */
export function snapshotNodes(nodes: Record<string, TreeNodeState>): Record<string, TreeNodeState> {
  const copy: Record<string, TreeNodeState> = {};
  for (const id of Object.keys(nodes)) {
    const n = nodes[id];
    copy[id] = { ...n };
  }
  return copy;
}
