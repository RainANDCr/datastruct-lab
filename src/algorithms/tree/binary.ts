/**
 * 二叉树（Binary Tree）
 *
 * 输入层序序列构建二叉树，并演示前序 / 中序 / 后序 / 层序四种遍历。
 * 遍历用显式栈 / 队列真实模拟递归展开过程，同步展示访问顺序与辅助结构。
 * 操作脚本：build 1,2,3,null,4,5 ; preorder（或 inorder / postorder / levelorder）。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 41 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { TreeState, TreeNodeState, TreeNodeStatus } from './types';
import { idsToValues } from './types';

/* ---------------- 参考代码（41 行，三语言对齐） ---------------- */
const cLines = [
  'typedef struct TreeNode {',
  '    int data;',
  '    struct TreeNode* left;',
  '    struct TreeNode* right;',
  '} TreeNode;',
  '',
  '// 前序遍历（根 → 左 → 右）',
  'void preorder(TreeNode* root) {',
  '    if (root == NULL) return;',
  '    visit(root->data);',
  '    preorder(root->left);',
  '    preorder(root->right);',
  '}',
  '',
  '// 中序遍历（左 → 根 → 右）',
  'void inorder(TreeNode* root) {',
  '    if (root == NULL) return;',
  '    inorder(root->left);',
  '    visit(root->data);',
  '    inorder(root->right);',
  '}',
  '',
  '// 后序遍历（左 → 右 → 根）',
  'void postorder(TreeNode* root) {',
  '    if (root == NULL) return;',
  '    postorder(root->left);',
  '    postorder(root->right);',
  '    visit(root->data);',
  '}',
  '',
  '// 层序遍历（队列）',
  'void levelorder(TreeNode* root) {',
  '    if (root == NULL) return;',
  '    Queue q; enqueue(&q, root);',
  '    while (!empty(&q)) {',
  '        TreeNode* cur = dequeue(&q);',
  '        visit(cur->data);',
  '        if (cur->left)  enqueue(&q, cur->left);',
  '        if (cur->right) enqueue(&q, cur->right);',
  '    }',
  '}',
];

const cppLines = [
  'struct TreeNode {',
  '    int data;',
  '    TreeNode* left;',
  '    TreeNode* right;',
  '};',
  '',
  '// 前序遍历（根 → 左 → 右）',
  'void preorder(TreeNode* root) {',
  '    if (root == nullptr) return;',
  '    visit(root->data);',
  '    preorder(root->left);',
  '    preorder(root->right);',
  '}',
  '',
  '// 中序遍历（左 → 根 → 右）',
  'void inorder(TreeNode* root) {',
  '    if (root == nullptr) return;',
  '    inorder(root->left);',
  '    visit(root->data);',
  '    inorder(root->right);',
  '}',
  '',
  '// 后序遍历（左 → 右 → 根）',
  'void postorder(TreeNode* root) {',
  '    if (root == nullptr) return;',
  '    postorder(root->left);',
  '    postorder(root->right);',
  '    visit(root->data);',
  '}',
  '',
  '// 层序遍历（队列）',
  'void levelorder(TreeNode* root) {',
  '    if (root == nullptr) return;',
  '    queue<TreeNode*> q; q.push(root);',
  '    while (!q.empty()) {',
  '        TreeNode* cur = q.front(); q.pop();',
  '        visit(cur->data);',
  '        if (cur->left)  q.push(cur->left);',
  '        if (cur->right) q.push(cur->right);',
  '    }',
  '}',
];

