/**
 * 循环双向链表（Circular Doubly Linked List）
 *
 * 双向链表 + 循环：头结点 prev 指向尾结点、尾结点 next 指向头结点，双向成环。
 * 头插、尾插、按值删除。展示 prev/next 双指针与头尾双向回环。
 * 操作脚本：insert(头插) / append(尾插) / delete(按值)。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 60 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { LinkedListState } from './types';
import { parseCommandScript } from './commands';
import { buildListState, buildMemory, createAddrAllocator, ptrVar, type HeapNode } from './linked-shared';

/* ---------------- 参考代码（60 行，三语言对齐） ---------------- */
const cLines = [
  'typedef struct Node {',
  '    int data;',
  '    struct Node* prev;',
  '    struct Node* next;',
  '} Node;',
  '',
  '// 头插法',
  'void insertHead(Node** head, int value) {',
  '    Node* p = (Node*)malloc(sizeof(Node));',
  '    p->data = value;',
  '    if (*head == NULL) {',
  '        p->prev = p;',
  '        p->next = p;',
  '        *head = p;',
  '    } else {',
  '        Node* tail = (*head)->prev;',
  '        p->next = *head;',
  '        p->prev = tail;',
  '        tail->next = p;',
  '        (*head)->prev = p;',
  '        *head = p;',
  '    }',
  '}',
  '',
  '// 尾插法',
  'void insertTail(Node** head, int value) {',
  '    Node* p = (Node*)malloc(sizeof(Node));',
  '    p->data = value;',
  '    if (*head == NULL) {',
  '        p->prev = p;',
  '        p->next = p;',
  '        *head = p;',
  '    } else {',
  '        Node* tail = (*head)->prev;',
  '        p->next = *head;',
  '        p->prev = tail;',
  '        tail->next = p;',
  '        (*head)->prev = p;',
  '    }',
  '}',
  '',
  '// 删除值为 value 的结点',
  'void deleteNode(Node** head, int value) {',
  '    if (*head == NULL) return;',
  '    Node* cur = *head;',
  '    do {',
  '        if (cur->data == value) {',
  '            if (cur->next == cur) {     // 唯一结点',
  '                *head = NULL;',
  '            } else {',
  '                cur->prev->next = cur->next;',
  '                cur->next->prev = cur->prev;',
  '                if (cur == *head) *head = cur->next;',
  '            }',
  '            free(cur);',
  '            return;',
  '        }',
  '        cur = cur->next;',
  '    } while (cur != *head);',
  '}',
];

const cppLines = [
  'struct Node {',
  '    int data;',
  '    Node* prev;',
  '    Node* next;',
  '};',
  '',
  '// 头插法',
  'void insertHead(Node*& head, int value) {',
  '    Node* p = new Node();',
  '    p->data = value;',
  '    if (head == nullptr) {',
  '        p->prev = p;',
  '        p->next = p;',
  '        head = p;',
  '    } else {',
  '        Node* tail = head->prev;',
  '        p->next = head;',
  '        p->prev = tail;',
  '        tail->next = p;',
  '        head->prev = p;',
  '        head = p;',
  '    }',
  '}',
  '',
  '// 尾插法',
  'void insertTail(Node*& head, int value) {',
  '    Node* p = new Node();',
  '    p->data = value;',
  '    if (head == nullptr) {',
  '        p->prev = p;',
  '        p->next = p;',
  '        head = p;',
  '    } else {',
  '        Node* tail = head->prev;',
  '        p->next = head;',
  '        p->prev = tail;',
  '        tail->next = p;',
  '        head->prev = p;',
  '    }',
  '}',
  '',
  '// 删除值为 value 的结点',
  'void deleteNode(Node*& head, int value) {',
  '    if (head == nullptr) return;',
  '    Node* cur = head;',
  '    do {',
  '        if (cur->data == value) {',
  '            if (cur->next == cur) {     // 唯一结点',
  '                head = nullptr;',
  '            } else {',
  '                cur->prev->next = cur->next;',
  '                cur->next->prev = cur->prev;',
  '                if (cur == head) head = cur->next;',
  '            }',
  '            delete cur;',
  '            return;',
  '        }',
  '        cur = cur->next;',
  '    } while (cur != head);',
  '}',
];

