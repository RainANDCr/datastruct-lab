/**
 * 线索二叉树（Threaded Binary Tree，中序线索化）
 *
 * 二叉树空指针较多（n 结点有 n+1 个空指针），中序线索化把这些空指针
 * 指向前驱/后继，便于遍历。复用 TreeView，aux 展示中序序列，描述说明线索。
 * 操作脚本：build 1,2,3,4,5,6,7 ; thread。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import { snapshotNodes, type TreeState, type TreeNodeState, type TreeNodeStatus } from './types';
import { buildTree, type BuildState } from './binary';

const cLines = [
  'typedef struct TNode {',
  '    int data;',
  '    struct TNode *left, *right;',
  '    int ltag, rtag;  // 0=孩子 1=线索',
  '} TNode;',
  'void inThread(TNode* p, TNode** pre) {',
  '    if (p == NULL) return;',
  '    inThread(p->left, pre);',
  '    if (p->left == NULL) { p->left = *pre; p->ltag = 1; }',
  '    if (*pre && (*pre)->right == NULL) { (*pre)->right = p; (*pre)->rtag = 1; }',
  '    *pre = p;',
  '    inThread(p->right, pre);',
  '}',
  '// 中序线索化后，可沿线索实现非递归遍历，',
  '// 无需栈。空左指针指向前驱、空右指针指向后继。',
];

const cppLines = [
  'struct TNode {',
  '    int data;',
  '    TNode *left, *right;',
  '    int ltag, rtag;  // 0=孩子 1=线索',
  '};',
  'void inThread(TNode* p, TNode*& pre) {',
  '    if (p == nullptr) return;',
  '    inThread(p->left, pre);',
  '    if (p->left == nullptr) { p->left = pre; p->ltag = 1; }',
  '    if (pre && pre->right == nullptr) { pre->right = p; pre->rtag = 1; }',
  '    pre = p;',
  '    inThread(p->right, pre);',
  '}',
  '// 中序线索化后，可沿线索实现非递归遍历，',
  '// 无需栈。空左指针指向前驱、空右指针指向后继。',
];

const pseudoLines = [
  '结点结构 TNode { data, left, right, ltag, rtag }',
  '函数 inThread(p, pre):  // pre 为前驱指针引用',
  '    if p = NULL then return',
  '    inThread(p.left, pre)',
  '    if p.left = NULL then p.left ← pre, p.ltag ← 1',
  '    if pre ≠ NULL 且 pre.right = NULL then pre.right ← p, pre.rtag ← 1',
  '    pre ← p',
  '    inThread(p.right, pre)',
  '结束函数',
  '// 中序线索化后，可沿线索实现非递归遍历，',
  '// 无需栈。空左指针指向前驱、空右指针指向后继。',
];

type Cmd = { op: 'build'; values: (number | null)[] } | { op: 'thread' };

function parseInput(raw: string): ParseResult<Cmd[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 build 1,2,3,4,5,6,7 ; thread）' };
  const parts = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  const commands: Cmd[] = [];
  for (const part of parts) {
    const tokens = part.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean);
    if (tokens.length === 0) continue;
    const cmd = tokens[0].toLowerCase();
    if (cmd === 'build') {
      const values = tokens.slice(1).map((t) => (t === 'null' || t === '#' || t === '空' ? null : Number(t)));
      if (values.some((v) => v !== null && !Number.isFinite(v))) return { ok: false, error: `"${part}" 含非法值` };
      commands.push({ op: 'build', values });
    } else if (cmd === 'thread' || cmd === 'threading') {
      commands.push({ op: 'thread' });
    } else {
      return { ok: false, error: `未知命令 "${cmd}"（支持 build / thread）` };
    }
  }
  if (commands.length === 0) return { ok: false, error: '命令为空' };
  return { ok: true, value: commands };
}

function createInitialState(): TreeState {
  return { nodes: {}, rootId: null, highlighted: [], status: {}, aux: { label: '中序序列', ids: [] } };
}

function* threadedSteps(input: Cmd[]): Generator<AlgorithmStep<TreeState>> {
  let nodes: Record<string, TreeNodeState> = {};
  let rootId: string | null = null;

  const build: BuildState = (highlighted = [], visitOrder = [], current = {}, aux) => {
    const status: Record<string, TreeNodeStatus> = {};
    Object.assign(status, current);
    return { nodes: snapshotNodes(nodes), rootId, highlighted, status, visitOrder: [...visitOrder], aux };
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
        description: `层序构建完成：${built.count} 个结点`,
        state: build(),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 结点数: built.count },
      };
    } else {
      // 中序遍历得到序列
      const order: string[] = [];
      const inorder = (id: string | null): void => {
        if (id === null) return;
        inorder(nodes[id].leftId);
        order.push(id);
        inorder(nodes[id].rightId);
      };
      inorder(rootId);

      yield {
        id: 'thread-order',
        description: `中序序列：${order.map((id) => nodes[id].value).join(' → ')}（线索化的依据）`,
        state: build([], [], {}, { label: '中序序列', ids: order.map((id) => String(nodes[id].value)) }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 中序: order.map((id) => nodes[id].value).join(' ') },
      };

      // 中序线索化
      let pre: string | null = null;
      for (const id of order) {
        const n = nodes[id];
        const clues: string[] = [];
        if (n.leftId === null && pre !== null) {
          clues.push(`左线索 → 前驱 ${nodes[pre].value}`);
        }
        if (pre !== null) {
          const p = nodes[pre];
          if (p.rightId === null) {
            clues.push(`结点 ${p.value} 右线索 → 后继 ${n.value}`);
          }
        }
        if (clues.length > 0) {
          yield {
            id: `thread-${id}`,
            description: `访问 ${n.value}：${clues.join('；')}`,
            state: build([id], [], { [id]: 'current' }, { label: '中序序列', ids: order.map((x) => String(nodes[x].value)) }),
            highlightedElements: [`node-${id}`],
            highlightedLines: [],
            variables: { 线索: clues.join('；') },
          };
        }
        pre = id;
      }

      yield {
        id: 'thread-done',
        description: `中序线索化完成（${order.length} 个结点）`,
        state: build([], [], {}, { label: '中序序列', ids: order.map((id) => String(nodes[id].value)) }),
        highlightedElements: [],
        highlightedLines: [],
        variables: { 结果: '线索化完成' },
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

export const threadedTreeModule: AlgorithmModule<TreeState, Cmd[]> = {
  meta: {
    id: 'tree.threaded',
    name: '线索二叉树',
    nameEn: 'Threaded Binary Tree',
    chapter: 'tree',
    order: 8,
    summary: '用空指针指向中序前驱/后继，实现无栈遍历。',
    coreIdea:
      'n 个结点的二叉链表有 n+1 个空指针。中序线索化把这些空指针利用起来：空左指针指向中序前驱、空右指针指向中序后继，并用 ltag/rtag 区分「孩子」与「线索」，从而无需栈即可非递归遍历。',
    operationSteps: [
      '中序遍历二叉树，记录访问顺序。',
      '对每个结点：空左指针指向前驱（ltag=1）。',
      '空右指针指向后继（rtag=1）。',
      '线索化后可沿线索非递归遍历。',
    ],
    useCases: ['频繁遍历的静态树', '节省递归栈空间', '非递归遍历'],
    complexity: {
      time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
      space: 'O(1) 遍历（无需栈）',
    },
    pros: ['遍历无需栈', '空指针得到利用'],
    cons: ['插入删除维护线索复杂', '需额外 ltag/rtag'],
    examPoints: [
      'n 个结点的二叉链表有 n+1 个空指针域。',
      '线索：空左指针指向前驱、空右指针指向后继。',
      'ltag/rtag：0 表示孩子、1 表示线索。',
      '中序线索化后可无栈遍历。',
    ],
    variableDocs: [
      { name: 'pre', meaning: '中序前驱结点指针' },
      { name: 'ltag / rtag', meaning: '0=孩子、1=线索' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build 1,2,3,4,5,6,7 ; thread' },
    ],
    defaultInput: 'build 1,2,3,4,5,6,7 ; thread',
    implemented: true,
    visualizer: 'tree',
  },
  generateSteps: threadedSteps,
  parseInput,
  createInitialState,
};