const pseudoLines = [
  '结点结构 TreeNode:',
  '    data 域',
  '    left 指针域',
  '    right 指针域',
  '结束结构',
  '',
  '// 前序遍历（根 → 左 → 右）',
  '函数 preorder(root):',
  '    if root = NULL then return',
  '    visit(root.data)',
  '    preorder(root.left)',
  '    preorder(root.right)',
  '结束函数',
  '',
  '// 中序遍历（左 → 根 → 右）',
  '函数 inorder(root):',
  '    if root = NULL then return',
  '    inorder(root.left)',
  '    visit(root.data)',
  '    inorder(root.right)',
  '结束函数',
  '',
  '// 后序遍历（左 → 右 → 根）',
  '函数 postorder(root):',
  '    if root = NULL then return',
  '    postorder(root.left)',
  '    postorder(root.right)',
  '    visit(root.data)',
  '结束函数',
  '',
  '// 层序遍历（队列）',
  '函数 levelorder(root):',
  '    if root = NULL then return',
  '    q ← 空队列, q.enqueue(root)',
  '    while q 非空 do',
  '        cur ← q.dequeue()',
  '        visit(cur.data)',
  '        if cur.left ≠ NULL then q.enqueue(cur.left)',
  '        if cur.right ≠ NULL then q.enqueue(cur.right)',
  '    end while',
  '结束函数',
];

const LINES = {
  preorderVisit: 10,
  inorderVisit: 19,
  postorderVisit: 28,
  levelorderVisit: 37,
} as const;

/**
 * 遍历代码的行号映射，供不同代码版本复用同一生成器。
 * 默认值对应本文件 41 行合并代码；独立遍历模块（代码更短）可传入自己的行号。
 */
export interface TraversalLineMap {
  start?: number[];
  visit: number[];
  next?: number[];
}

const DEFAULT_LINES: Record<TraversalOp, TraversalLineMap> = {
  preorder: { start: [8, 9], visit: [LINES.preorderVisit], next: [11, 12] },
  inorder: { start: [17, 18], visit: [LINES.inorderVisit], next: [19, 20] },
  postorder: { start: [25, 26], visit: [LINES.postorderVisit], next: [26, 27] },
  levelorder: { start: [32, 33], visit: [LINES.levelorderVisit], next: [38, 39] },
};

/* ---------------- 命令与输入 ---------------- */
export type TraversalOp = 'preorder' | 'inorder' | 'postorder' | 'levelorder';
export type Command = { op: 'build'; values: (number | null)[] } | { op: TraversalOp };

export function parseInput(raw: string): ParseResult<Command[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 build 1,2,3,null,4,5 ; preorder）' };
  const parts = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  const commands: Command[] = [];
  for (const part of parts) {
    const tokens = part.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean);
    if (tokens.length === 0) continue;
    const cmd = tokens[0].toLowerCase();
    if (cmd === 'build') {
      const values = tokens.slice(1).map((t) => (t === 'null' || t === '#' || t === '空' ? null : Number(t)));
      if (values.some((v) => v !== null && !Number.isFinite(v))) return { ok: false, error: `"${part}" 含非法值` };
      if (values.length === 0) return { ok: false, error: '"build" 需要节点序列（如 build 1,2,3,null,4,5）' };
      if (values.length > 31) return { ok: false, error: '节点过多（最多 31 个）' };
      commands.push({ op: 'build', values });
    } else if (cmd === 'preorder' || cmd === 'inorder' || cmd === 'postorder' || cmd === 'levelorder') {
      commands.push({ op: cmd });
    } else {
      return { ok: false, error: `未知命令 "${cmd}"（支持 build / preorder / inorder / postorder / levelorder）` };
    }
  }
  if (commands.length === 0) return { ok: false, error: '命令为空' };
  return { ok: true, value: commands };
}

/* ---------------- 构建与状态 ---------------- */
export function buildTree(values: (number | null)[]): { nodes: Record<string, TreeNodeState>; rootId: string | null; count: number } {
  const nodes: Record<string, TreeNodeState> = {};
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null) {
      nodes[String(i)] = { id: String(i), value: values[i] as number, leftId: null, rightId: null };
    }
  }
  for (let i = 0; i < values.length; i++) {
    if (values[i] === null) continue;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < values.length && values[l] !== null) nodes[String(i)].leftId = String(l);
    if (r < values.length && values[r] !== null) nodes[String(i)].rightId = String(r);
  }
  const count = Object.keys(nodes).length;
  return { nodes, rootId: count > 0 ? '0' : null, count };
}