const pseudoLines = [
  '结点结构 Node:',
  '    data 域',
  '    prev 指针域',
  '    next 指针域',
  '结束结构',
  '',
  '// 头插法',
  '函数 insertHead(head, value):',
  '    p ← 新建结点',
  '    p.data ← value',
  '    if head = NULL then',
  '        p.prev ← p',
  '        p.next ← p',
  '        head ← p',
  '    else',
  '        tail ← head.prev',
  '        p.next ← head',
  '        p.prev ← tail',
  '        tail.next ← p',
  '        head.prev ← p',
  '        head ← p',
  '    end if',
  '结束函数',
  '',
  '// 尾插法',
  '函数 insertTail(head, value):',
  '    p ← 新建结点',
  '    p.data ← value',
  '    if head = NULL then',
  '        p.prev ← p',
  '        p.next ← p',
  '        head ← p',
  '    else',
  '        tail ← head.prev',
  '        p.next ← head',
  '        p.prev ← tail',
  '        tail.next ← p',
  '        head.prev ← p',
  '    end if',
  '结束函数',
  '',
  '// 删除值为 value 的结点',
  '函数 deleteNode(head, value):',
  '    if head = NULL then return',
  '    cur ← head',
  '    do',
  '        if cur.data = value then',
  '            if cur.next = cur then     // 唯一结点',
  '                head ← NULL',
  '            else',
  '                cur.prev.next ← cur.next',
  '                cur.next.prev ← cur.prev',
  '                if cur = head then head ← cur.next',
  '            end if',
  '            释放 cur',
  '            return',
  '        end if',
  '        cur ← cur.next',
  '    while cur ≠ head',
  '结束函数',
];

const LINES = {
  insHeadNew: [9, 10],
  insHeadSelf: [12, 13, 14],
  insHeadTail: 16,
  insHeadLink: [17, 18],
  insHeadRelink: [19, 20],
  insHeadUpdate: 21,
  insTailNew: [27, 28],
  insTailSelf: [30, 31, 32],
  insTailTail: 34,
  insTailLink: [35, 36],
  insTailRelink: [37, 38],
  delEmpty: 44,
  delInit: [45, 46],
  delCmp: 47,
  delOnly: [48, 49],
  delRelink: [51, 52],
  delHeadUpdate: 53,
  delFree: 55,
  delAdvance: 58,
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
  return { nodes: [], headId: null, tailId: null, kind: 'circular-doubly', headLabel: 'head', tailLabel: 'tail', highlighted: [], status: {} };
}

