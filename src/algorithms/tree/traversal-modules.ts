/**
 * 二叉树四种遍历的独立模块（tree.preorder / inorder / postorder / levelorder）。
 * 复用 binary.ts 的构建与遍历生成器，每个模块聚焦单一遍历，
 * 默认输入固定为该遍历，便于教材章节按遍历逐一学习。
 */
import type { AlgorithmModule, AlgorithmStep, CodeSnippets, Complexity } from '@/engine/types';
import type { TreeState, TreeNodeState, TreeNodeStatus } from './types';
import {
  buildTree,
  createInitialState,
  inorder,
  levelorder,
  parseInput,
  postorder,
  preorder,
  type BuildState,
  type Command,
  type TraversalLineMap,
  type TraversalOp,
} from './binary';

const NAMES: Record<TraversalOp, { name: string; nameEn: string; order: number; summary: string; coreIdea: string; steps: string[]; order_desc: string }> = {
  preorder: {
    name: '前序遍历',
    nameEn: 'Preorder Traversal',
    order: 3,
    summary: '根 → 左 → 右，先访问根结点再递归子树。',
    coreIdea: '前序遍历（先序遍历）按「根 → 左子树 → 右子树」的顺序访问：先访问当前根结点，再递归前序遍历左子树，最后递归前序遍历右子树。',
    steps: ['访问根结点。', '前序遍历左子树。', '前序遍历右子树。'],
    order_desc: '根 → 左 → 右',
  },
  inorder: {
    name: '中序遍历',
    nameEn: 'Inorder Traversal',
    order: 4,
    summary: '左 → 根 → 右，二叉排序树中序得有序序列。',
    coreIdea: '中序遍历按「左子树 → 根 → 右子树」的顺序访问：先递归中序遍历左子树，再访问根结点，最后递归中序遍历右子树。对二叉排序树中序遍历可得到递增序列。',
    steps: ['中序遍历左子树。', '访问根结点。', '中序遍历右子树。'],
    order_desc: '左 → 根 → 右',
  },
  postorder: {
    name: '后序遍历',
    nameEn: 'Postorder Traversal',
    order: 5,
    summary: '左 → 右 → 根，先访问孩子再访问根。',
    coreIdea: '后序遍历按「左子树 → 右子树 → 根」的顺序访问：先递归后序遍历左子树，再递归后序遍历右子树，最后访问根结点。常用于计算子树高度、释放节点等场景。',
    steps: ['后序遍历左子树。', '后序遍历右子树。', '访问根结点。'],
    order_desc: '左 → 右 → 根',
  },
  levelorder: {
    name: '层序遍历',
    nameEn: 'Level-order Traversal',
    order: 6,
    summary: '逐层从左到右，借助队列实现。',
    coreIdea: '层序遍历按「从上到下、从左到右」逐层访问：根结点先入队，之后每次出队访问，并将其左右孩子依次入队，直到队列为空。',
    steps: ['根结点入队。', '出队并访问，左右孩子入队。', '重复直到队列为空。'],
    order_desc: '逐层从左到右',
  },
};

const CODES: Record<TraversalOp, { c: string; cpp: string; pseudocode: string }> = {
  preorder: {
    c: 'void preorder(TreeNode* root) {\n    if (root == NULL) return;\n    visit(root->data);\n    preorder(root->left);\n    preorder(root->right);\n}',
    cpp: 'void preorder(TreeNode* root) {\n    if (root == nullptr) return;\n    visit(root->data);\n    preorder(root->left);\n    preorder(root->right);\n}',
    pseudocode: '函数 preorder(root):\n    if root = NULL then return\n    visit(root.data)\n    preorder(root.left)\n    preorder(root.right)\n结束函数',
  },
  inorder: {
    c: 'void inorder(TreeNode* root) {\n    if (root == NULL) return;\n    inorder(root->left);\n    visit(root->data);\n    inorder(root->right);\n}',
    cpp: 'void inorder(TreeNode* root) {\n    if (root == nullptr) return;\n    inorder(root->left);\n    visit(root->data);\n    inorder(root->right);\n}',
    pseudocode: '函数 inorder(root):\n    if root = NULL then return\n    inorder(root.left)\n    visit(root.data)\n    inorder(root.right)\n结束函数',
  },
  postorder: {
    c: 'void postorder(TreeNode* root) {\n    if (root == NULL) return;\n    postorder(root->left);\n    postorder(root->right);\n    visit(root->data);\n}',
    cpp: 'void postorder(TreeNode* root) {\n    if (root == nullptr) return;\n    postorder(root->left);\n    postorder(root->right);\n    visit(root->data);\n}',
    pseudocode: '函数 postorder(root):\n    if root = NULL then return\n    postorder(root.left)\n    postorder(root.right)\n    visit(root.data)\n结束函数',
  },
  levelorder: {
    c: 'void levelorder(TreeNode* root) {\n    if (root == NULL) return;\n    Queue q; enqueue(&q, root);\n    while (!empty(&q)) {\n        TreeNode* cur = dequeue(&q);\n        visit(cur->data);\n        if (cur->left)  enqueue(&q, cur->left);\n        if (cur->right) enqueue(&q, cur->right);\n    }\n}',
    cpp: 'void levelorder(TreeNode* root) {\n    if (root == nullptr) return;\n    queue<TreeNode*> q; q.push(root);\n    while (!q.empty()) {\n        TreeNode* cur = q.front(); q.pop();\n        visit(cur->data);\n        if (cur->left)  q.push(cur->left);\n        if (cur->right) q.push(cur->right);\n    }\n}',
    pseudocode: '函数 levelorder(root):\n    if root = NULL then return\n    q ← 空队列, q.enqueue(root)\n    while q 非空 do\n        cur ← q.dequeue()\n        visit(cur.data)\n        if cur.left ≠ NULL then q.enqueue(cur.left)\n        if cur.right ≠ NULL then q.enqueue(cur.right)\n    end while\n结束函数',
  },
};

