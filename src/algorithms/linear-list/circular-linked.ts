/**
 * 循环单链表（Circular Singly Linked List）
 *
 * 尾结点的 next 指回头结点，构成一个环。头插、尾插、按值删除。
 * 展示 head / tail 指针与「尾结点 next → 头结点」的回环关系。
 * 操作脚本：insert(头插) / append(尾插) / delete(按值)。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 59 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { LinkedListState } from './types';
import { parseCommandScript } from './commands';
import { buildListState, buildMemory, createAddrAllocator, ptrVar, type HeapNode } from './linked-shared';

/* ---------------- 参考代码（59 行，三语言对齐） ---------------- */
const cLines = [
  'typedef struct Node {',
  '    int data;',
  '    struct Node* next;',
  '} Node;',
  '',
  '// 头插法：新结点成为新头',
  'void insertHead(Node** head, int value) {',
  '    Node* p = (Node*)malloc(sizeof(Node));',
  '    p->data = value;',
  '    if (*head == NULL) {',
  '        *head = p;',
  '        p->next = p;          // 单结点自环',
  '    } else {',
  '        Node* tail = *head;',
  '        while (tail->next != *head) tail = tail->next;  // 找到尾结点',
  '        p->next = *head;',
  '        tail->next = p;',
  '        *head = p;',
  '    }',
  '}',
  '',
  '// 尾插法：新结点插入到末尾',
  'void insertTail(Node** head, int value) {',
  '    Node* p = (Node*)malloc(sizeof(Node));',
  '    p->data = value;',
  '    if (*head == NULL) {',
  '        *head = p;',
  '        p->next = p;',
  '    } else {',
  '        Node* tail = *head;',
  '        while (tail->next != *head) tail = tail->next;',
  '        tail->next = p;',
  '        p->next = *head;',
  '    }',
  '}',
  '',
  '// 删除值为 value 的结点',
  'void deleteNode(Node** head, int value) {',
  '    if (*head == NULL) return;',
  '    Node *cur = *head, *prev = NULL;',
  '    while (cur->data != value && cur->next != *head) {',
  '        prev = cur;',
  '        cur = cur->next;',
  '    }',
  '    if (cur->data != value) return;  // 未找到',
  '    if (prev == NULL) {              // 删除头结点',
  '        if (cur->next == cur)        // 唯一结点',
  '            *head = NULL;',
  '        else {',
  '            Node* tail = cur;',
  '            while (tail->next != *head) tail = tail->next;',
  '            *head = cur->next;',
  '            tail->next = *head;',
  '        }',
  '    } else {',
  '        prev->next = cur->next;      // 删除非头结点',
  '    }',
  '    free(cur);',
  '}',
];

const cppLines = [
  'struct Node {',
  '    int data;',
  '    Node* next;',
  '};',
  '',
  '// 头插法：新结点成为新头',
  'void insertHead(Node*& head, int value) {',
  '    Node* p = new Node();',
  '    p->data = value;',
  '    if (head == nullptr) {',
  '        head = p;',
  '        p->next = p;          // 单结点自环',
  '    } else {',
  '        Node* tail = head;',
  '        while (tail->next != head) tail = tail->next;  // 找到尾结点',
  '        p->next = head;',
  '        tail->next = p;',
  '        head = p;',
  '    }',
  '}',
  '',
  '// 尾插法：新结点插入到末尾',
  'void insertTail(Node*& head, int value) {',
  '    Node* p = new Node();',
  '    p->data = value;',
  '    if (head == nullptr) {',
  '        head = p;',
  '        p->next = p;',
  '    } else {',
  '        Node* tail = head;',
  '        while (tail->next != head) tail = tail->next;',
  '        tail->next = p;',
  '        p->next = head;',
  '    }',
  '}',
  '',
  '// 删除值为 value 的结点',
  'void deleteNode(Node*& head, int value) {',
  '    if (head == nullptr) return;',
  '    Node *cur = head, *prev = nullptr;',
  '    while (cur->data != value && cur->next != head) {',
  '        prev = cur;',
  '        cur = cur->next;',
  '    }',
  '    if (cur->data != value) return;  // 未找到',
  '    if (prev == nullptr) {           // 删除头结点',
  '        if (cur->next == cur)        // 唯一结点',
  '            head = nullptr;',
  '        else {',
  '            Node* tail = cur;',
  '            while (tail->next != head) tail = tail->next;',
  '            head = cur->next;',
  '            tail->next = head;',
  '        }',
  '    } else {',
  '        prev->next = cur->next;      // 删除非头结点',
  '    }',
  '    delete cur;',
  '}',
];