function* circularDoublyLinkedListSteps(input: Command[]): Generator<AlgorithmStep<LinkedListState>> {
  const nodes = new Map<string, HeapNode>();
  let head: string | null = null;
  const newAddr = createAddrAllocator();

  // 循环双向：head.prev 即尾结点
  const tailOf = () => (head ? (nodes.get(head)!.prev ?? null) : null);

  const build = (highlighted: string[] = [], status: Record<string, 'new' | 'current' | 'done' | 'error'> = {}) =>
    buildListState({ head, nodes, highlighted, status, kind: 'circular-doubly', tailId: tailOf(), headLabel: 'head', tailLabel: 'tail' });
  const mem = (vars: ReturnType<typeof ptrVar>[]) => buildMemory(nodes, vars, true);

  yield {
    id: 'init',
    description: '初始状态：空循环双向链表，head = NULL',
    state: build(),
    memory: mem([ptrVar('head', null)]),
    highlightedElements: [],
    highlightedLines: [],
    variables: { head: 'NULL' },
  };

  for (const cmd of input) {
    if (cmd.op === 'insert' || cmd.op === 'append') {
      const value = cmd.value as number;
      const isHeadInsert = cmd.op === 'insert';
      const addr = newAddr();
      const newNode: HeapNode = { address: addr, value, prev: null, next: null };
      nodes.set(addr, newNode);
      const L = isHeadInsert
        ? { self: LINES.insHeadSelf, tail: LINES.insHeadTail, link: LINES.insHeadLink, relink: LINES.insHeadRelink, update: [LINES.insHeadUpdate] }
        : { self: LINES.insTailSelf, tail: LINES.insTailTail, link: LINES.insTailLink, relink: LINES.insTailRelink, update: [] as number[] };
      const newLines = isHeadInsert ? LINES.insHeadNew : LINES.insTailNew;

      yield {
        id: `${isHeadInsert ? 'ih' : 'it'}-new-${addr}`,
        description: `Node* p = new Node(${value})：堆中创建新结点 ${addr}`,
        state: build([], { [addr]: 'new' }),
        memory: mem([ptrVar('head', head), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...newLines],
        variables: { p: addr, value },
      };

      if (head === null) {
        newNode.prev = addr;
        newNode.next = addr;
        head = addr;
        yield {
          id: `${isHeadInsert ? 'ih' : 'it'}-self-${addr}`,
          description: `空表：p->prev = p，p->next = p（自环），head = p`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [...L.self],
          variables: { head: addr, 'p->next': addr },
        };
      } else {
        const tail = nodes.get(head)!.prev as string;
        yield {
          id: `${isHeadInsert ? 'ih' : 'it'}-tail-${addr}`,
          description: `tail = head->prev：头结点 ${head} 的 prev 指向尾结点 ${tail}`,
          state: build([], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr), ptrVar('tail', tail)]),
          highlightedElements: [`node-${tail}`],
          highlightedLines: [L.tail],
          variables: { tail, p: addr },
        };

        newNode.next = head;
        newNode.prev = tail;
        yield {
          id: `${isHeadInsert ? 'ih' : 'it'}-link-${addr}`,
          description: `p->next = head，p->prev = tail`,
          state: build([], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr), ptrVar('tail', tail)]),
          highlightedElements: [],
          highlightedLines: [...L.link],
          variables: { p: addr, 'p->next': head, 'p->prev': tail },
        };

        nodes.get(tail)!.next = addr;
        nodes.get(head)!.prev = addr;
        yield {
          id: `${isHeadInsert ? 'ih' : 'it'}-relink-${addr}`,
          description: `tail->next = p，head->prev = p（尾 ${tail} 与新结点 ${addr} 相连）`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr), ptrVar('tail', tail)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [...L.relink],
          variables: { tail, 'tail->next': addr, 'head->prev': addr },
        };

        if (isHeadInsert) {
          head = addr;
          yield {
            id: `ih-update-${addr}`,
            description: `head = p：头指针更新为新结点 ${addr}`,
            state: build([addr], { [addr]: 'new' }),
            memory: mem([ptrVar('head', head), ptrVar('p', addr)]),
            highlightedElements: [`node-${addr}`],
            highlightedLines: [...L.update],
            variables: { head: addr, value },
          };
        }
      }
    } else {
      const value = cmd.value as number;
      if (head === null) {
        yield {
          id: `del-empty-${value}`,
          description: `空循环双向链表，无法删除 ${value}`,
          state: build(),
          memory: mem([ptrVar('head', null)]),
          highlightedElements: [],
          highlightedLines: [LINES.delEmpty],
          variables: { 结果: '空表' },
        };
        continue;
      }

      let cur: string = head;
      yield {
        id: `del-init-${value}`,
        description: `删除 ${value}：cur = head = ${head}`,
        state: build(),
        memory: mem([ptrVar('head', head), ptrVar('cur', cur)]),
        highlightedElements: [],
        highlightedLines: [...LINES.delInit],
        variables: { cur, 目标: value },
      };

      let done = false;
      do {
        const node: HeapNode = nodes.get(cur)!;
        yield {
          id: `del-cmp-${cur}`,
          description: `比较 cur->data=${node.value} 与目标 ${value}`,
          state: build([cur], { [cur]: 'current' }),
          memory: mem([ptrVar('head', head), ptrVar('cur', cur)]),
          highlightedElements: [`node-${cur}`],
          highlightedLines: [LINES.delCmp],
          variables: { cur, 'cur->data': node.value, 目标: value },
        };

        if (node.value === value) {
          if (node.next === cur) {
            // 唯一结点
            head = null;
            yield {
              id: `del-only-${cur}`,
              description: `唯一结点：head = NULL，链表清空`,
              state: build(),
              memory: mem([ptrVar('head', null), ptrVar('cur', cur)]),
              highlightedElements: [],
              highlightedLines: [...LINES.delOnly],
              variables: { head: 'NULL' },
            };
          } else {
            const prevNode: HeapNode = nodes.get(node.prev as string)!;
            const nextNode: HeapNode = nodes.get(node.next as string)!;
            const wasHead = cur === head;
            prevNode.next = node.next;
            nextNode.prev = node.prev;
            if (wasHead) head = node.next;
            yield {
              id: `del-relink-${cur}`,
              description: `重链：结点 ${node.prev} 的 next → ${node.next}，结点 ${node.next} 的 prev → ${node.prev}${wasHead ? `，head 更新为 ${node.next}` : ''}`,
              state: build([cur], { [cur]: 'error' }),
              memory: mem([ptrVar('head', head), ptrVar('cur', cur)]),
              highlightedElements: [`node-${cur}`],
              highlightedLines: [...LINES.delRelink, ...(wasHead ? [LINES.delHeadUpdate] : [])],
              variables: { 'cur->prev': node.prev, 'cur->next': node.next, head: head ?? 'NULL' },
            };
          }
          nodes.get(cur)!.freed = true;
          yield {
            id: `del-free-${cur}`,
            description: `free(cur)：释放结点 ${cur}（值 ${value}）`,
            state: build(),
            memory: mem([ptrVar('head', head)]),
            highlightedElements: [],
            highlightedLines: [LINES.delFree],
            variables: { 已释放: cur },
          };
          done = true;
          break;
        }

        cur = node.next as string;
        yield {
          id: `del-adv-${cur}`,
          description: `cur = cur->next：移动到 ${cur}`,
          state: build(),
          memory: mem([ptrVar('head', head), ptrVar('cur', cur)]),
          highlightedElements: [],
          highlightedLines: [LINES.delAdvance],
          variables: { cur },
        };
      } while (cur !== head);

      if (!done) {
        yield {
          id: `del-notfound-${value}`,
          description: `遍历一圈，未找到值为 ${value} 的结点`,
          state: build(),
          memory: mem([ptrVar('head', head)]),
          highlightedElements: [],
          highlightedLines: [],
          variables: { 结果: '未找到' },
        };
      }
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: build(),
    memory: mem([ptrVar('head', head)]),
    highlightedElements: [],
    highlightedLines: [],
    variables: { head: head ?? 'NULL' },
  };
}

