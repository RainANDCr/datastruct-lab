/**
 * 广度优先搜索 BFS（图的遍历）
 *
 * 从起始顶点出发，按层逐层向外访问（队列）。
 * 复用 graph/traversal.ts 的解析与生成器。
 */
import type { AlgorithmModule } from '@/engine/types';
import type { GraphState } from './types';
import { cLines, cppLines, pseudoLines, createInitialState, graphSteps, parseInput, type GraphCommand } from './traversal';

export const bfsModule: AlgorithmModule<GraphState, GraphCommand[]> = {
  meta: {
    id: 'graph.bfs',
    name: '广度优先搜索 BFS',
    nameEn: 'Breadth-First Search',
    chapter: 'graph',
    order: 4,
    summary: '按层逐层向外访问，用队列实现，可求无权最短路。',
    coreIdea:
      '广度优先搜索（BFS）从起始顶点出发，先访问所有距离为 1 的邻接点，再访问距离为 2 的，逐层扩展，用队列实现。BFS 得到的路径是无权图中从起点到各顶点的最短路径。',
    operationSteps: [
      '起始顶点入队并标记访问。',
      '出队访问队头顶点。',
      '将其未访问的邻接点依次入队并标记。',
      '队列空则遍历结束。',
    ],
    useCases: ['无权图最短路径', '连通分量', '网络爬虫的层级遍历', '层序遍历'],
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V) 队列',
    },
    pros: ['可求无权最短路', '按层有序', '空间可预测'],
    cons: ['队列占用空间较大', '实现略多于 DFS'],
    examPoints: [
      'BFS 用队列实现，DFS 用栈实现。',
      'BFS 求无权图最短路径（边权为 1）。',
      '邻接表 + BFS 时间复杂度 O(V+E)。',
    ],
    variableDocs: [
      { name: 'visited', meaning: '顶点访问标记数组' },
      { name: 'q', meaning: 'BFS 队列' },
      { name: 'v', meaning: '当前出队顶点' },
      { name: 'w', meaning: '遍历的邻接顶点' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C ; edge A-B, A-C ; bfs A' },
    ],
    defaultInput: 'build A,B,C,D,E,F,G ; edge A-B, A-C, B-D, B-E, C-F, C-G ; bfs A',
    implemented: true,
    visualizer: 'graph',
  },
  generateSteps: graphSteps,
  parseInput,
  createInitialState,
};