const pseudoLines = [
  '结点结构 Node:',
  '    data 域',
  '    next 指针域',
  '结束结构',
  '',
  '// 头插法：新结点成为新头',
  '函数 insertHead(head, value):',
  '    p ← 新建结点',
  '    p.data ← value',
  '    if head = NULL then',
  '        head ← p',
  '        p.next ← p          // 单结点自环',
  '    else',
  '        tail ← head',
  '        while tail.next ≠ head do tail ← tail.next',
  '        p.next ← head',
  '        tail.next ← p',
  '        head ← p',
  '    end if',
  '结束函数',
  '',
  '// 尾插法：新结点插入到末尾',
  '函数 insertTail(head, value):',
  '    p ← 新建结点',
  '    p.data ← value',
  '    if head = NULL then',
  '        head ← p',
  '        p.next ← p',
  '    else',
  '        tail ← head',
  '        while tail.next ≠ head do tail ← tail.next',
  '        tail.next ← p',
  '        p.next ← head',
  '    end if',
  '结束函数',
  '',
  '// 删除值为 value 的结点',
  '函数 deleteNode(head, value):',
  '    if head = NULL then return',
  '    cur ← head, prev ← NULL',
  '    while cur.data ≠ value 且 cur.next ≠ head do',
  '        prev ← cur',
  '        cur ← cur.next',
  '    end while',
  '    if cur.data ≠ value then return  // 未找到',
  '    if prev = NULL then              // 删除头结点',
  '        if cur.next = cur then       // 唯一结点',
  '            head ← NULL',
  '        else',
  '            tail ← cur',
  '            while tail.next ≠ head do tail ← tail.next',
  '            head ← cur.next',
  '            tail.next ← head',
  '        end if',
  '    else',
  '        prev.next ← cur.next         // 删除非头结点',
  '    end if',
  '    释放 cur',
  '结束函数',
];

const LINES = {
  insHeadNew: [8, 9],
  insHeadSelf: [11, 12],
  insHeadFindTail: 15,
  insHeadRelink: [16, 17],
  insHeadUpdate: 18,
  insTailNew: [24, 25],
  insTailSelf: [27, 28],
  insTailFindTail: 31,
  insTailRelink: [32, 33],
  delEmpty: 39,
  delInit: 40,
  delScan: [41, 42, 43],
  delNotFound: 45,
  delHeadOnly: [47, 48],
  delHeadFindTail: 51,
  delHeadRelink: [52, 53],
  delMid: 56,
  delFree: 58,
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
  return { nodes: [], headId: null, tailId: null, kind: 'circular', headLabel: 'head', tailLabel: 'tail', highlighted: [], status: {} };
}

