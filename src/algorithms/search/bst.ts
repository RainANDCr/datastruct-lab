/**
 * 二叉排序树（Binary Search Tree, BST）
 *
 * 左子树 < 根 < 右子树的二叉搜索树。支持插入 / 查找 / 删除三种操作。
 * 删除分三种情况：叶子直接删、单子用孩子替换、双子用中序后继（右子树最左）替换。
 * 复用 TreeView 渲染器，visitOrder 展示从根到目标/插入位置的比较路径。
 * 操作脚本：insert v / search v / delete v。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 40 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import { snapshotNodes, type TreeState, type TreeNodeState, type TreeNodeStatus } from '../tree/types';
import { parseCommandScript } from '../linear-list/commands';
import { createAddrAllocator } from '../linear-list/linked-shared';

/* ---------------- 参考代码（40 行，三语言对齐） ---------------- */
const cLines = [
  'typedef struct TreeNode {',
  '    int data;',
  '    struct TreeNode *left, *right;',
  '} TreeNode;',
  '',
  '// 插入',
  'TreeNode* insert(TreeNode* root, int value) {',
  '    if (root == NULL) {',
  '        TreeNode* p = (TreeNode*)malloc(sizeof(TreeNode));',
  '        p->data = value;',
  '        p->left = p->right = NULL;',
  '        return p;',
  '    }',
  '    if (value < root->data) root->left = insert(root->left, value);',
  '    else if (value > root->data) root->right = insert(root->right, value);',
  '    return root;',
  '}',
  '',
  '// 查找',
  'TreeNode* search(TreeNode* root, int value) {',
  '    if (root == NULL || root->data == value) return root;',
  '    if (value < root->data) return search(root->left, value);',
  '    return search(root->right, value);',
  '}',
  '',
  '// 删除',
  'TreeNode* deleteNode(TreeNode* root, int value) {',
  '    if (root == NULL) return NULL;',
  '    if (value < root->data) root->left = deleteNode(root->left, value);',
  '    else if (value > root->data) root->right = deleteNode(root->right, value);',
  '    else {',
  '        if (root->left == NULL) return root->right;   // 叶子/单右子',
  '        if (root->right == NULL) return root->left;    // 单左子',
  '        TreeNode* succ = root->right;                  // 双子：中序后继',
  '        while (succ->left) succ = succ->left;',
  '        root->data = succ->data;',
  '        root->right = deleteNode(root->right, succ->data);',
  '    }',
  '    return root;',
  '}',
];

const cppLines = [
  'struct TreeNode {',
  '    int data;',
  '    TreeNode *left, *right;',
  '};',
  '',
  '// 插入',
  'TreeNode* insert(TreeNode* root, int value) {',
  '    if (root == nullptr) {',
  '        TreeNode* p = new TreeNode();',
  '        p->data = value;',
  '        p->left = p->right = nullptr;',
  '        return p;',
  '    }',
  '    if (value < root->data) root->left = insert(root->left, value);',
  '    else if (value > root->data) root->right = insert(root->right, value);',
  '    return root;',
  '}',
  '',
  '// 查找',
  'TreeNode* search(TreeNode* root, int value) {',
  '    if (root == nullptr || root->data == value) return root;',
  '    if (value < root->data) return search(root->left, value);',
  '    return search(root->right, value);',
  '}',
  '',
  '// 删除',
  'TreeNode* deleteNode(TreeNode* root, int value) {',
  '    if (root == nullptr) return nullptr;',
  '    if (value < root->data) root->left = deleteNode(root->left, value);',
  '    else if (value > root->data) root->right = deleteNode(root->right, value);',
  '    else {',
  '        if (root->left == nullptr) return root->right;  // 叶子/单右子',
  '        if (root->right == nullptr) return root->left;   // 单左子',
  '        TreeNode* succ = root->right;                    // 双子：中序后继',
  '        while (succ->left) succ = succ->left;',
  '        root->data = succ->data;',
  '        root->right = deleteNode(root->right, succ->data);',
  '    }',
  '    return root;',
  '}',
];

