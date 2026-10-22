/**
 * 哈夫曼树（Huffman Tree）
 *
 * 贪心选取权值最小的两个结点反复合并，构建带权路径长度（WPL）最小的二叉树。
 * 复用 TreeView，叶子显示权值，字符映射在描述中说明。
 * 输入：字符:权值 序列（如 A:5, B:3, C:2, D:4）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { snapshotNodes, type TreeState, type TreeNodeState, type TreeNodeStatus } from './types';
import { buildHuffman, createInitialState, parseHuffmanInput, type HuffmanSymbol } from './huffman-shared';

const cLines = [
  'typedef struct { int weight, parent, lchild, rchild; } HTNode;',
  'void huffman(HTNode ht[], int n) {',
  '    for (int i = 0; i < 2 * n - 1; i++)',
  '        ht[i].parent = ht[i].lchild = ht[i].rchild = 0;',
  '    for (int i = n; i < 2 * n - 1; i++) {',
  '        int m1 = INT_MAX, m2 = INT_MAX, s1 = 0, s2 = 0;',
  '        for (int j = 0; j < i; j++)',
  '            if (!ht[j].parent && ht[j].weight < m1) {',
  '                m2 = m1; s2 = s1;',
  '                m1 = ht[j].weight; s1 = j;',
  '            }',
  '        ht[s1].parent = i; ht[s2].parent = i;',
  '        ht[i].lchild = s1; ht[i].rchild = s2;',
  '        ht[i].weight = m1 + m2;',
  '    }',
  '}',
  '// 每次选权值最小且无父结点的两个结点，',
  '// 合并为新结点（权值 = 两者之和），重复 n-1 次。',
];

const cppLines = [
  'struct HTNode { int weight, parent, lchild, rchild; };',
  'void huffman(vector<HTNode>& ht, int n) {',
  '    ht.assign(2 * n - 1, {0, 0, 0, 0});',
  '    for (int i = n; i < 2 * n - 1; i++) {',
  '        int m1 = INT_MAX, m2 = INT_MAX, s1 = 0, s2 = 0;',
  '        for (int j = 0; j < i; j++)',
  '            if (!ht[j].parent && ht[j].weight < m1) {',
  '                m2 = m1; s2 = s1;',
  '                m1 = ht[j].weight; s1 = j;',
  '            }',
  '        ht[s1].parent = i; ht[s2].parent = i;',
  '        ht[i].lchild = s1; ht[i].rchild = s2;',
  '        ht[i].weight = m1 + m2;',
  '    }',
  '}',
  '// 每次选权值最小且无父结点的两个结点，',
  '// 合并为新结点（权值 = 两者之和），重复 n-1 次。',
];

const pseudoLines = [
  '结点结构 HTNode { weight, parent, lchild, rchild }',
  '函数 huffman(ht, n):',
  '    初始化 2n-1 个结点',
  '    for i ← n to 2n-2 do',
  '        选权值最小且无父结点的两个结点 s1, s2',
  '        ht[s1].parent ← i, ht[s2].parent ← i',
  '        ht[i].lchild ← s1, ht[i].rchild ← s2',
  '        ht[i].weight ← ht[s1].weight + ht[s2].weight',
  '    end for',
  '结束函数',
  '// 每次选权值最小且无父结点的两个结点，',
  '// 合并为新结点（权值 = 两者之和），重复 n-1 次。',
];

function* huffmanTreeSteps(input: HuffmanSymbol[]): Generator<AlgorithmStep<TreeState>> {
  let nodesRef: Record<string, TreeNodeState> = {};
  let rootRef: string | null = null;

  const build = (highlighted: string[] = [], current: Record<string, TreeNodeStatus> = {}, aux?: { label: string; ids: string[] }): TreeState => ({
    nodes: snapshotNodes(nodesRef),
    rootId: rootRef,
    highlighted,
    status: current,
    aux,
  });

  yield {
    id: 'init',
    description: '初始状态：准备构建哈夫曼树',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  const result = yield* buildHuffman(input, (nodes, getRoot) => {
    nodesRef = nodes;
    return (highlighted = [], current = {}, aux) => ({
      nodes: snapshotNodes(nodes),
      rootId: getRoot(),
      highlighted,
      status: current,
      aux,
    });
  });
  rootRef = result.rootId;

  yield {
    id: 'done',
    description: '哈夫曼树构建完毕',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 叶子数: input.length, 根权值: result.rootId ? result.nodes[result.rootId].value : 0 },
  };
}

export const huffmanTreeModule: AlgorithmModule<TreeState, HuffmanSymbol[]> = {
  meta: {
    id: 'tree.huffman-tree',
    name: '哈夫曼树',
    nameEn: 'Huffman Tree',
    chapter: 'tree',
    order: 9,
    summary: '贪心合并最小两个权值，构建 WPL 最小的最优二叉树。',
    coreIdea:
      '哈夫曼树是带权路径长度（WPL）最小的二叉树。构建时每次从森林中选取权值最小的两个结点合并成新结点（权值为两者之和），重复 n-1 次，最终只剩一个根结点。',
    operationSteps: [
      '将 n 个字符作为 n 棵单结点树（权值 = 出现频率）。',
      '选取权值最小的两棵树合并为新树，权值为两者之和。',
      '重复上一步，直到只剩一棵树。',
      '这棵树就是哈夫曼树。',
    ],
    useCases: ['数据压缩', '哈夫曼编码', '最优判定树'],
    complexity: {
      time: { best: 'O(n log n) 堆优化', average: 'O(n log n)', worst: 'O(n²) 朴素实现' },
      space: 'O(n)',
    },
    pros: ['WPL 最小', '是哈夫曼编码的基础'],
    cons: ['构建需排序/堆', '树形不唯一但 WPL 唯一'],
    examPoints: [
      '哈夫曼树是带权路径长度最小的二叉树。',
      'WPL = Σ 叶子权值 × 深度。',
      '哈夫曼树没有度为 1 的结点。',
      'n 个叶子的哈夫曼树共 2n-1 个结点。',
    ],
    variableDocs: [
      { name: 'weight', meaning: '结点权值（频率）' },
      { name: 's1 / s2', meaning: '权值最小的两个结点' },
      { name: 'WPL', meaning: '带权路径长度' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'symbols', label: '字符:权值', type: 'string', placeholder: 'A:5, B:3, C:2, D:4' },
    ],
    defaultInput: 'A:5, B:3, C:2, D:4',
    implemented: true,
    visualizer: 'tree',
  },
  generateSteps: huffmanTreeSteps,
  parseInput: parseHuffmanInput,
  createInitialState,
};
