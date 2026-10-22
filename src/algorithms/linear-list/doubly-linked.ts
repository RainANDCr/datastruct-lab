/**
 * 双向链表（Doubly Linked List）
 *
 * 每个结点含 prev / data / next 三个域，支持双向遍历。
 * 头插、尾插、按值删除；展示 head / tail 指针与 prev / next 双指针关系。
 * 操作脚本：insert(头插) / append(尾插) / delete(按值)。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 38 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { LinkedListState } from './types';
import { parseCommandScript } from './commands';
import { buildListState, buildMemory, createAddrAllocator, ptrVar, type HeapNode } from './linked-shared';

/* ---------------- 参考代码（38 行，三语言对齐） ---------------- */
const cLines = [
  'typedef struct Node {',
  '    int data;',
  '    struct Node* prev;',
  '    struct Node* next;',
  '} Node;',
  '',
  '// 头插法：新结点插入到链表最前',
  'void insertHead(Node** head, Node** tail, int value) {',
  '    Node* p = (Node*)malloc(sizeof(Node));',
  '    p->data = value;',
  '    p->prev = NULL;',
  '    p->next = *head;',
  '    if (*head) (*head)->prev = p;',
  '    else *tail = p;',
  '    *head = p;',
  '}',
  '',
  '// 尾插法：新结点插入到链表最后',
  'void insertTail(Node** head, Node** tail, int value) {',
  '    Node* p = (Node*)malloc(sizeof(Node));',
  '    p->data = value;',
  '    p->next = NULL;',
  '    p->prev = *tail;',
  '    if (*tail) (*tail)->next = p;',
  '    else *head = p;',
  '    *tail = p;',
  '}',
  '',
  '// 删除值为 value 的结点',
  'void deleteNode(Node** head, Node** tail, int value) {',
  '    Node* cur = *head;',
  '    while (cur && cur->data != value) cur = cur->next;',
  '    if (!cur) return;',
  '    if (cur->prev) cur->prev->next = cur->next;',
  '    else *head = cur->next;',
  '    if (cur->next) cur->next->prev = cur->prev;',
  '    else *tail = cur->prev;',
  '    free(cur);',
  '}',
];

const cppLines = [
  'struct Node {',
  '    int data;',
  '    Node* prev;',
  '    Node* next;',
  '};',
  '',
  '// 头插法：新结点插入到链表最前',
  'void insertHead(Node*& head, Node*& tail, int value) {',
  '    Node* p = new Node();',
  '    p->data = value;',
  '    p->prev = nullptr;',
  '    p->next = head;',
  '    if (head) head->prev = p;',
  '    else tail = p;',
  '    head = p;',
  '}',
  '',
  '// 尾插法：新结点插入到链表最后',
  'void insertTail(Node*& head, Node*& tail, int value) {',
  '    Node* p = new Node();',
  '    p->data = value;',
  '    p->next = nullptr;',
  '    p->prev = tail;',
  '    if (tail) tail->next = p;',
  '    else head = p;',
  '    tail = p;',
  '}',
  '',
  '// 删除值为 value 的结点',
  'void deleteNode(Node*& head, Node*& tail, int value) {',
  '    Node* cur = head;',
  '    while (cur && cur->data != value) cur = cur->next;',
  '    if (!cur) return;',
  '    if (cur->prev) cur->prev->next = cur->next;',
  '    else head = cur->next;',
  '    if (cur->next) cur->next->prev = cur->prev;',
  '    else tail = cur->prev;',
  '    delete cur;',
  '}',
];

const pseudoLines = [
  '结点结构 Node:',
  '    data 域',
  '    prev 指针域',
  '    next 指针域',
  '结束结构',
  '',
  '// 头插法：新结点插入到链表最前',
  '函数 insertHead(head, tail, value):',
  '    p ← 新建结点',
  '    p.data ← value',
  '    p.prev ← NULL',
  '    p.next ← head',
  '    if head ≠ NULL then head.prev ← p',
  '    else tail ← p',
  '    head ← p',
  '结束函数',
  '',
  '// 尾插法：新结点插入到链表最后',
  '函数 insertTail(head, tail, value):',
  '    p ← 新建结点',
  '    p.data ← value',
  '    p.next ← NULL',
  '    p.prev ← tail',
  '    if tail ≠ NULL then tail.next ← p',
  '    else head ← p',
  '    tail ← p',
  '结束函数',
  '',
  '// 删除值为 value 的结点',
  '函数 deleteNode(head, tail, value):',
  '    cur ← head',
  '    while cur ≠ NULL 且 cur.data ≠ value do cur ← cur.next',
  '    if cur = NULL then return',
  '    if cur.prev ≠ NULL then cur.prev.next ← cur.next',
  '    else head ← cur.next',
  '    if cur.next ≠ NULL then cur.next.prev ← cur.prev',
  '    else tail ← cur.prev',
  '    释放 cur',
  '结束函数',
];