const TRAVERSER: Record<TraversalOp, typeof preorder> = { preorder, inorder, postorder, levelorder };

/**
 * 各遍历模块自身代码的行号映射。
 *
 * 本文件的参考代码只含单一遍历（6~10 行），而复用的生成器默认按 binary.ts
 * 的 41 行合并代码输出行号；若不覆盖会导致高亮行越界、代码同步失效。
 * 这里的行号与上面 CODES 中每种语言的代码逐一对应（C / C++ / 伪代码行数一致）。
 */
const TRAVERSAL_LINES: Record<TraversalOp, TraversalLineMap> = {
  // 1 函数头 / 2 if / 3 visit / 4 preorder(left) / 5 preorder(right) / 6 }
  preorder: { start: [1, 2], visit: [3], next: [4, 5] },
  // 1 函数头 / 2 if / 3 inorder(left) / 4 visit / 5 inorder(right) / 6 }
  inorder: { start: [3], visit: [4], next: [5] },
  // 1 函数头 / 2 if / 3 postorder(left) / 4 postorder(right) / 5 visit / 6 }
  postorder: { start: [3], visit: [5], next: [4] },
  // 1 函数头 / 2 if / 3 enqueue(root) / 4 while / 5 dequeue / 6 visit / 7-8 enqueue / 9 } / 10 }
  levelorder: { start: [1, 2, 3], visit: [5, 6], next: [7, 8] },
};

function makeTraversalSteps(kind: TraversalOp): (input: Command[]) => Generator<AlgorithmStep<TreeState>> {
  return function* (input: Command[]): Generator<AlgorithmStep<TreeState>> {
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
          description: `层序构建完成：${built.count} 个结点（根 ${built.rootId ? nodes[built.rootId].value : '无'}）`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结点数: built.count },
        };
      } else if (cmd.op === kind) {
        if (rootId === null) {
          yield {
            id: `${kind}-empty`,
            description: '树为空，无法遍历',
            state: build(),
            highlightedElements: [],
            highlightedLines: [],
            variables: { 结果: '空树' },
          };
          continue;
        }
        yield* TRAVERSER[kind](rootId, nodes, build, TRAVERSAL_LINES[kind]);
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
  };
}

function makeModule(kind: TraversalOp): AlgorithmModule<TreeState, Command[]> {
  const info = NAMES[kind];
  const code = CODES[kind];
  const complexity: Complexity = {
    time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
    space: kind === 'levelorder' ? 'O(w) 队列' : 'O(h) 递归栈',
  };
  return {
    meta: {
      id: `tree.${kind}`,
      name: info.name,
      nameEn: info.nameEn,
      chapter: 'tree',
      order: info.order,
      summary: info.summary,
      coreIdea: info.coreIdea,
      operationSteps: info.steps,
      useCases: ['表达式树的解析', '树的复制与序列化', '二叉树性质验证'],
      complexity,
      pros: ['访问所有结点恰好一次', 'O(n) 时间'],
      cons: ['递归实现需栈空间', '非递归需显式栈/队列'],
      examPoints: [
        `${info.name}访问顺序：${info.order_desc}。`,
        '由「前序 + 中序」或「后序 + 中序」可唯一确定二叉树。',
        '中序遍历二叉排序树得到递增序列。',
      ],
      variableDocs: [
        { name: 'root', meaning: '当前子树根结点' },
        { name: 'q / stack', meaning: '层序队列 / 递归栈' },
      ],
      code: code as CodeSnippets,
      inputSchema: [{ key: 'ops', label: '命令', type: 'string', placeholder: `build 1,2,3,null,4,5 ; ${kind}` }],
      defaultInput: `build 1,2,3,4,5,6,7 ; ${kind}`,
      implemented: true,
      visualizer: 'tree',
    },
    generateSteps: makeTraversalSteps(kind),
    parseInput,
    createInitialState,
  };
}

export const preorderModule = makeModule('preorder');
export const inorderModule = makeModule('inorder');
export const postorderModule = makeModule('postorder');
export const levelorderModule = makeModule('levelorder');