export function createInitialState(): TreeState {
  return { nodes: {}, rootId: null, highlighted: [], status: {}, visitOrder: [], aux: { label: '递归栈', ids: [] } };
}

/* ---------------- 遍历生成器 ---------------- */
export type BuildState = (highlighted?: string[], visitOrder?: string[], current?: Record<string, TreeNodeStatus>, aux?: { label: string; ids: string[] }) => TreeState;

export function* preorder(
  rootId: string | null,
  nodes: Record<string, TreeNodeState>,
  build: BuildState,
  lines: TraversalLineMap = DEFAULT_LINES.preorder,
): Generator<AlgorithmStep<TreeState>> {
  const stack: string[] = [];
  const order: string[] = [];
  if (rootId) stack.push(rootId);
  yield {
    id: 'pre-start',
    description: '前序遍历开始：根结点入栈',
    state: build([], order, {}, { label: '递归栈', ids: [...stack] }),
    highlightedElements: [],
    highlightedLines: lines.start ?? [],
    variables: { 递归栈: idsToValues(stack, nodes).join(', ') || '空' },
  };
  while (stack.length) {
    const id = stack.pop() as string;
    order.push(id);
    yield {
      id: `pre-visit-${id}`,
      description: `访问结点 ${nodes[id].value}（根 → 左 → 右）`,
      state: build([id], order, { [id]: 'current' }, { label: '递归栈', ids: [...stack] }),
      highlightedElements: [`node-${id}`],
      highlightedLines: lines.visit,
      variables: { 当前: nodes[id].value, 访问序: idsToValues(order, nodes).join(' ') },
    };
    const n = nodes[id];
    if (n.rightId) stack.push(n.rightId);
    if (n.leftId) stack.push(n.leftId);
    if (stack.length) {
      yield {
        id: `pre-push-${id}`,
        description: '右子、左子依次入栈',
        state: build([], order, {}, { label: '递归栈', ids: [...stack] }),
        highlightedElements: [],
        highlightedLines: lines.next ?? [],
        variables: { 递归栈: idsToValues(stack, nodes).join(', ') },
      };
    }
  }
  yield {
    id: 'pre-done',
    description: `前序遍历完成：${idsToValues(order, nodes).join(' → ')}`,
    state: build([], order, {}, { label: '递归栈', ids: [] }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结果: idsToValues(order, nodes).join(' ') },
  };
}

export function* inorder(
  rootId: string | null,
  nodes: Record<string, TreeNodeState>,
  build: BuildState,
  lines: TraversalLineMap = DEFAULT_LINES.inorder,
): Generator<AlgorithmStep<TreeState>> {
  const stack: string[] = [];
  const order: string[] = [];
  let cur: string | null = rootId;
  while (cur || stack.length) {
    while (cur) {
      stack.push(cur);
      yield {
        id: `in-push-${cur}`,
        description: `沿左子树下探，结点 ${nodes[cur].value} 入栈`,
        state: build([], order, {}, { label: '递归栈', ids: [...stack] }),
        highlightedElements: [],
        highlightedLines: lines.start ?? [],
        variables: { 递归栈: idsToValues(stack, nodes).join(', ') },
      };
      cur = nodes[cur].leftId;
    }
    cur = stack.pop() as string;
    order.push(cur);
    yield {
      id: `in-visit-${cur}`,
      description: `访问结点 ${nodes[cur].value}（左 → 根 → 右）`,
      state: build([cur], order, { [cur]: 'current' }, { label: '递归栈', ids: [...stack] }),
      highlightedElements: [`node-${cur}`],
      highlightedLines: lines.visit,
      variables: { 当前: nodes[cur].value, 访问序: idsToValues(order, nodes).join(' ') },
    };
    cur = nodes[cur].rightId;
  }
  yield {
    id: 'in-done',
    description: `中序遍历完成：${idsToValues(order, nodes).join(' → ')}`,
    state: build([], order, {}, { label: '递归栈', ids: [] }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结果: idsToValues(order, nodes).join(' ') },
  };
}