const LINES = {
  insHeadNew: [9, 10],
  insHeadPrevNext: [11, 12],
  insHeadLinkPrev: 13,
  insHeadElseTail: 14,
  insHeadUpdate: 15,
  insTailNew: [20, 21],
  insTailNextPrev: [22, 23],
  insTailLinkNext: 24,
  insTailElseHead: 25,
  insTailUpdate: 26,
  delInit: 31,
  delWhile: 32,
  delNotFound: 33,
  delRelinkPrev: [34, 35],
  delRelinkNext: [36, 37],
  delFree: 38,
} as const;

type Op = 'insert' | 'append' | 'delete';
interface Command {
  op: Op;
  value?: number;
}

function parseInput(raw: string): ParseResult<Command[]> {
  const parsed = parseCommandScript(raw);
  if (!parsed.ok) return parsed;
  const commands: Command[] = [];
  for (const c of parsed.value) {
    if (c.cmd === 'insert') {
      if (c.args.length !== 1) return { ok: false, error: '"insert" 需要一个参数（头插，如 insert 10）' };
      commands.push({ op: 'insert', value: c.args[0] });
    } else if (c.cmd === 'append') {
      if (c.args.length !== 1) return { ok: false, error: '"append" 需要一个参数（尾插，如 append 30）' };
      commands.push({ op: 'append', value: c.args[0] });
    } else if (c.cmd === 'delete' || c.cmd === 'remove') {
      if (c.args.length !== 1) return { ok: false, error: '"delete" 需要一个参数（按值删除）' };
      commands.push({ op: 'delete', value: c.args[0] });
    } else {
      return { ok: false, error: `未知命令 "${c.cmd}"（支持 insert / append / delete）` };
    }
  }
  if (commands.length > 12) return { ok: false, error: '命令过多（最多 12 条）' };
  return { ok: true, value: commands };
}

function createInitialState(): LinkedListState {
  return { nodes: [], headId: null, tailId: null, kind: 'doubly', headLabel: 'head', tailLabel: 'tail', highlighted: [], status: {} };
}