const pseudoLines = [
  '结点结构 TreeNode:',
  '    data 域',
  '    left 指针域, right 指针域',
  '结束结构',
  '',
  '// 插入',
  '函数 insert(root, value):',
  '    if root = NULL then',
  '        新建结点 p',
  '        p.data ← value',
  '        p.left ← p.right ← NULL',
  '        return p',
  '    end if',
  '    if value < root.data then root.left ← insert(root.left, value)',
  '    else if value > root.data then root.right ← insert(root.right, value)',
  '    return root',
  '结束函数',
  '',
  '// 查找',
  '函数 search(root, value):',
  '    if root = NULL 或 root.data = value then return root',
  '    if value < root.data then return search(root.left, value)',
  '    return search(root.right, value)',
  '结束函数',
  '',
  '// 删除',
  '函数 deleteNode(root, value):',
  '    if root = NULL then return NULL',
  '    if value < root.data then root.left ← deleteNode(root.left, value)',
  '    else if value > root.data then root.right ← deleteNode(root.right, value)',
  '    else',
  '        if root.left = NULL then return root.right   // 叶子/单右子',
  '        if root.right = NULL then return root.left   // 单左子',
  '        succ ← root.right                           // 双子：中序后继',
  '        while succ.left ≠ NULL do succ ← succ.left',
  '        root.data ← succ.data',
  '        root.right ← deleteNode(root.right, succ.data)',
  '    end if',
  '    return root',
  '结束函数',
];

const LINES = {
  insNew: [9, 10, 11],
  insLeft: 14,
  insRight: 15,
  searchCmp: 21,
  searchLeft: 22,
  searchRight: 23,
  delLeft: 29,
  delRight: 30,
  delSingle: [32, 33],
  delSucc: [34, 35],
  delCopy: 36,
} as const;

/* ---------------- 命令与输入 ---------------- */
type Op = 'insert' | 'search' | 'delete';
interface Command {
  op: Op;
  value: number;
}

function parseInput(raw: string): ParseResult<Command[]> {
  const parsed = parseCommandScript(raw);
  if (!parsed.ok) return parsed;
  const commands: Command[] = [];
  for (const c of parsed.value) {
    if (c.cmd === 'insert') {
      if (c.args.length !== 1) return { ok: false, error: '"insert" 需要一个参数（如 insert 20）' };
      commands.push({ op: 'insert', value: c.args[0] });
    } else if (c.cmd === 'search' || c.cmd === 'find') {
      if (c.args.length !== 1) return { ok: false, error: '"search" 需要一个参数' };
      commands.push({ op: 'search', value: c.args[0] });
    } else if (c.cmd === 'delete' || c.cmd === 'remove') {
      if (c.args.length !== 1) return { ok: false, error: '"delete" 需要一个参数' };
      commands.push({ op: 'delete', value: c.args[0] });
    } else {
      return { ok: false, error: `未知命令 "${c.cmd}"（支持 insert / search / delete）` };
    }
  }
  if (commands.length > 20) return { ok: false, error: '命令过多（最多 20 条）' };
  return { ok: true, value: commands };
}

function createInitialState(): TreeState {
  return { nodes: {}, rootId: null, highlighted: [], status: {}, visitOrder: [], aux: { label: '查找路径', ids: [] } };
}

type Build = (highlighted?: string[], visitOrder?: string[], current?: Record<string, TreeNodeStatus>, aux?: { label: string; ids: string[] }) => TreeState;

