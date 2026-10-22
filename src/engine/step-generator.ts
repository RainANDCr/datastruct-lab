/**
 * 步骤生成器工具：将生成器序列化为一组可随机访问的步骤快照。
 *
 * 第 0 步固定为「初始状态」，此后为算法逐步产出。所有步骤可任意跳转，
 * 这是进度条拖动、历史回溯与单步执行的基石。
 */
import type { AlgorithmModule, AlgorithmStep } from './types';

export const INITIAL_STEP_ID = '__initial__';

/** 构造初始状态步骤 */
export function createInitialStep<TState>(state: TState): AlgorithmStep<TState> {
  return {
    id: INITIAL_STEP_ID,
    description: '初始状态',
    state,
    highlightedElements: [],
    highlightedLines: [],
  };
}

/**
 * 将生成器展开为「初始状态 + 算法步骤」数组，并保证 id 稳定、全局唯一、可回放。
 *
 * id 去重：部分算法在同一轮循环中会产出语义相同、id 相同的步骤
 * （如堆调整多次比较同一对父子）。若直接沿用会造成 React key 冲突与
 * 按 id 检索歧义，这里对重复 id 追加序号后缀，保证全局唯一。
 */
export function collectSteps<TState, TInput>(
  mod: AlgorithmModule<TState, TInput>,
  input: TInput,
): AlgorithmStep<TState>[] {
  const steps: AlgorithmStep<TState>[] = [createInitialStep(mod.createInitialState(input))];
  const usedIds = new Set<string>([INITIAL_STEP_ID]);

  let index = 0;
  for (const step of mod.generateSteps(input)) {
    index += 1;
    let id = step.id || `step-${index}`;
    if (usedIds.has(id)) id = `${id}#${index}`;
    usedIds.add(id);
    steps.push({ ...step, id });
  }
  return steps;
}