function* doublyLinkedListSteps(input: Command[]): Generator<AlgorithmStep<LinkedListState>> {
  const nodes = new Map<string, HeapNode>();
  let head: string | null = null;
  let tail: string | null = null;
  const newAddr = createAddrAllocator();

  const build = (highlighted: string[] = [], status: Record<string, 'new' | 'current' | 'done' | 'error'> = {}) =>
    buildListState({ head, nodes, highlighted, status, kind: 'doubly', tailId: tail, headLabel: 'head', tailLabel: 'tail' });
  const mem = (vars: ReturnType<typeof ptrVar>[]) => buildMemory(nodes, vars, true);
  const baseVars = () => [ptrVar('head', head), ptrVar('tail', tail)];

  yield {
    id: 'init',
    description: '初始状态：空链表，head = tail = NULL',
    state: build(),
    memory: mem(baseVars()),
    highlightedElements: [],
    highlightedLines: [],
    variables: { head: 'NULL', tail: 'NULL' },
  };

  for (const cmd of input) {
    if (cmd.op === 'insert') {
      const value = cmd.value as number;
      const addr = newAddr();
      const newNode: HeapNode = { address: addr, value, prev: null, next: null };
      nodes.set(addr, newNode);

      yield {
        id: `ih-new-${addr}`,
        description: `Node* p = new Node(${value})：堆中创建新结点 ${addr}`,
        state: build([], { [addr]: 'new' }),
        memory: mem([...baseVars(), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...LINES.insHeadNew],
        variables: { p: addr, value },
      };

      newNode.next = head;
      yield {
        id: `ih-set-${addr}`,
        description: `p->prev = NULL，p->next = head（${head ?? 'NULL'}）`,
        state: build([], { [addr]: 'new' }),
        memory: mem([...baseVars(), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...LINES.insHeadPrevNext],
        variables: { p: addr, 'p->next': head ?? 'NULL' },
      };

      if (head !== null) {
        nodes.get(head)!.prev = addr;
        yield {
          id: `ih-linkprev-${addr}`,
          description: `head->prev = p：原头结点 ${head} 的 prev 指向新结点 ${addr}`,
          state: build([], { [addr]: 'new' }),
          memory: mem([...baseVars(), ptrVar('p', addr)]),
          highlightedElements: [],
          highlightedLines: [LINES.insHeadLinkPrev],
          variables: { head, 'head->prev': addr },
        };
      } else {
        tail = addr;
        yield {
          id: `ih-settail-${addr}`,
          description: `空表：tail = p，新结点 ${addr} 既是头也是尾`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([...baseVars(), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [LINES.insHeadElseTail],
          variables: { tail: addr },
        };
      }

      head = addr;
      yield {
        id: `ih-update-${addr}`,
        description: `head = p：头指针更新为新结点 ${addr}`,
        state: build([addr], { [addr]: 'new' }),
        memory: mem([...baseVars(), ptrVar('p', addr)]),
        highlightedElements: [`node-${addr}`],
        highlightedLines: [LINES.insHeadUpdate],
        variables: { head: addr, value },
      };
    } else if (cmd.op === 'append') {
      const value = cmd.value as number;
      const addr = newAddr();
      const newNode: HeapNode = { address: addr, value, prev: null, next: null };
      nodes.set(addr, newNode);

      yield {
        id: `it-new-${addr}`,
        description: `Node* p = new Node(${value})：堆中创建新结点 ${addr}`,
        state: build([], { [addr]: 'new' }),
        memory: mem([...baseVars(), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...LINES.insTailNew],
        variables: { p: addr, value },
      };

      newNode.prev = tail;
      yield {
        id: `it-set-${addr}`,
        description: `p->next = NULL，p->prev = tail（${tail ?? 'NULL'}）`,
        state: build([], { [addr]: 'new' }),
        memory: mem([...baseVars(), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...LINES.insTailNextPrev],
        variables: { p: addr, 'p->prev': tail ?? 'NULL' },
      };

      if (tail !== null) {
        nodes.get(tail)!.next = addr;
        yield {
          id: `it-linknext-${addr}`,
          description: `tail->next = p：原尾结点 ${tail} 的 next 指向新结点 ${addr}`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([...baseVars(), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [LINES.insTailLinkNext],
          variables: { tail, 'tail->next': addr },
        };
      } else {
        head = addr;
        yield {
          id: `it-sethead-${addr}`,
          description: `空表：head = p，新结点 ${addr} 既是头也是尾`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([...baseVars(), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [LINES.insTailElseHead],
          variables: { head: addr },
        };
      }

      tail = addr;
      yield {
        id: `it-update-${addr}`,
        description: `tail = p：尾指针更新为新结点 ${addr}`,
        state: build([addr], { [addr]: 'new' }),
        memory: mem([...baseVars(), ptrVar('p', addr)]),
        highlightedElements: [`node-${addr}`],
        highlightedLines: [LINES.insTailUpdate],
        variables: { tail: addr, value },
      };
    } else {
      const value = cmd.value as number;
      let cur: string | null = head;
      yield {
        id: `del-init-${value}`,
        description: `删除 ${value}：cur = head = ${head ?? 'NULL'}`,
        state: build(),
        memory: mem([...baseVars(), ptrVar('cur', cur)]),
        highlightedElements: [],
        highlightedLines: [LINES.delInit],
        variables: { cur: cur ?? 'NULL', 目标: value },
      };

      let target: string | null = null;
      while (cur !== null) {
        const node = nodes.get(cur)!;
        yield {
          id: `del-cmp-${cur}`,
          description: `比较 cur->data=${node.value} 与目标 ${value}`,
          state: build([cur], { [cur]: 'current' }),
          memory: mem([...baseVars(), ptrVar('cur', cur)]),
          highlightedElements: [`node-${cur}`],
          highlightedLines: [LINES.delWhile],
          variables: { cur, 'cur->data': node.value, 目标: value },
        };
        if (node.value === value) {
          target = cur;
          break;
        }
        cur = node.next;
        yield {
          id: `del-adv-${cur ?? 'null'}`,
          description: `cur = cur->next：移动到 ${cur ?? 'NULL'}`,
          state: build(),
          memory: mem([...baseVars(), ptrVar('cur', cur)]),
          highlightedElements: [],
          highlightedLines: [LINES.delWhile],
          variables: { cur: cur ?? 'NULL' },
        };
      }

      if (target === null) {
        yield {
          id: `del-notfound-${value}`,
          description: `未找到值为 ${value} 的结点，无需删除`,
          state: build(),
          memory: mem(baseVars()),
          highlightedElements: [],
          highlightedLines: [LINES.delNotFound],
          variables: { 结果: '未找到' },
        };
      } else {
        const tnode: HeapNode = nodes.get(target)!;
        const tPrev: string | null = tnode.prev ?? null;
        const tNext: string | null = tnode.next;
        if (tPrev !== null) {
          nodes.get(tPrev)!.next = tNext;
        } else {
          head = tNext;
        }
        yield {
          id: `del-prev-${target}`,
          description: `重链前驱：${tPrev !== null ? `结点 ${tPrev} 的 next` : 'head'} 指向 ${tNext ?? 'NULL'}`,
          state: build([target], { [target]: 'error' }),
          memory: mem([...baseVars(), ptrVar('cur', target)]),
          highlightedElements: [`node-${target}`],
          highlightedLines: [...LINES.delRelinkPrev],
          variables: { head: head ?? 'NULL' },
        };

        if (tNext !== null) {
          nodes.get(tNext)!.prev = tPrev;
        } else {
          tail = tPrev;
        }
        yield {
          id: `del-next-${target}`,
          description: `重链后继：${tNext !== null ? `结点 ${tNext} 的 prev` : 'tail'} 指向 ${tPrev ?? 'NULL'}`,
          state: build([target], { [target]: 'error' }),
          memory: mem([...baseVars(), ptrVar('cur', target)]),
          highlightedElements: [`node-${target}`],
          highlightedLines: [...LINES.delRelinkNext],
          variables: { tail: tail ?? 'NULL' },
        };

        nodes.get(target)!.freed = true;
        yield {
          id: `del-free-${target}`,
          description: `free(cur)：释放结点 ${target}（值 ${value}）`,
          state: build(),
          memory: mem(baseVars()),
          highlightedElements: [],
          highlightedLines: [LINES.delFree],
          variables: { 已释放: target },
        };
      }
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: build(),
    memory: mem(baseVars()),
    highlightedElements: [],
    highlightedLines: [],
    variables: { head: head ?? 'NULL', tail: tail ?? 'NULL' },
  };
}

export const doublyLinkedListModule: AlgorithmModule<LinkedListState, Command[]> = {
  meta: {
    id: 'linear-list.doubly-linked',
    name: '双向链表',
    nameEn: 'Doubly Linked List',
    chapter: 'linear-list',
    order: 4,
    summary: '每个结点含 prev/next 双指针，可双向遍历，头尾各有指针。',
    coreIdea:
      '双向链表每个结点含 prev、data、next 三个域，既可向后遍历也可向前回溯；配合 head、tail 指针，在头尾插入删除均为 O(1)。删除某结点时需同时更新其前驱的 next 与后继的 prev。',
    operationSteps: [
      '头插：新结点 prev=NULL、next=head，若原头存在则其 prev 指向新结点，最后 head 更新。',
      '尾插：新结点 next=NULL、prev=tail，若原尾存在则其 next 指向新结点，最后 tail 更新。',
      '删除：先查找定位 cur，再更新 cur->prev->next 与 cur->next->prev（注意头尾边界），最后 free。',
    ],
    useCases: ['需要双向遍历或频繁在两端插入删除', 'LRU 缓存等', '需要前驱回溯的场景'],
    complexity: {
      time: { best: 'O(1) 两端插入删除', average: 'O(n) 查找', worst: 'O(n)' },
      space: 'O(n)（两个指针域开销更大）',
    },
    pros: ['可双向遍历', '两端插入删除 O(1)', '删除已知结点 O(1)（无需找前驱）'],
    cons: ['每个结点多一个指针域', '实现更复杂', '空间开销更大'],
    examPoints: [
      '双向链表结点比单链表多一个 prev 指针域。',
      '删除结点需同时改前驱的 next 与后继的 prev。',
      '双向链表在已知结点的删除为 O(1)。',
    ],
    variableDocs: [
      { name: 'head', meaning: '头指针，指向首结点' },
      { name: 'tail', meaning: '尾指针，指向末结点' },
      { name: 'p', meaning: '新结点指针' },
      { name: 'cur', meaning: '删除时的遍历指针' },
      { name: 'prev', meaning: '结点的前驱指针域' },
      { name: 'next', meaning: '结点的后继指针域' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '操作序列', type: 'string', placeholder: 'insert 10, insert 20, append 30, delete 20' },
    ],
    defaultInput: 'insert 10, insert 20, append 30, delete 20',
    implemented: true,
    visualizer: 'linked-list',
  },
  generateSteps: doublyLinkedListSteps,
  parseInput,
  createInitialState,
};
