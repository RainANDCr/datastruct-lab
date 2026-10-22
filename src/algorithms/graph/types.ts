/**
 * 图与图遍历共享状态类型。
 */

export type GraphElemStatus = 'default' | 'current' | 'comparing' | 'done' | 'error' | 'new';

/** 图顶点 */
export interface GraphVertex {
  id: string;
}

/** 图边 */
export interface GraphEdge {
  id: string; // 如 "A-B"
  from: string;
  to: string;
  weight: number;
  directed: boolean;
}

/** 图可视化状态 */
export interface GraphState {
  vertices: Record<string, GraphVertex>;
  edges: Record<string, GraphEdge>;
  /** 是否为有向图 */
  directed: boolean;
  /** 高亮顶点 */
  highlightedVertices: string[];
  /** 高亮边 */
  highlightedEdges: string[];
  /** 顶点状态（着色） */
  vertexStatus?: Record<string, GraphElemStatus>;
  /** 边状态（着色） */
  edgeStatus?: Record<string, GraphElemStatus>;
  /** 访问顺序（顶点 id 序列） */
  visitOrder?: string[];
  /** 辅助结构（DFS 栈 / BFS 队列） */
  aux?: { label: string; ids: string[] };
  /** 顶点下方标注（如 Prim 的 key / Dijkstra 的 dist 值） */
  vertexLabels?: Record<string, string>;
  /** 信息面板（如最小生成树总权值 / 最短距离汇总） */
  info?: Record<string, string | number>;
  /** 矩阵展示（如 Floyd 的 dist 矩阵） */
  matrix?: {
    labels: string[];
    cells: (string | number)[][];
    /** 高亮的 cell 坐标（row, col） */
    highlightedCells?: { row: number; col: number }[];
  };
}

/** 构造无向边 id（a、b 按字典序排列） */
export function undirectedEdgeId(a: string, b: string): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * 深拷贝图顶点与边，生成不可变状态快照。
 *
 * 同 tree 的 snapshotNodes：生成器若在 yield 之间原地修改 vertices/edges
 * （如逐步 build 顶点、加边），collectSteps 一次性遍历后所有步骤会共享
 * 最终态，导致中间动画丢失。build 闭包应调用本函数生成独立副本。
 */
export function snapshotGraph(
  vertices: Record<string, GraphVertex>,
  edges: Record<string, GraphEdge>,
): { vertices: Record<string, GraphVertex>; edges: Record<string, GraphEdge> } {
  const v: Record<string, GraphVertex> = {};
  for (const id of Object.keys(vertices)) v[id] = { ...vertices[id] };
  const e: Record<string, GraphEdge> = {};
  for (const id of Object.keys(edges)) e[id] = { ...edges[id] };
  return { vertices: v, edges: e };
}