function* circularLinkedListSteps(input: Command[]): Generator<AlgorithmStep<LinkedListState>> {
  const nodes = new Map<string, HeapNode>();
  let head: string | null = null;
  const newAddr = createAddrAllocator();

  // 从头结点出发沿 next 找到尾结点（next == head 者）
  const findTail = (h: string): string => {
    let t = h;
    while (nodes.get(t)!.next !== h) t = nodes.get(t)!.next as string;
    return t;
  };
  const tailNow = () => (head ? findTail(head) : null);

  const build = (highlighted: string[] = [], status: Record<string, 'new' | 'current' | 'done' | 'error'> = {}) =>
    buildListState({ head, nodes, highlighted, status, kind: 'circular', tailId: tailNow(), headLabel: 'head', tailLabel: 'tail' });
  const mem = (vars: ReturnType<typeof ptrVar>[]) => buildMemory(nodes, vars, false);

  yield {
    id: 'init',
    description: '初始状态：空循环链表，head = NULL',
    state: build(),
    memory: mem([ptrVar('head', null)]),
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
        id: `ih-new-${addr}`,
        description: `Node* p = new Node(${value})：堆中创建新结点 ${addr}`,
        state: build([], { [addr]: 'new' }),
        memory: mem([ptrVar('head', head), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...LINES.insHeadNew],
        variables: { p: addr, value },
      };

      if (head === null) {
        head = addr;
        newNode.next = addr;
        yield {
          id: `ih-self-${addr}`,
          description: `空表：head = p，且 p->next = p（单结点自环）`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [...LINES.insHeadSelf],
          variables: { head: addr, 'p->next': addr },
        };
      } else {
        const tail = findTail(head);
        yield {
          id: `ih-findtail-${addr}`,
          description: `tail 从 head 出发，循环移动直至 tail->next == head，找到尾结点 ${tail}`,
          state: build([], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr), ptrVar('tail', tail)]),
          highlightedElements: [`node-${tail}`],
          highlightedLines: [LINES.insHeadFindTail],
          variables: { tail, p: addr },
        };

        newNode.next = head;
        nodes.get(tail)!.next = addr;
        yield {
          id: `ih-relink-${addr}`,
          description: `p->next = head，tail->next = p（${tail} 的 next 指向新结点 ${addr}）`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr), ptrVar('tail', tail)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [...LINES.insHeadRelink],
          variables: { tail, 'tail->next': addr },
        };

        head = addr;
        yield {
          id: `ih-update-${addr}`,
          description: `head = p：头指针更新为新结点 ${addr}`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [LINES.insHeadUpdate],
          variables: { head: addr, value },
        };
      }
    } else if (cmd.op === 'append') {
      const value = cmd.value as number;
      const addr = newAddr();
      const newNode: HeapNode = { address: addr, value, next: null };
      nodes.set(addr, newNode);

      yield {
        id: `it-new-${addr}`,
        description: `Node* p = new Node(${value})：堆中创建新结点 ${addr}`,
        state: build([], { [addr]: 'new' }),
        memory: mem([ptrVar('head', head), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...LINES.insTailNew],
        variables: { p: addr, value },
      };

      if (head === null) {
        head = addr;
        newNode.next = addr;
        yield {
          id: `it-self-${addr}`,
          description: `空表：head = p，且 p->next = p（单结点自环）`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [...LINES.insTailSelf],
          variables: { head: addr, 'p->next': addr },
        };
      } else {
        const tail = findTail(head);
        yield {
          id: `it-findtail-${addr}`,
          description: `tail 从 head 出发，循环移动直至 tail->next == head，找到尾结点 ${tail}`,
          state: build([], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr), ptrVar('tail', tail)]),
          highlightedElements: [`node-${tail}`],
          highlightedLines: [LINES.insTailFindTail],
          variables: { tail, p: addr },
        };

        nodes.get(tail)!.next = addr;
        newNode.next = head;
        yield {
          id: `it-relink-${addr}`,
          description: `tail->next = p（${tail} 的 next 指向新结点 ${addr}），p->next = head`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('head', head), ptrVar('p', addr), ptrVar('tail', tail)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [...LINES.insTailRelink],
          variables: { tail, 'tail->next': addr },
        };
      }
    } else {
      const value = cmd.value as number;
      if (head === null) {
        yield {
          id: `del-empty-${value}`,
          description: `空循环链表，无法删除 ${value}`,
          state: build(),
          memory: mem([ptrVar('head', null)]),
          highlightedElements: [],
          highlightedLines: [LINES.delEmpty],
          variables: { 结果: '空表' },
        };
        continue;
      }

      let cur: string | null = head;
      let prev: string | null = null;
      yield {
        id: `del-init-${value}`,
        description: `删除 ${value}：cur = head，prev = NULL`,
        state: build(),
        memory: mem([ptrVar('head', head), ptrVar('cur', cur), ptrVar('prev', prev)]),
        highlightedElements: [],
        highlightedLines: [LINES.delInit],
        variables: { cur: cur ?? 'NULL', prev: 'NULL' },
      };

      let target: string | null = null;
      while (nodes.get(cur!)!.value !== value && nodes.get(cur!)!.next !== head) {
        yield {
          id: `del-cmp-${cur}`,
          description: `比较 cur->data=${nodes.get(cur!)!.value} 与目标 ${value}`,
          state: build([cur!], { [cur!]: 'current' }),
          memory: mem([ptrVar('head', head), ptrVar('cur', cur), ptrVar('prev', prev)]),
          highlightedElements: [`node-${cur}`],
          highlightedLines: [...LINES.delScan],
          variables: { cur: cur!, 'cur->data': nodes.get(cur!)!.value },
        };
        prev = cur;
        cur = nodes.get(cur!)!.next;
        yield {
          id: `del-adv-${cur}`,
          description: `prev = cur，cur = cur->next（移动到 ${cur}）`,
          state: build(),
          memory: mem([ptrVar('head', head), ptrVar('cur', cur), ptrVar('prev', prev)]),
          highlightedElements: [],
          highlightedLines: [...LINES.delScan],
          variables: { cur: cur!, prev: prev ?? 'NULL' },
        };
      }

      // 定位最终 cur（可能是目标或绕回 head）
      const finalCur = cur as string;
      const finalNode = nodes.get(finalCur)!;
      if (finalNode.value === value) {
        target = finalCur;
      } else {
        yield {
          id: `del-notfound-${value}`,
          description: `遍历一圈，未找到值为 ${value} 的结点`,
          state: build(),
          memory: mem([ptrVar('head', head)]),
          highlightedElements: [],
          highlightedLines: [LINES.delNotFound],
          variables: { 结果: '未找到' },
        };
        continue;
      }

      const tNode = nodes.get(target)!;
      if (prev === null) {
        // 删除头结点
        if (tNode.next === target) {
          // 唯一结点
          head = null;
          yield {
            id: `del-only-${target}`,
            description: `唯一结点：head = NULL，链表清空`,
            state: build(),
            memory: mem([ptrVar('head', null), ptrVar('cur', target)]),
            highlightedElements: [],
            highlightedLines: [...LINES.delHeadOnly],
            variables: { head: 'NULL' },
          };
        } else {
          const tail = findTail(target);
          yield {
            id: `del-head-findtail-${target}`,
            description: `删除头结点：先找到尾结点 ${tail}`,
            state: build([target], { [target]: 'error' }),
            memory: mem([ptrVar('head', head), ptrVar('cur', target), ptrVar('tail', tail)]),
            highlightedElements: [`node-${tail}`],
            highlightedLines: [LINES.delHeadFindTail],
            variables: { tail },
          };
          head = tNode.next;
          nodes.get(tail)!.next = head;
          yield {
            id: `del-head-relink-${target}`,
            description: `head = cur->next（${head}），tail->next = head（尾结点 ${tail} 的 next 指向新头）`,
            state: build([target], { [target]: 'error' }),
            memory: mem([ptrVar('head', head), ptrVar('cur', target)]),
            highlightedElements: [`node-${head as string}`],
            highlightedLines: [...LINES.delHeadRelink],
            variables: { head: head as string, 已删除: target },
          };
        }
      } else {
        nodes.get(prev)!.next = tNode.next;
        yield {
          id: `del-mid-${target}`,
          description: `prev->next = cur->next：结点 ${prev} 的 next 跳过 ${target}，指向 ${tNode.next ?? 'NULL'}`,
          state: build([target], { [target]: 'error' }),
          memory: mem([ptrVar('head', head), ptrVar('cur', target), ptrVar('prev', prev)]),
          highlightedElements: [`node-${target}`],
          highlightedLines: [LINES.delMid],
          variables: { prev, 'prev->next': tNode.next ?? 'NULL' },
        };
      }

      nodes.get(target)!.freed = true;
      yield {
        id: `del-free-${target}`,
        description: `free(cur)：释放结点 ${target}（值 ${value}）`,
        state: build(),
        memory: mem([ptrVar('head', head)]),
        highlightedElements: [],
        highlightedLines: [LINES.delFree],
        variables: { 已释放: target },
      };
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

export const circularLinkedListModule: AlgorithmModule<LinkedListState, Command[]> = {
  meta: {
    id: 'linear-list.circular-linked',
    name: '循环单链表',
    nameEn: 'Circular Singly Linked List',
    chapter: 'linear-list',
    order: 3,
    summary: '尾结点 next 指回头结点形成环，可从任意结点遍历全表。',
    coreIdea:
      '循环单链表与单链表唯一的区别是：尾结点的 next 不再指向 NULL，而是指回头结点，形成一个环。因此从任意结点出发都能遍历整张表；判空用 head==NULL，判尾用 tail->next==head。',
    operationSteps: [
      '头插：新结点 next=head，找到尾结点并使其 next 指向新结点，最后 head 更新（空表时结点自环）。',
      '尾插：找到尾结点，tail->next=p、p->next=head（空表时结点自环）。',
      '删除：定位 cur 与 prev；删头结点需更新 head 并让新尾指向新头，删非头结点只需 prev->next 跳过。',
    ],
    useCases: ['需要循环遍历的场景', '约瑟夫环问题', '循环调度', '环形缓冲区'],
    complexity: {
      time: { best: 'O(1) 头插', average: 'O(n) 尾插/删除（找尾）', worst: 'O(n)' },
      space: 'O(n)',
    },
    pros: ['从任意结点可遍历全表', '无需对尾结点作特殊 NULL 处理'],
    cons: ['找尾结点需遍历 O(n)（无尾指针时）', '遍历需小心死循环'],
    examPoints: [
      '循环单链表的判空：head == NULL；判尾：tail->next == head。',
      '单结点时 next 指向自身（自环）。',
      '删除头结点需同时更新尾结点的 next。',
    ],
    variableDocs: [
      { name: 'head', meaning: '头指针，指向首结点' },
      { name: 'tail', meaning: '尾结点（next 指向 head）' },
      { name: 'p', meaning: '新结点指针' },
      { name: 'cur', meaning: '遍历/删除游标' },
      { name: 'prev', meaning: '删除时 cur 的前驱' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '操作序列', type: 'string', placeholder: 'insert 10, insert 20, append 30, delete 20' },
    ],
    defaultInput: 'insert 10, insert 20, append 30, delete 20',
    implemented: true,
    visualizer: 'linked-list',
  },
  generateSteps: circularLinkedListSteps,
  parseInput,
  createInitialState,
};
