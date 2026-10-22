/**
 * Kruskal 最小生成树（Minimum Spanning Tree）
 *
 * 带权无向图，将所有边按权升序排序，用并查集判断是否成环，
 * 依次选入不成环的最小权边，直到得到 n-1 条边的最小生成树。
 * 顶点下方标注并查集代表元（根），选中边绿色、成环丢弃的边红色。
 * 操作脚本：build ... ; edge A-B-1, ... ; kruskal。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 21 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { GraphState, GraphVertex, GraphEdge, GraphElemStatus } from './types';
import { snapshotGraph } from './types';
import { createInitialState, parseInput, type GraphCommand } from './traversal';

const cLines = [
  '#define MAXV 100',
  'typedef struct { int u, v, w; } Edge;',
  'Edge edges[MAXE];',
  'int parent[MAXV];',
  'int find(int x) {',
  '    if (parent[x] != x) parent[x] = find(parent[x]);',
  '    return parent[x];',
  '}',
  'void kruskal(int n, int m) {',
  '    for (int i = 0; i < n; i++) parent[i] = i;',
  '    sort(edges, edges + m, cmp);',
  '    int total = 0;',
  '    for (int i = 0; i < m; i++) {',
  '        int ru = find(edges[i].u);',
  '        int rv = find(edges[i].v);',
  '        if (ru != rv) {',
  '            parent[ru] = rv;',
  '            total += edges[i].w;',
  '        }',
  '    }',
  '}',
];

const cppLines = [
  'const int MAXV = 100;',
  'struct Edge { int u, v, w; };',
  'vector<Edge> edges;',
  'vector<int> parent(MAXV);',
  'int find(int x) {',
  '    if (parent[x] != x) parent[x] = find(parent[x]);',
  '    return parent[x];',
  '}',
  'void kruskal(int n) {',
  '    for (int i = 0; i < n; i++) parent[i] = i;',
  '    sort(edges.begin(), edges.end(), cmp);',
  '    int total = 0;',
  '    for (auto& e : edges) {',
  '        int ru = find(e.u);',
  '        int rv = find(e.v);',
  '        if (ru != rv) {',
  '            parent[ru] = rv;',
  '            total += e.w;',
  '        }',
  '    }',
  '}',
];

const pseudoLines = [
  '常量 MAXV ← 100',
  '边结构 Edge { u, v, w }',
  '边数组 edges[]',
  '并查集 parent[0..MAXV-1]',
  '函数 find(x):',
  '    if parent[x] ≠ x then parent[x] ← find(parent[x])',
  '    return parent[x]',
  '结束函数',
  '函数 kruskal(n, m):',
  '    for i ← 0 to n-1 do parent[i] ← i',
  '    将 edges 按权重升序排序',
  '    total ← 0',
  '    for i ← 0 to m-1 do',
  '        ru ← find(edges[i].u)',
  '        rv ← find(edges[i].v)',
  '        if ru ≠ rv then',
  '            parent[ru] ← rv',
  '            total ← total + edges[i].w',
  '        end if',
  '    end for',
  '结束函数',
];

const LINES = {
  init: [10],
  sort: [11],
  find: [14, 15],
  union: [16, 17, 18],
} as const;

type Build = (
  highlightedV?: string[],
  highlightedE?: string[],
  currentV?: Record<string, GraphElemStatus>,
  currentE?: Record<string, GraphElemStatus>,
  labels?: Record<string, string>,
  info?: Record<string, string | number>,
  aux?: { label: string; ids: string[] },
) => GraphState;

function* kruskalSteps(input: GraphCommand[]): Generator<AlgorithmStep<GraphState>> {
  const vertices: Record<string, GraphVertex> = {};
  const edges: Record<string, GraphEdge> = {};
  let directed = false;

  const parent = new Map<string, string>();
  const mstEdges: string[] = [];
  const rejectedEdges: string[] = [];
  let total = 0;

  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p !== x) parent.set(x, find(p));
    return parent.get(x)!;
  };

  const labelsOf = (): Record<string, string> => {
    const labels: Record<string, string> = {};
    for (const v of Object.keys(vertices)) labels[v] = find(v);
    return labels;
  };

  const build: Build = (highlightedV = [], highlightedE = [], currentV = {}, currentE = {}, labels, info, aux) => {
    const vertexStatus: Record<string, GraphElemStatus> = {};
    Object.assign(vertexStatus, currentV);
    const edgeStatus: Record<string, GraphElemStatus> = {};
    for (const eid of mstEdges) edgeStatus[eid] = 'done';
    for (const eid of rejectedEdges) edgeStatus[eid] = 'error';
    Object.assign(edgeStatus, currentE);
    const snap = snapshotGraph(vertices, edges);
    return { vertices: snap.vertices, edges: snap.edges, directed, highlightedVertices: highlightedV, highlightedEdges: highlightedE, vertexStatus, edgeStatus, vertexLabels: labels, info, aux };
  };

  yield {
    id: 'init',
    description: '初始状态：空图',
    state: build([], [], {}, {}, {}, {}, { label: '按权重升序的边', ids: [] }),
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
        state: build([], [], {}, {}, {}, {}, { label: '按权重升序的边', ids: [] }),
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
          const eid = `${e.from < e.to ? e.from : e.to}-${e.from < e.to ? e.to : e.from}`;
          edges[eid] = { id: eid, from: e.from, to: e.to, weight: e.weight, directed: false };
        }
      }
      yield {
        id: 'edged',
        description: '已添加边（含权重）',
        state: build([], [], {}, {}, {}, {}, { label: '按权重升序的边', ids: [] }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 边数: Object.keys(edges).length },
      };
    } else if (cmd.op === 'kruskal') {
      for (const v of Object.keys(vertices)) parent.set(v, v);
      mstEdges.length = 0;
      rejectedEdges.length = 0;
      total = 0;

      const sorted = Object.values(edges).sort((a, b) => a.weight - b.weight || a.id.localeCompare(b.id));
      const sortedLabels = sorted.map((e) => `${e.id}(${e.weight})`);

      yield {
        id: 'kruskal-init',
        description: `将所有 ${sorted.length} 条边按权重升序排序：${sortedLabels.join(' → ')}`,
        state: build([], [], {}, {}, labelsOf(), { 待选边数: sorted.length }, { label: '按权重升序的边', ids: [...sortedLabels] }),
        highlightedElements: [],
        highlightedLines: [...LINES.init, ...LINES.sort],
        variables: { 排序后: sortedLabels.join(' → ') },
      };

      for (let i = 0; i < sorted.length; i++) {
        const e = sorted[i];
        const remaining = sortedLabels.slice(i);
        yield {
          id: `kruskal-consider-${i}`,
          description: `考虑边 ${e.id}（权 ${e.weight}）`,
          state: build([], [e.id], {}, { [e.id]: 'current' }, labelsOf(), { 当前边: `${e.id}(${e.weight})` }, { label: '待处理边', ids: remaining }),
          highlightedElements: [`e-${e.id}`],
          highlightedLines: [...LINES.find],
          variables: { 当前边: `${e.id}(${e.weight})` },
        };

        const ru = find(e.from);
        const rv = find(e.to);
        if (ru !== rv) {
          parent.set(ru, rv);
          mstEdges.push(e.id);
          total += e.weight;
          yield {
            id: `kruskal-select-${i}`,
            description: `${e.from} 与 ${e.to} 不在同一集合（根 ${ru} ≠ ${rv}），选入：合并 ${ru} → ${rv}`,
            state: build([], [e.id], {}, { [e.id]: 'done' }, labelsOf(), { 总权值: total, 已选边数: mstEdges.length }, { label: '待处理边', ids: remaining }),
            highlightedElements: [`e-${e.id}`],
            highlightedLines: [...LINES.union],
            variables: { 选入: `${e.id}(${e.weight})`, 总权值: total },
          };
        } else {
          rejectedEdges.push(e.id);
          yield {
            id: `kruskal-reject-${i}`,
            description: `${e.from} 与 ${e.to} 已在同一集合（根 ${ru}），选入会成环，丢弃`,
            state: build([], [e.id], {}, { [e.id]: 'error' }, labelsOf(), { 总权值: total, 已选边数: mstEdges.length }, { label: '待处理边', ids: remaining }),
            highlightedElements: [`e-${e.id}`],
            highlightedLines: [...LINES.find],
            variables: { 丢弃: `${e.id}(${e.weight})` },
          };
        }
      }

      yield {
        id: 'kruskal-done',
        description: `Kruskal 完成：最小生成树边 ${mstEdges.join(', ')}，总权值 ${total}`,
        state: build([], mstEdges, {}, {}, labelsOf(), { 总权值: total, 边数: mstEdges.length }, { label: '待处理边', ids: [] }),
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

export const kruskalModule: AlgorithmModule<GraphState, GraphCommand[]> = {
  meta: {
    id: 'graph.kruskal',
    name: 'Kruskal 最小生成树',
    nameEn: "Kruskal's Minimum Spanning Tree",
    chapter: 'graph',
    order: 6,
    summary: '按边权升序选边，用并查集判环，生成最小生成树。',
    coreIdea:
      'Kruskal 算法将所有边按权升序排序，依次尝试选入：若边两端点已在同一并查集（会成环）则丢弃，否则选入并合并。重复直到选满 n-1 条边，即得总权值最小的生成树。',
    operationSteps: [
      '初始化并查集，每个顶点自成一类。',
      '将所有边按权重升序排序。',
      '依次取最小权边，用并查集判断两端点是否同根。',
      '不同根则选入并合并；同根则成环、丢弃。',
    ],
    useCases: ['最小生成树', '稀疏图求 MST', '网络连通成本最小化'],
    complexity: {
      time: { best: 'O(E log E)', average: 'O(E log E)', worst: 'O(E log E)' },
      space: 'O(V)',
    },
    pros: ['对稀疏图高效', '边排序后逻辑清晰', '易理解'],
    cons: ['需要边排序 O(E log E)', '只适用于无向图'],
    examPoints: [
      'Kruskal 从边排序入手，Prim 从点扩展入手。',
      '并查集用于判断选边是否成环。',
      'n 个顶点的最小生成树有 n-1 条边。',
    ],
    variableDocs: [
      { name: 'parent', meaning: '并查集父结点数组（路径压缩）' },
      { name: 'find(x)', meaning: '返回 x 所在集合的代表元（根）' },
      { name: 'total', meaning: '最小生成树总权值' },
      { name: 'ru / rv', meaning: '边两端点的代表元' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C ; edge A-B-1, B-C-2 ; kruskal' },
    ],
    defaultInput: 'build A,B,C,D ; edge A-B-1, B-C-2, C-D-3, A-C-4, B-D-5 ; kruskal',
    implemented: true,
    visualizer: 'graph',
  },
  generateSteps: kruskalSteps,
  parseInput,
  createInitialState,
};
