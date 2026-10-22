/**
 * 图遍历共享逻辑：输入解析、图构建、DFS / BFS 遍历生成器与参考代码。
 * 被 graph.dfs 与 graph.bfs 两个模块复用。
 *
 * 操作脚本：
 *   build A,B,C,D,E,F        —— 创建顶点
 *   edge A-B, A-C, B-D-3     —— 添加边（A-B 无向，A->B 有向，A-B-3 带权重）
 *   dfs A / bfs A            —— 从顶点 A 开始遍历
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 28 行）。
 */
import type { AlgorithmStep, ParseResult } from '@/engine/types';
import type { GraphState, GraphVertex, GraphEdge, GraphElemStatus } from './types';
import { snapshotGraph, undirectedEdgeId } from './types';

/* ---------------- 参考代码（28 行，三语言对齐） ---------------- */
export const cLines = [
  '#define MAXV 100',
  'int graph[MAXV][MAXV];     // 邻接矩阵',
  'int n;                      // 顶点数',
  'int visited[MAXV];',
  '',
  '// 深度优先搜索 DFS',
  'void dfs(int v) {',
  '    visited[v] = 1;',
  '    visit(v);',
  '    for (int w = 0; w < n; w++)',
  '        if (graph[v][w] && !visited[w])',
  '            dfs(w);',
  '}',
  '',
  '// 广度优先搜索 BFS',
  'void bfs(int start) {',
  '    int q[MAXV], front = 0, rear = 0;',
  '    q[rear++] = start; visited[start] = 1;',
  '    while (front < rear) {',
  '        int v = q[front++];',
  '        visit(v);',
  '        for (int w = 0; w < n; w++)',
  '            if (graph[v][w] && !visited[w]) {',
  '                visited[w] = 1;',
  '                q[rear++] = w;',
  '            }',
  '    }',
  '}',
];

export const cppLines = [
  'const int MAXV = 100;',
  'int graph[MAXV][MAXV];      // 邻接矩阵',
  'int n;                       // 顶点数',
  'vector<int> visited(MAXV);',
  '',
  '// 深度优先搜索 DFS',
  'void dfs(int v) {',
  '    visited[v] = 1;',
  '    visit(v);',
  '    for (int w = 0; w < n; w++)',
  '        if (graph[v][w] && !visited[w])',
  '            dfs(w);',
  '}',
  '',
  '// 广度优先搜索 BFS',
  'void bfs(int start) {',
  '    queue<int> q;',
  '    q.push(start); visited[start] = 1;',
  '    while (!q.empty()) {',
  '        int v = q.front(); q.pop();',
  '        visit(v);',
  '        for (int w = 0; w < n; w++)',
  '            if (graph[v][w] && !visited[w]) {',
  '                visited[w] = 1;',
  '                q.push(w);',
  '            }',
  '    }',
  '}',
];

export const pseudoLines = [
  '常量 MAXV ← 100',
  '邻接矩阵 graph[MAXV][MAXV]',
  '顶点数 n',
  '访问标记 visited[0..MAXV-1]',
  '',
  '// 深度优先搜索 DFS',
  '函数 dfs(v):',
  '    visited[v] ← 1',
  '    visit(v)',
  '    for w ← 0 to n-1 do',
  '        if graph[v][w] = 1 且 visited[w] = 0 then',
  '            dfs(w)',
  '结束函数',
  '',
  '// 广度优先搜索 BFS',
  '函数 bfs(start):',
  '    q ← 空队列',
  '    q.enqueue(start), visited[start] ← 1',
  '    while q 非空 do',
  '        v ← q.dequeue()',
  '        visit(v)',
  '        for w ← 0 to n-1 do',
  '            if graph[v][w] = 1 且 visited[w] = 0 then',
  '                visited[w] ← 1',
  '                q.enqueue(w)',
  '            end if',
  '    end while',
  '结束函数',
];