export function* postorder(
  rootId: string | null,
  nodes: Record<string, TreeNodeState>,
  build: BuildState,
  lines: TraversalLineMap = DEFAULT_LINES.postorder,
): Generator<AlgorithmStep<TreeState>> {
  const stack: string[] = [];
  const order: string[] = [];
  let cur: string | null = rootId;
  let last: string | null = null;
  while (cur || stack.length) {
    while (cur) {
      stack.push(cur);
      yield {
        id: `post-push-${cur}`,
        description: `沿左子树下探，结点 ${nodes[cur].value} 入栈`,
        state: build([], order, {}, { label: '递归栈', ids: [...stack] }),
        highlightedElements: [],
        highlightedLines: lines.start ?? [],
        variables: { 递归栈: idsToValues(stack, nodes).join(', ') },
      };
      cur = nodes[cur].leftId;
    }
    const top = stack[stack.length - 1];
    if (nodes[top].rightId && nodes[top].rightId !== last) {
      cur = nodes[top].rightId;
    } else {
      stack.pop();
      last = top;
      order.push(top);
      yield {
        id: `post-visit-${top}`,
        description: `访问结点 ${nodes[top].value}（左 → 右 → 根）`,
        state: build([top], order, { [top]: 'current' }, { label: '递归栈', ids: [...stack] }),
        highlightedElements: [`node-${top}`],
        highlightedLines: lines.visit,
        variables: { 当前: nodes[top].value, 访问序: idsToValues(order, nodes).join(' ') },
      };
    }
  }
  yield {
    id: 'post-done',
    description: `后序遍历完成：${idsToValues(order, nodes).join(' → ')}`,
    state: build([], order, {}, { label: '递归栈', ids: [] }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结果: idsToValues(order, nodes).join(' ') },
  };
}

export function* levelorder(
  rootId: string | null,
  nodes: Record<string, TreeNodeState>,
  build: BuildState,
  lines: TraversalLineMap = DEFAULT_LINES.levelorder,
): Generator<AlgorithmStep<TreeState>> {
  const queue: string[] = [];
  const order: string[] = [];
  if (rootId) queue.push(rootId);
  yield {
    id: 'lv-start',
    description: '层序遍历开始：根结点入队',
    state: build([], order, {}, { label: '层序队列', ids: [...queue] }),
    highlightedElements: [],
    highlightedLines: lines.start ?? [],
    variables: { 队列: idsToValues(queue, nodes).join(', ') || '空' },
  };
  while (queue.length) {
    const id = queue.shift() as string;
    order.push(id);
    yield {
      id: `lv-visit-${id}`,
      description: `出队并访问结点 ${nodes[id].value}`,
      state: build([id], order, { [id]: 'current' }, { label: '层序队列', ids: [...queue] }),
      highlightedElements: [`node-${id}`],
      highlightedLines: lines.visit,
      variables: { 当前: nodes[id].value, 访问序: idsToValues(order, nodes).join(' ') },
    };
    const n = nodes[id];
    if (n.leftId) queue.push(n.leftId);
    if (n.rightId) queue.push(n.rightId);
    if (queue.length) {
      yield {
        id: `lv-enqueue-${id}`,
        description: '左右子结点依次入队',
        state: build([], order, {}, { label: '层序队列', ids: [...queue] }),
        highlightedElements: [],
        highlightedLines: lines.next ?? [],
        variables: { 队列: idsToValues(queue, nodes).join(', ') },
      };
    }
  }
  yield {
    id: 'lv-done',
    description: `层序遍历完成：${idsToValues(order, nodes).join(' → ')}`,
    state: build([], order, {}, { label: '层序队列', ids: [] }),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结果: idsToValues(order, nodes).join(' ') },
  };
}

