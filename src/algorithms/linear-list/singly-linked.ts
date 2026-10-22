/**
 * 单链表（Singly Linked List）—— C/C++ 指针与堆内存可视化旗舰模块。
 *
 * 每个操作步骤携带 memory 快照，同步展示：
 *   栈帧局部指针变量（head / p / cur / prev）↔ 堆内存结点（data + next 指针域）。
 * 以操作脚本为输入：insert(头插) / search / delete / clear。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 36 行）。
 */
import type { MemorySnapshot, AlgorithmModule, AlgorithmStep, ParseResult, StackVariable } from '@/engine/types';
import type { LinkedListState, LinkedNodeState } from './types';
import { parseCommandScript } from './commands';

/* ---------------- 参考代码（36 行，三语言对齐） ---------------- */
const cLines = [
  'typedef struct Node {',
  '    int data;',
  '    struct Node* next;',
  '} Node;',
  '',
  '// 头插法：在链表头部插入元素',
  'void insertHead(Node** head, int value) {',
  '    Node* p = (Node*)malloc(sizeof(Node));',
  '    p->data = value;',
  '    p->next = *head;',
  '    *head = p;',
  '}',
  '',
  '// 查找值为 value 的结点',
  'Node* search(Node* head, int value) {',
  '    Node* cur = head;',
  '    while (cur != NULL && cur->data != value) {',
  '        cur = cur->next;',
  '    }',
  '    return cur;',
  '}',
  '',
  '// 删除值为 value 的第一个结点',
  'void deleteNode(Node** head, int value) {',
  '    Node *cur = *head, *prev = NULL;',
  '    while (cur != NULL && cur->data != value) {',
  '        prev = cur;',
  '        cur = cur->next;',
  '    }',
  '    if (cur == NULL) return;',
  '    if (prev == NULL)',
  '        *head = cur->next;',
  '    else',
  '        prev->next = cur->next;',
  '    free(cur);',
  '}',
];

const cppLines = [
  'struct Node {',
  '    int data;',
  '    Node* next;',
  '};',
  '',
  '// 头插法：在链表头部插入元素',
  'void insertHead(Node*& head, int value) {',
  '    Node* p = new Node();',
  '    p->data = value;',
  '    p->next = head;',
  '    head = p;',
  '}',
  '',
  '// 查找值为 value 的结点',
  'Node* search(Node* head, int value) {',
  '    Node* cur = head;',
  '    while (cur != nullptr && cur->data != value) {',
  '        cur = cur->next;',
  '    }',
  '    return cur;',
  '}',
  '',
  '// 删除值为 value 的第一个结点',
  'void deleteNode(Node*& head, int value) {',
  '    Node *cur = head, *prev = nullptr;',
  '    while (cur != nullptr && cur->data != value) {',
  '        prev = cur;',
  '        cur = cur->next;',
  '    }',
  '    if (cur == nullptr) return;',
  '    if (prev == nullptr)',
  '        head = cur->next;',
  '    else',
  '        prev->next = cur->next;',
  '    delete cur;',
  '}',
];

const pseudoLines = [
  '结点结构 Node:',
  '    data 域',
  '    next 指针域',
  '结束结构',
  '',
  '// 头插法：在链表头部插入元素',
  '函数 insertHead(head, value):',
  '    p ← 新建结点',
  '    p.data ← value',
  '    p.next ← head',
  '    head ← p',
  '结束函数',
  '',
  '// 查找值为 value 的结点',
  '函数 search(head, value):',
  '    cur ← head',
  '    while cur ≠ NULL 且 cur.data ≠ value do',
  '        cur ← cur.next',
  '    end while',
  '    return cur',
  '结束函数',
  '',
  '// 删除值为 value 的第一个结点',
  '函数 deleteNode(head, value):',
  '    cur ← head, prev ← NULL',
  '    while cur ≠ NULL 且 cur.data ≠ value do',
  '        prev ← cur',
  '        cur ← cur.next',
  '    end while',
  '    if cur = NULL then return',
  '    if prev = NULL then',
  '        head ← cur.next',
  '    else',
  '        prev.next ← cur.next',
  '    free(cur)',
  '结束函数',
];

const LINES = {
  newNode: [8, 9],
  linkNext: 10,
  updateHead: 11,
  searchInit: 16,
  searchWhile: 17,
  searchAdvance: 18,
  deleteInit: 25,
  deleteWhile: 26,
  deleteAdvance: [27, 28],
  relink: [31, 32, 33, 34],
  free: 35,
} as const;

