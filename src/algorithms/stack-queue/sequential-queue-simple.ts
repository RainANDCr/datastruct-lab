/**
 * 顺序队列（Sequential Queue，非循环）
 *
 * 数组实现的普通队列：front 指向队头、rear 指向队尾，队尾入队、队头出队。
 * 关键教学点：出队后 front 前进、rear 只增不减，当 rear 到末尾时会「假溢出」
 * （前面有空位却无法入队），由此引出循环队列。
 * 操作脚本：enqueue v / dequeue。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 15 行）。
 */
import type { AlgorithmModule, AlgorithmStep, ParseResult } from '@/engine/types';
import type { ArrayState } from '../linear-list/types';
import { parseCommandScript } from '../linear-list/commands';

const MAX = 8;

const cLines = [
  '#define MAX 8',
  'int queue[MAX];',
  'int front = 0, rear = -1;   // 队头、队尾指针',
  '',
  '// 入队',
  'void enqueue(int value) {',
  '    if (rear == MAX - 1) return;  // 队满（假溢出）',
  '    queue[++rear] = value;',
  '}',
  '',
  '// 出队',
  'int dequeue() {',
  '    if (front > rear) return -1;   // 队空',
  '    return queue[front++];',
  '}',
];

const cppLines = [
  'const int MAX = 8;',
  'int queue[MAX];',
  'int front = 0, rear = -1;   // 队头、队尾指针',
  '',
  '// 入队',
  'void enqueue(int value) {',
  '    if (rear == MAX - 1) return;  // 队满（假溢出）',
  '    queue[++rear] = value;',
  '}',
  '',
  '// 出队',
  'int dequeue() {',
  '    if (front > rear) return -1;   // 队空',
  '    return queue[front++];',
  '}',
];

const pseudoLines = [
  '常量 MAX ← 8',
  '队列数组 queue[0..MAX-1]',
  'front ← 0, rear ← -1   // 队头、队尾指针',
  '',
  '// 入队',
  '函数 enqueue(value):',
  '    if rear = MAX-1 then return   // 队满（假溢出）',
  '    rear ← rear+1, queue[rear] ← value',
  '结束函数',
  '',
  '// 出队',
  '函数 dequeue():',
  '    if front > rear then return -1   // 队空',
  '    取出 queue[front], front ← front+1',
  '结束函数',
];

