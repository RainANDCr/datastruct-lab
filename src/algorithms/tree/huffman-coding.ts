/**
 * 哈夫曼编码（Huffman Coding）
 *
 * 在哈夫曼树基础上，从根到叶子，左分支记 0、右分支记 1，
 * 得到每个字符的前缀编码。复用 TreeView，编码表在 aux/info 展示。
 * 输入：字符:权值 序列（如 A:5, B:3, C:2, D:4）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { snapshotNodes, type TreeState, type TreeNodeState, type TreeNodeStatus } from './types';
import { buildHuffman, createInitialState, parseHuffmanInput, type HuffmanSymbol } from './huffman-shared';

const cLines = [
  '// 从哈夫曼树求编码（左 0 右 1）',
  'void encode(HTNode ht[], int root, char* code, int len) {',
  '    if (ht[root].lchild == 0 && ht[root].rchild == 0) {',
  '        code[len] = 0;',
  '        printf("%s\\n", code);   // 叶子：输出编码',
  '        return;',
  '    }',
  '    code[len] = 0; encode(ht, ht[root].lchild, code, len + 1);',
  '    code[len] = 1; encode(ht, ht[root].rchild, code, len + 1);',
  '}',
  '// 哈夫曼编码是前缀编码（任一编码都不是',
  '// 另一编码的前缀），解码无二义性。',
  '// 频率越高的字符编码越短。',
];

const cppLines = [
  '// 从哈夫曼树求编码（左 0 右 1）',
  'void encode(HTNode ht[], int root, string& code) {',
  '    if (ht[root].lchild == 0 && ht[root].rchild == 0) {',
  '        cout << code << "\\n";   // 叶子：输出编码',
  '        return;',
  '    }',
  '    code.push_back(0); encode(ht, ht[root].lchild, code);',
  '    code.back() = 1;  encode(ht, ht[root].rchild, code);',
  '    code.pop_back();',
  '}',
  '// 哈夫曼编码是前缀编码（任一编码都不是',
  '// 另一编码的前缀），解码无二义性。',
  '// 频率越高的字符编码越短。',
];

const pseudoLines = [
  '// 从哈夫曼树求编码（左 0 右 1）',
  '函数 encode(ht, root, code):',
  '    if root 是叶子 then',
  '        输出 code',
  '        return',
  '    end if',
  '    code ← code + "0", encode(ht, root.lchild, code)',
  '    code ← code + "1", encode(ht, root.rchild, code)',
  '结束函数',
  '// 哈夫曼编码是前缀编码（任一编码都不是',
  '// 另一编码的前缀），解码无二义性。',
  '// 频率越高的字符编码越短。',
];

function* huffmanCodingSteps(input: HuffmanSymbol[]): Generator<AlgorithmStep<TreeState>> {
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
    description: '初始状态：准备构建哈夫曼树并编码',
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

  const codeList = Object.entries(result.codes).map(([ch, code]) => `${ch}: ${code}`);
  yield {
    id: 'codes',
    description: `哈夫曼编码（左 0 右 1）：${codeList.join('，')}`,
    state: build([], {}, { label: '编码', ids: codeList }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 编码: codeList.join(' ') },
  };

  yield {
    id: 'done',
    description: '哈夫曼编码完成',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 编码: codeList.join(' ') },
  };
}

export const huffmanCodingModule: AlgorithmModule<TreeState, HuffmanSymbol[]> = {
  meta: {
    id: 'tree.huffman-coding',
    name: '哈夫曼编码',
    nameEn: 'Huffman Coding',
    chapter: 'tree',
    order: 10,
    summary: '基于哈夫曼树，左 0 右 1 生成前缀编码。',
    coreIdea:
      '哈夫曼编码基于哈夫曼树，从根到每个叶子：沿左分支记 0、右分支记 1，得到的路径序列即该字符的编码。它是最优前缀编码——频率高的字符编码短，且任一编码都不是另一编码的前缀，解码无二义性。',
    operationSteps: [
      '构建哈夫曼树。',
      '从根出发，左分支记 0、右分支记 1。',
      '到达叶子时，路径上的 0/1 序列即该字符的编码。',
      '汇总得到所有字符的编码表。',
    ],
    useCases: ['文件压缩（zip/gzip）', '图像/视频编码', '通信数据传输'],
    complexity: {
      time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
      space: 'O(n)',
    },
    pros: ['最优前缀编码', '平均码长最短', '解码无二义性'],
    cons: ['需先统计频率', '需传输编码表', '对均匀分布无优势'],
    examPoints: [
      '哈夫曼编码是前缀编码，解码无二义性。',
      '频率越高的字符编码越短。',
      '左 0 右 1（或反之）均可，约定一致即可。',
      '哈夫曼编码平均码长 = WPL / 总权值。',
    ],
    variableDocs: [
      { name: 'code', meaning: '当前路径的 0/1 编码串' },
      { name: 'lchild/rchild', meaning: '左右孩子（0/1 分支）' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'symbols', label: '字符:权值', type: 'string', placeholder: 'A:5, B:3, C:2, D:4' },
    ],
    defaultInput: 'A:5, B:3, C:2, D:4',
    implemented: true,
    visualizer: 'tree',
  },
  generateSteps: huffmanCodingSteps,
  parseInput: parseHuffmanInput,
  createInitialState,
};