/* ---------------- 命令与输入 ---------------- */
type ListOp = 'insert' | 'search' | 'delete' | 'clear';
interface ListCommand {
  op: ListOp;
  value?: number;
}

function parseInput(raw: string): ParseResult<ListCommand[]> {
  const parsed = parseCommandScript(raw);
  if (!parsed.ok) return parsed;
  const commands: ListCommand[] = [];
  for (const c of parsed.value) {
    switch (c.cmd) {
      case 'insert':
        if (c.args.length !== 1) return { ok: false, error: '"insert" 需要一个参数（如 insert 20）' };
        commands.push({ op: 'insert', value: c.args[0] });
        break;
      case 'search':
        if (c.args.length !== 1) return { ok: false, error: '"search" 需要一个参数' };
        commands.push({ op: 'search', value: c.args[0] });
        break;
      case 'delete':
      case 'remove':
        if (c.args.length !== 1) return { ok: false, error: '"delete" 需要一个参数' };
        commands.push({ op: 'delete', value: c.args[0] });
        break;
      case 'clear':
        commands.push({ op: 'clear' });
        break;
      default:
        return { ok: false, error: `未知命令 "${c.cmd}"（支持 insert / search / delete / clear）` };
    }
  }
  if (commands.length > 12) return { ok: false, error: '命令过多（最多 12 条）' };
  return { ok: true, value: commands };
}

/* ---------------- 内部状态与快照 ---------------- */
interface HeapNode {
  address: string;
  value: number;
  next: string | null;
  freed?: boolean;
}

function buildListState(
  head: string | null,
  nodes: Map<string, HeapNode>,
  highlighted: string[],
  status: Record<string, 'default' | 'current' | 'comparing' | 'done' | 'error' | 'new'>,
): LinkedListState {
  const ordered: LinkedNodeState[] = [];
  const seen = new Set<string>();
  let cur = head;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const n = nodes.get(cur)!;
    ordered.push({ id: cur, value: n.value, nextId: n.next });
    cur = n.next;
  }
  return { nodes: ordered, headId: head, highlighted, status };
}

function ptrVar(name: string, pointsTo: string | null): StackVariable {
  return { name, type: 'Node*', value: pointsTo ?? 'NULL', pointsTo: pointsTo ?? undefined };
}

function buildMemory(
  nodes: Map<string, HeapNode>,
  vars: StackVariable[],
): MemorySnapshot {
  const heap = [...nodes.values()].map((n) => ({
    address: n.address,
    label: `Node(${n.value})`,
    fields: [
      { name: 'data', value: String(n.value) },
      { name: 'next', value: n.next ?? 'NULL', pointsTo: n.next ?? undefined },
    ],
    freed: n.freed,
  }));
  return { stack: [{ function: 'main', variables: vars }], heap, links: [] };
}

function createInitialState(): LinkedListState {
  return { nodes: [], headId: null, highlighted: [], status: {} };
}