const LINES = {
  dfsVisit: [8, 9],
  dfsLoop: [10, 11, 12],
  bfsInit: [17, 18],
  bfsVisit: [20, 21],
  bfsLoop: [22, 23, 24, 25],
} as const;

/* ---------------- 命令解析 ---------------- */
interface ParsedEdge {
  from: string;
  to: string;
  weight: number;
  directed: boolean;
}
type Command =
  | { op: 'build'; labels: string[] }
  | { op: 'edge'; edges: ParsedEdge[] }
  | { op: 'dfs' | 'bfs' | 'prim' | 'dijkstra'; start: string }
  | { op: 'kruskal' }
  | { op: 'topological' }
  | { op: 'floyd' }
  | { op: 'critical-path' };
export type GraphCommand = Command;

function parseEdge(token: string): ParsedEdge | null {
  const directed = token.includes('->');
  const sep = directed ? '->' : '-';
  const idx = token.indexOf(sep);
  if (idx <= 0) return null;
  const from = token.slice(0, idx).trim();
  const rest = token.slice(idx + sep.length);
  const restParts = rest.split('-').map((s) => s.trim());
  const to = restParts[0];
  if (!from || !to) return null;
  let weight = 1;
  if (restParts.length > 1) {
    weight = Number(restParts[restParts.length - 1]);
    if (!Number.isFinite(weight)) return null;
  }
  return { from, to, weight, directed };
}

export function parseInput(raw: string): ParseResult<Command[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 build A,B,C ; edge A-B, A-C ; dfs A）' };
  const parts = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  const commands: Command[] = [];
  for (const part of parts) {
    const m = part.match(/^(\S+)\s*(.*)$/);
    if (!m) continue;
    const cmd = m[1].toLowerCase();
    const rest = m[2].trim();
    if (cmd === 'build') {
      const labels = rest.split(/[\s,，]+/).filter(Boolean);
      if (labels.length === 0) return { ok: false, error: '"build" 需要顶点列表（如 build A,B,C）' };
      commands.push({ op: 'build', labels });
    } else if (cmd === 'edge' || cmd === 'edges') {
      const tokens = rest.split(/[，,]+/).map((s) => s.trim()).filter(Boolean);
      if (tokens.length === 0) return { ok: false, error: '"edge" 需要边列表（如 edge A-B, A-C）' };
      const edges: ParsedEdge[] = [];
      for (const t of tokens) {
        const e = parseEdge(t);
        if (!e) return { ok: false, error: `边 "${t}" 格式错误（应为 A-B 或 A->B 或 A-B-5）` };
        edges.push(e);
      }
      commands.push({ op: 'edge', edges });
    } else if (cmd === 'dfs' || cmd === 'bfs' || cmd === 'prim' || cmd === 'dijkstra') {
      if (!rest) return { ok: false, error: `"${cmd}" 需要起始顶点（如 ${cmd} A）` };
      commands.push({ op: cmd, start: rest });
    } else if (cmd === 'kruskal') {
      commands.push({ op: 'kruskal' });
    } else if (cmd === 'topological' || cmd === 'topo') {
      commands.push({ op: 'topological' });
    } else if (cmd === 'floyd') {
      commands.push({ op: 'floyd' });
    } else if (cmd === 'critical-path' || cmd === 'criticalpath' || cmd === 'cp') {
      commands.push({ op: 'critical-path' });
    } else {
      return { ok: false, error: `未知命令 "${cmd}"（支持 build / edge / dfs / bfs / prim / dijkstra / kruskal / topological / floyd / critical-path）` };
    }
  }
  if (commands.length === 0) return { ok: false, error: '命令为空' };
  return { ok: true, value: commands };
}

/* ---------------- 状态与邻接表 ---------------- */
export function createInitialState(): GraphState {
  return { vertices: {}, edges: {}, directed: false, highlightedVertices: [], highlightedEdges: [], vertexStatus: {}, edgeStatus: {}, visitOrder: [], aux: { label: 'DFS 栈', ids: [] } };
}