function* bstSteps(input: Command[]): Generator<AlgorithmStep<TreeState>> {
  const nodes: Record<string, TreeNodeState> = {};
  let rootId: string | null = null;
  const newAddr = createAddrAllocator();

  const build: Build = (highlighted = [], visitOrder = [], current = {}, aux) => {
    const status: Record<string, TreeNodeStatus> = {};
    for (const id of visitOrder) status[id] = 'done';
    Object.assign(status, current);
    return { nodes: snapshotNodes(nodes), rootId, highlighted, status, visitOrder: [...visitOrder], aux };
  };

  yield {
    id: 'init',
    description: '初始状态：空二叉排序树',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: {},
  };

  for (const cmd of input) {
    if (cmd.op === 'insert') {
      const value = cmd.value;
      if (rootId === null) {
        const id = newAddr();
        nodes[id] = { id, value, leftId: null, rightId: null };
        rootId = id;
        yield {
          id: `ins-root-${id}`,
          description: `空树：插入 ${value} 作为根结点 ${id}`,
          state: build([id], [], { [id]: 'new' }),
          highlightedElements: [`node-${id}`],
          highlightedLines: [...LINES.insNew],
          variables: { 根: value },
        };
        continue;
      }

      const path: string[] = [];
      let cur: string = rootId;
      let inserted = false;
      while (!inserted) {
        path.push(cur);
        const node: TreeNodeState = nodes[cur];
        yield {
          id: `ins-cmp-${cur}`,
          description: `比较 ${value} 与当前结点 ${node.value}`,
          state: build([cur], path, { [cur]: 'comparing' }, { label: '查找路径', ids: path }),
          highlightedElements: [`node-${cur}`],
          highlightedLines: value < node.value ? [LINES.insLeft] : [LINES.insRight],
          variables: { 待插入: value, 当前: node.value },
        };

        if (value === node.value) {
          yield {
            id: `ins-dup-${cur}`,
            description: `${value} 已存在，忽略重复值`,
            state: build([], path, {}, { label: '查找路径', ids: path }),
            highlightedElements: [],
            highlightedLines: [],
            variables: { 结果: '已存在' },
          };
          inserted = true;
          break;
        } else if (value < node.value) {
          if (node.leftId) {
            cur = node.leftId;
            continue;
          }
          const id = newAddr();
          nodes[id] = { id, value, leftId: null, rightId: null };
          node.leftId = id;
          yield {
            id: `ins-left-${id}`,
            description: `${value} < ${node.value}：插入为结点 ${cur} 的左孩子 ${id}`,
            state: build([id], path, { [id]: 'new' }, { label: '查找路径', ids: [...path, id] }),
            highlightedElements: [`node-${id}`],
            highlightedLines: [...LINES.insNew],
            variables: { 插入: value, 父结点: node.value },
          };
          inserted = true;
        } else {
          if (node.rightId) {
            cur = node.rightId;
            continue;
          }
          const id = newAddr();
          nodes[id] = { id, value, leftId: null, rightId: null };
          node.rightId = id;
          yield {
            id: `ins-right-${id}`,
            description: `${value} > ${node.value}：插入为结点 ${cur} 的右孩子 ${id}`,
            state: build([id], path, { [id]: 'new' }, { label: '查找路径', ids: [...path, id] }),
            highlightedElements: [`node-${id}`],
            highlightedLines: [...LINES.insNew],
            variables: { 插入: value, 父结点: node.value },
          };
          inserted = true;
        }
      }
    } else if (cmd.op === 'search') {
      const value = cmd.value;
      if (rootId === null) {
        yield {
          id: 'search-empty',
          description: `空树，未找到 ${value}`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '空树' },
        };
        continue;
      }
      const path: string[] = [];
      let cur: string | null = rootId;
      let found = false;
      while (cur) {
        path.push(cur);
        const node: TreeNodeState = nodes[cur];
        yield {
          id: `search-cmp-${cur}`,
          description: `比较 ${value} 与结点 ${node.value}`,
          state: build([cur], path, { [cur]: 'comparing' }, { label: '查找路径', ids: path }),
          highlightedElements: [`node-${cur}`],
          highlightedLines: [LINES.searchCmp],
          variables: { 目标: value, 当前: node.value },
        };
        if (value === node.value) {
          found = true;
          yield {
            id: `search-found-${cur}`,
            description: `找到 ${value}（结点 ${cur}）`,
            state: build([cur], path, { [cur]: 'current' }, { label: '查找路径', ids: path }),
            highlightedElements: [`node-${cur}`],
            highlightedLines: [LINES.searchCmp],
            variables: { 结果: '找到' },
          };
          break;
        }
        cur = value < node.value ? node.leftId : node.rightId;
        if (cur) {
          yield {
            id: `search-go-${cur}`,
            description: `${value} ${value < node.value ? '<' : '>'} ${node.value}：进入${value < node.value ? '左' : '右'}子树`,
            state: build([], path, {}, { label: '查找路径', ids: path }),
            highlightedElements: [],
            highlightedLines: value < node.value ? [LINES.searchLeft] : [LINES.searchRight],
            variables: { 目标: value },
          };
        }
      }
      if (!found) {
        yield {
          id: 'search-notfound',
          description: `未找到 ${value}`,
          state: build([], path, {}, { label: '查找路径', ids: path }),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '未找到' },
        };
      }
    } else {
      const value = cmd.value;
      if (rootId === null) {
        yield {
          id: 'del-empty',
          description: `空树，无法删除 ${value}`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '空树' },
        };
        continue;
      }

      // 查找目标及其父结点
      const path: string[] = [];
      let parent: string | null = null;
      let cur: string | null = rootId;
      let isLeft = false;
      let target: string | null = null;
      while (cur) {
        path.push(cur);
        const node: TreeNodeState = nodes[cur];
        yield {
          id: `del-cmp-${cur}`,
          description: `查找 ${value}：比较结点 ${node.value}`,
          state: build([cur], path, { [cur]: 'comparing' }, { label: '查找路径', ids: path }),
          highlightedElements: [`node-${cur}`],
          highlightedLines: value < node.value ? [LINES.delLeft] : [LINES.delRight],
          variables: { 目标: value, 当前: node.value },
        };
        if (value === node.value) {
          target = cur;
          break;
        }
        parent = cur;
        if (value < node.value) {
          isLeft = true;
          cur = node.leftId;
        } else {
          isLeft = false;
          cur = node.rightId;
        }
      }

      if (target === null) {
        yield {
          id: 'del-notfound',
          description: `未找到 ${value}，无需删除`,
          state: build([], path, {}, { label: '查找路径', ids: path }),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '未找到' },
        };
        continue;
      }

      const tNode = nodes[target];
      const replaceChild = (newId: string | null) => {
        if (parent === null) rootId = newId;
        else if (isLeft) nodes[parent].leftId = newId;
        else nodes[parent].rightId = newId;
      };

      if (tNode.leftId === null && tNode.rightId === null) {
        // 叶子
        replaceChild(null);
        yield {
          id: `del-leaf-${target}`,
          description: `叶子结点：直接删除 ${value}`,
          state: build([target], path, { [target]: 'error' }, { label: '查找路径', ids: path }),
          highlightedElements: [`node-${target}`],
          highlightedLines: [...LINES.delSingle],
          variables: { 删除: value, 情况: '叶子' },
        };
        delete nodes[target];
        yield {
          id: `del-leaf-done-${target}`,
          description: `已删除 ${value}`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 已删除: value },
        };
      } else if (tNode.leftId === null || tNode.rightId === null) {
        // 单子
        const childId = tNode.leftId ?? tNode.rightId;
        replaceChild(childId);
        yield {
          id: `del-single-${target}`,
          description: `单子结点：用其${tNode.leftId ? '左' : '右'}孩子 ${nodes[childId as string].value} 替换 ${value}`,
          state: build([target], path, { [target]: 'error' }, { label: '查找路径', ids: path }),
          highlightedElements: [`node-${target}`],
          highlightedLines: [...LINES.delSingle],
          variables: { 删除: value, 情况: '单子', 孩子: nodes[childId as string].value },
        };
        delete nodes[target];
        yield {
          id: `del-single-done-${target}`,
          description: `已删除 ${value}`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 已删除: value },
        };
      } else {
        // 双子：中序后继（右子树最左）
        let succParent: string = target;
        let succ: string = tNode.rightId as string;
        let succIsLeft = false;
        yield {
          id: `del-succ-start-${target}`,
          description: `双子结点：找中序后继（右子树最左）`,
          state: build([succ], path, { [target]: 'current' }, { label: '查找路径', ids: path }),
          highlightedElements: [`node-${succ}`],
          highlightedLines: [LINES.delSucc[0]],
          variables: { 情况: '双子', 后继候选: nodes[succ].value },
        };
        while (nodes[succ].leftId) {
          succParent = succ;
          succ = nodes[succ].leftId as string;
          succIsLeft = true;
          yield {
            id: `del-succ-step-${succ}`,
            description: `沿左子下探到 ${nodes[succ].value}`,
            state: build([succ], path, { [succ]: 'comparing' }, { label: '查找路径', ids: path }),
            highlightedElements: [`node-${succ}`],
            highlightedLines: [LINES.delSucc[1]],
            variables: { 后继: nodes[succ].value },
          };
        }

        const succValue = nodes[succ].value;
        nodes[target].value = succValue;
        yield {
          id: `del-copy-${target}`,
          description: `将后继 ${succValue} 的值复制到 ${value} 的位置（结点 ${target} 值变为 ${succValue}）`,
          state: build([target], path, { [target]: 'current' }, { label: '查找路径', ids: path }),
          highlightedElements: [`node-${target}`],
          highlightedLines: [LINES.delCopy],
          variables: { 结点值变为: succValue, 删除后继: nodes[succ].value },
        };

        // 删除后继 succ（至多右子）
        const succRight = nodes[succ].rightId;
        if (succParent === target) {
          nodes[target].rightId = succRight;
        } else if (succIsLeft) {
          nodes[succParent].leftId = succRight;
        }
        yield {
          id: `del-succ-delete-${succ}`,
          description: `删除后继结点 ${succ}（值 ${succValue}）`,
          state: build([succ], path, { [succ]: 'error' }, { label: '查找路径', ids: path }),
          highlightedElements: [`node-${succ}`],
          highlightedLines: [...LINES.delSingle],
          variables: { 已删除后继: succValue },
        };
        delete nodes[succ];
        yield {
          id: `del-double-done-${target}`,
          description: `已删除 ${value}（双子，用中序后继 ${succValue} 替换）`,
          state: build(),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 已删除: value },
        };
      }
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: build(),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 结点数: Object.keys(nodes).length },
  };
}