const LINES = {
  enqFull: 7,
  enqWrite: 8,
  deqEmpty: 13,
  deqTake: 14,
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

function makeState(items: (number | null)[], front: number, rear: number, highlighted: number[]): ArrayState {
  const markers: { label: string; index: number }[] = [];
  if (front >= 0 && front < MAX) markers.push({ label: 'front', index: front });
  if (rear >= 0 && rear < MAX) markers.push({ label: 'rear', index: rear });
  const size = front <= rear ? rear - front + 1 : 0;
  return { items: [...items], highlighted, markers, info: { front, rear, 大小: size } };
}

function createInitialState(): ArrayState {
  return makeState(new Array<number | null>(MAX).fill(null), 0, -1, []);
}

function* sequentialQueueSteps(input: QueueCommand[]): Generator<AlgorithmStep<ArrayState>> {
  const queue: (number | null)[] = new Array<number | null>(MAX).fill(null);
  let front = 0;
  let rear = -1;

  yield {
    id: 'init',
    description: '初始状态：空队，front = 0，rear = -1',
    state: makeState(queue, front, rear, []),
    highlightedElements: [],
    highlightedLines: [],
    variables: { front, rear: -1 },
  };

  for (const cmd of input) {
    if (cmd.op === 'enqueue') {
      const value = cmd.value as number;
      if (rear >= MAX - 1) {
        yield {
          id: 'enq-full',
          description: `队满（rear=${rear} 已到末尾），无法入队 ${value}。注意：下标 0..${front - 1} 其实有空位 —— 这就是「假溢出」`,
          state: makeState(queue, front, rear, []),
          highlightedElements: [],
          highlightedLines: [LINES.enqFull],
          variables: { front, rear, 结果: '假溢出' },
        };
        continue;
      }
      rear += 1;
      queue[rear] = value;
      yield {
        id: `enq-${rear}`,
        description: `入队 ${value}：rear 移动到 ${rear}，queue[${rear}] = ${value}`,
        state: makeState(queue, front, rear, [rear]),
        highlightedElements: [`cell-${rear}`],
        highlightedLines: [LINES.enqWrite],
        variables: { front, rear, value },
      };
    } else {
      if (front > rear) {
        yield {
          id: 'deq-empty',
          description: `队空（front=${front} > rear=${rear}），无法出队`,
          state: makeState(queue, front, rear, []),
          highlightedElements: [],
          highlightedLines: [LINES.deqEmpty],
          variables: { front, rear, 结果: '队空' },
        };
        continue;
      }
      const value = queue[front] as number;
      queue[front] = null;
      yield {
        id: `deq-${front}`,
        description: `出队 ${value}：取出 queue[${front}]，front 后移（下标 ${front} 将不再复用）`,
        state: makeState(queue, front, rear, [front]),
        highlightedElements: [`cell-${front}`],
        highlightedLines: [LINES.deqTake],
        variables: { front, rear, 出队: value },
      };
      front += 1;
      yield {
        id: `deq-adv-${front}`,
        description: `front = ${front}：队头指针后移`,
        state: makeState(queue, front, rear, []),
        highlightedElements: [],
        highlightedLines: [LINES.deqTake],
        variables: { front, rear },
      };
    }
  }

  yield {
    id: 'done',
    description: '操作执行完毕',
    state: makeState(queue, front, rear, []),
    highlightedElements: [],
    highlightedLines: [],
    variables: { front, rear },
  };
}

export const sequentialQueueModule: AlgorithmModule<ArrayState, QueueCommand[]> = {
  meta: {
    id: 'stack-queue.seq-queue',
    name: '顺序队列',
    nameEn: 'Sequential Queue',
    chapter: 'stack-queue',
    order: 3,
    summary: '数组实现的普通队列，front/rear 单向移动，会假溢出。',
    coreIdea:
      '顺序队列用数组存储，front 指向队头、rear 指向队尾：入队 rear 后移写入，出队 front 后移取出。因 rear 只增不减，多次出队后 front 前移、rear 已到末尾，即使前面有空位也无法入队——这就是「假溢出」，正是引入循环队列的动机。',
    operationSteps: [
      '入队 enqueue：rear 后移并写入 queue[rear]。',
      '出队 dequeue：取出 queue[front]，front 后移。',
      '队空：front > rear；队满：rear == MAX-1（假溢出点）。',
    ],
    useCases: ['理解队列 FIFO 特性', '引出循环队列的假溢出问题', '简单队列建模'],
    complexity: {
      time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
      space: 'O(n)',
    },
    pros: ['入队出队 O(1)', '实现简单、直观'],
    cons: ['rear 只增不减，产生假溢出', '容量固定', '出队后的空间无法复用'],
    examPoints: [
      '队列特性：先进先出（FIFO）。',
      '顺序队列队空 front > rear，队满 rear == MAX-1。',
      '假溢出：front 前有空位但 rear 已到末尾，无法继续入队；用循环队列解决。',
    ],
    variableDocs: [
      { name: 'front', meaning: '队头指针，指向队头元素下标' },
      { name: 'rear', meaning: '队尾指针，指向队尾元素下标' },
      { name: 'MAX', meaning: '队列最大容量' },
    ],
    code: { c: cLines.join('\n'), cpp: cppLines.join('\n'), pseudocode: pseudoLines.join('\n') },
    inputSchema: [
      { key: 'ops', label: '操作序列', type: 'string', placeholder: 'enqueue 10, enqueue 20, dequeue, enqueue 30' },
    ],
    defaultInput: 'enqueue 10, enqueue 20, enqueue 30, enqueue 40, enqueue 50, enqueue 60, enqueue 70, enqueue 80, dequeue, dequeue, enqueue 90',
    implemented: true,
    visualizer: 'queue',
  },
  generateSteps: sequentialQueueSteps,
  parseInput,
  createInitialState,
};