export function buildAdjacency(vertices: Record<string, GraphVertex>, edges: Record<string, GraphEdge>): Map<string, { to: string; edgeId: string; weight: number }[]> {
  const adj = new Map<string, { to: string; edgeId: string; weight: number }[]>();
  for (const v of Object.keys(vertices)) adj.set(v, []);
  for (const e of Object.values(edges)) {
    adj.get(e.from)?.push({ to: e.to, edgeId: e.id, weight: e.weight });
    if (!e.directed) adj.get(e.to)?.push({ to: e.from, edgeId: e.id, weight: e.weight });
  }
  for (const list of adj.values()) list.sort((a, b) => a.to.localeCompare(b.to));
  return adj;
}

type Build = (highlightedV?: string[], highlightedE?: string[], visitOrder?: string[], currentV?: Record<string, GraphElemStatus>, currentE?: Record<string, GraphElemStatus>, aux?: { label: string; ids: string[] }) => GraphState;

/* ---------------- 遍历生成器 ---------------- */
function* dfsSteps(start: string, adj: Map<string, { to: string; edgeId: string; weight: number }[]>, treeEdges: string[], build: Build): Generator<AlgorithmStep<GraphState>> {
  const visited = new Set<string>();
  const stack: string[] = [start];
  const order: string[] = [];
  visited.add(start);
  yield {
    id: 'dfs-start',
    description: `DFS 从顶点 ${start} 开始：${start} 入栈`,
    state: build([], [], order, {}, {}, { label: 'DFS 栈', ids: [...stack] }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 栈: stack.join(', ') },
  };
  while (stack.length) {
    const v = stack.pop() as string;
    order.push(v);
    yield {
      id: `dfs-visit-${v}`,
      description: `出栈并访问顶点 ${v}`,
      state: build([v], treeEdges, order, { [v]: 'current' }, {}, { label: 'DFS 栈', ids: [...stack] }),
      highlightedElements: [`v-${v}`],
      highlightedLines: [...LINES.dfsVisit],
      variables: { 当前: v, 访问序: order.join(' ') },
    };
    const neighbors = adj.get(v) ?? [];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const nb = neighbors[i];
      if (!visited.has(nb.to)) {
        visited.add(nb.to);
        stack.push(nb.to);
        treeEdges.push(nb.edgeId);
      }
    }
    if (stack.length) {
      yield {
        id: `dfs-push-${v}`,
        description: `将 ${v} 的未访问邻接点依次入栈`,
        state: build([], treeEdges, order, {}, {}, { label: 'DFS 栈', ids: [...stack] }),
        highlightedElements: [],
        highlightedLines: [...LINES.dfsLoop],
        variables: { 栈: stack.join(', ') },
      };
    }
  }
  yield {
    id: 'dfs-done',
    description: `DFS 完成：${order.join(' → ')}`,
    state: build([], treeEdges, order, {}, {}, { label: 'DFS 栈', ids: [] }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结果: order.join(' ') },
  };
}

function* bfsSteps(start: string, adj: Map<string, { to: string; edgeId: string; weight: number }[]>, treeEdges: string[], build: Build): Generator<AlgorithmStep<GraphState>> {
  const visited = new Set<string>();
  const queue: string[] = [start];
  const order: string[] = [];
  visited.add(start);
  yield {
    id: 'bfs-start',
    description: `BFS 从顶点 ${start} 开始：${start} 入队`,
    state: build([], [], order, {}, {}, { label: 'BFS 队列', ids: [...queue] }),
    highlightedElements: [],
    highlightedLines: [...LINES.bfsInit],
    variables: { 队列: queue.join(', ') },
  };
  while (queue.length) {
    const v = queue.shift() as string;
    order.push(v);
    yield {
      id: `bfs-visit-${v}`,
      description: `出队并访问顶点 ${v}`,
      state: build([v], treeEdges, order, { [v]: 'current' }, {}, { label: 'BFS 队列', ids: [...queue] }),
      highlightedElements: [`v-${v}`],
      highlightedLines: [...LINES.bfsVisit],
      variables: { 当前: v, 访问序: order.join(' ') },
    };
    for (const nb of adj.get(v) ?? []) {
      if (!visited.has(nb.to)) {
        visited.add(nb.to);
        queue.push(nb.to);
        treeEdges.push(nb.edgeId);
      }
    }
    if (queue.length) {
      yield {
        id: `bfs-enqueue-${v}`,
        description: `将 ${v} 的未访问邻接点依次入队`,
        state: build([], treeEdges, order, {}, {}, { label: 'BFS 队列', ids: [...queue] }),
        highlightedElements: [],
        highlightedLines: [...LINES.bfsLoop],
        variables: { 队列: queue.join(', ') },
      };
    }
  }
  yield {
    id: 'bfs-done',
    description: `BFS 完成：${order.join(' → ')}`,
    state: build([], treeEdges, order, {}, {}, { label: 'BFS 队列', ids: [] }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结果: order.join(' ') },
  };
}

