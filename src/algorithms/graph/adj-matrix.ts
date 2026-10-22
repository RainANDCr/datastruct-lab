/**
 * 邻接矩阵（Adjacency Matrix）
 *
 * 用 n×n 矩阵表示图：matrix[i][j] = 1（或权值）表示有边 i→j。
 * 复用 MatrixView，展示顶点之间的邻接关系。
 * 操作脚本：build A,B,C,D ; edge A-B, A-C, B-D。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { MatrixState } from '../array/types';
import { parseInput as graphParse, type GraphCommand } from './traversal';
import type { GraphVertex, GraphEdge } from './types';
import { undirectedEdgeId } from './types';

const cLines = [
  '// 邻接矩阵表示',
  'int graph[MAXV][MAXV];',
  '// graph[i][j] = 1 表示有边 i->j（或权值）',
  '// 无向图则 graph[i][j] = graph[j][i] = 1。',
  '// 空间 O(V²)，适合稠密图。',
  '// 判断 i、j 是否相邻 O(1)。',
];

const cppLines = [
  '// 邻接矩阵表示',
  'vector<vector<int>> graph(MAXV, vector<int>(MAXV));',
  '// graph[i][j] = 1 表示有边 i->j（或权值）',
  '// 无向图则 graph[i][j] = graph[j][i] = 1。',
  '// 空间 O(V²)，适合稠密图。',
  '// 判断 i、j 是否相邻 O(1)。',
];

const pseudoLines = [
  '// 邻接矩阵表示',
  '邻接矩阵 graph[0..MAXV-1][0..MAXV-1]',
  '// graph[i][j] = 1 表示有边 i->j（或权值）',
  '// 无向图则 graph[i][j] = graph[j][i] = 1。',
  '// 空间 O(V²)，适合稠密图。',
  '// 判断 i、j 是否相邻 O(1)。',
];

function makeState(matrix: (number | null)[][], labels: string[], highlighted: [number, number][], info: Record<string, string | number>): MatrixState {
  return { rows: matrix.length, cols: matrix[0]?.length ?? 0, matrix: matrix.map((r) => [...r]), highlighted, labels, info };
}

function createInitialState(): MatrixState {
  return makeState([], [], [], { 提示: '请先 build 顶点、edge 边' });
}

function* adjMatrixSteps(input: GraphCommand[]): Generator<AlgorithmStep<MatrixState>> {
  const vertices: Record<string, GraphVertex> = {};
  const edges: Record<string, GraphEdge> = {};

  const labelsOf = () => Object.keys(vertices).sort();
  const matrixOf = (hl: [number, number][] = []): MatrixState => {
    const labels = labelsOf();
    const n = labels.length;
    const idx = new Map(labels.map((l, i) => [l, i]));
    const matrix: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (const e of Object.values(edges)) {
      const i = idx.get(e.from)!;
      const j = idx.get(e.to)!;
      matrix[i][j] = e.weight !== 1 ? e.weight : 1;
      if (!e.directed) matrix[j][i] = e.weight !== 1 ? e.weight : 1;
    }
    return makeState(matrix, labels, hl, { 顶点: n, 边: Object.keys(edges).length });
  };

  yield {
    id: 'init',
    description: '初始状态：空图',
    state: makeState([], [], [], { 提示: '请先 build 顶点、edge 边' }),
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
        state: matrixOf(),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 顶点数: Object.keys(vertices).length },
      };
    } else if (cmd.op === 'edge') {
      for (const e of cmd.edges) {
        if (!vertices[e.from]) vertices[e.from] = { id: e.from };
        if (!vertices[e.to]) vertices[e.to] = { id: e.to };
        const eid = e.directed ? `${e.from}->${e.to}` : undirectedEdgeId(e.from, e.to);
        edges[eid] = { id: eid, from: e.from, to: e.to, weight: e.weight, directed: e.directed };
        const labels = labelsOf();
        const i = labels.indexOf(e.from);
        const j = labels.indexOf(e.to);
        yield {
          id: `edge-${eid}`,
          description: `添加边 ${e.directed ? `${e.from}->${e.to}` : `${e.from}-${e.to}`}：matrix[${i}][${j}] = ${e.weight !== 1 ? e.weight : 1}${e.directed ? '' : '（对称）'}`,
          state: matrixOf([[i, j]]),
          highlightedElements: [`cell-${i}-${j}`],
          highlightedLines: [],
          variables: { 边: `${e.from}${e.directed ? '->' : '-'}${e.to}` },
        };
      }
    }
  }

  yield {
    id: 'done',
    description: '邻接矩阵构建完成',
    state: matrixOf(),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 顶点数: Object.keys(vertices).length, 边数: Object.keys(edges).length },
  };
}

export const adjMatrixModule: AlgorithmModule<MatrixState, GraphCommand[]> = {
  meta: {
    id: 'graph.adj-matrix',
    name: '邻接矩阵',
    nameEn: 'Adjacency Matrix',
    chapter: 'graph',
    order: 1,
    summary: 'n×n 矩阵表示边，判断相邻 O(1)，空间 O(V²)。',
    coreIdea: '邻接矩阵用 n×n 二维数组表示图：matrix[i][j] = 1（或权值）表示存在边 i→j，无向图则对称。判断两顶点是否相邻 O(1)，但空间 O(V²)，适合稠密图。',
    operationSteps: ['build 创建顶点。', 'edge 添加边。', '有边则 matrix[i][j] 置 1（或权值）。', '无向图对称赋值。'],
    useCases: ['稠密图', '需要快速判断相邻', 'Floyd 等算法'],
    complexity: {
      time: { best: 'O(1) 判相邻', average: 'O(1) 判相邻', worst: 'O(1) 判相邻' },
      space: 'O(V²)',
    },
    pros: ['判断相邻 O(1)', '实现简单'],
    cons: ['空间 O(V²) 浪费', '稀疏图效率低'],
    examPoints: [
      '邻接矩阵空间 O(V²)。',
      '无向图邻接矩阵对称。',
      '有向图 matrix[i][j] = 1 表示 i→j 有边。',
      '适合稠密图。',
    ],
    variableDocs: [{ name: 'graph[i][j]', meaning: '边 i→j 是否存在（或权值）' }],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [{ key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C,D ; edge A-B, A-C, B-D' }],
    defaultInput: 'build A,B,C,D ; edge A-B, A-C, B-D, C-D',
    implemented: true,
    visualizer: 'matrix',
  },
  generateSteps: adjMatrixSteps,
  parseInput: graphParse,
  createInitialState,
};
