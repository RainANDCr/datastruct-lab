/**
 * 拓扑排序（Topological Sort，Kahn 算法）
 *
 * 有向无环图（DAG / AOV 网），反复选取入度为 0 的顶点输出并删除其出边，
 * 直到输出全部顶点；若仍有顶点未输出，则图中存在环。
 * 顶点下方标注入度，底部展示入度为 0 的队列，顶部展示拓扑序。
 * 操作脚本：build ... ; edge A->B, ... ; topological。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 18 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { GraphState, GraphVertex, GraphEdge, GraphElemStatus } from './types';
import { snapshotGraph } from './types';
import { createInitialState, parseInput, type GraphCommand } from './traversal';

const cLines = [
  '#define MAXV 100',
  'int indegree[MAXV];',
  'int graph[MAXV][MAXV];',
  'int n;',
  'void topoSort() {',
  '    int q[MAXV], front = 0, rear = 0;',
  '    for (int i = 0; i < n; i++)',
  '        if (indegree[i] == 0) q[rear++] = i;',
  '    while (front < rear) {',
  '        int u = q[front++];',
  '        visit(u);',
  '        for (int v = 0; v < n; v++)',
  '            if (graph[u][v]) {',
  '                indegree[v]--;',
  '                if (indegree[v] == 0) q[rear++] = v;',
  '            }',
  '    }',
  '}',
];

const cppLines = [
  'const int MAXV = 100;',
  'vector<int> indegree(MAXV);',
  'vector<vector<int>> graph(MAXV);',
  'int n;',
  'void topoSort() {',
  '    queue<int> q;',
  '    for (int i = 0; i < n; i++)',
  '        if (indegree[i] == 0) q.push(i);',
  '    while (!q.empty()) {',
  '        int u = q.front(); q.pop();',
  '        visit(u);',
  '        for (int v = 0; v < n; v++)',
  '            if (graph[u][v]) {',
  '                indegree[v]--;',
  '                if (indegree[v] == 0) q.push(v);',
  '            }',
  '    }',
  '}',
];

const pseudoLines = [
  '常量 MAXV ← 100',
  '入度数组 indegree[0..MAXV-1]',
  '邻接矩阵 graph[MAXV][MAXV]',
  '顶点数 n',
  '函数 topoSort():',
  '    q ← 空队列',
  '    for i ← 0 to n-1 do',
  '        if indegree[i] = 0 then q.enqueue(i)',
  '    while q 非空 do',
  '        u ← q.dequeue()',
  '        visit(u)',
  '        for v ← 0 to n-1 do',
  '            if graph[u][v] = 1 then',
  '                indegree[v] ← indegree[v] - 1',
  '                if indegree[v] = 0 then q.enqueue(v)',
  '            end if',
  '    end while',
  '结束函数',
];

const LINES = {
  init: [7, 8],
  pop: [10, 11],
  decrement: [13, 14],
  enqueue: [15],
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

function* topologicalSteps(input: GraphCommand[]): Generator<AlgorithmStep<GraphState>> {
  const vertices: Record<string, GraphVertex> = {};
  const edges: Record<string, GraphEdge> = {};
  let directed = false;

  const indegree = new Map<string, number>();
  const processed = new Set<string>();
  const order: string[] = [];

  const labelsOf = (): Record<string, string> => {
    const labels: Record<string, string> = {};
    for (const v of Object.keys(vertices)) {
      labels[v] = processed.has(v) ? '✓' : String(indegree.get(v) ?? 0);
    }
    return labels;
  };

  const build: Build = (highlightedV = [], highlightedE = [], currentV = {}, currentE = {}, labels, info, aux) => {
    const vertexStatus: Record<string, GraphElemStatus> = {};
    for (const v of processed) vertexStatus[v] = 'done';
    Object.assign(vertexStatus, currentV);
    const edgeStatus: Record<string, GraphElemStatus> = {};
    Object.assign(edgeStatus, currentE);
    const snap = snapshotGraph(vertices, edges);
    return { vertices: snap.vertices, edges: snap.edges, directed, highlightedVertices: highlightedV, highlightedEdges: highlightedE, vertexStatus, edgeStatus, visitOrder: [...order], vertexLabels: labels, info, aux };
  };

  yield {
    id: 'init',
    description: '初始状态：空图',
    state: build([], [], {}, {}, {}, {}, { label: '队列', ids: [] }),
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
        state: build([], [], {}, {}, {}, {}, { label: '队列', ids: [] }),
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
        description: '已添加有向边',
        state: build([], [], {}, {}, {}, {}, { label: '队列', ids: [] }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 边数: Object.keys(edges).length },
      };
    } else if (cmd.op === 'topological') {
      indegree.clear();
      processed.clear();
      order.length = 0;
      for (const v of Object.keys(vertices)) indegree.set(v, 0);
      for (const e of Object.values(edges)) if (e.directed) indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);

      const out = new Map<string, string[]>();
      for (const v of Object.keys(vertices)) out.set(v, []);
      for (const e of Object.values(edges)) if (e.directed) out.get(e.from)?.push(e.to);
      for (const list of out.values()) list.sort();

      const zeroIn = Object.keys(vertices).filter((v) => (indegree.get(v) ?? 0) === 0).sort();
      const queue: string[] = [...zeroIn];

      yield {
        id: 'topo-init',
        description: `初始化入度：入度为 0 的顶点 ${zeroIn.join(', ') || '（无）'} 入队`,
        state: build([], [], {}, {}, labelsOf(), { 入度0顶点: zeroIn.join(', ') || '无' }, { label: '队列', ids: [...queue] }),
        highlightedElements: [],
        highlightedLines: [...LINES.init],
        variables: { 队列: queue.join(', ') },
      };

      while (queue.length) {
        const u = queue.shift() as string;
        order.push(u);
        processed.add(u);
        yield {
          id: `topo-pop-${u}`,
          description: `出队顶点 ${u}，加入拓扑序`,
          state: build([u], [], { [u]: 'current' }, {}, labelsOf(), { 当前: u }, { label: '队列', ids: [...queue] }),
          highlightedElements: [`v-${u}`],
          highlightedLines: [...LINES.pop],
          variables: { 出队: u, 拓扑序: order.join(' → ') },
        };

        const decEdges: string[] = [];
        for (const v of out.get(u) ?? []) {
          const d = (indegree.get(v) ?? 0) - 1;
          indegree.set(v, d);
          decEdges.push(`${u}->${v}`);
          if (d === 0) queue.push(v);
        }
        queue.sort();

        if (decEdges.length > 0) {
          const decEdgeStatus: Record<string, GraphElemStatus> = {};
          for (const eid of decEdges) decEdgeStatus[eid] = 'current';
          yield {
            id: `topo-dec-${u}`,
            description: `删除 ${u} 的出边，后继顶点入度减 1：${decEdges.join(', ')}`,
            state: build([], decEdges, { [u]: 'done' }, decEdgeStatus, labelsOf(), {}, { label: '队列', ids: [...queue] }),
            highlightedElements: decEdges.map((eid) => `e-${eid}`),
            highlightedLines: [...LINES.decrement, ...LINES.enqueue],
            variables: { 入度更新: decEdges.join(', '), 队列: queue.join(', ') },
          };
        }
      }

      if (order.length === Object.keys(vertices).length) {
        yield {
          id: 'topo-done',
          description: `拓扑排序完成：${order.join(' → ')}`,
          state: build([], [], {}, {}, labelsOf(), { 结果: order.join(' → ') }, { label: '队列', ids: [] }),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: order.join(' → ') },
        };
      } else {
        yield {
          id: 'topo-cycle',
          description: `剩余 ${Object.keys(vertices).length - order.length} 个顶点未入队，图中存在环，无法拓扑排序`,
          state: build([], [], {}, {}, labelsOf(), { 结果: '存在环' }, { label: '队列', ids: [] }),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '存在环（不是 DAG）' },
        };
      }
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

export const topologicalModule: AlgorithmModule<GraphState, GraphCommand[]> = {
  meta: {
    id: 'graph.topological',
    name: '拓扑排序',
    nameEn: 'Topological Sort',
    chapter: 'graph',
    order: 9,
    summary: '反复选取入度为 0 的顶点输出，得到 DAG 的拓扑序。',
    coreIdea:
      '拓扑排序（Kahn 算法）维护每个顶点的入度，将所有入度为 0 的顶点入队；每次出队一个顶点加入拓扑序，并把它指向的后继顶点入度减 1，减到 0 就入队。若最终输出顶点数少于总顶点数，则说明存在环。',
    operationSteps: [
      '统计每个顶点的入度。',
      '入度为 0 的顶点入队。',
      '出队一个顶点加入拓扑序，其后继入度减 1。',
      '入度减到 0 的后继入队，重复直到队列为空。',
    ],
    useCases: ['课程先修关系', '任务调度 / 依赖排序', '编译依赖解析'],
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    pros: ['线性时间高效', '可检测图中是否有环'],
    cons: ['只适用于有向无环图（DAG）', '拓扑序可能不唯一'],
    examPoints: [
      '拓扑排序只适用于有向无环图。',
      'Kahn 算法：入度为 0 入队，出队减后继入度。',
      '若输出顶点数 < 总顶点数，则图中有环。',
    ],
    variableDocs: [
      { name: 'indegree', meaning: '每个顶点的入度' },
      { name: 'q', meaning: '入度为 0 的顶点队列' },
      { name: 'u', meaning: '当前出队的顶点' },
      { name: 'visit(u)', meaning: '输出（加入拓扑序）' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C ; edge A->B, A->C ; topological' },
    ],
    defaultInput: 'build A,B,C,D,E ; edge A->B, A->C, B->D, C->D, D->E ; topological',
    implemented: true,
    visualizer: 'graph',
  },
  generateSteps: topologicalSteps,
  parseInput,
  createInitialState,
};