/* ---------------- 主生成器 ---------------- */
export function* graphSteps(input: Command[]): Generator<AlgorithmStep<GraphState>> {
  const vertices: Record<string, GraphVertex> = {};
  const edges: Record<string, GraphEdge> = {};
  let directed = false;
  let treeEdges: string[] = [];

  const build: Build = (highlightedV = [], highlightedE = [], visitOrder = [], currentV = {}, currentE = {}, aux) => {
    const vertexStatus: Record<string, GraphElemStatus> = {};
    for (const id of visitOrder) vertexStatus[id] = 'done';
    Object.assign(vertexStatus, currentV);
    const edgeStatus: Record<string, GraphElemStatus> = {};
    for (const eid of treeEdges) edgeStatus[eid] = 'done';
    Object.assign(edgeStatus, currentE);
    const snap = snapshotGraph(vertices, edges);
    return { vertices: snap.vertices, edges: snap.edges, directed, highlightedVertices: highlightedV, highlightedEdges: highlightedE, vertexStatus, edgeStatus, visitOrder: [...visitOrder], aux };
  };

  yield {
    id: 'init',
    description: '初始状态：空图',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (const cmd of input) {
    if (cmd.op === 'build') {
      for (const label of cmd.labels) if (!vertices[label]) vertices[label] = { id: label };
      yield {
        id: 'built',
        description: `已创建顶点：${cmd.labels.join(', ')}（共 ${Object.keys(vertices).length} 个）`,
        state: build(),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 顶点数: Object.keys(vertices).length },
      };
    } else if (cmd.op === 'edge') {
      for (const e of cmd.edges) {
        if (!vertices[e.from]) vertices[e.from] = { id: e.from };
        if (!vertices[e.to]) vertices[e.to] = { id: e.to };
        if (e.directed) {
          directed = true;
          const eid = `${e.from}->${e.to}`;
          edges[eid] = { id: eid, from: e.from, to: e.to, weight: e.weight, directed: true };
        } else {
          const eid = undirectedEdgeId(e.from, e.to);
          edges[eid] = { id: eid, from: e.from, to: e.to, weight: e.weight, directed: false };
        }
      }
      yield {
        id: 'edged',
        description: `已添加边：${cmd.edges.map((e) => (e.directed ? `${e.from}->${e.to}` : `${e.from}-${e.to}`)).join(', ')}`,
        state: build(),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 边数: Object.keys(edges).length },
      };
    } else if (cmd.op === 'dfs' || cmd.op === 'bfs') {
      const adj = buildAdjacency(vertices, edges);
      if (!vertices[cmd.start]) {
        yield {
          id: `${cmd.op}-missing`,
          description: `顶点 ${cmd.start} 不存在，无法遍历`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '顶点不存在' },
        };
        continue;
      }
      treeEdges = [];
      if (cmd.op === 'dfs') yield* dfsSteps(cmd.start, adj, treeEdges, build);
      else yield* bfsSteps(cmd.start, adj, treeEdges, build);
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 顶点数: Object.keys(vertices).length, 边数: Object.keys(edges).length },
  };
}