/* ---------------- 算法执行（生成器） ---------------- */
function* singlyLinkedListSteps(input: ListCommand[]): Generator<AlgorithmStep<LinkedListState>> {
  const nodes = new Map<string, HeapNode>();
  let head: string | null = null;
  let addrCounter = 0x100;
  const newAddr = () => {
    const a = '0x' + addrCounter.toString(16).toUpperCase();
    addrCounter += 0x10;
    return a;
  };
  const defaultStatus: Record<string, 'default'> = {};

  yield {
    id: 'init',
    description: '初始状态：空链表，head = NULL',
    state: buildListState(head, nodes, [], {}),
    memory: buildMemory(nodes, [ptrVar('head', null)]),
    highlightedElements: [],
    highlightedLines: [],
    variables: { head: 'NULL' },
  };

  for (const cmd of input) {
    if (cmd.op === 'insert') {
      const value = cmd.value as number;
      const addr = newAddr();
      const newNode: HeapNode = { address: addr, value, next: null };
      nodes.set(addr, newNode);

      yield {
        id: `new-${addr}`,
        description: `Node* p = new Node(${value})：在堆中创建新结点 ${addr}，p 指向它`,
        state: buildListState(head, nodes, [], { [addr]: 'new' }),
        memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...LINES.newNode],
        variables: { p: addr, value },
      };

      newNode.next = head;
      yield {
        id: `link-${addr}`,
        description: `p->next = head：新结点 ${addr} 的 next 指向原头结点 ${head ?? 'NULL'}`,
        state: buildListState(head, nodes, [], { [addr]: 'new' }),
        memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [LINES.linkNext],
        variables: { p: addr, 'p->next': head ?? 'NULL' },
      };

      head = addr;
      yield {
        id: `head-${addr}`,
        description: `head = p：头指针更新为新结点 ${addr}`,
        state: buildListState(head, nodes, [addr], { [addr]: 'new' }),
        memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('p', addr)]),
        highlightedElements: [`node-${addr}`],
        highlightedLines: [LINES.updateHead],
        variables: { head: addr, value },
      };
    } else if (cmd.op === 'search') {
      const value = cmd.value as number;
      let cur: string | null = head;
      yield {
        id: `search-init-${value}`,
        description: `查找 ${value}：cur = head = ${head ?? 'NULL'}`,
        state: buildListState(head, nodes, [], defaultStatus),
        memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('cur', cur)]),
        highlightedElements: [],
        highlightedLines: [LINES.searchInit],
        variables: { cur: cur ?? 'NULL', 目标: value },
      };
      let found = false;
      while (cur) {
        const n: HeapNode = nodes.get(cur)!;
        yield {
          id: `search-cmp-${cur}`,
          description: `比较 cur->data=${n.value} 与目标 ${value}`,
          state: buildListState(head, nodes, [cur], { [cur]: 'current' }),
          memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('cur', cur)]),
          highlightedElements: [`node-${cur}`],
          highlightedLines: [LINES.searchWhile],
          variables: { cur, 'cur->data': n.value, 目标: value },
        };
        if (n.value === value) {
          found = true;
          yield {
            id: `search-found-${cur}`,
            description: `找到结点 ${cur}（值为 ${value}）`,
            state: buildListState(head, nodes, [cur], { [cur]: 'done' }),
            memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('cur', cur)]),
            highlightedElements: [`node-${cur}`],
            highlightedLines: [],
            variables: { cur, 结果: '找到' },
          };
          break;
        }
        cur = n.next;
        yield {
          id: `search-adv-${cur ?? 'null'}`,
          description: `cur = cur->next：移动到 ${cur ?? 'NULL'}`,
          state: buildListState(head, nodes, cur ? [cur] : [], defaultStatus),
          memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('cur', cur)]),
          highlightedElements: [],
          highlightedLines: [LINES.searchAdvance],
          variables: { cur: cur ?? 'NULL' },
        };
      }
      if (!found) {
        yield {
          id: `search-notfound-${value}`,
          description: `遍历结束，未找到值为 ${value} 的结点`,
          state: buildListState(head, nodes, [], defaultStatus),
          memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('cur', null)]),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '未找到' },
        };
      }
    } else if (cmd.op === 'delete') {
      const value = cmd.value as number;
      let cur: string | null = head;
      let prev: string | null = null;
      yield {
        id: `del-init-${value}`,
        description: `删除 ${value}：cur = head，prev = NULL`,
        state: buildListState(head, nodes, [], defaultStatus),
        memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('cur', cur), ptrVar('prev', prev)]),
        highlightedElements: [],
        highlightedLines: [LINES.deleteInit],
        variables: { cur: cur ?? 'NULL', prev: 'NULL' },
      };
      let target: HeapNode | null = null;
      while (cur) {
        const n: HeapNode = nodes.get(cur)!;
        yield {
          id: `del-cmp-${cur}`,
          description: `比较 cur->data=${n.value} 与目标 ${value}`,
          state: buildListState(head, nodes, [cur], { [cur]: 'current' }),
          memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('cur', cur), ptrVar('prev', prev)]),
          highlightedElements: [`node-${cur}`],
          highlightedLines: [LINES.deleteWhile],
          variables: { cur, prev: prev ?? 'NULL', 'cur->data': n.value },
        };
        if (n.value === value) {
          target = n;
          break;
        }
        prev = cur;
        cur = n.next;
        yield {
          id: `del-adv-${cur ?? 'null'}`,
          description: `prev = cur，cur = cur->next`,
          state: buildListState(head, nodes, cur ? [cur] : [], defaultStatus),
          memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('cur', cur), ptrVar('prev', prev)]),
          highlightedElements: [],
          highlightedLines: [...LINES.deleteAdvance],
          variables: { cur: cur ?? 'NULL', prev },
        };
      }
      if (!target) {
        yield {
          id: `del-notfound-${value}`,
          description: `未找到值为 ${value} 的结点，无需删除`,
          state: buildListState(head, nodes, [], defaultStatus),
          memory: buildMemory(nodes, [ptrVar('head', head)]),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '未找到' },
        };
      } else {
        const targetAddr = target.address;
        if (prev === null) {
          head = target.next;
        } else {
          nodes.get(prev)!.next = target.next;
        }
        yield {
          id: `del-relink-${targetAddr}`,
          description: `重链：${prev === null ? 'head' : `结点 ${prev} 的 next`} 指向 ${target.next ?? 'NULL'}`,
          state: buildListState(head, nodes, [], { [targetAddr]: 'error' }),
          memory: buildMemory(nodes, [ptrVar('head', head), ptrVar('prev', prev)]),
          highlightedElements: [`node-${targetAddr}`],
          highlightedLines: [...LINES.relink],
          variables: { head: head ?? 'NULL', prev: prev ?? 'NULL' },
        };
        target.freed = true;
        yield {
          id: `del-free-${targetAddr}`,
          description: `free(cur)：释放结点 ${targetAddr}（值 ${value}）`,
          state: buildListState(head, nodes, [], {}),
          memory: buildMemory(nodes, [ptrVar('head', head)]),
          highlightedElements: [],
          highlightedLines: [LINES.free],
          variables: { 已释放: targetAddr },
        };
      }
    } else if (cmd.op === 'clear') {
      let cur: string | null = head;
      while (cur) {
        const n: HeapNode = nodes.get(cur)!;
        const next = n.next;
        n.freed = true;
        yield {
          id: `clear-${cur}`,
          description: `释放结点 ${cur}`,
          state: buildListState(head, nodes, [], {}),
          memory: buildMemory(nodes, [ptrVar('head', head)]),
          highlightedElements: [],
          highlightedLines: [LINES.free],
          variables: { 已释放: cur },
        };
        cur = next;
      }
      head = null;
      yield {
        id: 'cleared',
        description: '链表已清空，head = NULL',
        state: buildListState(head, nodes, [], {}),
        memory: buildMemory(nodes, [ptrVar('head', null)]),
        highlightedElements: [],
        highlightedLines: [],
        variables: { head: 'NULL' },
      };
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: buildListState(head, nodes, [], {}),
    memory: buildMemory(nodes, [ptrVar('head', head)]),
    highlightedElements: [],
    highlightedLines: [],
    variables: { head: head ?? 'NULL' },
  };
}

