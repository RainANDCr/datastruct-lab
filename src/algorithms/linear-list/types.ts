/**
 * 线性结构（顺序表 / 链表 / 栈 / 队列）共享状态类型。
 */

/** 链表种类：单向 / 双向 / 循环 / 循环双向 */
export type LinkedListKind = 'singly' | 'doubly' | 'circular' | 'circular-doubly';

/** 链表逻辑节点 */
export interface LinkedNodeState {
  id: string;
  value: number;
  nextId: string | null;
  /** 前驱指针（双向链表用） */
  prevId?: string | null;
}

/** 链表逻辑状态（画布主视图） */
export interface LinkedListState {
  /** 按逻辑顺序排列的节点 */
  nodes: LinkedNodeState[];
  /** 头指针指向的节点 id */
  headId: string | null;
  /** 尾指针指向的节点 id（链队列 / 双向 / 循环链表用） */
  tailId?: string | null;
  /** 链表种类（决定箭头绘制方式） */
  kind?: LinkedListKind;
  /** 头指针标签（默认 "head"） */
  headLabel?: string;
  /** 尾指针标签（默认 "tail"） */
  tailLabel?: string;
  /** 高亮节点 id */
  highlighted: string[];
  /** 节点状态（用于着色） */
  status?: Record<string, 'default' | 'current' | 'comparing' | 'done' | 'error' | 'new'>;
}

/** 数组标记（栈顶 top / 队头 front / 队尾 rear 等） */
export interface ArrayMarker {
  label: string;
  index: number;
}

/** 数组类结构状态（顺序表 / 顺序栈 / 循环队列） */
export interface ArrayState {
  /** 元素（null 表示空位） */
  items: (number | null)[];
  /** 高亮下标（当前操作位置） */
  highlighted: number[];
  /** 指针标记 */
  markers: ArrayMarker[];
  /** 附加信息（length / top / front / rear 等） */
  info?: Record<string, string | number>;
}
