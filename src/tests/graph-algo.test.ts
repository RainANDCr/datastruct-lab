import { describe, expect, it } from 'vitest';
import { dijkstraModule } from '@/algorithms/graph/dijkstra';
import { primModule } from '@/algorithms/graph/prim';
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

describe('Prim 最小生成树', () => {
  const INPUT = 'build A,B,C,D ; edge A-B-1, A-C-4, B-C-2, B-D-5, C-D-3 ; prim A';

  it('最小生成树总权值正确', () => {
    const done = completion(primModule, INPUT, 'Prim 完成');
    expect((done.state as GraphState).info?.总权值).toBe(6);
  });

  it('选中的 MST 边正确', () => {
    const done = completion(primModule, INPUT, 'Prim 完成');
    const st = done.state as GraphState;
    const mstEdges = Object.keys(st.edges).filter((eid) => st.edgeStatus?.[eid] === 'done').sort();
    expect(mstEdges).toEqual(['A-B', 'B-C', 'C-D']);
  });
});

describe('Dijkstra 最短路径', () => {
  const INPUT = 'build A,B,C,D,E ; edge A-B-4, A-C-2, B-C-1, B-D-5, C-D-8, C-E-10, D-E-2 ; dijkstra A';

  it('各顶点最短距离正确', () => {
    const done = completion(dijkstraModule, INPUT, 'Dijkstra 完成');
    const result = done.variables?.结果 as string;
    expect(result).toContain('A:0');
    expect(result).toContain('B:3');
    expect(result).toContain('C:2');
    expect(result).toContain('D:8');
    expect(result).toContain('E:10');
  });
});