/* ---------------- 主生成器 ---------------- */
function* binaryTreeSteps(input: Command[]): Generator<AlgorithmStep<TreeState>> {
  let nodes: Record<string, TreeNodeState> = {};
  let rootId: string | null = null;

  const build: BuildState = (highlighted = [], visitOrder = [], current = {}, aux) => {
    const status: Record<string, TreeNodeStatus> = {};
    for (const id of visitOrder) status[id] = 'done';
    Object.assign(status, current);
    return { nodes, rootId, highlighted, status, visitOrder: [...visitOrder], aux };
  };

  yield {
    id: 'init',
    description: '初始状态：空树',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (const cmd of input) {
    if (cmd.op === 'build') {
      const built = buildTree(cmd.values);
      nodes = built.nodes;
      rootId = built.rootId;
      yield {
        id: 'built',
        description: `层序构建完成：${built.count} 个结点的二叉树（根为 ${built.rootId ? nodes[built.rootId].value : '无'}）`,
        state: build(),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 结点数: built.count, 根: built.rootId ? nodes[built.rootId].value : '空' },
      };
    } else {
      const name = { preorder: '前序', inorder: '中序', postorder: '后序', levelorder: '层序' }[cmd.op];
      if (rootId === null) {
        yield {
          id: `${cmd.op}-empty`,
          description: `树为空，无法进行${name}遍历`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '空树' },
        };
        continue;
      }
      const traverser = { preorder, inorder, postorder, levelorder }[cmd.op];
      yield* traverser(rootId, nodes, build);
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

export const binaryTreeModule: AlgorithmModule<TreeState, Command[]> = {
  meta: {
    id: 'tree.binary',
    name: '二叉树',
    nameEn: 'Binary Tree',
    chapter: 'tree',
    order: 1,
    summary: '层序构建二叉树，演示前序 / 中序 / 后序 / 层序四种遍历。',
    coreIdea:
      '二叉树每个结点至多有两个孩子（left / right）。遍历是按一定次序访问所有结点：前序（根→左→右）、中序（左→根→右）、后序（左→右→根）用递归（或栈）实现，层序用队列逐层访问。',
    operationSteps: [
      'build 序列：按层序数组构建（下标 i 的左子为 2i+1、右子为 2i+2，null 表示空位）。',
      '前序：访问根 → 递归左子树 → 递归右子树。',
      '中序：递归左子树 → 访问根 → 递归右子树。',
      '后序：递归左子树 → 递归右子树 → 访问根。',
      '层序：队列逐层，出队访问并让其左右孩子入队。',
    ],
    useCases: ['表达式树的解析', '文件系统目录结构', '二叉堆/二叉搜索树的基础'],
    complexity: {
      time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
      space: 'O(h) 递归栈（层序 O(w) 队列）',
    },
    pros: ['结构清晰、应用广泛', '遍历形式多样', '是众多树结构的基础'],
    cons: ['普通二叉树查找无顺序保证', '可能退化为链状'],
    examPoints: [
      '前序：根→左→右；中序：左→根→右；后序：左→右→根；层序：逐层从左到右。',
      '由「前序 + 中序」或「后序 + 中序」可唯一确定二叉树。',
      'n 个结点的二叉树有 n+1 个空指针域。',
    ],
    variableDocs: [
      { name: 'root', meaning: '根结点指针' },
      { name: 'left', meaning: '左孩子指针' },
      { name: 'right', meaning: '右孩子指针' },
      { name: 'q', meaning: '层序遍历用的队列' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build 1,2,3,null,4,5 ; preorder' },
    ],
    defaultInput: 'build 1,2,3,4,5,6,7 ; preorder',
    implemented: true,
    visualizer: 'tree',
  },
  generateSteps: binaryTreeSteps,
  parseInput,
  createInitialState,
};
