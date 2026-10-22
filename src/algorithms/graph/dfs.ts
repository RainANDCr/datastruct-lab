/**
 * 深度优先搜索 DFS（图的遍历）
 *
 * 从起始顶点出发，沿邻接点一路深入（栈），回溯后继续。
 * 复用 graph/traversal.ts 的解析与生成器。
 */
import type { AlgorithmModule } from '@/engine/types';
import type { GraphState } from './types';
import { cLines, cppLines, pseudoLines, createInitialState, graphSteps, parseInput, type GraphCommand } from './traversal';

export const dfsModule: AlgorithmModule<GraphState, GraphCommand[]> = {
  meta: {
    id: 'graph.dfs',
    name: '深度优先搜索 DFS',
    nameEn: 'Depth-First Search',
    chapter: 'graph',
    order: 3,
    summary: '沿一条路径一路深入、回溯再探，用栈（递归）实现。',
    coreIdea:
      '深度优先搜索（DFS）从起始顶点出发，沿某条路径尽可能深入地访问，走到无路可走再回溯到最近的岔口继续。可用递归或显式栈实现，天然适合生成树/拓扑排序/连通分量等问题。',
    operationSteps: [
      '从起始顶点入栈（递归调用）开始。',
      '出栈访问当前顶点，标记已访问。',
      '将未访问的邻接点入栈，继续深入。',
      '栈空则遍历结束。',
    ],
    useCases: ['连通分量', '拓扑排序', '迷宫/路径搜索', '图的生成树'],
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V) 栈深度（递归）',
    },
    pros: ['实现简单（递归）', '空间通常小于 BFS', '适合求连通性/拓扑'],
    cons: ['不保证最短路径', '递归可能栈溢出'],
    examPoints: [
      'DFS 用栈（或递归）实现，BFS 用队列实现。',
      '邻接表 + DFS 时间复杂度 O(V+E)。',
      'DFS 生成树：访问时沿树边深入。',
    ],
    variableDocs: [
      { name: 'visited', meaning: '顶点访问标记数组' },
      { name: 'graph', meaning: '邻接矩阵' },
      { name: 'v', meaning: '当前访问顶点' },
      { name: 'w', meaning: '遍历的邻接顶点' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build A,B,C ; edge A-B, A-C ; dfs A' },
    ],
    defaultInput: 'build A,B,C,D,E,F,G ; edge A-B, A-C, B-D, B-E, C-F, C-G ; dfs A',
    implemented: true,
    visualizer: 'graph',
  },
  generateSteps: graphSteps,
  parseInput,
  createInitialState,
};
