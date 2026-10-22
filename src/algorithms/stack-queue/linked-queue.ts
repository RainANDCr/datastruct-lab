/**
 * 链队列（Linked Queue）
 *
 * 链式存储的队列：front 指向队头、rear 指向队尾，队尾入队、队头出队。
 * 复用链表渲染器与内存快照，展示 front / rear / p 指针与堆内存结点关系。
 * 操作脚本：enqueue v / dequeue。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 31 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { LinkedListState } from '../linear-list/types';
import { parseCommandScript } from '../linear-list/commands';
import { buildListState, buildMemory, createAddrAllocator, ptrVar, type HeapNode } from '../linear-list/linked-shared';

/* ---------------- 参考代码（31 行，三语言对齐） ---------------- */
const cLines = [
  'typedef struct Node {',
  '    int data;',
  '    struct Node* next;',
  '} Node;',
  '',
  'Node* front = NULL;',
  'Node* rear = NULL;',
  '',
  '// 入队',
  'void enqueue(int value) {',
  '    Node* p = (Node*)malloc(sizeof(Node));',
  '    p->data = value;',
  '    p->next = NULL;',
  '    if (rear == NULL) {',
  '        front = rear = p;',
  '    } else {',
  '        rear->next = p;',
  '        rear = p;',
  '    }',
  '}',
  '',
  '// 出队',
  'int dequeue() {',
  '    if (front == NULL) return -1;  // 队空',
  '    Node* p = front;',
  '    int value = p->data;',
  '    front = front->next;',
  '    if (front == NULL) rear = NULL;',
  '    free(p);',
  '    return value;',
  '}',
];

const cppLines = [
  'struct Node {',
  '    int data;',
  '    Node* next;',
  '};',
  '',
  'Node* front = nullptr;',
  'Node* rear = nullptr;',
  '',
  '// 入队',
  'void enqueue(int value) {',
  '    Node* p = new Node();',
  '    p->data = value;',
  '    p->next = nullptr;',
  '    if (rear == nullptr) {',
  '        front = rear = p;',
  '    } else {',
  '        rear->next = p;',
  '        rear = p;',
  '    }',
  '}',
  '',
  '// 出队',
  'int dequeue() {',
  '    if (front == nullptr) return -1;  // 队空',
  '    Node* p = front;',
  '    int value = p->data;',
  '    front = front->next;',
  '    if (front == nullptr) rear = nullptr;',
  '    delete p;',
  '    return value;',
  '}',
];

const pseudoLines = [
  '结点结构 Node:',
  '    data 域',
  '    next 指针域',
  '结束结构',
  '',
  'front ← NULL',
  'rear ← NULL',
  '',
  '// 入队',
  '函数 enqueue(value):',
  '    p ← 新建结点',
  '    p.data ← value',
  '    p.next ← NULL',
  '    if rear = NULL then',
  '        front ← p, rear ← p',
  '    else',
  '        rear.next ← p',
  '        rear ← p',
  '    end if',
  '结束函数',
  '',
  '// 出队',
  '函数 dequeue():',
  '    if front = NULL then return -1  // 队空',
  '    p ← front',
  '    value ← p.data',
  '    front ← front.next',
  '    if front = NULL then rear ← NULL',
  '    释放 p',
  '    return value',
  '结束函数',
];

const LINES = {
  enqNew: [11, 12, 13],
  enqEmpty: [14, 15],
  enqLink: [17, 18],
  deqEmpty: 24,
  deqTake: [25, 26],
  deqAdvance: 27,
  deqRearReset: 28,
  deqFree: 29,
} as const;

type QueueOp = 'enqueue' | 'dequeue';
interface QueueCommand {
  op: QueueOp;
  value?: number;
}

