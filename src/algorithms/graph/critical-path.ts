/**
 * 关键路径（Critical Path，AOE 网）
 *
 * 有向无环带权图（AOE 网），边表示活动、权表示工期、顶点表示事件。
 * 先拓扑排序，再正推最早发生时间 ve、逆推最迟发生时间 vl，
 * 若活动 (u,v) 满足 ve[u] == vl[v] - w(u,v)，则为关键活动，构成关键路径。
 * 顶点下方标注 ve/vl，关键边绿色高亮。
 * 操作脚本：build ... ; edge A->B-2, ... ; critical-path（或 cp）。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 18 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import type { GraphState, GraphVertex, GraphEdge, GraphElemStatus } from './types';
import { snapshotGraph } from './types';
import { createInitialState, parseInput, type GraphCommand } from './traversal';

const cLines = [
  '#define MAXV 100',
  'int ve[MAXV], vl[MAXV];',
  'int graph[MAXV][MAXV];',
  'int topo[MAXV];        // 拓扑序',
  'void criticalPath(int n) {',
  '    for (int i = 0; i < n; i++) ve[i] = 0;',
  '    for (int t = 0; t < n; t++) {',
  '        int u = topo[t];',
  '        for (int v = 0; v < n; v++)',
  '            if (graph[u][v] && ve[u] + graph[u][v] > ve[v])',
  '                ve[v] = ve[u] + graph[u][v];',
  '    }',
  '    for (int i = 0; i < n; i++) vl[i] = ve[n-1];',
  '    for (int t = n-1; t >= 0; t--) {',
  '        int u = topo[t];',
  '        for (int v = 0; v < n; v++)',
  '            if (graph[u][v] && vl[v] - graph[u][v] < vl[u])',
  '                vl[u] = vl[v] - graph[u][v];',
  '    }',
  '}',
];

const cppLines = [
  'const int MAXV = 100;',
  'vector<int> ve(MAXV), vl(MAXV);',
  'vector<vector<int>> graph(MAXV);',
  'vector<int> topo;      // 拓扑序',
  'void criticalPath(int n) {',
  '    fill(ve.begin(), ve.end(), 0);',
  '    for (int t = 0; t < n; t++) {',
  '        int u = topo[t];',
  '        for (int v = 0; v < n; v++)',
  '            if (graph[u][v] && ve[u] + graph[u][v] > ve[v])',
  '                ve[v] = ve[u] + graph[u][v];',
  '    }',
  '    fill(vl.begin(), vl.end(), ve[n-1]);',
  '    for (int t = n-1; t >= 0; t--) {',
  '        int u = topo[t];',
  '        for (int v = 0; v < n; v++)',
  '            if (graph[u][v] && vl[v] - graph[u][v] < vl[u])',
  '                vl[u] = vl[v] - graph[u][v];',
  '    }',
  '}',
];

const pseudoLines = [
  '常量 MAXV ← 100',
  '最早发生时间 ve、最迟发生时间 vl 数组',
  '邻接矩阵 graph[MAXV][MAXV]',
  '拓扑序 topo[0..MAXV-1]',
  '函数 criticalPath(n):',
  '    for i ← 0 to n-1 do ve[i] ← 0',
  '    for t ← 0 to n-1 do  // 正推 ve',
  '        u ← topo[t]',
  '        for v ← 0 to n-1 do',
  '            if graph[u][v] > 0 且 ve[u]+graph[u][v] > ve[v] then',
  '                ve[v] ← ve[u] + graph[u][v]',
  '            end if',
  '    for i ← 0 to n-1 do vl[i] ← ve[n-1]',
  '    for t ← n-1 downto 0 do  // 逆推 vl',
  '        u ← topo[t]',
  '        for v ← 0 to n-1 do',
  '            if graph[u][v] > 0 且 vl[v]-graph[u][v] < vl[u] then',
  '                vl[u] ← vl[v] - graph[u][v]',
  '            end if',
  '结束函数',
];

const LINES = {
  initVe: [6],
  forward: [7, 8, 9, 10, 11],
  initVl: [13],
  backward: [14, 15, 16, 17, 18],
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

function* criticalPathSteps(input: GraphCommand[]): Generator<AlgorithmStep<GraphState>> {
  const vertices: Record<string, GraphVertex> = {};
  const edges: Record<string, GraphEdge> = {};
  let directed = false;

  const ve = new Map<string, number>();
  const vl = new Map<string, number>();

  const labelsOf = (): Record<string, string> => {
    const labels: Record<string, string> = {};
    for (const v of Object.keys(vertices)) {
      const a = ve.has(v) ? ve.get(v) : '-';
      const b = vl.has(v) ? vl.get(v) : '-';
      labels[v] = `${a}/${b}`;
    }
    return labels;
  };

  const build: Build = (highlightedV = [], highlightedE = [], currentV = {}, currentE = {}, labels, info, aux) => {
    const vertexStatus: Record<string, GraphElemStatus> = {};
    Object.assign(vertexStatus, currentV);
    const edgeStatus: Record<string, GraphElemStatus> = {};
    Object.assign(edgeStatus, currentE);
    const snap = snapshotGraph(vertices, edges);
    return { vertices: snap.vertices, edges: snap.edges, directed, highlightedVertices: highlightedV, highlightedEdges: highlightedE, vertexStatus, edgeStatus, vertexLabels: labels, info, aux };
  };

  yield {
    id: 'init',
    description: '初始状态：空图',
    state: build([], [], {}, {}, {}, {}, { label: '拓扑序', ids: [] }),
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
        state: build([], [], {}, {}, {}, {}, { label: '拓扑序', ids: [] }),
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
        description: '已添加有向边（权为工期）',
        state: build([], [], {}, {}, {}, {}, { label: '拓扑序', ids: [] }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 边数: Object.keys(edges).length },
      };
    } else if (cmd.op === 'critical-path') {
      // 构建有向邻接表（出边）与入度
      const out = new Map<string, { to: string; w: number }[]>();
      const indegree = new Map<string, number>();
      for (const v of Object.keys(vertices)) {
        out.set(v, []);
        indegree.set(v, 0);
      }
      for (const e of Object.values(edges)) {
        if (!e.directed) continue;
        out.get(e.from)?.push({ to: e.to, w: e.weight });
        indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);
      }
      for (const list of out.values()) list.sort((a, b) => a.to.localeCompare(b.to));

      // Kahn 拓扑排序
      const queue = Object.keys(vertices).filter((v) => (indegree.get(v) ?? 0) === 0).sort();
      const topo: string[] = [];
      while (queue.length) {
        const u = queue.shift() as string;
        topo.push(u);
        for (const nb of out.get(u) ?? []) {
          const d = (indegree.get(nb.to) ?? 0) - 1;
          indegree.set(nb.to, d);
          if (d === 0) queue.push(nb.to);
        }
        queue.sort();
      }

      if (topo.length !== Object.keys(vertices).length) {
        yield {
          id: 'cp-cycle',
          description: '图中存在环（或有孤立顶点），无法求关键路径',
          state: build([], [], {}, {}, {}, { 结果: '存在环' }, { label: '拓扑序', ids: [] }),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '存在环（不是 DAG）' },
        };
        continue;
      }

      yield {
        id: 'cp-topo',
        description: `拓扑排序：${topo.join(' → ')}`,
        state: build([], [], {}, {}, {}, {}, { label: '拓扑序', ids: [...topo] }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 拓扑序: topo.join(' → ') },
      };

      // 正推 ve
      for (const v of Object.keys(vertices)) ve.set(v, 0);
      for (const u of topo) {
        for (const nb of out.get(u) ?? []) {
          const nv = (ve.get(u) ?? 0) + nb.w;
          if (nv > (ve.get(nb.to) ?? 0)) ve.set(nb.to, nv);
        }
      }
      yield {
        id: 'cp-ve',
        description: `正推最早发生时间 ve：${topo.map((v) => `${v}=${ve.get(v)}`).join(' ')}`,
        state: build([], [], {}, {}, labelsOf(), { ve: topo.map((v) => `${v}:${ve.get(v)}`).join(' ') }, { label: '拓扑序', ids: [...topo] }),
        highlightedElements: [],
        highlightedLines: [...LINES.initVe, ...LINES.forward],
        variables: { ve: topo.map((v) => `${v}=${ve.get(v)}`).join(' ') },
      };

      // 逆推 vl
      const sink = topo[topo.length - 1];
      for (const v of Object.keys(vertices)) vl.set(v, ve.get(sink) ?? 0);
      for (let t = topo.length - 1; t >= 0; t--) {
        const u = topo[t];
        for (const nb of out.get(u) ?? []) {
          const nv = (vl.get(nb.to) ?? 0) - nb.w;
          if (nv < (vl.get(u) ?? 0)) vl.set(u, nv);
        }
      }
      yield {
        id: 'cp-vl',
        description: `逆推最迟发生时间 vl：${topo.map((v) => `${v}=${vl.get(v)}`).join(' ')}`,
        state: build([], [], {}, {}, labelsOf(), { vl: topo.map((v) => `${v}:${vl.get(v)}`).join(' ') }, { label: '拓扑序', ids: [...topo] }),
        highlightedElements: [],
        highlightedLines: [...LINES.initVl, ...LINES.backward],
        variables: { vl: topo.map((v) => `${v}=${vl.get(v)}`).join(' ') },
      };

      // 关键活动
      const criticalEdges: string[] = [];
      const criticalEdgeStatus: Record<string, GraphElemStatus> = {};
      for (const e of Object.values(edges)) {
        if (!e.directed) continue;
        const slack = (vl.get(e.to) ?? 0) - (ve.get(e.from) ?? 0) - e.weight;
        if (slack === 0) {
          criticalEdges.push(e.id);
          criticalEdgeStatus[e.id] = 'done';
        }
      }

      const pathStr = criticalEdges.join(' → ');
      yield {
        id: 'cp-done',
        description: `关键活动：${pathStr}，总工期 ${ve.get(sink)}`,
        state: build([], criticalEdges, {}, criticalEdgeStatus, labelsOf(), { 关键路径: pathStr, 总工期: ve.get(sink) ?? 0 }, { label: '拓扑序', ids: [...topo] }),
        highlightedElements: criticalEdges.map((eid) => `e-${eid}`),
        highlightedLines: [],
        variables: { 关键活动: pathStr, 总工期: ve.get(sink) ?? 0 },
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

export const criticalPathModule: AlgorithmModule<GraphState, GraphCommand[]> = {
  meta: {
    id: 'graph.critical-path',
    name: '关键路径',
    nameEn: 'Critical Path (AOE Network)',
    chapter: 'graph',
    order: 10,
    summary: 'AOE 网正推 ve / 逆推 vl，找出决定总工期的关键活动。',
    coreIdea:
      '关键路径算法先对 AOE 网拓扑排序，再正推每个事件的最早发生时间 ve、逆推最迟发生时间 vl。若活动 (u,v) 满足 ve[u] == vl[v] - w(u,v)，则该活动没有时间余量，是关键活动，由关键活动组成的路径即关键路径，其长度决定整个工程的最短工期。',
    operationSteps: [
      '对 AOE 网做拓扑排序。',
      '正推 ve：ve[v] = max(ve[u] + w(u,v))。',
      '逆推 vl：vl[u] = min(vl[v] - w(u,v))，汇点 vl = ve。',
      '若 ve[u] == vl[v] - w(u,v)，则边 (u,v) 是关键活动。',
    ],
    useCases: ['工程项目工期估算', '任务调度优化', '流程瓶颈分析'],
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V+E)',
    },
    pros: ['找出决定工期的关键活动', '支持工期优化分析'],
    cons: ['只适用于 AOE 网（有向无环）', '需要先拓扑排序'],
    examPoints: [
      '关键路径是 AOE 网中从源点到汇点的最长路径。',
      '关键活动的时间余量（松弛量）为 0。',
      '缩短关键活动才能缩短总工期。',
    ],
    variableDocs: [
      { name: 've', meaning: '事件最早发生时间（正推）' },
      { name: 'vl', meaning: '事件最迟发生时间（逆推）' },
      { name: 'topo', meaning: '拓扑排序序列' },
      { name: 'w(u,v)', meaning: '活动（边）的工期' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C ; edge A->B-2, B->C-3 ; critical-path' },
    ],
    defaultInput: 'build A,B,C,D ; edge A->B-2, B->C-3, A->C-1, C->D-4 ; critical-path',
    implemented: true,
    visualizer: 'graph',
  },
  generateSteps: criticalPathSteps,
  parseInput,
  createInitialState,
};
