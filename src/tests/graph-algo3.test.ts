import { describe, expect, it } from 'vitest';
import { criticalPathModule } from '@/algorithms/graph/critical-path';
import { floydModule } from '@/algorithms/graph/floyd';
import type { GraphState } from '@/algorithms/graph/types';
import type { AlgorithmModule } from '@/engine/types';
import { collectSteps } from '@/engine/step-generator';

function parse<T>(mod: { parseInput: (s: string) => { ok: true; value: T } | { ok: false } }, input: string): T {
  const r = mod.parseInput(input);
  if (!r.ok) throw new Error('parse failed');
  return r.value;
}

function completion<TInput>(mod: AlgorithmModule<GraphState, TInput>, input: string, keyword: string) {
  const steps = collectSteps(mod, parse(mod, input));
  const done = steps.find((s) => s.description.includes(keyword));
  expect(done).toBeDefined();
  return done!;
}

describe('Floyd 最短路径', () => {
  const INPUT = 'build A,B,C,D ; edge A-B-3, A-C-8, A-D-2, B-C-1, C-D-1 ; floyd';

  it('任意两点最短距离正确', () => {
    const done = completion(floydModule, INPUT, 'Floyd 完成');
    const st = done.state as GraphState;
    const labels = st.matrix!.labels;
    const cells = st.matrix!.cells;
    const at = (r: string, c: string) => cells[labels.indexOf(r)][labels.indexOf(c)];
    // A->B: 直连 3 或经 C(8+1=9)/D(2+1=3) 最短 3
    expect(at('A', 'B')).toBe(3);
    // A->C: 直连 8 或经 B(3+1=4)/D(2+1=3) 最短 3
    expect(at('A', 'C')).toBe(3);
    // A->D: 直连 2 或经 C(3+1=4) 最短 2
    expect(at('A', 'D')).toBe(2);
    // B->D: 经 C(1+1=2) 最短 2
    expect(at('B', 'D')).toBe(2);
  });
});

describe('关键路径', () => {
  const INPUT = 'build A,B,C,D ; edge A->B-2, B->C-3, A->C-1, C->D-4 ; critical-path';

  it('总工期正确', () => {
    const done = completion(criticalPathModule, INPUT, '总工期');
    expect((done.state as GraphState).info?.总工期).toBe(9);
  });

  it('关键活动正确', () => {
    const done = completion(criticalPathModule, INPUT, '关键活动');
    const st = done.state as GraphState;
    const critical = Object.keys(st.edges).filter((eid) => st.edgeStatus?.[eid] === 'done').sort();
    // 关键路径 A->B->C->D，边 A->C(10) 非关键
    expect(critical).toEqual(['A->B', 'B->C', 'C->D']);
  });

  it('存在环时提示', () => {
    const steps = collectSteps(criticalPathModule, parse(criticalPathModule, 'build A,B ; edge A->B, B->A ; critical-path'));
    expect(steps.some((s) => s.description.includes('存在环'))).toBe(true);
  });
});
