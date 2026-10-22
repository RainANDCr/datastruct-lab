/**
 * 普通树（General Tree，孩子兄弟表示法）
 *
 * 普通树每个结点可有多个孩子，用「孩子兄弟表示法」转化为二叉树：
 * 左指针指向第一个孩子，右指针指向下一个兄弟。复用 TreeView 展示转换结果。
 * 输入：边列表（父-子），如 A-B, A-C, B-D, B-E, C-F。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import { snapshotNodes, type TreeState, type TreeNodeState, type TreeNodeStatus } from './types';

const cLines = [
  '// 孩子兄弟表示法（左孩子右兄弟）',
  'typedef struct CSNode {',
  '    char data;',
  '    struct CSNode *firstChild, *nextSibling;',
  '} CSNode;',
  '// 每个结点的 firstChild 指向第一个孩子，',
  '// nextSibling 指向下一个兄弟。',
  '// 通过这种方式，任意普通树都可',
  '// 转化为一棵二叉树存储。',
  '// 转化后：原树的孩子 → 二叉树的左孩子，',
  '// 原树的兄弟 → 二叉树的右孩子。',
];

const cppLines = [
  '// 孩子兄弟表示法（左孩子右兄弟）',
  'struct CSNode {',
  '    char data;',
  '    CSNode *firstChild, *nextSibling;',
  '};',
  '// 每个结点的 firstChild 指向第一个孩子，',
  '// nextSibling 指向下一个兄弟。',
  '// 通过这种方式，任意普通树都可',
  '// 转化为一棵二叉树存储。',
  '// 转化后：原树的孩子 → 二叉树的左孩子，',
  '// 原树的兄弟 → 二叉树的右孩子。',
];

const pseudoLines = [
  '// 孩子兄弟表示法（左孩子右兄弟）',
  '结点结构 CSNode { data, firstChild, nextSibling }',
  '// 每个结点的 firstChild 指向第一个孩子，',
  '// nextSibling 指向下一个兄弟。',
  '// 通过这种方式，任意普通树都可',
  '// 转化为一棵二叉树存储。',
  '// 转化后：原树的孩子 → 二叉树的左孩子，',
  '// 原树的兄弟 → 二叉树的右孩子。',
];

type Edge = { parent: string; child: string };

function parseInput(raw: string): ParseResult<Edge[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入边列表（如 A-B, A-C, B-D, B-E, C-F）' };
  const tokens = trimmed.split(/[,\s，、;；]+/).filter(Boolean);
  const edges: Edge[] = [];
  for (const t of tokens) {
    const m = t.match(/^([A-Za-z])-([A-Za-z])$/);
    if (!m) return { ok: false, error: `"${t}" 格式错误（应为 父-子，如 A-B）` };
    edges.push({ parent: m[1], child: m[2] });
  }
  if (edges.length === 0) return { ok: false, error: '至少需要一条边' };
  return { ok: true, value: edges };
}

function createInitialState(): TreeState {
  return { nodes: {}, rootId: null, highlighted: [], status: {} };
}

function* generalTreeSteps(input: Edge[]): Generator<AlgorithmStep<TreeState>> {
  const nodes: Record<string, TreeNodeState> = {};
  let rootId: string | null = null;

  const build = (highlighted: string[] = [], current: Record<string, TreeNodeStatus> = {}): TreeState => ({
    nodes: snapshotNodes(nodes),
    rootId,
    highlighted,
    status: current,
  });

  // 建立 父 → 子 列表
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  for (const e of input) {
    if (!children.has(e.parent)) children.set(e.parent, []);
    children.get(e.parent)!.push(e.child);
    hasParent.add(e.child);
  }

  yield {
    id: 'init',
    description: '初始状态：准备构建普通树',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 边数: input.length },
  };

  // 收集所有节点
  const allLabels = new Set<string>();
  for (const e of input) {
    allLabels.add(e.parent);
    allLabels.add(e.child);
  }
  const roots = [...allLabels].filter((l) => !hasParent.has(l)).sort();

  let idx = 0;
  const labelToId = new Map<string, string>();
  for (const label of [...allLabels].sort()) {
    const id = `n${idx++}`;
    labelToId.set(label, id);
    nodes[id] = { id, value: idx, label, leftId: null, rightId: null };
  }

  // 孩子兄弟表示法：firstChild = 第一个孩子，nextSibling = 下一个兄弟
  for (const [parent, kids] of children) {
    const pid = labelToId.get(parent)!;
    let prevSibling: string | null = null;
    for (const kid of kids) {
      const kidId = labelToId.get(kid)!;
      if (prevSibling === null) {
        nodes[pid].leftId = kidId; // 第一个孩子
      } else {
        nodes[prevSibling].rightId = kidId; // 兄弟链接
      }
      prevSibling = kidId;
      yield {
        id: `link-${parent}-${kid}`,
        description: `${kid} 是 ${parent} 的孩子（左孩子链）`,
        state: build([pid, kidId], { [pid]: 'current', [kidId]: 'new' }),
        highlightedElements: [`node-${kidId}`],
        highlightedLines: [],
        variables: { 父: parent, 子: kid },
      };
    }
  }

  if (roots.length > 0) {
    rootId = labelToId.get(roots[0])!;
    // 若多个根，用兄弟链接串联
    let prev: string | null = null;
    for (const r of roots) {
      const rid = labelToId.get(r)!;
      if (prev !== null) nodes[prev].rightId = rid;
      prev = rid;
    }
  }

  yield {
    id: 'done',
    description: `孩子兄弟表示法转换完成：${allLabels.size} 个结点（根 ${roots.join(', ') || '无'}）`,
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结点数: allLabels.size, 根: roots.join(', ') },
  };
}

export const generalTreeModule: AlgorithmModule<TreeState, Edge[]> = {
  meta: {
    id: 'tree.general',
    name: '普通树',
    nameEn: 'General Tree',
    chapter: 'tree',
    order: 1,
    summary: '孩子兄弟表示法：孩子转左孩子、兄弟转右孩子。',
    coreIdea:
      '普通树的每个结点可有任意多个孩子。孩子兄弟表示法（左孩子右兄弟）用两个指针：firstChild 指向第一个孩子、nextSibling 指向下一个兄弟，从而把任意普通树转化为二叉树存储，是树与二叉树之间的桥梁。',
    operationSteps: [
      '输入父-子边列表。',
      '每个结点的第一个孩子作为其左孩子。',
      '其余孩子依次作为前一个孩子的右兄弟。',
      '最终得到一棵等价二叉树。',
    ],
    useCases: ['目录结构', '组织架构', '表达式/语法树'],
    complexity: {
      time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
      space: 'O(n)',
    },
    pros: ['结构统一、易存储', '与二叉树互转方便'],
    cons: ['需额外指针', '兄弟关系用右指针表示较绕'],
    examPoints: [
      '孩子兄弟表示法：孩子 → 左孩子，兄弟 → 右孩子。',
      '普通树与二叉树可相互转换。',
      '森林也可转化为一棵二叉树。',
      '树的存储：双亲表示法、孩子表示法、孩子兄弟表示法。',
    ],
    variableDocs: [
      { name: 'firstChild', meaning: '第一个孩子指针' },
      { name: 'nextSibling', meaning: '下一个兄弟指针' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'edges', label: '边列表', type: 'string', placeholder: 'A-B, A-C, B-D, B-E, C-F' },
    ],
    defaultInput: 'A-B, A-C, A-D, B-E, B-F, C-G',
    implemented: true,
    visualizer: 'tree',
  },
  generateSteps: generalTreeSteps,
  parseInput,
  createInitialState,
};
