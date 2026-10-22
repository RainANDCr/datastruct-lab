import { describe, expect, it } from 'vitest';
import { complexityModule } from '@/algorithms/intro/complexity';
import type { ComplexityState } from '@/algorithms/intro/types';
import { collectSteps } from '@/engine/step-generator';

describe('时间复杂度曲线（真实计算）', () => {
  it('步骤数量 = 最大规模（初始态 + n=2..maxN）', () => {
    const steps = collectSteps(complexityModule, 10);
    expect(steps.length).toBe(10);
    const last = steps[steps.length - 1].state as ComplexityState;
    expect(last.n).toBe(10);
    expect(last.maxN).toBe(10);
  });

  it('操作次数按定义正确计算', () => {
    const steps = collectSteps(complexityModule, 20);
    const last = steps[steps.length - 1].state as ComplexityState;
    const byLabel = Object.fromEntries(last.counts.map((c) => [c.label, c.value]));
    expect(byLabel['O(1)']).toBe(1);
    expect(byLabel['O(n)']).toBe(20);
    expect(byLabel['O(n²)']).toBe(400);
    // O(log n) 与 O(n log n) 在 n=20 下的近似值
    expect(byLabel['O(log n)']).toBeGreaterThanOrEqual(4);
    expect(byLabel['O(n log n)']).toBeGreaterThanOrEqual(80);
  });

  it('parseInput 拒绝非法输入', () => {
    expect(complexityModule.parseInput('').ok).toBe(false);
    expect(complexityModule.parseInput('abc').ok).toBe(false);
    expect(complexityModule.parseInput('1').ok).toBe(false); // < 2
    expect(complexityModule.parseInput('1000').ok).toBe(false); // > 500
  });

  it('parseInput 正确解析数字', () => {
    const r = complexityModule.parseInput('60');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(60);
  });
});