function parseInput(raw: string): ParseResult<QueueCommand[]> {
  const parsed = parseCommandScript(raw);
  if (!parsed.ok) return parsed;
  const commands: QueueCommand[] = [];
  for (const c of parsed.value) {
    if (c.cmd === 'enqueue' || c.cmd === 'enq') {
      if (c.args.length !== 1) return { ok: false, error: '"enqueue" 需要一个参数（如 enqueue 10）' };
      commands.push({ op: 'enqueue', value: c.args[0] });
    } else if (c.cmd === 'dequeue' || c.cmd === 'deq') {
      commands.push({ op: 'dequeue' });
    } else {
      return { ok: false, error: `未知命令 "${c.cmd}"（支持 enqueue / dequeue）` };
    }
  }
  return { ok: true, value: commands };
}

function createInitialState(): LinkedListState {
  return {
    nodes: [],
    headId: null,
    tailId: null,
    kind: 'singly',
    headLabel: 'front',
    tailLabel: 'rear',
    highlighted: [],
    status: {},
  };
}

function* linkedQueueSteps(input: QueueCommand[]): Generator<AlgorithmStep<LinkedListState>> {
  const nodes = new Map<string, HeapNode>();
  let front: string | null = null;
  let rear: string | null = null;
  const newAddr = createAddrAllocator();

  const build = (highlighted: string[] = [], status: Record<string, 'new' | 'current' | 'done' | 'error'> = {}) =>
    buildListState({ head: front, nodes, highlighted, status, kind: 'singly', tailId: rear, headLabel: 'front', tailLabel: 'rear' });
  const mem = (vars: ReturnType<typeof ptrVar>[]) => buildMemory(nodes, vars, false);

  yield {
    id: 'init',
    description: '初始状态：空队，front = rear = NULL',
    state: build(),
    memory: mem([ptrVar('front', null), ptrVar('rear', null)]),
    highlightedElements: [],
    highlightedLines: [],
    variables: { front: 'NULL', rear: 'NULL' },
  };

  for (const cmd of input) {
    if (cmd.op === 'enqueue') {
      const value = cmd.value as number;
      const addr = newAddr();
      const newNode: HeapNode = { address: addr, value, next: null };
      nodes.set(addr, newNode);

      yield {
        id: `enq-new-${addr}`,
        description: `Node* p = new Node(${value})：堆中创建新结点 ${addr}，p->next = NULL`,
        state: build([], { [addr]: 'new' }),
        memory: mem([ptrVar('front', front), ptrVar('rear', rear), ptrVar('p', addr)]),
        highlightedElements: [],
        highlightedLines: [...LINES.enqNew],
        variables: { p: addr, value },
      };

      if (rear === null) {
        front = addr;
        rear = addr;
        yield {
          id: `enq-first-${addr}`,
          description: `空队：front = rear = p，队头队尾都指向 ${addr}`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('front', front), ptrVar('rear', rear), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [...LINES.enqEmpty],
          variables: { front: addr, rear: addr },
        };
      } else {
        nodes.get(rear)!.next = addr;
        yield {
          id: `enq-link-${addr}`,
          description: `rear->next = p：原队尾 ${rear} 的 next 指向新结点 ${addr}`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('front', front), ptrVar('rear', rear), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [LINES.enqLink[0]],
          variables: { rear, 'rear->next': addr },
        };
        rear = addr;
        yield {
          id: `enq-update-${addr}`,
          description: `rear = p：队尾指针更新为 ${addr}`,
          state: build([addr], { [addr]: 'new' }),
          memory: mem([ptrVar('front', front), ptrVar('rear', rear), ptrVar('p', addr)]),
          highlightedElements: [`node-${addr}`],
          highlightedLines: [LINES.enqLink[1]],
          variables: { rear: addr },
        };
      }
    } else {
      if (front === null) {
        yield {
          id: 'deq-empty',
          description: '队空（front = NULL），无法出队',
          state: build(),
          memory: mem([ptrVar('front', null), ptrVar('rear', null)]),
          highlightedElements: [],
          highlightedLines: [],
          variables: { front: 'NULL', rear: 'NULL', 结果: '队空' },
        };
        continue;
      }
      const p: string = front;
      const value = nodes.get(p)!.value;
      yield {
        id: `deq-take-${p}`,
        description: `p = front：取出队头结点 ${p}（值 ${value}）`,
        state: build([p], { [p]: 'current' }),
        memory: mem([ptrVar('front', front), ptrVar('rear', rear), ptrVar('p', p)]),
        highlightedElements: [`node-${p}`],
        highlightedLines: [...LINES.deqTake],
        variables: { p, 'p->data': value },
      };

      front = nodes.get(p)!.next;
      yield {
        id: `deq-advance-${p}`,
        description: `front = front->next：队头指针后移为 ${front ?? 'NULL'}`,
        state: build(),
        memory: mem([ptrVar('front', front), ptrVar('rear', rear), ptrVar('p', p)]),
        highlightedElements: [],
        highlightedLines: [LINES.deqAdvance],
        variables: { front: front ?? 'NULL', p },
      };

      if (front === null) rear = null;
      if (front === null) {
        yield {
          id: `deq-last-${p}`,
          description: `队空：front = NULL，rear = NULL`,
          state: build(),
          memory: mem([ptrVar('front', null), ptrVar('rear', null), ptrVar('p', p)]),
          highlightedElements: [],
          highlightedLines: [LINES.deqRearReset],
          variables: { front: 'NULL', rear: 'NULL' },
        };
      }

      nodes.get(p)!.freed = true;
      yield {
        id: `deq-free-${p}`,
        description: `free(p)：释放结点 ${p}（值 ${value}）`,
        state: build(),
        memory: mem([ptrVar('front', front), ptrVar('rear', rear), ptrVar('p', p)]),
        highlightedElements: [],
        highlightedLines: [LINES.deqFree],
        variables: { 出队: value, 已释放: p },
      };
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: build(),
    memory: mem([ptrVar('front', front), ptrVar('rear', rear)]),
    highlightedElements: [],
    highlightedLines: [],
    variables: { front: front ?? 'NULL', rear: rear ?? 'NULL' },
  };
}

export const linkedQueueModule: AlgorithmModule<LinkedListState, QueueCommand[]> = {
  meta: {
    id: 'stack-queue.linked-queue',
    name: '链队列',
    nameEn: 'Linked Queue',
    chapter: 'stack-queue',
    order: 5,
    summary: '用链表实现的队列，front/rear 双指针，队尾入队、队头出队。',
    coreIdea:
      '链队列用 front 指向队头、rear 指向队尾：入队在 rear 端插入新结点并更新 rear，出队删除 front 端结点并前移 front。因两端各有指针，入队出队均为 O(1)，且无假溢出问题。',
    operationSteps: [
      '入队 enqueue：Node* p = new Node(v) → 若队空则 front=rear=p，否则 rear->next=p 后 rear=p。',
      '出队 dequeue：先判队空（front==NULL），再 front=front->next，并 free 原队头。',
      '出队后若 front 变 NULL，需同时将 rear 置 NULL。',
    ],
    useCases: ['任务调度', '广度优先搜索', '消息队列', '需要动态容量的队列场景'],
    complexity: {
      time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
      space: 'O(n)（含指针开销）',
    },
    pros: ['入队出队 O(1)', '无队满、无假溢出', '容量动态'],
    cons: ['每个结点需额外指针空间', '无随机访问'],
    examPoints: [
      '链队列入队出队均为 O(1)。',
      '队空条件 front == NULL（或 rear == NULL）。',
      '出队删到空时需将 rear 也置 NULL。',
    ],
    variableDocs: [
      { name: 'front', meaning: '队头指针，指向队头结点' },
      { name: 'rear', meaning: '队尾指针，指向队尾结点' },
      { name: 'p', meaning: '临时指针（入队指向新结点，出队指向待释放结点）' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '操作序列', type: 'string', placeholder: 'enqueue 10, enqueue 20, dequeue, enqueue 30' },
    ],
    defaultInput: 'enqueue 10, enqueue 20, enqueue 30, dequeue, enqueue 40',
    implemented: true,
    visualizer: 'linked-list',
  },
  generateSteps: linkedQueueSteps,
  parseInput,
  createInitialState,
};
