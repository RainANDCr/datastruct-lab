import { describe, expect, it } from 'vitest';
import { getAllAlgorithmMeta, getAlgorithm } from '@/engine/registry';
import { collectSteps } from '@/engine/step-generator';
import '@/algorithms';

/**
 * 步骤数据完整性校验（跨全部算法）。
 *
 * 这些约束一旦被破坏，界面会出现难以察觉的教学体验缺陷：
 * - 重复 id：React key 冲突、按 id 检索歧义
 * - 空描述：顶部「当前步骤」空白，学生不知道在做什么
 * - 行号越界：代码面板完全不高亮，代码与动画失去同步
 */
describe('步骤数据完整性', () => {
  const metas = getAllAlgorithmMeta();

  it('算法总数应为 59（教材九章全覆盖）', () => {
    expect(metas.length).toBe(59);
  });

  it.each(metas.map((m) => [m.id, m] as const))('%s 的步骤数据合法', (_id, meta) => {
    const mod = getAlgorithm(meta.id);
    expect(mod).toBeDefined();
    if (!mod) return;

    const parsed = mod.parseInput(meta.defaultInput);
    expect(parsed.ok, `默认输入应可解析：${meta.defaultInput}`).toBe(true);
    if (!parsed.ok) return;

    const steps = collectSteps(mod, parsed.value);

    // 至少包含初始步 + 一个算法步骤
    expect(steps.length).toBeGreaterThan(1);

    // 1) id 全局唯一
    const ids = steps.map((s) => s.id);
    expect(new Set(ids).size, 'step.id 必须唯一').toBe(ids.length);

    // 2) 描述非空
    for (const s of steps) {
      expect(s.description.trim().length, 'description 不能为空').toBeGreaterThan(0);
    }

    // 3) state 为对象
    for (const s of steps) {
      expect(s.state !== null && typeof s.state === 'object', 'state 必须为对象').toBe(true);
    }

    // 4) 高亮行号为正整数且不超过参考代码最大行数
    const maxLines = Math.max(
      meta.code.c.split('\n').length,
      meta.code.cpp.split('\n').length,
      meta.code.pseudocode.split('\n').length,
    );
    for (const s of steps) {
      for (const ln of s.highlightedLines) {
        expect(Number.isInteger(ln) && ln >= 1, `非法行号 ${ln}`).toBe(true);
        expect(ln, `行号 ${ln} 超出代码行数 ${maxLines}`).toBeLessThanOrEqual(maxLines);
      }
    }
  });
});
