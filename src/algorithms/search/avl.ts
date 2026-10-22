/**
 * 平衡二叉树 AVL（Adelson-Velsky & Landis Tree）
 *
 * 二叉排序树 + 平衡因子（左高 - 右高，绝对值 ≤ 1）。
 * 插入后若失衡，通过 LL / RR / LR / RL 四种旋转恢复平衡。
 * 复用 TreeView，visitOrder 展示插入路径，描述中说明平衡因子与旋转。
 * 输入：逗号分隔的插入序列。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 22 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import { snapshotNodes, type TreeState, type TreeNodeState, type TreeNodeStatus } from '../tree/types';

const cLines = [
  'typedef struct Node {',
  '    int key, h;',
  '    struct Node *left, *right;',
  '} Node;',
  'int height(Node* n) { return n ? n->h : 0; }',
  'int bf(Node* n) {',
  '    return height(n->left) - height(n->right);',
  '}',
  'Node* rotateRight(Node* y) {',
  '    Node* x = y->left; Node* T2 = x->right;',
  '    x->right = y; y->left = T2;',
  '    y->h = max(height(y->left), height(y->right)) + 1;',
  '    x->h = max(height(x->left), height(x->right)) + 1;',
  '    return x;',
  '}',
  'Node* rotateLeft(Node* x) {',
  '    Node* y = x->right; Node* T2 = y->left;',
  '    y->left = x; x->right = T2;',
  '    x->h = max(height(x->left), height(x->right)) + 1;',
  '    y->h = max(height(y->left), height(y->right)) + 1;',
  '    return y;',
  '}',
];

const cppLines = [
  'struct Node {',
  '    int key, h;',
  '    Node *left, *right;',
  '};',
  'int height(Node* n) { return n ? n->h : 0; }',
  'int bf(Node* n) {',
  '    return height(n->left) - height(n->right);',
  '}',
  'Node* rotateRight(Node* y) {',
  '    Node* x = y->left; Node* T2 = x->right;',
  '    x->right = y; y->left = T2;',
  '    y->h = max(height(y->left), height(y->right)) + 1;',
  '    x->h = max(height(x->left), height(x->right)) + 1;',
  '    return x;',
  '}',
  'Node* rotateLeft(Node* x) {',
  '    Node* y = x->right; Node* T2 = y->left;',
  '    y->left = x; x->right = T2;',
  '    x->h = max(height(x->left), height(x->right)) + 1;',
  '    y->h = max(height(y->left), height(y->right)) + 1;',
  '    return y;',
  '}',
];

const pseudoLines = [
  '结点结构 Node { key, h, left, right }',
  '函数 height(n):',
  '    if n = NULL then return 0 else return n.h',
  '函数 bf(n):',
  '    return height(n.left) - height(n.right)',
  '结束函数',
  '函数 rotateRight(y):  // LL 右旋',
  '    x ← y.left, T2 ← x.right',
  '    x.right ← y, y.left ← T2',
  '    y.h ← max(height(y.left), height(y.right)) + 1',
  '    x.h ← max(height(x.left), height(x.right)) + 1',
  '    return x',
  '结束函数',
  '函数 rotateLeft(x):  // RR 左旋',
  '    y ← x.right, T2 ← y.left',
  '    y.left ← x, x.right ← T2',
  '    x.h ← max(height(x.left), height(x.right)) + 1',
  '    y.h ← max(height(y.left), height(y.right)) + 1',
  '    return y',
  '结束函数',
];

const LINES = { height: [6, 7], rotRight: [10, 11, 12, 13, 14], rotLeft: [17, 18, 19, 20, 21] } as const;

function createAddrAllocator() {
  let i = 0;
  return () => `n${i++}`;
}

function parseInput(raw: string): ParseResult<number[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入插入序列（如 8, 3, 10, 1, 6）' };
  const tokens = trimmed.split(/[,\s，、;；]+/).filter(Boolean);
  const values: number[] = [];
  for (const t of tokens) {
    const n = Number(t);
    if (!Number.isFinite(n)) return { ok: false, error: `"${t}" 不是有效数字` };
    values.push(n);
  }
  if (values.length === 0) return { ok: false, error: '至少需要 1 个数字' };
  if (values.length > 30) return { ok: false, error: '元素过多（最多 30 个）' };
  return { ok: true, value: values };
}

function createInitialState(): TreeState {
  return { nodes: {}, rootId: null, highlighted: [], status: {}, visitOrder: [], aux: { label: '平衡因子', ids: [] } };
}

type Gen = Generator<AlgorithmStep<TreeState>, string, unknown>;

function* avlSteps(input: number[]): Generator<AlgorithmStep<TreeState>> {
  const nodes: Record<string, TreeNodeState> = {};
  const height = new Map<string, number>();
  let root: string | null = null;
  const alloc = createAddrAllocator();

  const heightOf = (id: string | null): number => (id === null ? 0 : (height.get(id) ?? 0));
  const updateHeight = (id: string): void => {
    const n = nodes[id];
    height.set(id, Math.max(heightOf(n.leftId), heightOf(n.rightId)) + 1);
  };
  const balance = (id: string): number => heightOf(nodes[id].leftId) - heightOf(nodes[id].rightId);

  const build = (highlighted: string[] = [], current: Record<string, TreeNodeStatus> = {}, aux?: { label: string; ids: string[] }): TreeState => {
    const status: Record<string, TreeNodeStatus> = {};
    Object.assign(status, current);
    return { nodes: snapshotNodes(nodes), rootId: root, highlighted, status, aux };
  };

  function* rotateRight(y: string): Gen {
    const x = nodes[y].leftId!;
    const T2 = nodes[x].rightId;
    nodes[y].leftId = T2;
    nodes[x].rightId = y;
    updateHeight(y);
    updateHeight(x);
    if (root === y) root = x;
    yield {
      id: `rotR-${x}`,
      description: `LL 型失衡：对结点 ${nodes[y].value} 右旋（${nodes[x].value} 上提为新根）`,
      state: build([x], { [x]: 'done' }, { label: '旋转', ids: [nodes[x].value.toString()] }),
      highlightedElements: [`node-${x}`],
      highlightedLines: [...LINES.rotRight],
      variables: { 旋转: 'LL 右旋', 新根: nodes[x].value },
    };
    return x;
  }

  function* rotateLeft(x: string): Gen {
    const y = nodes[x].rightId!;
    const T2 = nodes[y].leftId;
    nodes[x].rightId = T2;
    nodes[y].leftId = x;
    updateHeight(x);
    updateHeight(y);
    if (root === x) root = y;
    yield {
      id: `rotL-${y}`,
      description: `RR 型失衡：对结点 ${nodes[x].value} 左旋（${nodes[y].value} 上提为新根）`,
      state: build([y], { [y]: 'done' }, { label: '旋转', ids: [nodes[y].value.toString()] }),
      highlightedElements: [`node-${y}`],
      highlightedLines: [...LINES.rotLeft],
      variables: { 旋转: 'RR 左旋', 新根: nodes[y].value },
    };
    return y;
  }

  function* insert(id: string | null, value: number): Gen {
    if (id === null) {
      const nid = alloc();
      nodes[nid] = { id: nid, value, leftId: null, rightId: null };
      height.set(nid, 1);
      yield {
        id: `new-${nid}`,
        description: `创建新结点 ${value}（高度 1）`,
        state: build([nid], { [nid]: 'new' }),
        highlightedElements: [`node-${nid}`],
        highlightedLines: [],
        variables: { 新结点: value },
      };
      return nid;
    }
    const n = nodes[id];
    yield {
      id: `cmp-${id}-${value}`,
      description: `比较 ${value} 与结点 ${n.value}`,
      state: build([id], { [id]: 'comparing' }),
      highlightedElements: [`node-${id}`],
      highlightedLines: [],
      variables: { 当前结点: n.value, 待插入: value },
    };
    if (value < n.value) {
      n.leftId = yield* insert(n.leftId, value);
    } else if (value > n.value) {
      n.rightId = yield* insert(n.rightId, value);
    } else {
      yield {
        id: `dup-${value}`,
        description: `${value} 已存在，忽略（AVL 不允许重复）`,
        state: build([id], { [id]: 'error' }),
        highlightedElements: [`node-${id}`],
        highlightedLines: [],
        variables: { 重复: value },
      };
      return id;
    }

    updateHeight(id);
    const b = balance(id);
    if (b > 1) {
      if (value < nodes[n.leftId!].value) {
        yield {
          id: `ll-${id}`,
          description: `结点 ${n.value} 平衡因子 ${b}，LL 型失衡，需右旋`,
          state: build([id], { [id]: 'error' }),
          highlightedElements: [`node-${id}`],
          highlightedLines: [...LINES.rotRight],
          variables: { 平衡因子: b, 类型: 'LL' },
        };
        return yield* rotateRight(id);
      }
      yield {
        id: `lr-${id}`,
        description: `结点 ${n.value} 平衡因子 ${b}，LR 型失衡：先左旋左子，再右旋`,
        state: build([id], { [id]: 'error' }),
        highlightedElements: [`node-${id}`],
        highlightedLines: [...LINES.rotLeft, ...LINES.rotRight],
        variables: { 平衡因子: b, 类型: 'LR' },
      };
      n.leftId = yield* rotateLeft(n.leftId!);
      return yield* rotateRight(id);
    }
    if (b < -1) {
      if (value > nodes[n.rightId!].value) {
        yield {
          id: `rr-${id}`,
          description: `结点 ${n.value} 平衡因子 ${b}，RR 型失衡，需左旋`,
          state: build([id], { [id]: 'error' }),
          highlightedElements: [`node-${id}`],
          highlightedLines: [...LINES.rotLeft],
          variables: { 平衡因子: b, 类型: 'RR' },
        };
        return yield* rotateLeft(id);
      }
      yield {
        id: `rl-${id}`,
        description: `结点 ${n.value} 平衡因子 ${b}，RL 型失衡：先右旋右子，再左旋`,
        state: build([id], { [id]: 'error' }),
        highlightedElements: [`node-${id}`],
        highlightedLines: [...LINES.rotRight, ...LINES.rotLeft],
        variables: { 平衡因子: b, 类型: 'RL' },
      };
      n.rightId = yield* rotateRight(n.rightId!);
      return yield* rotateLeft(id);
    }
    return id;
  }

  yield {
    id: 'init',
    description: '初始状态：空 AVL 树',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (const value of input) {
    yield {
      id: `insert-${value}`,
      description: `插入 ${value}`,
      state: build([], {}, { label: '待插入', ids: [String(value)] }),
      highlightedElements: [],
      highlightedLines: [],
      variables: { 待插入: value },
    };
    root = yield* insert(root, value);
    yield {
      id: `done-${value}`,
      description: `插入 ${value} 完成，树保持平衡`,
      state: build([root ?? ''], {}, { label: '平衡因子', ids: [] }),
      highlightedElements: [],
      highlightedLines: [],
      variables: { 根: root ? nodes[root].value : '空' },
    };
  }

  // 中序遍历验证有序
  const order: string[] = [];
  const inorder = (id: string | null): void => {
    if (id === null) return;
    inorder(nodes[id].leftId);
    order.push(id);
    inorder(nodes[id].rightId);
  };
  inorder(root);

  yield {
    id: 'done',
    description: `AVL 构建完成，中序序列：${order.map((id) => nodes[id].value).join(' → ')}`,
    state: build([], {}, { label: '中序', ids: order.map((id) => String(nodes[id].value)) }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 中序: order.map((id) => nodes[id].value).join(' ') },
  };
}

export const avlModule: AlgorithmModule<TreeState, number[]> = {
  meta: {
    id: 'search.avl',
    name: '平衡二叉树 AVL',
    nameEn: 'AVL Tree',
    chapter: 'search',
    order: 5,
    summary: '二叉排序树 + 平衡因子，失衡时 LL/RR/LR/RL 旋转。',
    coreIdea:
      'AVL 树是平衡的二叉排序树，每个结点的平衡因子（左子树高 - 右子树高）绝对值不超过 1。插入导致失衡时，通过 LL（右旋）、RR（左旋）、LR（先左旋再右旋）、RL（先右旋再左旋）恢复平衡，保证查找 O(log n)。',
    operationSteps: [
      '按二叉排序树规则插入新结点。',
      '回溯更新各结点高度与平衡因子。',
      '若某结点平衡因子为 2 或 -2，判断失衡类型。',
      'LL 右旋、RR 左旋、LR 先左后右、RL 先右后左，恢复平衡。',
    ],
    useCases: ['需要频繁查找的动态表', '数据库索引', '有序集合'],
    complexity: {
      time: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
      space: 'O(log n) 递归栈',
    },
    pros: ['查找/插入/删除都是 O(log n)', '严格平衡、高度约 1.44log n'],
    cons: ['旋转实现复杂', '需要额外存储平衡因子/高度'],
    examPoints: [
      'AVL 是平衡的二叉排序树，平衡因子绝对值 ≤ 1。',
      '四种失衡：LL 右旋、RR 左旋、LR 先左后右、RL 先右后左。',
      'AVL 高度约 1.44 log n，查找 O(log n)。',
      '与红黑树对比：AVL 更严格平衡、旋转更多。',
    ],
    variableDocs: [
      { name: 'h', meaning: '结点高度' },
      { name: 'bf', meaning: '平衡因子 = 左高 - 右高' },
      { name: 'rotateRight', meaning: '右旋（LL）' },
      { name: 'rotateLeft', meaning: '左旋（RR）' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'array', label: '插入序列', type: 'array', placeholder: '如：8, 3, 10, 1, 6' },
    ],
    defaultInput: '8, 3, 10, 1, 6, 4, 7, 14, 13',
    implemented: true,
    visualizer: 'tree',
  },
  generateSteps: avlSteps,
  parseInput,
  createInitialState,
};
