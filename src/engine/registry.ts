/**
 * 算法模块注册中心
 *
 * 每个算法模块在 `src/algorithms/<category>/` 下通过 `registerAlgorithm`
 * 完成自注册。章节导航与算法列表由注册中心动态派生，新增算法无需改动布局代码。
 */
import type { AlgorithmMeta, AlgorithmModule, ChapterId } from './types';

const modules = new Map<string, AlgorithmModule<unknown, unknown>>();
const registrationOrder: string[] = [];

/** 注册一个算法模块（幂等：重复注册时覆盖并告警） */
export function registerAlgorithm<TState, TInput>(
  mod: AlgorithmModule<TState, TInput>,
): void {
  if (modules.has(mod.meta.id)) {
    console.warn(`[registry] 算法 "${mod.meta.id}" 重复注册，将被覆盖`);
  } else {
    registrationOrder.push(mod.meta.id);
  }
  modules.set(mod.meta.id, mod as unknown as AlgorithmModule<unknown, unknown>);
}

export function getAlgorithm(id: string): AlgorithmModule<unknown, unknown> | undefined {
  return modules.get(id);
}

export function getAlgorithmMeta(id: string): AlgorithmMeta | undefined {
  return modules.get(id)?.meta;
}

/** 获取某章节下已实现的算法元信息（按章内 order 排序） */
export function getAlgorithmsByChapter(chapter: ChapterId): AlgorithmMeta[] {
  return registrationOrder
    .map((id) => modules.get(id)!.meta)
    .filter((m) => m.chapter === chapter)
    .sort((a, b) => a.order - b.order);
}

/** 获取全部已注册算法元信息 */
export function getAllAlgorithmMeta(): AlgorithmMeta[] {
  return registrationOrder.map((id) => modules.get(id)!.meta);
}

/** 获取全部已注册算法模块（原始） */
export function getAllModules(): AlgorithmModule<unknown, unknown>[] {
  return registrationOrder.map((id) => modules.get(id)!);
}

/** 已注册算法总数 */
export function getRegisteredCount(): number {
  return registrationOrder.length;
}
