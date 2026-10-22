/**
 * Dijkstra 最短路径（Single-Source Shortest Path）
 *
 * 带权图，从源点出发每次选取 dist 最小且未确定的顶点，松弛其邻接点，
 * 逐步求得源点到各顶点的最短距离。顶点下方标注 dist 值。
 * 操作脚本：build ... ; edge A-B-4, ... ; dijkstra A。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 16 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { GraphState, GraphVertex, GraphEdge, GraphElemStatus } from './types';
import { snapshotGraph, undirectedEdgeId } from './types';
import { buildAdjacency, createInitialState, parseInput, type GraphCommand } from './traversal';

const cLines = [
  '#define INF 0x3f3f3f3f',
  '// Dijkstra 最短路径',
  'void dijkstra(int g[MAXV][MAXV], int n, int src) {',
  '    int dist[MAXV], done[MAXV];',
  '    for (int i = 0; i < n; i++) dist[i] = INF, done[i] = 0;',
  '    dist[src] = 0;',
  '    for (int cnt = 0; cnt < n; cnt++) {',
  '        int u = -1;',
  '        for (int i = 0; i < n; i++)',
  '            if (!done[i] && (u == -1 || dist[i] < dist[u])) u = i;',
  '        done[u] = 1;',
  '        for (int v = 0; v < n; v++)',
  '            if (g[u][v] && !done[v] && dist[u] + g[u][v] < dist[v])',
  '                dist[v] = dist[u] + g[u][v];',
  '    }',
  '}',
];

const cppLines = [
  '#define INF INT_MAX',
  '// Dijkstra 最短路径',
  'void dijkstra(vector<vector<int>>& g, int n, int src) {',
  '    vector<int> dist(n, INF), done(n, 0);',
  '    for (int i = 0; i < n; i++) dist[i] = INF, done[i] = 0;',
  '    dist[src] = 0;',
  '    for (int cnt = 0; cnt < n; cnt++) {',
  '        int u = -1;',
  '        for (int i = 0; i < n; i++)',
  '            if (!done[i] && (u == -1 || dist[i] < dist[u])) u = i;',
  '        done[u] = 1;',
  '        for (int v = 0; v < n; v++)',
  '            if (g[u][v] && !done[v] && dist[u] + g[u][v] < dist[v])',
  '                dist[v] = dist[u] + g[u][v];',
  '    }',
  '}',
];

const pseudoLines = [
  '常量 INF ← 无穷大',
  '// Dijkstra 最短路径',
  '函数 dijkstra(g, n, src):',
  '    dist, done 数组',
  '    for i ← 0 to n-1 do dist[i] ← INF, done[i] ← 0',
  '    dist[src] ← 0',
  '    for cnt ← 0 to n-1 do',
  '        u ← -1',
  '        for i ← 0 to n-1 do',
  '            if done[i] = 0 且 (u = -1 或 dist[i] < dist[u]) then u ← i',
  '        done[u] ← 1',
  '        for v ← 0 to n-1 do',
  '            if g[u][v] > 0 且 done[v] = 0 且 dist[u]+g[u][v] < dist[v] then',
  '                dist[v] ← dist[u] + g[u][v]',
  '    end for',
  '结束函数',
];

const LINES = {
  initDist: [5, 6],
  selectU: [8, 9, 10],
  doneU: 11,
  relax: [12, 13, 14],
} as const;

const INF = Number.POSITIVE_INFINITY;

type Build = (highlightedV?: string[], highlightedE?: string[], currentV?: Record<string, GraphElemStatus>, currentE?: Record<string, GraphElemStatus>, labels?: Record<string, string>, info?: Record<string, string | number>) => GraphState;

function* dijkstraSteps(input: GraphCommand[]): Generator<AlgorithmStep<GraphState>> {
  const vertices: Record<string, GraphVertex> = {};
  const edges: Record<string, GraphEdge> = {};
  let directed = false;

  const dist = new Map<string, number>();
  const done = new Set<string>();

  const labelsOf = (): Record<string, string> => {
    const labels: Record<string, string> = {};
    for (const v of Object.keys(vertices)) {
      const d = dist.get(v) ?? INF;
      labels[v] = done.has(v) ? '✓' : d === INF ? '∞' : String(d);
    }
    return labels;
  };

  const build: Build = (highlightedV = [], highlightedE = [], currentV = {}, currentE = {}, labels, info) => {
    const vertexStatus: Record<string, GraphElemStatus> = {};
    for (const id of done) vertexStatus[id] = 'done';
    Object.assign(vertexStatus, currentV);
    const edgeStatus: Record<string, GraphElemStatus> = {};
    Object.assign(edgeStatus, currentE);
    const snap = snapshotGraph(vertices, edges);
    return { vertices: snap.vertices, edges: snap.edges, directed, highlightedVertices: highlightedV, highlightedEdges: highlightedE, vertexStatus, edgeStatus, vertexLabels: labels, info };
  };

  yield {
    id: 'init',
    description: '初始状态：空图',
    state: build([], [], {}, {}, {}, {}),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (const cmd of input) {
    if (cmd.op === 'build') {
      for (const label of cmd.labels) if (!vertices[label]) vertices[label] = { id: label };
      yield {
        id: 'built',
        description: `已创建顶点：${cmd.labels.join(', ')}`,
        state: build([], [], {}, {}, {}, {}),
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
        description: '已添加边（含权重）',
        state: build([], [], {}, {}, {}, {}),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 边数: Object.keys(edges).length },
      };
    } else if (cmd.op === 'dijkstra') {
      const src = cmd.start;
      if (!vertices[src]) {
        yield {
          id: 'dij-missing',
          description: `顶点 ${src} 不存在`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '顶点不存在' },
        };
        continue;
      }

      const adj = buildAdjacency(vertices, edges);
      for (const v of Object.keys(vertices)) dist.set(v, INF);
      dist.set(src, 0);
      done.clear();

      yield {
        id: 'dij-init',
        description: `Dijkstra 从源点 ${src} 开始：dist[${src}] = 0，其余为 ∞`,
        state: build([], [], {}, {}, labelsOf(), { 源点: src }),
        highlightedElements: [],
        highlightedLines: [...LINES.initDist],
        variables: { 源点: src },
      };

      for (let cnt = 0; cnt < Object.keys(vertices).length; cnt++) {
        let u: string | null = null;
        for (const v of Object.keys(vertices)) {
          if (!done.has(v) && (u === null || (dist.get(v) ?? INF) < (dist.get(u as string) ?? INF))) u = v;
        }
        if (u === null) break;

        yield {
          id: `dij-select-${u}`,
          description: `选取 dist 最小且未确定的顶点 ${u}（dist = ${dist.get(u) === INF ? '∞' : dist.get(u)}）`,
          state: build([u], [], { [u]: 'current' }, {}, labelsOf(), { 当前: u }),
          highlightedElements: [`v-${u}`],
          highlightedLines: [...LINES.selectU],
          variables: { 选取: u, dist: dist.get(u) === INF ? '∞' : dist.get(u) },
        };

        done.add(u);
        yield {
          id: `dij-done-${u}`,
          description: `确定顶点 ${u} 的最短距离为 ${dist.get(u)}`,
          state: build([u], [], { [u]: 'done' }, {}, labelsOf(), { 确定: u }),
          highlightedElements: [`v-${u}`],
          highlightedLines: [LINES.doneU],
          variables: { 确定: u, dist: dist.get(u) },
        };

        for (const nb of adj.get(u) ?? []) {
          const nd = (dist.get(u) ?? INF) + nb.weight;
          if (!done.has(nb.to) && nd < (dist.get(nb.to) ?? INF)) {
            dist.set(nb.to, nd);
          }
        }
        yield {
          id: `dij-relax-${u}`,
          description: `松弛 ${u} 的邻接点：更新其 dist 值`,
          state: build([], [], {}, {}, labelsOf(), {}),
          highlightedElements: [],
          highlightedLines: [...LINES.relax],
          variables: {},
        };
      }

      const summary = Object.keys(vertices).map((v) => `${v}:${dist.get(v) === INF ? '∞' : dist.get(v)}`).join(' ');
      yield {
        id: 'dij-done',
        description: `Dijkstra 完成：最短距离 ${summary}`,
        state: build([], [], {}, {}, labelsOf(), { 源点: src }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 结果: summary },
      };
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };
}

export const dijkstraModule: AlgorithmModule<GraphState, GraphCommand[]> = {
  meta: {
    id: 'graph.dijkstra',
    name: 'Dijkstra 最短路径',
    nameEn: "Dijkstra's Shortest Path",
    chapter: 'graph',
    order: 7,
    summary: '从源点逐步确定最短距离，松弛邻接点，求单源最短路。',
    coreIdea:
      'Dijkstra 算法维护 dist[v]（源点到 v 的当前最短距离），每次选取 dist 最小且未确定的顶点 u 确定其最短距离，并松弛其邻接点：若 dist[u]+w(u,v) < dist[v]，则更新。要求边权非负。',
    operationSteps: [
      '初始化 dist[源点]=0，其余为 ∞。',
      '每轮选取 dist 最小且未确定的顶点 u。',
      '确定 u 的最短距离，标记 done。',
      '松弛 u 的邻接点：dist[v] = min(dist[v], dist[u]+w(u,v))。',
    ],
    useCases: ['单源最短路径', '地图导航', '网络路由'],
    complexity: {
      time: { best: 'O(V²) 邻接矩阵', average: 'O((V+E)log V) 堆优化', worst: 'O(V²)' },
      space: 'O(V)',
    },
    pros: ['求单源最短路高效', '贪心策略直观'],
    cons: ['不能处理负权边', '每次全局找最小 O(V²)'],
    examPoints: [
      'Dijkstra 采用贪心策略，要求边权非负。',
      'Dijkstra 与 Prim 结构相似：都每次选 dist/key 最小的顶点。',
      '堆优化后时间复杂度 O((V+E)log V)。',
    ],
    variableDocs: [
      { name: 'dist', meaning: '源点到各顶点的当前最短距离' },
      { name: 'done', meaning: '顶点最短距离是否已确定' },
      { name: 'u', meaning: '当前选取的顶点' },
      { name: 'src', meaning: '源点' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C ; edge A-B-4, B-C-3 ; dijkstra A' },
    ],
    defaultInput: 'build A,B,C,D,E ; edge A-B-4, A-C-2, B-C-1, B-D-5, C-D-8, C-E-10, D-E-2 ; dijkstra A',
    implemented: true,
    visualizer: 'graph',
  },
  generateSteps: dijkstraSteps,
  parseInput,
  createInitialState,
};
