/**
 * 二叉树创建与删除（Create & Delete）
 *
 * 层序构建二叉树，删除指定值结点（叶子直接删、单子用孩子替换、
 * 双子用中序后继替换）。复用 TreeView。
 * 操作脚本：build 1,2,3,4,5,6,7 ; delete 5。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 14 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import { snapshotNodes, type TreeState, type TreeNodeState, type TreeNodeStatus } from './types';
import { buildTree, type BuildState } from './binary';

const cLines = [
  '// 删除结点（双子用中序后继替换）',
  'TreeNode* del(TreeNode* root, int key) {',
  '    if (root == NULL) return NULL;',
  '    if (key < root->data) root->left = del(root->left, key);',
  '    else if (key > root->data) root->right = del(root->right, key);',
  '    else {',
  '        if (!root->left) return root->right;',
  '        if (!root->right) return root->left;',
  '        TreeNode* s = root->right;',
  '        while (s->left) s = s->left;',
  '        root->data = s->data;',
  '        root->right = del(root->right, s->data);',
  '    }',
  '    return root;',
  '}',
];

const cppLines = [
  '// 删除结点（双子用中序后继替换）',
  'TreeNode* del(TreeNode* root, int key) {',
  '    if (root == nullptr) return nullptr;',
  '    if (key < root->data) root->left = del(root->left, key);',
  '    else if (key > root->data) root->right = del(root->right, key);',
  '    else {',
  '        if (!root->left) return root->right;',
  '        if (!root->right) return root->left;',
  '        TreeNode* s = root->right;',
  '        while (s->left) s = s->left;',
  '        root->data = s->data;',
  '        root->right = del(root->right, s->data);',
  '    }',
  '    return root;',
  '}',
];

const pseudoLines = [
  '// 删除结点（双子用中序后继替换）',
  '函数 del(root, key):',
  '    if root = NULL then return NULL',
  '    if key < root.data then root.left ← del(root.left, key)',
  '    else if key > root.data then root.right ← del(root.right, key)',
  '    else',
  '        if root.left = NULL then return root.right',
  '        if root.right = NULL then return root.left',
  '        s ← root.right',
  '        while s.left ≠ NULL do s ← s.left',
  '        root.data ← s.data',
  '        root.right ← del(root.right, s.data)',
  '    end if',
  '    return root',
  '结束函数',
];

const LINES = { search: [3, 4, 5], leaf: [7, 8], successor: [9, 10, 11, 12] } as const;

type Cmd = { op: 'build'; values: (number | null)[] } | { op: 'delete'; key: number };

function parseInput(raw: string): ParseResult<Cmd[]> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: '请输入命令（如 build 1,2,3,4,5,6,7 ; delete 5）' };
  const parts = trimmed.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
  const commands: Cmd[] = [];
  for (const part of parts) {
    const tokens = part.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean);
    if (tokens.length === 0) continue;
    const cmd = tokens[0].toLowerCase();
    if (cmd === 'build') {
      const values = tokens.slice(1).map((t) => (t === 'null' || t === '#' || t === '空' ? null : Number(t)));
      if (values.some((v) => v !== null && !Number.isFinite(v))) return { ok: false, error: `"${part}" 含非法值` };
      if (values.length === 0) return { ok: false, error: '"build" 需要节点序列' };
      commands.push({ op: 'build', values });
    } else if (cmd === 'delete' || cmd === 'del') {
      const key = Number(tokens[1]);
      if (!Number.isFinite(key)) return { ok: false, error: '"delete" 需要一个值' };
      commands.push({ op: 'delete', key });
    } else {
      return { ok: false, error: `未知命令 "${cmd}"（支持 build / delete）` };
    }
  }
  if (commands.length === 0) return { ok: false, error: '命令为空' };
  return { ok: true, value: commands };
}

function createInitialState(): TreeState {
  return { nodes: {}, rootId: null, highlighted: [], status: {}, visitOrder: [], aux: { label: '删除目标', ids: [] } };
}

function* createDeleteSteps(input: Cmd[]): Generator<AlgorithmStep<TreeState>> {
  let nodes: Record<string, TreeNodeState> = {};
  let rootId: string | null = null;

  const build: BuildState = (highlighted = [], visitOrder = [], current = {}, aux) => {
    const status: Record<string, TreeNodeStatus> = {};
    Object.assign(status, current);
    return { nodes: snapshotNodes(nodes), rootId, highlighted, status, visitOrder: [...visitOrder], aux };
  };

  // 查找值为 key 的节点 id（DFS）
  const findByValue = (id: string | null, key: number): string | null => {
    if (id === null) return null;
    if (nodes[id].value === key) return id;
    return findByValue(nodes[id].leftId, key) ?? findByValue(nodes[id].rightId, key);
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
      const target = findByValue(rootId, cmd.key);
      if (target === null) {
        yield {
          id: 'del-missing',
          description: `未找到值为 ${cmd.key} 的结点`,
          state: build([], [], {}, { label: '删除目标', ids: [] }),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '未找到' },
        };
        continue;
      }

      yield {
        id: 'del-search',
        description: `定位到待删除结点 ${cmd.key}`,
        state: build([target], [], { [target]: 'error' }, { label: '删除目标', ids: [String(cmd.key)] }),
        highlightedElements: [`node-${target}`],
        highlightedLines: [...LINES.search],
        variables: { 目标: cmd.key },
      };

      const t = nodes[target];
      if (t.leftId === null && t.rightId === null) {
        // 叶子：直接删
        delete nodes[target];
        const parent = Object.values(nodes).find((n) => n.leftId === target || n.rightId === target);
        if (parent) {
          if (parent.leftId === target) parent.leftId = null;
          else parent.rightId = null;
        } else {
          rootId = null;
        }
        yield {
          id: 'del-leaf',
          description: `${cmd.key} 是叶子结点，直接删除`,
          state: build([], [], {}, { label: '删除目标', ids: [] }),
          highlightedElements: [],
          highlightedLines: [...LINES.leaf],
          variables: { 删除: cmd.key, 类型: '叶子' },
        };
      } else if (t.leftId === null || t.rightId === null) {
        // 单子：孩子替换
        const child = t.leftId ?? t.rightId!;
        delete nodes[target];
        const parent = Object.values(nodes).find((n) => n.leftId === target || n.rightId === target);
        if (parent) {
          if (parent.leftId === target) parent.leftId = child;
          else parent.rightId = child;
        } else {
          rootId = child;
        }
        yield {
          id: 'del-single',
          description: `${cmd.key} 只有一个孩子，用其孩子 ${nodes[child]?.value ?? '?'} 替换`,
          state: build([child], [], { [child]: 'done' }, { label: '替换', ids: [String(nodes[child]?.value ?? '?')] }),
          highlightedElements: [`node-${child}`],
          highlightedLines: [...LINES.leaf],
          variables: { 删除: cmd.key, 类型: '单子' },
        };
      } else {
        // 双子：中序后继（右子树最左）替换
        let s = t.rightId!;
        const path: string[] = [target, s];
        while (nodes[s].leftId) {
          s = nodes[s].leftId!;
          path.push(s);
        }
        yield {
          id: 'del-successor',
          description: `${cmd.key} 有两个孩子，找中序后继（右子树最左）${nodes[s].value}`,
          state: build(path, [], { [s]: 'comparing' }, { label: '中序后继', ids: [String(nodes[s].value)] }),
          highlightedElements: [`node-${s}`],
          highlightedLines: [...LINES.successor],
          variables: { 中序后继: nodes[s].value },
        };
        t.value = nodes[s].value;
        yield {
          id: 'del-copy',
          description: `将 ${cmd.key} 的值替换为中序后继 ${nodes[s].value}`,
          state: build([target], [], { [target]: 'done' }, { label: '替换', ids: [String(nodes[s].value)] }),
          highlightedElements: [`node-${target}`],
          highlightedLines: [...LINES.successor],
          variables: { 替换: `${cmd.key} → ${nodes[s].value}` },
        };
        // 删除后继（后继无左子，可能有右子）
        const child = nodes[s].rightId;
        delete nodes[s];
        const sp = Object.values(nodes).find((n) => n.leftId === s || n.rightId === s);
        if (sp) {
          if (sp.leftId === s) sp.leftId = child;
          else sp.rightId = child;
        }
      }
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

export const createDeleteModule: AlgorithmModule<TreeState, Cmd[]> = {
  meta: {
    id: 'tree.create-delete',
    name: '二叉树创建与删除',
    nameEn: 'Binary Tree Create & Delete',
    chapter: 'tree',
    order: 7,
    summary: '层序创建二叉树，删除结点分叶子/单子/双子三情况。',
    coreIdea:
      '二叉树的创建可用层序数组（下标 i 的左子 2i+1、右子 2i+2）。删除结点分三种情况：叶子直接删、只有一个孩子用孩子替换、有两个孩子用中序后继（右子树最左）替换再删除后继。',
    operationSteps: [
      'build 按层序数组创建二叉树。',
      '删除叶子：直接删除。',
      '删除单子：用其唯一孩子替换。',
      '删除双子：用中序后继替换，再删除后继。',
    ],
    useCases: ['树的维护', '二叉堆的删除', '树的序列化与重建'],
    complexity: {
      time: { best: 'O(1)', average: 'O(h)', worst: 'O(h)' },
      space: 'O(h) 递归栈',
    },
    pros: ['结构清晰', '删除逻辑通用'],
    cons: ['双子删除较复杂', '需维护父子关系'],
    examPoints: [
      '删除双子结点用中序后继或前驱替换。',
      '层序数组下标 i 的左子 2i+1、右子 2i+2。',
      '中序后继 = 右子树最左结点。',
    ],
    variableDocs: [
      { name: 's', meaning: '中序后继（右子树最左）' },
      { name: 'target', meaning: '待删除结点' },
      { name: 'child', meaning: '替换用的孩子' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '命令', type: 'string', placeholder: 'build 1,2,3,4,5,6,7 ; delete 5' },
    ],
    defaultInput: 'build 1,2,3,4,5,6,7 ; delete 5',
    implemented: true,
    visualizer: 'tree',
  },
  generateSteps: createDeleteSteps,
  parseInput,
  createInitialState,
};
