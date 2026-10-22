/**
 * 教材章节目录与算法目录（静态登记）。
 *
 * 每个章节登记其规划的全部算法模块；是否「已实现」由算法注册中心动态覆盖。
 * 侧边栏据此渲染：已实现 → 可点击进入；未实现 → 显示「开发中」。
 */
import type { ChapterId } from '../engine/types';

export interface ChapterAlgorithm {
  id: string;
  name: string;
}

export interface Chapter {
  id: ChapterId;
  /** 如「第一章 绪论」 */
  title: string;
  /** 如「绪论」 */
  shortTitle: string;
  icon: string;
  description: string;
  algorithms: ChapterAlgorithm[];
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    title: '第一章 绪论',
    shortTitle: '绪论',
    icon: 'book-open',
    description: '算法与数据结构基本概念、时间复杂度分析',
    algorithms: [
      { id: 'intro.complexity', name: '时间复杂度曲线' },
      { id: 'intro.operation-count', name: '操作次数模拟' },
      { id: 'intro.knowledge-cards', name: '复杂度知识卡片' },
    ],
  },
  {
    id: 'linear-list',
    title: '第二章 线性表',
    shortTitle: '线性表',
    icon: 'list',
    description: '顺序表与各类链表的存储与操作',
    algorithms: [
      { id: 'linear-list.sequential', name: '顺序表' },
      { id: 'linear-list.singly-linked', name: '单链表' },
      { id: 'linear-list.circular-linked', name: '循环单链表' },
      { id: 'linear-list.doubly-linked', name: '双向链表' },
      { id: 'linear-list.circular-doubly-linked', name: '循环双向链表' },
    ],
  },
  {
    id: 'stack-queue',
    title: '第三章 栈和队列',
    shortTitle: '栈和队列',
    icon: 'layers',
    description: '栈与队列的存储结构、经典应用',
    algorithms: [
      { id: 'stack-queue.seq-stack', name: '顺序栈' },
      { id: 'stack-queue.linked-stack', name: '链栈' },
      { id: 'stack-queue.seq-queue', name: '顺序队列' },
      { id: 'stack-queue.circular-queue', name: '循环队列' },
      { id: 'stack-queue.linked-queue', name: '链队列' },
      { id: 'stack-queue.bracket-matching', name: '括号匹配' },
      { id: 'stack-queue.expression-eval', name: '表达式求值' },
    ],
  },
  {
    id: 'string',
    title: '第四章 串',
    shortTitle: '串',
    icon: 'type',
    description: '字符串操作与模式匹配',
    algorithms: [
      { id: 'string.basic', name: '字符串基本操作' },
      { id: 'string.naive-match', name: '朴素字符串匹配' },
      { id: 'string.kmp', name: 'KMP 算法' },
    ],
  },
  {
    id: 'array',
    title: '第五章 数组和广义表',
    shortTitle: '数组和广义表',
    icon: 'grid',
    description: '数组存储与特殊矩阵压缩',
    algorithms: [
      { id: 'array.one-dim', name: '一维数组' },
      { id: 'array.two-dim', name: '二维数组存储' },
      { id: 'array.symmetric', name: '对称矩阵压缩' },
      { id: 'array.triangular', name: '三角矩阵压缩' },
      { id: 'array.tridiagonal', name: '三对角矩阵压缩' },
      { id: 'array.sparse', name: '稀疏矩阵三元组' },
      { id: 'array.generalized-list', name: '广义表' },
    ],
  },
  {
    id: 'tree',
    title: '第六章 树和二叉树',
    shortTitle: '树和二叉树',
    icon: 'git-branch',
    description: '树的存储、遍历与哈夫曼树',
    algorithms: [
      { id: 'tree.general', name: '普通树' },
      { id: 'tree.binary', name: '二叉树' },
      { id: 'tree.preorder', name: '前序遍历' },
      { id: 'tree.inorder', name: '中序遍历' },
      { id: 'tree.postorder', name: '后序遍历' },
      { id: 'tree.levelorder', name: '层序遍历' },
      { id: 'tree.create-delete', name: '二叉树创建与删除' },
      { id: 'tree.threaded', name: '线索二叉树' },
      { id: 'tree.huffman-tree', name: '哈夫曼树' },
      { id: 'tree.huffman-coding', name: '哈夫曼编码' },
    ],
  },
  {
    id: 'graph',
    title: '第七章 图',
    shortTitle: '图',
    icon: 'share-2',
    description: '图的存储、遍历与经典算法',
    algorithms: [
      { id: 'graph.adj-matrix', name: '邻接矩阵' },
      { id: 'graph.adj-list', name: '邻接表' },
      { id: 'graph.dfs', name: '深度优先搜索 DFS' },
      { id: 'graph.bfs', name: '广度优先搜索 BFS' },
      { id: 'graph.prim', name: 'Prim 最小生成树' },
      { id: 'graph.kruskal', name: 'Kruskal 最小生成树' },
      { id: 'graph.dijkstra', name: 'Dijkstra 最短路径' },
      { id: 'graph.floyd', name: 'Floyd 最短路径' },
      { id: 'graph.topological', name: '拓扑排序' },
      { id: 'graph.critical-path', name: '关键路径' },
    ],
  },
  {
    id: 'search',
    title: '第八章 查找',
    shortTitle: '查找',
    icon: 'search',
    description: '顺序、折半、分块与树表查找',
    algorithms: [
      { id: 'search.sequential', name: '顺序查找' },
      { id: 'search.binary', name: '折半查找' },
      { id: 'search.block', name: '分块查找' },
      { id: 'search.bst', name: '二叉排序树' },
      { id: 'search.avl', name: '平衡二叉树 AVL' },
      { id: 'search.hash', name: '散列查找' },
    ],
  },
  {
    id: 'sorting',
    title: '第九章 排序',
    shortTitle: '排序',
    icon: 'bar-chart-3',
    description: '八大排序算法的可视化对比',
    algorithms: [
      { id: 'sorting.bubble', name: '冒泡排序' },
      { id: 'sorting.selection', name: '简单选择排序' },
      { id: 'sorting.insertion', name: '直接插入排序' },
      { id: 'sorting.shell', name: '希尔排序' },
      { id: 'sorting.quick', name: '快速排序' },
      { id: 'sorting.heap', name: '堆排序' },
      { id: 'sorting.merge', name: '归并排序' },
      { id: 'sorting.radix', name: '基数排序' },
    ],
  },
];

/** 根据 id 查找章节 */
export function getChapterById(id: ChapterId): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}
