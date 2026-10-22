/**
 * Prim 最小生成树（Minimum Spanning Tree）
 *
 * 带权无向图，从起点出发每次选取「与已选集合相连的最小权边」的顶点加入，
 * 逐步扩展生成最小生成树。顶点下方标注 key（到已选集合的最小边权），选中边高亮。
 * 操作脚本：build ... ; edge A-B-6, ... ; prim A。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 18 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { GraphState, GraphVertex, GraphEdge, GraphElemStatus } from './types';
import { snapshotGraph, undirectedEdgeId } from './types';
import { buildAdjacency, createInitialState, parseInput, type GraphCommand } from './traversal';

const cLines = [
  '#define INF 0x3f3f3f3f',
  '// Prim 最小生成树',
  'void prim(int g[MAXV][MAXV], int n, int start) {',
  '    int key[MAXV], inMST[MAXV], parent[MAXV];',
  '    for (int i = 0; i < n; i++) key[i] = INF, inMST[i] = 0;',
  '    key[start] = 0, parent[start] = -1;',
  '    for (int cnt = 0; cnt < n; cnt++) {',
  '        int u = -1;',
  '        for (int i = 0; i < n; i++)',
  '            if (!inMST[i] && (u == -1 || key[i] < key[u])) u = i;',
  '        inMST[u] = 1;',
  '        for (int v = 0; v < n; v++)',
  '            if (g[u][v] && !inMST[v] && g[u][v] < key[v]) {',
  '                key[v] = g[u][v];',
  '                parent[v] = u;',
  '            }',
  '    }',
  '}',
];

const cppLines = [
  '#define INF INT_MAX',
  '// Prim 最小生成树',
  'void prim(vector<vector<int>>& g, int n, int start) {',
  '    vector<int> key(n, INF), inMST(n, 0), parent(n, -1);',
  '    for (int i = 0; i < n; i++) key[i] = INF, inMST[i] = 0;',
  '    key[start] = 0, parent[start] = -1;',
  '    for (int cnt = 0; cnt < n; cnt++) {',
  '        int u = -1;',
  '        for (int i = 0; i < n; i++)',
  '            if (!inMST[i] && (u == -1 || key[i] < key[u])) u = i;',
  '        inMST[u] = 1;',
  '        for (int v = 0; v < n; v++)',
  '            if (g[u][v] && !inMST[v] && g[u][v] < key[v]) {',
  '                key[v] = g[u][v];',
  '                parent[v] = u;',
  '            }',
  '    }',
  '}',
];

const pseudoLines = [
  '常量 INF ← 无穷大',
  '// Prim 最小生成树',
  '函数 prim(g, n, start):',
  '    key, inMST, parent 数组',
  '    for i ← 0 to n-1 do key[i] ← INF, inMST[i] ← 0',
  '    key[start] ← 0, parent[start] ← -1',
  '    for cnt ← 0 to n-1 do',
  '        u ← -1',
  '        for i ← 0 to n-1 do',
  '            if inMST[i] = 0 且 (u = -1 或 key[i] < key[u]) then u ← i',
  '        inMST[u] ← 1',
  '        for v ← 0 to n-1 do',
  '            if g[u][v] > 0 且 inMST[v] = 0 且 g[u][v] < key[v] then',
  '                key[v] ← g[u][v]',
  '                parent[v] ← u',
  '            end if',
  '    end for',
  '结束函数',
];

const LINES = {
  initKey: [5, 6],
  selectU: [8, 9, 10],
  addU: 11,
  relax: [12, 13, 14, 15],
} as const;

const INF = Number.POSITIVE_INFINITY;

type Build = (highlightedV?: string[], highlightedE?: string[], currentV?: Record<string, GraphElemStatus>, currentE?: Record<string, GraphElemStatus>, labels?: Record<string, string>, info?: Record<string, string | number>) => GraphState;

function* primSteps(input: GraphCommand[]): Generator<AlgorithmStep<GraphState>> {
  const vertices: Record<string, GraphVertex> = {};
  const edges: Record<string, GraphEdge> = {};
  let directed = false;

  const key = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const inMST = new Set<string>();
  const mstEdges: string[] = [];

  const labelsOf = (): Record<string, string> => {
    const labels: Record<string, string> = {};
    for (const v of Object.keys(vertices)) {
      const k = key.get(v) ?? INF;
      labels[v] = inMST.has(v) ? '✓' : k === INF ? '∞' : String(k);
    }
    return labels;
  };

  const build: Build = (highlightedV = [], highlightedE = [], currentV = {}, currentE = {}, labels, info) => {
    const vertexStatus: Record<string, GraphElemStatus> = {};
    for (const id of inMST) vertexStatus[id] = 'done';
    Object.assign(vertexStatus, currentV);
    const edgeStatus: Record<string, GraphElemStatus> = {};
    for (const eid of mstEdges) edgeStatus[eid] = 'done';
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
    } else if (cmd.op === 'prim') {
      const start = cmd.start;
      if (!vertices[start]) {
        yield {
          id: 'prim-missing',
          description: `顶点 ${start} 不存在`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '顶点不存在' },
        };
        continue;
      }

      const adj = buildAdjacency(vertices, edges);
      for (const v of Object.keys(vertices)) {
        key.set(v, INF);
        parent.set(v, null);
      }
      key.set(start, 0);
      inMST.clear();
      mstEdges.length = 0;

      yield {
        id: 'prim-init',
        description: `Prim 从 ${start} 开始：key[${start}] = 0，其余为 ∞`,
        state: build([], [], {}, {}, labelsOf(), { 起点: start }),
        highlightedElements: [],
        highlightedLines: [...LINES.initKey],
        variables: { 起点: start },
      };

      for (let cnt = 0; cnt < Object.keys(vertices).length; cnt++) {
        let u: string | null = null;
        for (const v of Object.keys(vertices)) {
          if (!inMST.has(v) && (u === null || (key.get(v) ?? INF) < (key.get(u as string) ?? INF))) u = v;
        }
        if (u === null) break;

        yield {
          id: `prim-select-${u}`,
          description: `选取 key 最小的未入树顶点 ${u}（key = ${key.get(u) === INF ? '∞' : key.get(u)}）`,
          state: build([u], mstEdges, { [u]: 'current' }, {}, labelsOf(), { 当前: u }),
          highlightedElements: [`v-${u}`],
          highlightedLines: [...LINES.selectU],
          variables: { 选取: u, key: key.get(u) === INF ? '∞' : key.get(u) },
        };

        inMST.add(u);
        const p = parent.get(u);
        if (p !== null && p !== undefined) {
          mstEdges.push(undirectedEdgeId(u, p));
          yield {
            id: `prim-add-${u}`,
            description: `将顶点 ${u} 加入生成树，选中边 ${p}-${u}`,
            state: build([u], mstEdges, { [u]: 'done' }, {}, labelsOf(), { 加入: u }),
            highlightedElements: [`v-${u}`],
            highlightedLines: [LINES.addU],
            variables: { 加入: u, 边: `${p}-${u}` },
          };
        } else {
          yield {
            id: `prim-add-root-${u}`,
            description: `将起点 ${u} 加入生成树（无父结点）`,
            state: build([u], mstEdges, { [u]: 'done' }, {}, labelsOf(), { 加入: u }),
            highlightedElements: [`v-${u}`],
            highlightedLines: [LINES.addU],
            variables: { 加入: u },
          };
        }

        for (const nb of adj.get(u) ?? []) {
          if (!inMST.has(nb.to) && nb.weight < (key.get(nb.to) ?? INF)) {
            key.set(nb.to, nb.weight);
            parent.set(nb.to, u);
          }
        }
        yield {
          id: `prim-relax-${u}`,
          description: `松弛 ${u} 的邻接点：更新其 key 值`,
          state: build([], mstEdges, {}, {}, labelsOf(), {}),
          highlightedElements: [],
          highlightedLines: [...LINES.relax],
          variables: {},
        };
      }

      const total = mstEdges.reduce((sum, eid) => sum + edges[eid].weight, 0);
      yield {
        id: 'prim-done',
        description: `Prim 完成：最小生成树边 ${mstEdges.join(', ')}，总权值 ${total}`,
        state: build([], mstEdges, {}, {}, labelsOf(), { 总权值: total, 边数: mstEdges.length }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 总权值: total },
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

export const primModule: AlgorithmModule<GraphState, GraphCommand[]> = {
  meta: {
    id: 'graph.prim',
    name: 'Prim 最小生成树',
    nameEn: "Prim's Minimum Spanning Tree",
    chapter: 'graph',
    order: 5,
    summary: '从起点逐步选取最小权边扩展，生成最小生成树。',
    coreIdea:
      'Prim 算法维护 key[v]（v 到已选集合的最小边权），每次从未入树的顶点中选 key 最小的加入生成树，并松弛其邻接点。重复 n 次即可得到总权值最小的生成树。',
    operationSteps: [
      '初始化 key[起点]=0，其余为 ∞。',
      '每轮选取 key 最小且未入树的顶点 u。',
      '将 u 加入生成树，选中 parent[u]-u 这条边。',
      '松弛 u 的邻接点：若边权小于其 key，则更新 key 与 parent。',
    ],
    useCases: ['最小生成树', '网络布线 / 成本最小化', '聚类'],
    complexity: {
      time: { best: 'O(V²) 邻接矩阵', average: 'O((V+E)log V) 堆优化', worst: 'O(V²)' },
      space: 'O(V)',
    },
    pros: ['适用于稠密图', '与 Dijkstra 结构相似，易学'],
    cons: ['朴素实现 O(V²)', '只适用于连通无向图'],
    examPoints: [
      'Prim 每次选「已选集合相连的最小权边」的顶点。',
      'Prim 与 Kruskal 都求最小生成树，Prim 从点扩展、Kruskal 从边排序。',
      'n 个顶点的最小生成树有 n-1 条边。',
    ],
    variableDocs: [
      { name: 'key', meaning: '顶点到已选集合的最小边权' },
      { name: 'inMST', meaning: '顶点是否已入生成树' },
      { name: 'parent', meaning: '顶点在生成树中的父结点' },
      { name: 'u', meaning: '当前选取的顶点' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C ; edge A-B-2, B-C-3 ; prim A' },
    ],
    defaultInput: 'build A,B,C,D ; edge A-B-1, A-C-4, B-C-2, B-D-5, C-D-3 ; prim A',
    implemented: true,
    visualizer: 'graph',
  },
  generateSteps: primSteps,
  parseInput,
  createInitialState,
};
