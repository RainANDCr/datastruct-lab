import { describe, expect, it } from 'vitest';
import { sequentialListModule } from '@/algorithms/linear-list/sequential';
import { singlyLinkedListModule } from '@/algorithms/linear-list/singly-linked';
import type { ArrayState, LinkedListState } from '@/algorithms/linear-list/types';
import { circularQueueModule } from '@/algorithms/stack-queue/sequential-queue';
import { sequentialStackModule } from '@/algorithms/stack-queue/sequential-stack';
import type { AlgorithmModule } from '@/engine/types';
import { collectSteps } from '@/engine/step-generator';

function lastState<TState, TInput>(mod: AlgorithmModule<TState, TInput>, input: TInput) {
  const steps = collectSteps(mod, input);
  return steps[steps.length - 1].state;
}

function parse<T>(mod: { parseInput: (s: string) => { ok: true; value: T } | { ok: false } }, input: string): T {
  const r = mod.parseInput(input);
  if (!r.ok) throw new Error('parse failed');
  return r.value;
}

describe('单链表（含内存快照）', () => {
  it('头插法建表（顺序与插入相反）', () => {
    const state = lastState(singlyLinkedListModule, parse(singlyLinkedListModule, 'insert 20, insert 30, insert 10')) as LinkedListState;
    expect(state.nodes.map((n) => n.value)).toEqual([10, 30, 20]);
  });

  it('删除结点正确重链', () => {
    const state = lastState(singlyLinkedListModule, parse(singlyLinkedListModule, 'insert 20, insert 30, delete 20')) as LinkedListState;
    expect(state.nodes.map((n) => n.value)).toEqual([30]);
  });

  it('查找命中', () => {
    const steps = collectSteps(singlyLinkedListModule, parse(singlyLinkedListModule, 'insert 20, insert 30, search 30'));
    const found = steps.some((s) => s.description.includes('找到'));
    expect(found).toBe(true);
  });

  it('算法步骤携带内存快照（堆结点数量正确）', () => {
    const steps = collectSteps(singlyLinkedListModule, parse(singlyLinkedListModule, 'insert 20, insert 30'));
    // 跳过 collectSteps 自动生成的通用初始步（其不含 memory），检查算法生成的步骤
    for (const s of steps.slice(1)) {
      expect(s.memory).toBeDefined();
      expect(s.memory!.stack.length).toBeGreaterThan(0);
    }
    const last = steps[steps.length - 1];
    expect(last.memory!.heap.length).toBe(2);
  });
});

describe('顺序表', () => {
  it('末尾追加与指定位置插入', () => {
    const state = lastState(sequentialListModule, parse(sequentialListModule, 'append 10, append 20, insert 1 99')) as ArrayState;
    expect(state.items).toEqual([10, 99, 20]);
  });

  it('删除位置元素', () => {
    const state = lastState(sequentialListModule, parse(sequentialListModule, 'append 10, append 20, append 30, delete 0')) as ArrayState;
    expect(state.items).toEqual([20, 30]);
  });

  it('查找返回值', () => {
    const steps = collectSteps(sequentialListModule, parse(sequentialListModule, 'append 10, append 20, search 20'));
    const found = steps.some((s) => s.description.includes('下标为 1'));
    expect(found).toBe(true);
  });
});

describe('顺序栈', () => {
  it('入栈与出栈', () => {
    const state = lastState(sequentialStackModule, parse(sequentialStackModule, 'push 10, push 20, pop')) as ArrayState;
    const values = state.items.filter((x): x is number => x !== null);
    expect(values).toEqual([10]);
    expect(state.info?.top).toBe(0);
  });

  it('空栈出栈被拒绝', () => {
    const steps = collectSteps(sequentialStackModule, parse(sequentialStackModule, 'pop'));
    expect(steps.some((s) => s.description.includes('栈空'))).toBe(true);
  });
});

describe('循环队列', () => {
  it('入队出队并循环', () => {
    const state = lastState(circularQueueModule, parse(circularQueueModule, 'enqueue 10, enqueue 20, dequeue, enqueue 30')) as ArrayState;
    const values = state.items.filter((x): x is number => x !== null);
    expect(values).toEqual([20, 30]);
    expect(state.info?.大小).toBe(2);
  });

  it('空队出队被拒绝', () => {
    const steps = collectSteps(circularQueueModule, parse(circularQueueModule, 'dequeue'));
    expect(steps.some((s) => s.description.includes('队空'))).toBe(true);
  });
});