export const bstModule: AlgorithmModule<TreeState, Command[]> = {
  meta: {
    id: 'search.bst',
    name: '二叉排序树',
    nameEn: 'Binary Search Tree',
    chapter: 'search',
    order: 4,
    summary: '左小右大的二叉搜索树，支持插入 / 查找 / 删除。',
    coreIdea:
      '二叉排序树（BST）满足：左子树所有结点值 < 根 < 右子树所有结点值。查找时每次比较可排除一半候选，平均 O(log n)；删除分叶子（直接删）、单子（用孩子替换）、双子（用中序后继替换）三种情况。',
    operationSteps: [
      '插入：从根比较，小则去左、大则去右，直到空位插入（重复值忽略）。',
      '查找：从根比较，相等命中，小去左、大去右，到空则未找到。',
      '删除叶子：直接删除。',
      '删除单子结点：用唯一孩子替换。',
      '删除双子结点：取中序后继（右子树最左）的值替换，再删除后继。',
    ],
    useCases: ['有序数据的动态查找', '符号表 / 集合', 'AVL / 红黑树的基础'],
    complexity: {
      time: { best: 'O(log n) 平衡时', average: 'O(log n)', worst: 'O(n) 退化为链' },
      space: 'O(h) 递归栈',
    },
    pros: ['查找/插入/删除平均 O(log n)', '中序遍历得到有序序列', '结构简单'],
    cons: ['可能退化为链（最坏 O(n)）', '不平衡时性能下降'],
    examPoints: [
      'BST 中序遍历结果有序（升序）。',
      '删除双子结点用中序后继（或前驱）替换。',
      'n 个结点 BST 的高度：最好 ⌊log₂n⌋，最坏 n-1。',
    ],
    variableDocs: [
      { name: 'root', meaning: '根结点指针' },
      { name: 'succ', meaning: '删除双子时的中序后继（右子树最左）' },
      { name: 'left', meaning: '左孩子指针' },
      { name: 'right', meaning: '右孩子指针' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '操作序列', type: 'string', placeholder: 'insert 8, insert 3, insert 10, search 6, delete 8' },
    ],
    defaultInput: 'insert 8, insert 3, insert 10, insert 1, insert 6, insert 14, insert 4, insert 7, search 6, delete 8',
    implemented: true,
    visualizer: 'tree',
  },
  generateSteps: bstSteps,
  parseInput,
  createInitialState,
};
