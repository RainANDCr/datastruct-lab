import { describe, expect, it } from 'vitest';
import { circularLinkedListModule } from '@/algorithms/linear-list/circular-linked';
import { doublyLinkedListModule } from '@/algorithms/linear-list/doubly-linked';
import type { LinkedListState } from '@/algorithms/linear-list/types';
import { linkedQueueModule } from '@/algorithms/stack-queue/linked-queue';
import { linkedStackModule } from '@/algorithms/stack-queue/linked-stack';
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

function values(state: LinkedListState): number[] {
  return state.nodes.map((n) => n.value);
}

describe('链栈', () => {
  it('入栈出栈后栈顶正确', () => {
    const state = lastState(linkedStackModule, parse(linkedStackModule, 'push 10, push 20, push 30, pop')) as LinkedListState;
    expect(values(state)).toEqual([20, 10]);
  });

  it('空栈出栈被拒绝', () => {
    const steps = collectSteps(linkedStackModule, parse(linkedStackModule, 'pop'));
    expect(steps.some((s) => s.description.includes('栈空'))).toBe(true);
  });

  it('步骤携带内存快照', () => {
    const steps = collectSteps(linkedStackModule, parse(linkedStackModule, 'push 10, push 20'));
    for (const s of steps.slice(1)) expect(s.memory).toBeDefined();
    expect(steps[steps.length - 1].memory!.heap.length).toBe(2);
  });
});

describe('链队列', () => {
  it('入队出队后队头队尾正确', () => {
    const state = lastState(linkedQueueModule, parse(linkedQueueModule, 'enqueue 10, enqueue 20, enqueue 30, dequeue, enqueue 40')) as LinkedListState;
    expect(values(state)).toEqual([20, 30, 40]);
  });

  it('空队出队被拒绝', () => {
    const steps = collectSteps(linkedQueueModule, parse(linkedQueueModule, 'dequeue'));
    expect(steps.some((s) => s.description.includes('队空'))).toBe(true);
  });

  it('出队到空后 front/rear 均复位', () => {
    const state = lastState(linkedQueueModule, parse(linkedQueueModule, 'enqueue 10, dequeue')) as LinkedListState;
    expect(state.headId).toBeNull();
    expect(state.tailId).toBeNull();
  });
});

describe('双向链表', () => {
  it('头插顺序反转、尾插追加', () => {
    const state = lastState(doublyLinkedListModule, parse(doublyLinkedListModule, 'insert 10, insert 20, append 30')) as LinkedListState;
    expect(values(state)).toEqual([20, 10, 30]);
  });

  it('删除中间结点', () => {
    const state = lastState(doublyLinkedListModule, parse(doublyLinkedListModule, 'insert 10, insert 20, append 30, delete 10')) as LinkedListState;
    expect(values(state)).toEqual([20, 30]);
  });

  it('删除头结点', () => {
    const state = lastState(doublyLinkedListModule, parse(doublyLinkedListModule, 'insert 10, insert 20, append 30, delete 20')) as LinkedListState;
    expect(values(state)).toEqual([10, 30]);
  });

  it('尾指针指向末结点，prev 双向链接正确', () => {
    const state = lastState(doublyLinkedListModule, parse(doublyLinkedListModule, 'insert 10, insert 20, append 30')) as LinkedListState;
    expect(state.tailId).toBe(state.nodes[state.nodes.length - 1].id);
    expect(state.nodes[1].prevId).toBe(state.nodes[0].id);
    expect(state.nodes[1].nextId).toBe(state.nodes[2].id);
  });
});

describe('循环单链表', () => {
  it('头插顺序反转', () => {
    const state = lastState(circularLinkedListModule, parse(circularLinkedListModule, 'insert 10, insert 20')) as LinkedListState;
    expect(values(state)).toEqual([20, 10]);
  });

  it('尾结点 next 指回头结点（成环）', () => {
    const state = lastState(circularLinkedListModule, parse(circularLinkedListModule, 'insert 10, insert 20, append 30')) as LinkedListState;
    expect(state.nodes[state.nodes.length - 1].nextId).toBe(state.headId);
  });

  it('删除中间结点', () => {
    const state = lastState(circularLinkedListModule, parse(circularLinkedListModule, 'insert 10, append 20, append 30, delete 20')) as LinkedListState;
    expect(values(state)).toEqual([10, 30]);
    expect(state.nodes[state.nodes.length - 1].nextId).toBe(state.headId);
  });

  it('删除头结点并重链尾结点', () => {
    const state = lastState(circularLinkedListModule, parse(circularLinkedListModule, 'insert 10, insert 20, append 30, delete 20')) as LinkedListState;
    expect(values(state)).toEqual([10, 30]);
    expect(state.nodes[state.nodes.length - 1].nextId).toBe(state.headId);
  });

  it('删除唯一结点后为空表', () => {
    const state = lastState(circularLinkedListModule, parse(circularLinkedListModule, 'insert 10, delete 10')) as LinkedListState;
    expect(state.headId).toBeNull();
    expect(state.nodes).toEqual([]);
  });
});