export const singlyLinkedListModule: AlgorithmModule<LinkedListState, ListCommand[]> = {
  meta: {
    id: 'linear-list.singly-linked',
    name: '单链表',
    nameEn: 'Singly Linked List',
    chapter: 'linear-list',
    order: 2,
    summary: '通过指针串联的链式存储，直观展示 Node* 与堆内存结点关系。',
    coreIdea:
      '单链表用「结点」存储数据，每个结点含数据域 data 与指针域 next，指向下一个结点；通过头指针 head 访问整条链表。本模块同步展示栈帧中的指针变量与堆内存中结点的对应关系。',
    operationSteps: [
      '头插：Node* p = new Node(v) 创建新结点 → p->next = head 连接 → head = p 更新头指针。',
      '查找：从 head 出发，用 cur 指针逐个比较，匹配则返回。',
      '删除：用 cur/prev 双指针定位目标结点，重链后 free 释放。',
      '清空：依次 free 所有结点，head 置 NULL。',
    ],
    useCases: ['需要频繁插入/删除、不要求随机访问的场景', '链式存储教学基础', '栈与队列的链式实现基础'],
    complexity: {
      time: { best: 'O(1) 头插', average: 'O(n) 查找/删除', worst: 'O(n)' },
      space: 'O(n)',
    },
    stable: undefined,
    pros: ['插入删除 O(1)（已知位置）', '无需预先分配、可动态增长', '内存利用率灵活'],
    cons: ['不支持随机访问，查找 O(n)', '每个结点需额外指针空间', '无法逆向遍历'],
    examPoints: [
      '头插法建表得到的结点顺序与插入顺序相反。',
      '删除结点需要记录前驱指针 prev。',
      '链表访问第 i 个元素需从头遍历，时间复杂度 O(n)。',
      '头指针 head 是访问链表的唯一入口。',
    ],
    variableDocs: [
      { name: 'head', meaning: '头指针，指向第一个结点' },
      { name: 'p', meaning: '新结点指针（头插时指向新建结点）' },
      { name: 'cur', meaning: '当前遍历指针' },
      { name: 'prev', meaning: '前驱指针（删除时用）' },
      { name: 'next', meaning: '结点的指针域，指向下一结点' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      {
        key: 'ops',
        label: '操作序列',
        type: 'string',
        placeholder: 'insert 20, insert 30, search 30, delete 20',
      },
    ],
    defaultInput: 'insert 20, insert 30, insert 10, search 30, delete 20',
    implemented: true,
    visualizer: 'linked-list',
  },
  generateSteps: singlyLinkedListSteps,
  parseInput,
  createInitialState,
};
