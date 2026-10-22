import { describe, expect, it } from 'vitest';
import { kruskalModule } from '@/algorithms/graph/kruskal';
import { topologicalModule } from '@/algorithms/graph/topological';
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

describe('Kruskal 最小生成树', () => {
  const INPUT = 'build A,B,C,D ; edge A-B-1, B-C-2, C-D-3, A-C-4, B-D-5 ; kruskal';

  it('最小生成树总权值正确', () => {
    const done = completion(kruskalModule, INPUT, 'Kruskal 完成');
    expect((done.state as GraphState).info?.总权值).toBe(6);
  });

  it('选中的 MST 边正确（含成环丢弃）', () => {
    const done = completion(kruskalModule, INPUT, 'Kruskal 完成');
    const st = done.state as GraphState;
    const mstEdges = Object.keys(st.edges).filter((eid) => st.edgeStatus?.[eid] === 'done').sort();
    expect(mstEdges).toEqual(['A-B', 'B-C', 'C-D']);
    // 成环的边 A-C、B-D 被丢弃
    expect(st.edgeStatus?.['A-C']).toBe('error');
    expect(st.edgeStatus?.['B-D']).toBe('error');
  });
});

describe('拓扑排序', () => {
  const INPUT = 'build A,B,C,D,E ; edge A->B, A->C, B->D, C->D, D->E ; topological';

  it('拓扑序正确', () => {
    const done = completion(topologicalModule, INPUT, '拓扑排序完成');
    expect((done.state as GraphState).visitOrder).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('存在环时提示', () => {
    const steps = collectSteps(topologicalModule, parse(topologicalModule, 'build A,B ; edge A->B, B->A ; topological'));
    expect(steps.some((s) => s.description.includes('存在环'))).toBe(true);
  });
});