export const circularDoublyLinkedListModule: AlgorithmModule<LinkedListState, Command[]> = {
  meta: {
    id: 'linear-list.circular-doubly-linked',
    name: '循环双向链表',
    nameEn: 'Circular Doubly Linked List',
    chapter: 'linear-list',
    order: 5,
    summary: '双向链表两端相连成环，从任一结点可双向遍历全表。',
    coreIdea:
      '循环双向链表是双向链表与循环链表的结合：头结点的 prev 指向尾结点、尾结点的 next 指向头结点，prev/next 双向成环。因此从任意结点出发，向前或向后都能遍历整张表，且头尾操作都可在 O(1) 完成。',
    operationSteps: [
      '头插：p->next=head、p->prev=tail（head->prev），再 tail->next=p、head->prev=p，最后 head=p（空表时自环）。',
      '尾插：p->next=head、p->prev=tail，再 tail->next=p、head->prev=p（head 不变，新结点成为尾）。',
      '删除：定位 cur，cur->prev->next=cur->next、cur->next->prev=cur->prev，删头则 head 更新，唯一结点则置空。',
    ],
    useCases: ['需要双向循环遍历的场景', '约瑟夫环的优化', '操作系统的循环调度、环形结构建模'],
    complexity: {
      time: { best: 'O(1) 头尾插入删除', average: 'O(n) 按值查找删除', worst: 'O(n)' },
      space: 'O(n)（两个指针域）',
    },
    pros: ['从任意结点双向遍历', '头尾插入删除 O(1)', '无需 NULL 特殊处理'],
    cons: ['每个结点两个指针域，空间开销最大', '实现最复杂', '遍历需防死循环'],
    examPoints: [
      '循环双向链表 head->prev 即尾结点，tail->next 即头结点。',
      '空表判 head==NULL；单结点时 prev、next 均指向自身。',
      '头尾插入删除均为 O(1)。',
    ],
    variableDocs: [
      { name: 'head', meaning: '头指针，指向首结点' },
      { name: 'tail', meaning: '尾结点（head->prev）' },
      { name: 'p', meaning: '新结点指针' },
      { name: 'cur', meaning: '删除时的遍历游标' },
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
  generateSteps: circularDoublyLinkedListSteps,
  parseInput,
  createInitialState,
};
