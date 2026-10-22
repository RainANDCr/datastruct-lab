/**
 * 邻接表（Adjacency List）
 *
 * 每个顶点维护一个邻接点链表，空间 O(V+E)，适合稀疏图。
 * 复用 GraphView，aux 展示各顶点的邻接表。
 * 操作脚本：build A,B,C,D ; edge A-B, A-C, B-D。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { GraphState, GraphVertex, GraphEdge } from './types';
import { snapshotGraph, undirectedEdgeId } from './types';
import { parseInput as graphParse, type GraphCommand } from './traversal';

const cLines = [
  '// 邻接表表示',
  'typedef struct ArcNode {',
  '    int adjvex; struct ArcNode* next;',
  '} ArcNode;',
  'typedef struct { ArcNode* firstarc; } VNode;',
  'VNode adjlist[MAXV];',
  '// 每个顶点一条链表，存放其邻接点。',
  '// 空间 O(V+E)，适合稀疏图。',
];

const cppLines = [
  '// 邻接表表示',
  'vector<list<int>> adjlist(MAXV);',
  '// 每个顶点一条链表，存放其邻接点。',
  '// 空间 O(V+E)，适合稀疏图。',
  '// 遍历某顶点的所有邻接点 O(度)。',
];

const pseudoLines = [
  '// 邻接表表示',
  '邻接表 adjlist[0..MAXV-1]',
  '// 每个顶点一条链表，存放其邻接点。',
  '// 空间 O(V+E)，适合稀疏图。',
  '// 遍历某顶点的所有邻接点 O(度)。',
];

function makeState(vertices: Record<string, GraphVertex>, edges: Record<string, GraphEdge>, directed: boolean, aux: { label: string; ids: string[] }): GraphState {
  const snap = snapshotGraph(vertices, edges);
  return { vertices: snap.vertices, edges: snap.edges, directed, highlightedVertices: [], highlightedEdges: [], vertexStatus: {}, edgeStatus: {}, aux };
}

function createInitialState(): GraphState {
  return makeState({}, {}, false, { label: '邻接表', ids: [] });
}

function* adjListSteps(input: GraphCommand[]): Generator<AlgorithmStep<GraphState>> {
  const vertices: Record<string, GraphVertex> = {};
  const edges: Record<string, GraphEdge> = {};
  let directed = false;

  const adjListOf = (): string[] => {
    const adj = new Map<string, string[]>();
    for (const v of Object.keys(vertices)) adj.set(v, []);
    for (const e of Object.values(edges)) {
      adj.get(e.from)?.push(e.to);
      if (!e.directed) adj.get(e.to)?.push(e.from);
    }
    return Object.keys(vertices).sort().map((v) => `${v} → ${[...(adj.get(v) ?? [])].sort().join(', ') || '∅'}`);
  };

  const build = (aux?: string[]): GraphState => makeState(vertices, edges, directed, { label: '邻接表', ids: aux ?? adjListOf() });

  yield {
    id: 'init',
    description: '初始状态：空图',
    state: build([]),
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
        state: build(),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 顶点数: Object.keys(vertices).length },
      };
    } else if (cmd.op === 'edge') {
      for (const e of cmd.edges) {
        if (!vertices[e.from]) vertices[e.from] = { id: e.from };
        if (!vertices[e.to]) vertices[e.to] = { id: e.to };
        if (e.directed) directed = true;
        const eid = e.directed ? `${e.from}->${e.to}` : undirectedEdgeId(e.from, e.to);
        edges[eid] = { id: eid, from: e.from, to: e.to, weight: e.weight, directed: e.directed };
      }
      yield {
        id: 'edged',
        description: `已添加边，更新邻接表`,
        state: build(),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 边数: Object.keys(edges).length },
      };
    }
  }

  yield {
    id: 'done',
    description: `邻接表构建完成（${Object.keys(vertices).length} 个顶点、${Object.keys(edges).length} 条边）`,
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 顶点数: Object.keys(vertices).length, 边数: Object.keys(edges).length },
  };
}

export const adjListModule: AlgorithmModule<GraphState, GraphCommand[]> = {
  meta: {
    id: 'graph.adj-list',
    name: '邻接表',
    nameEn: 'Adjacency List',
    chapter: 'graph',
    order: 2,
    summary: '每个顶点一条邻接点链表，空间 O(V+E)。',
    coreIdea: '邻接表为每个顶点维护一条链表，存放其所有邻接点。空间 O(V+E)，遍历某顶点邻接点 O(度)，适合稀疏图。',
    operationSteps: ['build 创建顶点。', 'edge 添加边。', '把邻接点加入对应顶点的链表。', '无向图两个方向都加入。'],
    useCases: ['稀疏图', 'DFS/BFS 遍历', '需要遍历邻接点'],
    complexity: {
      time: { best: 'O(度) 遍历邻接点', average: 'O(度)', worst: 'O(度)' },
      space: 'O(V+E)',
    },
    pros: ['空间 O(V+E)', '遍历邻接点高效'],
    cons: ['判断相邻需遍历链表', '实现较矩阵复杂'],
    examPoints: [
      '邻接表空间 O(V+E)。',
      '每个顶点一条邻接点链表。',
      '适合稀疏图。',
      '与邻接矩阵对比：矩阵适合稠密、邻接表适合稀疏。',
    ],
    variableDocs: [{ name: 'firstarc', meaning: '顶点第一条边（链表头）' }, { name: 'adjvex', meaning: '邻接点编号' }],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [{ key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C,D ; edge A-B, A-C, B-D' }],
    defaultInput: 'build A,B,C,D ; edge A-B, A-C, B-D, C-D',
    implemented: true,
    visualizer: 'graph',
  },
  generateSteps: adjListSteps,
  parseInput: graphParse,
  createInitialState,
};
