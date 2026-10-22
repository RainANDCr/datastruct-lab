import { describe, expect, it } from 'vitest';
import { circularDoublyLinkedListModule } from '@/algorithms/linear-list/circular-doubly-linked';
import type { LinkedListState } from '@/algorithms/linear-list/types';
import { sequentialQueueModule } from '@/algorithms/stack-queue/sequential-queue-simple';
import type { ArrayState } from '@/algorithms/linear-list/types';
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

describe('顺序队列（非循环）', () => {
  it('入队出队后 front/rear 正确', () => {
    const state = lastState(sequentialQueueModule, parse(sequentialQueueModule, 'enqueue 10, enqueue 20, enqueue 30, dequeue')) as ArrayState;
    const values = state.items.filter((x): x is number => x !== null);
    expect(values).toEqual([20, 30]);
    expect(state.info?.front).toBe(1);
    expect(state.info?.rear).toBe(2);
    expect(state.info?.大小).toBe(2);
  });

  it('rear 到末尾后产生假溢出（前面有空位仍无法入队）', () => {
    const steps = collectSteps(
      sequentialQueueModule,
      parse(sequentialQueueModule, 'enqueue 10, enqueue 20, enqueue 30, enqueue 40, enqueue 50, enqueue 60, enqueue 70, enqueue 80, dequeue, dequeue, enqueue 90'),
    );
    expect(steps.some((s) => s.description.includes('假溢出'))).toBe(true);
  });

  it('空队出队被拒绝', () => {
    const steps = collectSteps(sequentialQueueModule, parse(sequentialQueueModule, 'dequeue'));
    expect(steps.some((s) => s.description.includes('队空'))).toBe(true);
  });
});

describe('循环双向链表', () => {
  it('头插顺序反转，且双向成环', () => {
    const state = lastState(circularDoublyLinkedListModule, parse(circularDoublyLinkedListModule, 'insert 10, insert 20')) as LinkedListState;
    expect(state.nodes.map((n) => n.value)).toEqual([20, 10]);
    expect(state.nodes[state.nodes.length - 1].nextId).toBe(state.headId);
    expect(state.nodes[0].prevId).toBe(state.tailId);
  });

  it('尾插追加', () => {
    const state = lastState(circularDoublyLinkedListModule, parse(circularDoublyLinkedListModule, 'insert 10, append 20, append 30')) as LinkedListState;
    expect(state.nodes.map((n) => n.value)).toEqual([10, 20, 30]);
    expect(state.nodes[state.nodes.length - 1].nextId).toBe(state.headId);
  });

  it('删除头结点并重链', () => {
    const state = lastState(circularDoublyLinkedListModule, parse(circularDoublyLinkedListModule, 'insert 10, insert 20, append 30, delete 20')) as LinkedListState;
    expect(state.nodes.map((n) => n.value)).toEqual([10, 30]);
    expect(state.headId).toBe(state.nodes[0].id);
    expect(state.nodes[state.nodes.length - 1].nextId).toBe(state.headId);
    expect(state.nodes[0].prevId).toBe(state.tailId);
  });

  it('删除中间结点', () => {
    const state = lastState(circularDoublyLinkedListModule, parse(circularDoublyLinkedListModule, 'insert 10, append 20, append 30, delete 20')) as LinkedListState;
    expect(state.nodes.map((n) => n.value)).toEqual([10, 30]);
  });

  it('删除唯一结点后为空表', () => {
    const state = lastState(circularDoublyLinkedListModule, parse(circularDoublyLinkedListModule, 'insert 10, delete 10')) as LinkedListState;
    expect(state.headId).toBeNull();
    expect(state.nodes).toEqual([]);
  });

  it('内存快照结点含 prev/data/next 三个域', () => {
    const steps = collectSteps(circularDoublyLinkedListModule, parse(circularDoublyLinkedListModule, 'insert 10, insert 20'));
    const last = steps[steps.length - 1];
    expect(last.memory).toBeDefined();
    expect(last.memory!.heap[0].fields.length).toBe(3);
  });
});
