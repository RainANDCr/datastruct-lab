/**
 * Floyd 最短路径（All-Pairs Shortest Path）
 *
 * 多源最短路径，三重循环动态规划：dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])。
 * 依次以每个顶点 k 作为中转点，松弛所有 (i,j) 路径，最终得到任意两点间最短距离。
 * 顶部展示 dist 距离矩阵（高亮正在更新的 cell），顶点下方标注，中转顶点黄色高亮。
 * 操作脚本：build ... ; edge A-B-3, ... ; floyd。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 18 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { GraphState, GraphVertex, GraphEdge, GraphElemStatus } from './types';
import { snapshotGraph } from './types';
import { createInitialState, parseInput, type GraphCommand } from './traversal';

const cLines = [
  '#define INF 0x3f3f3f3f',
  'int dist[MAXV][MAXV];',
  'void floyd(int n) {',
  '    for (int k = 0; k < n; k++)',
  '        for (int i = 0; i < n; i++)',
  '            for (int j = 0; j < n; j++)',
  '                if (dist[i][k] + dist[k][j] < dist[i][j])',
  '                    dist[i][j] = dist[i][k] + dist[k][j];',
  '}',
  '// 初始化：',
  '// dist[i][j] = w(i,j) 若有边；',
  '// dist[i][j] = 0 若 i == j；',
  '// dist[i][j] = INF 否则。',
  '// 初始化：',
  '// 无负权回路时 Floyd 正确。',
  '// 时间复杂度 O(V^3)。',
];

const cppLines = [
  '#define INF INT_MAX',
  'vector<vector<int>> dist(MAXV, vector<int>(MAXV));',
  'void floyd(int n) {',
  '    for (int k = 0; k < n; k++)',
  '        for (int i = 0; i < n; i++)',
  '            for (int j = 0; j < n; j++)',
  '                if (dist[i][k] + dist[k][j] < dist[i][j])',
  '                    dist[i][j] = dist[i][k] + dist[k][j];',
  '}',
  '// 初始化：',
  '// dist[i][j] = w(i,j) 若有边；',
  '// dist[i][j] = 0 若 i == j；',
  '// dist[i][j] = INF 否则。',
  '// 初始化：',
  '// 无负权回路时 Floyd 正确。',
  '// 时间复杂度 O(V^3)。',
];

const pseudoLines = [
  '常量 INF ← 无穷大',
  '距离矩阵 dist[0..MAXV-1][0..MAXV-1]',
  '函数 floyd(n):',
  '    for k ← 0 to n-1 do',
  '        for i ← 0 to n-1 do',
  '            for j ← 0 to n-1 do',
  '                if dist[i][k] + dist[k][j] < dist[i][j] then',
  '                    dist[i][j] ← dist[i][k] + dist[k][j]',
  '                end if',
  '            end for',
  '        end for',
  '    end for',
  '结束函数',
  '初始化：dist[i][i] ← 0，有边取权，无边取 INF',
  '中转顶点 k 依次尝试松弛所有路径',
  '最终得到任意两点间最短距离',
  '时间复杂度 O(V^3)',
  '无负权回路时结果正确',
];

const LINES = {
  loop: [4, 5, 6],
  check: [7],
  update: [8],
} as const;

const INF = Number.POSITIVE_INFINITY;

type Build = (
  highlightedV?: string[],
  highlightedE?: string[],
  currentV?: Record<string, GraphElemStatus>,
  currentE?: Record<string, GraphElemStatus>,
  labels?: Record<string, string>,
  info?: Record<string, string | number>,
  matrix?: GraphState['matrix'],
) => GraphState;

function* floydSteps(input: GraphCommand[]): Generator<AlgorithmStep<GraphState>> {
  const vertices: Record<string, GraphVertex> = {};
  const edges: Record<string, GraphEdge> = {};
  let directed = false;

  const build: Build = (highlightedV = [], highlightedE = [], currentV = {}, currentE = {}, labels, info, matrix) => {
    const vertexStatus: Record<string, GraphElemStatus> = {};
    Object.assign(vertexStatus, currentV);
    const edgeStatus: Record<string, GraphElemStatus> = {};
    Object.assign(edgeStatus, currentE);
    const snap = snapshotGraph(vertices, edges);
    return { vertices: snap.vertices, edges: snap.edges, directed, highlightedVertices: highlightedV, highlightedEdges: highlightedE, vertexStatus, edgeStatus, vertexLabels: labels, info, matrix };
  };

  yield {
    id: 'init',
    description: '初始状态：空图',
    state: build([], [], {}, {}, {}, {}, undefined),
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
        state: build([], [], {}, {}, {}, {}, undefined),
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
        state: build([], [], {}, {}, {}, {}, undefined),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 边数: Object.keys(edges).length },
      };
    } else if (cmd.op === 'floyd') {
      const ids = Object.keys(vertices).sort();
      const n = ids.length;
      const idx = new Map(ids.map((v, i) => [v, i]));

      // 初始化 dist 矩阵
      const dist: number[][] = Array.from({ length: n }, () => Array(n).fill(INF));
      for (let i = 0; i < n; i++) dist[i][i] = 0;
      for (const e of Object.values(edges)) {
        const i = idx.get(e.from)!;
        const j = idx.get(e.to)!;
        dist[i][j] = Math.min(dist[i][j], e.weight);
        if (!e.directed) dist[j][i] = Math.min(dist[j][i], e.weight);
      }

      const matrixOf = (highlightedCells?: { row: number; col: number }[]): GraphState['matrix'] => ({
        labels: ids,
        cells: dist.map((row) => row.map((v) => (v === INF ? '∞' : v))),
        highlightedCells,
      });

      yield {
        id: 'floyd-init',
        description: `初始化距离矩阵：dist[i][i]=0，有边取权，无边为 ∞`,
        state: build([], [], {}, {}, {}, { 顶点数: n }, matrixOf()),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 顶点数: n },
      };

      for (let k = 0; k < n; k++) {
        yield {
          id: `floyd-k-${k}`,
          description: `以顶点 ${ids[k]} 作为中转点 k，松弛所有 (i,j) 路径`,
          state: build([ids[k]], [], { [ids[k]]: 'current' }, {}, {}, { 中转点: ids[k] }, matrixOf()),
          highlightedElements: [`v-${ids[k]}`],
          highlightedLines: [...LINES.loop],
          variables: { 中转点: ids[k] },
        };

        for (let i = 0; i < n; i++) {
          if (dist[i][k] === INF) continue;
          for (let j = 0; j < n; j++) {
            if (dist[k][j] === INF) continue;
            const nd = dist[i][k] + dist[k][j];
            if (nd < dist[i][j]) {
              dist[i][j] = nd;
              yield {
                id: `floyd-update-${k}-${i}-${j}`,
                description: `dist[${ids[i]}][${ids[j]}] = dist[${ids[i]}][${ids[k]}] + dist[${ids[k]}][${ids[j]}] = ${dist[i][k]} + ${dist[k][j]} = ${nd}`,
                state: build([ids[k], ids[i], ids[j]], [], { [ids[k]]: 'current', [ids[i]]: 'comparing', [ids[j]]: 'comparing' }, {}, {}, { 更新: `${ids[i]}→${ids[j]}` }, matrixOf([{ row: i, col: j }])),
                highlightedElements: [`v-${ids[i]}`, `v-${ids[j]}`],
                highlightedLines: [...LINES.check, ...LINES.update],
                variables: { 更新: `dist[${ids[i]}][${ids[j]}] = ${nd}` },
              };
            }
          }
        }
      }

      const summary = ids.map((v) => `${v} 到各点: ${dist[idx.get(v)!].map((d, i) => `${ids[i]}:${d === INF ? '∞' : d}`).join(' ')}`).join('；');
      yield {
        id: 'floyd-done',
        description: `Floyd 完成，任意两点间最短距离：${summary}`,
        state: build([], [], {}, {}, {}, { 完成: '✓' }, matrixOf()),
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

export const floydModule: AlgorithmModule<GraphState, GraphCommand[]> = {
  meta: {
    id: 'graph.floyd',
    name: 'Floyd 最短路径',
    nameEn: "Floyd's All-Pairs Shortest Path",
    chapter: 'graph',
    order: 8,
    summary: '三重循环动态规划，求任意两点间最短距离。',
    coreIdea:
      'Floyd 算法维护 dist[i][j]（i 到 j 的当前最短距离），依次以每个顶点 k 作为中转点，若 dist[i][k]+dist[k][j] 更短则更新 dist[i][j]。三重循环结束后得到任意两点间最短距离。',
    operationSteps: [
      '初始化 dist：dist[i][i]=0，有边取权，无边为 ∞。',
      '依次以每个顶点 k 作为中转点。',
      '对所有 (i,j) 检查 dist[i][k]+dist[k][j] 是否更短。',
      '更短则更新 dist[i][j]，重复直到结束。',
    ],
    useCases: ['多源最短路径', '任意两点距离', '传递闭包'],
    complexity: {
      time: { best: 'O(V³)', average: 'O(V³)', worst: 'O(V³)' },
      space: 'O(V²)',
    },
    pros: ['求所有点对最短路', '可处理负权边（无负环）', '代码极简'],
    cons: ['O(V³) 较慢', '空间 O(V²)', '不能处理负权回路'],
    examPoints: [
      'Floyd 用三重循环，中转点 k 在最外层。',
      'dist[i][j] = min(dist[i][j], dist[i][k]+dist[k][j])。',
      '可处理负权边，但不能有负权回路。',
    ],
    variableDocs: [
      { name: 'dist', meaning: '任意两点间当前最短距离矩阵' },
      { name: 'k', meaning: '当前中转顶点' },
      { name: 'i / j', meaning: '起点 / 终点' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C ; edge A-B-2, B-C-3 ; floyd' },
    ],
    defaultInput: 'build A,B,C,D ; edge A-B-3, A-C-8, A-D-2, B-C-1, C-D-1 ; floyd',
    implemented: true,
    visualizer: 'graph',
  },
  generateSteps: floydSteps,
  parseInput,
  createInitialState,
};
