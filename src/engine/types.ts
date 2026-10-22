/**
 * 算法引擎核心类型定义
 *
 * 设计原则：
 * 1. 所有算法状态均为结构化、可序列化的纯数据（JSON-safe），
 *    以便进度条跳转、历史回溯与快照导出。
 * 2. 算法模块与 React/DOM 完全解耦，仅通过类型与注册中心交互。
 */

/**
 * 可视化渲染器种类：算法声明其状态应如何渲染，UI 据此选择画布组件。
 * 算法层只负责生成状态，渲染逻辑完全在 UI 层。
 */
export type VisualizerKind =
  | 'bars' // 柱状图（排序）
  | 'chart' // 曲线图（复杂度/趋势）
  | 'array' // 数组
  | 'linked-list' // 链表（含指针/内存）
  | 'stack' // 栈
  | 'queue' // 队列
  | 'tree' // 树
  | 'graph' // 图
  | 'matrix' // 矩阵
  | 'string' // 字符串
  | 'hash' // 哈希表
  | 'memory'; // 内存结构

/** 章节标识 */
export type ChapterId =
  | 'intro'
  | 'linear-list'
  | 'stack-queue'
  | 'string'
  | 'array'
  | 'tree'
  | 'graph'
  | 'search'
  | 'sorting';

/**
 * 算法执行的单个步骤快照。
 * @typeParam TState 算法可视化状态类型（由具体算法定义）
 */
export interface AlgorithmStep<TState> {
  /** 步骤唯一标识（稳定，供 React key 使用） */
  id: string;
  /** 本步中文说明 */
  description: string;
  /** 本步完整状态快照 */
  state: TState;
  /** 本步需要高亮的元素 id */
  highlightedElements: string[];
  /** 本步需要高亮的代码行（1-based） */
  highlightedLines: number[];
  /** 关键变量监视（变量名 → 当前值） */
  variables?: Record<string, unknown>;
  /** 可选：C/C++ 内存快照（指针可视化） */
  memory?: MemorySnapshot;
  /** 可选：本步建议停留时长(ms)，未指定时使用播放器默认速度 */
  duration?: number;
}

/* ------------------------------------------------------------------ */
/* 内存结构可视化（C/C++ 指针与堆内存）—— 项目长期核心特色             */
/* ------------------------------------------------------------------ */

/** 栈帧中的局部变量（含指针变量） */
export interface StackVariable {
  name: string;
  type: string;
  value: string;
  /** 指向的堆对象地址（指针变量） */
  pointsTo?: string;
}

export interface StackFrame {
  function: string;
  variables: StackVariable[];
}

/** 堆对象字段（数据域与指针域） */
export interface HeapField {
  name: string;
  value: string;
  /** 指向的堆对象地址（指针域，如 next） */
  pointsTo?: string;
}

/** 堆中动态分配的节点 */
export interface HeapObject {
  address: string;
  label: string;
  fields: HeapField[];
  /** 是否已释放（free/delete） */
  freed?: boolean;
}

/** 指针指向关系 */
export interface MemoryLink {
  from: string;
  field?: string;
  to: string;
}

/** 内存快照：栈帧 ↔ 堆对象 ↔ 指针关系 三者的统一视图 */
export interface MemorySnapshot {
  stack: StackFrame[];
  heap: HeapObject[];
  links: MemoryLink[];
}

/* ------------------------------------------------------------------ */
/* 算法元信息（学习辅助内容）                                          */
/* ------------------------------------------------------------------ */

export interface Complexity {
  time: { best: string; average: string; worst: string };
  space: string;
}

export interface CodeSnippets {
  /** C 参考实现 */
  c: string;
  /** C++ 参考实现 */
  cpp: string;
  /** 伪代码 */
  pseudocode: string;
}

export interface InputField {
  key: string;
  label: string;
  type: 'array' | 'number' | 'string' | 'select' | 'matrix';
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface AlgorithmMeta {
  /** 全局唯一，如 "sorting.bubble" */
  id: string;
  name: string;
  nameEn: string;
  chapter: ChapterId;
  /** 章内排序 */
  order: number;
  /** 一句话简介 */
  summary: string;
  /** 核心思想 */
  coreIdea: string;
  /** 操作步骤 */
  operationSteps: string[];
  /** 适用场景 */
  useCases: string[];
  complexity: Complexity;
  /** 排序稳定性（仅排序算法有意义） */
  stable?: boolean;
  pros: string[];
  cons: string[];
  /** 常见考试知识点 */
  examPoints: string[];
  /** 关键变量含义说明（代码教学用） */
  variableDocs?: { name: string; meaning: string }[];
  code: CodeSnippets;
  inputSchema: InputField[];
  defaultInput: string;
  /** 是否已实现（false 时界面显示「开发中」） */
  implemented: boolean;
  /** 可视化渲染器种类 */
  visualizer: VisualizerKind;
}

/* ------------------------------------------------------------------ */
/* 输入解析与模块接口                                                  */
/* ------------------------------------------------------------------ */

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * 算法模块接口：算法层与引擎层的契约。
 * @typeParam TState 可视化状态类型
 * @typeParam TInput 算法输入类型
 */
export interface AlgorithmModule<TState, TInput> {
  meta: AlgorithmMeta;
  /** 通过生成器产出每一步状态快照（纯逻辑，无副作用） */
  generateSteps: (input: TInput) => Generator<AlgorithmStep<TState>>;
  /** 统一处理空输入、重复值、非法输入 */
  parseInput: (raw: string) => ParseResult<TInput>;
  /** 初始状态（第 0 步，未开始执行时的状态） */
  createInitialState: (input: TInput) => TState;
}
