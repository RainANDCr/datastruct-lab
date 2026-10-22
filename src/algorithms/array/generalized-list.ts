/**
 * 广义表（Generalized List）
 *
 * 广义表元素可以是原子或子表，如 (a, (b, c), d)。
 * 用「表头表尾分解」转化为二叉树：head（第一个元素）为左孩子，
 * tail（其余元素组成的表）为右孩子。复用 TreeView 展示。
 * 输入：广义表表达式，如 (a, (b, c), d)。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import { snapshotNodes, type TreeState, type TreeNodeState, type TreeNodeStatus } from '../tree/types';

const cLines = [
  '// 广义表结点（表头表尾分解）',
  'typedef struct GLNode {',
  '    int tag;          // 0=原子 1=子表',
  '    union { char atom; struct { struct GLNode *hp, *tp; } ptr; };',
  '} GLNode;',
  '// hp（表头）指向第一个元素，',
  '// tp（表尾）指向其余元素组成的表。',
  '// 广义表可递归定义：元素是原子或子表。',
];

const cppLines = [
  '// 广义表结点（表头表尾分解）',
  'struct GLNode {',
  '    int tag;          // 0=原子 1=子表',
  '    char atom;',
  '    GLNode *hp, *tp;  // 表头 / 表尾',
  '};',
  '// hp（表头）指向第一个元素，',
  '// tp（表尾）指向其余元素组成的表。',
  '// 广义表可递归定义：元素是原子或子表。',
];

const pseudoLines = [
  '// 广义表结点（表头表尾分解）',
  '结点结构 GLNode { tag, atom, hp, tp }',
  '// hp（表头）指向第一个元素，',
  '// tp（表尾）指向其余元素组成的表。',
  '// 广义表可递归定义：元素是原子或子表。',
];

interface GLElement {
  kind: 'atom' | 'list';
  value?: string;
  children?: GLElement[];
}

function parseInput(raw: string): ParseResult<GLElement> {
  const s = raw.trim();
  if (!s) return { ok: false, error: '请输入广义表（如 (a, (b, c), d)）' };
  let pos = 0;

  const parseList = (): GLElement => {
    // 期望 '('
    if (s[pos] !== '(') throw new Error('expected (');
    pos++;
    const children: GLElement[] = [];
    while (pos < s.length && s[pos] !== ')') {
      if (s[pos] === '(') {
        children.push(parseList());
      } else if (s[pos] === ',' || s[pos] === ' ') {
        pos++;
        continue;
      } else {
        children.push({ kind: 'atom', value: s[pos] });
        pos++;
      }
    }
    if (s[pos] !== ')') throw new Error('expected )');
    pos++;
    return { kind: 'list', children };
  };

  try {
    const root = parseList();
    return { ok: true, value: root };
  } catch {
    return { ok: false, error: '广义表格式错误（应为 (a, (b, c), d)）' };
  }
}

function createInitialState(): TreeState {
  return { nodes: {}, rootId: null, highlighted: [], status: {} };
}

function* generalizedListSteps(input: GLElement): Generator<AlgorithmStep<TreeState>> {
  const nodes: Record<string, TreeNodeState> = {};
  let rootId: string | null = null;
  let counter = 0;

  const build = (highlighted: string[] = [], current: Record<string, TreeNodeStatus> = {}): TreeState => ({
    nodes: snapshotNodes(nodes),
    rootId,
    highlighted,
    status: current,
  });

  const labelOf = (e: GLElement): string => (e.kind === 'atom' ? e.value! : `(${e.children!.map((c) => (c.kind === 'atom' ? c.value : '…')).join(',')})`);

  // 表头表尾分解：head 为左孩子，tail 为右孩子
  function* convert(list: GLElement, parentId: string | null, isHead: boolean): Generator<AlgorithmStep<TreeState>, string | null> {
    const elements = list.children ?? [];
    if (elements.length === 0) return null;
    const head = elements[0];
    const tail = elements.slice(1);

    const headId = `n${counter++}`;
    nodes[headId] = {
      id: headId,
      value: counter,
      label: head.kind === 'atom' ? head.value : `(表)`,
      leftId: null,
      rightId: null,
    };
    if (parentId) {
      if (isHead) nodes[parentId].leftId = headId;
      else nodes[parentId].rightId = headId;
    } else {
      rootId = headId;
    }

    yield {
      id: `head-${headId}`,
      description: `表头（第一个元素）：${labelOf(head)}`,
      state: build([headId], { [headId]: 'current' }),
      highlightedElements: [`node-${headId}`],
      highlightedLines: [],
      variables: { 表头: labelOf(head) },
    };

    // 表头若是子表，递归展开
    if (head.kind === 'list') {
      yield* convert(head, headId, true);
    }

    // 表尾（其余元素组成的表）
    if (tail.length > 0) {
      const tailList: GLElement = { kind: 'list', children: tail };
      const tailId = `n${counter++}`;
      nodes[tailId] = { id: tailId, value: counter, label: '(表尾)', leftId: null, rightId: null };
      nodes[headId].rightId = tailId;
      yield {
        id: `tail-${tailId}`,
        description: `表尾（其余元素）：(${tail.map((c) => labelOf(c)).join(', ')})`,
        state: build([tailId], { [tailId]: 'comparing' }),
        highlightedElements: [`node-${tailId}`],
        highlightedLines: [],
        variables: { 表尾: `(${tail.map((c) => labelOf(c)).join(',')})` },
      };
      yield* convert(tailList, tailId, true);
    }

    return headId;
  }

  yield {
    id: 'init',
    description: '广义表：准备分解',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  yield* convert(input, null, false);

  yield {
    id: 'done',
    description: '表头表尾分解完成（孩子兄弟表示法）',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结点数: counter },
  };
}

export const generalizedListModule: AlgorithmModule<TreeState, GLElement> = {
  meta: {
    id: 'array.generalized-list',
    name: '广义表',
    nameEn: 'Generalized List',
    chapter: 'array',
    order: 7,
    summary: '元素可为原子或子表，表头表尾分解存储。',
    coreIdea: '广义表是线性表的推广，元素既可以是原子也可以是子表，可递归定义。通常用表头（第一个元素）和表尾（其余元素组成的表）来分解，转化为孩子兄弟表示法存储。',
    operationSteps: ['解析广义表表达式。', '取表头（第一个元素）与表尾（其余元素）。', '表头为左孩子、表尾为右孩子。', '递归处理子表。'],
    useCases: ['LISP 语言数据结构', '多元多项式', '树/图的表示'],
    complexity: {
      time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
      space: 'O(n)',
    },
    pros: ['可表示递归结构', '灵活'],
    cons: ['结构复杂', '访问元素需递归'],
    examPoints: [
      '广义表元素可为原子或子表。',
      '表头 = 第一个元素，表尾 = 其余元素组成的表。',
      '空表 () 与空广义表不同。',
      '广义表可递归定义、可共享、可递归。',
    ],
    variableDocs: [
      { name: 'hp', meaning: '表头指针（第一个元素）' },
      { name: 'tp', meaning: '表尾指针（其余元素）' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [{ key: 'expr', label: '广义表', type: 'string', placeholder: '(a, (b, c), d)' }],
    defaultInput: '(a, (b, c), d)',
    implemented: true,
    visualizer: 'tree',
  },
  generateSteps: generalizedListSteps,
  parseInput,
  createInitialState,
};
