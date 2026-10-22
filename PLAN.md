# DataStruct Lab —— 数据结构与算法可视化学习平台

> 面向中国高校计算机专业学生的交互式数据结构与算法学习平台。
> 核心原则：**所有动画由真实算法状态驱动，算法逻辑与 UI 渲染彻底解耦。**

---

## 1. 项目定位

将抽象的数据结构转化为动态、可交互、可回溯的可视化图形，同步高亮当前执行的代码行，
展示指针变量与堆内存等内部机制，帮助学习者建立「数据结构 + 算法 + 程序运行」的完整心智模型。

### 1.1 核心特色（差异化）

**C/C++ 代码执行过程与内存结构可视化**（长期核心特色，贯穿各阶段）：

- 学习单链表时，不仅看到节点之间的箭头，还能看到 **指针变量（栈上）** 与 **堆内存中的节点** 的关系。
- 当用户执行 `Node* p = new Node(20);` 时，软件同步展示：
  1. 新节点在堆内存中的创建（`malloc` / `new`）；
  2. 指针变量 `p` 被赋值、指向该堆地址；
  3. 后续 `p->next = head; head = p;` 等连接操作中的指针重新绑定。
- 通过一张「内存快照图」呈现：栈帧（局部指针变量）↔ 堆（动态分配节点）↔ 逻辑结构（链表/树/图）三者的映射。

这一能力比普通算法动画更具教学价值，将作为项目的长期技术主线。

---

## 2. 整体架构（分层设计）

```
┌─────────────────────────────────────────────────────────┐
│                    视图层（UI / 渲染）                    │
│   pages / components(layout·visualization·controls·code) │
│   —— 纯展示，消费引擎状态，绝不包含算法逻辑               │
├─────────────────────────────────────────────────────────┤
│                    状态层（stores，Zustand）              │
│   playerStore · algorithmStore · settingsStore ·         │
│   progressStore —— 桥接引擎与视图                        │
├─────────────────────────────────────────────────────────┤
│                    引擎层（engine，纯 TypeScript）         │
│   types.ts（数据模型）· registry.ts（模块注册）           │
│   step-generator.ts（生成器工具）· player.ts（播放状态机） │
├─────────────────────────────────────────────────────────┤
│                    算法层（algorithms，纯函数/生成器）     │
│   linear-list · stack · queue · string · array ·         │
│   tree · graph · search · sorting                        │
│   —— 每个模块导出 meta + generateSteps + parse/validate  │
├─────────────────────────────────────────────────────────┤
│               基础设施层（utils / hooks / data）           │
│   工具函数 · 自定义 Hooks · 教材章节数据 · 主题           │
└─────────────────────────────────────────────────────────┘
```

**数据流（单向）：**

```
用户输入 ──► parseInput/validateInput ──► generateSteps(生成器)
   ──► AlgorithmStep<TState>[] ──► playerStore（游标/播放/速度）
   ──► visualization 组件（SVG，按 state 渲染 + 平滑过渡）
   ──► code 面板（highlightedLines 高亮）
```

### 2.1 关键约束

1. 算法模块是**纯函数/生成器**，不依赖 React、不依赖 DOM。
2. 生成器产出**完整的状态快照序列**，播放器仅维护一个游标 `currentIndex`。
3. **禁止**用 `setTimeout` 堆叠模拟算法；播放节奏由播放器统一调度（`setInterval`/`requestAnimationFrame` 驱动游标前移）。
4. 任意时刻可前进/后退/拖拽进度条到任意步骤，历史状态可完整回溯。
5. 播放速度只影响游标推进频率，不影响算法正确性。

---

## 3. 算法引擎数据模型（核心设计）

### 3.1 步骤模型

```typescript
// engine/types.ts
export interface AlgorithmStep<TState> {
  id: string;                       // 步骤唯一标识（稳定，供 React key 使用）
  description: string;              // 本步中文说明
  state: TState;                    // 本步完整状态快照（结构化、可序列化）
  highlightedElements: string[];    // 本步高亮的元素 id
  highlightedLines: number[];       // 本步高亮的代码行（1-based）
  variables?: Record<string, unknown>; // 关键变量监视（变量名 → 当前值）
  memory?: MemorySnapshot;          // 可选：内存快照（C/C++ 指针可视化）
  duration?: number;                // 可选：本步建议停留时长(ms)
}

export interface MemorySnapshot {
  stack: StackFrame[];   // 栈帧：局部变量（含指针变量及其指向）
  heap: HeapObject[];    // 堆对象：动态分配的节点及其地址/字段
  links: MemoryLink[];   // 指针指向关系（变量 → 堆对象 / 堆对象 → 堆对象）
}

export interface StackFrame {
  function: string;
  variables: { name: string; type: string; value: string; pointsTo?: string }[];
}

export interface HeapObject {
  address: string;              // 如 "0x1A2B"
  label: string;                // 如 "Node(20)"
  fields: { name: string; value: string; pointsTo?: string }[];
  freed?: boolean;              // 是否已释放（delete/free）
}

export interface MemoryLink {
  from: string;   // 源（变量名或堆对象地址）
  field?: string; // 字段名（如 next）
  to: string;     // 目标堆对象地址
}
```

### 3.2 算法元信息模型

```typescript
export interface AlgorithmMeta {
  id: string;                    // 全局唯一，如 "sorting.bubble"
  name: string;                  // 中文名
  nameEn: string;                // 英文名
  chapter: ChapterId;            // 所属章节
  order: number;                 // 章内排序
  summary: string;               // 一句话简介
  // 学习辅助
  coreIdea: string;              // 核心思想
  operationSteps: string[];      // 操作步骤
  useCases: string[];            // 适用场景
  complexity: {
    time: { best: string; average: string; worst: string };
    space: string;
  };
  stable?: boolean;              // 排序稳定性
  pros: string[];                // 优点
  cons: string[];                // 缺点
  examPoints: string[];          // 常见考试知识点
  // 参考代码
  code: {
    c: string;                   // C 参考实现
    cpp: string;                 // C++ 参考实现
    pseudocode: string;          // 伪代码
  };
  // 输入定义
  inputSchema: InputField[];     // 自定义输入控件描述
  defaultInput: string;          // 默认输入
}

export interface InputField {
  key: string;
  label: string;
  type: 'array' | 'number' | 'string' | 'select' | 'matrix';
  placeholder?: string;
  options?: { label: string; value: string }[];
}
```

### 3.3 算法模块接口（注册机制）

```typescript
// engine/registry.ts
export interface AlgorithmModule<TState, TInput> {
  meta: AlgorithmMeta;
  generateSteps: (input: TInput) => Generator<AlgorithmStep<TState>>;
  parseInput: (raw: string) => TInput | { error: string };   // 统一处理空/重复/非法输入
  createInitialState: (input: TInput) => TState;             // 初始状态（第 0 步之前）
}

// 注册中心
export function registerAlgorithm<TState, TInput>(mod: AlgorithmModule<TState, TInput>): void;
export function getAlgorithm(id: string): AlgorithmModule<unknown, unknown> | undefined;
export function getAlgorithmsByChapter(chapter: ChapterId): AlgorithmModule<unknown, unknown>[];
export function getAllAlgorithms(): AlgorithmModule<unknown, unknown>[];
```

每个算法模块在 `src/algorithms/<category>/index.ts` 中调用 `registerAlgorithm(...)` 完成自注册，
`src/algorithms/index.ts` 统一导入各分类以触发注册（side-effect import）。
新增算法时只需新建模块文件 + 在分类 index 里 export，UI 与章节导航**自动**识别，无需改动布局代码。

### 3.4 播放器状态机（playerStore）

```typescript
interface PlayerState {
  algorithmId: string | null;
  steps: AlgorithmStep<unknown>[];   // 当前算法的步骤序列（含初始状态）
  currentIndex: number;              // 当前游标
  isPlaying: boolean;                // 是否自动播放
  speed: number;                     // 0.25 | 0.5 | 1 | 1.5 | 2 | 4
}
// actions: load / play / pause / stepForward / stepBack / reset / seekTo / setSpeed
```

---

## 4. 教材章节规划（九章）

| 章节 | id | 核心模块 |
|------|----|----------|
| 第一章 绪论 | `intro` | 时间复杂度曲线对比、O(1)/O(log n)/O(n)/O(n log n)/O(n²) 操作次数模拟、复杂度知识卡片 |
| 第二章 线性表 | `linear-list` | 顺序表、单链表、循环单链表、双向链表、循环双向链表 |
| 第三章 栈和队列 | `stack-queue` | 顺序栈、链栈、顺序队列、循环队列、链队列、括号匹配、表达式求值 |
| 第四章 串 | `string` | 基本操作、朴素匹配、KMP（next 数组生成） |
| 第五章 数组和广义表 | `array` | 一维/二维数组、对称/三角/三对角矩阵压缩、稀疏矩阵三元组、广义表 |
| 第六章 树和二叉树 | `tree` | 二叉树、四种遍历、线索二叉树、哈夫曼树与编码 |
| 第七章 图 | `graph` | 邻接矩阵/表、DFS、BFS、Prim、Kruskal、Dijkstra、Floyd、拓扑排序、关键路径 |
| 第八章 查找 | `search` | 顺序查找、折半查找、分块查找、二叉排序树、AVL、散列查找 |
| 第九章 排序 | `sorting` | 冒泡、选择、插入、希尔、快速、堆、归并、基数排序 |

---

## 5. 开发阶段（八阶段）

1. **阶段一 项目基础**：初始化 + 主界面布局 + 章节导航 + 主题切换 + 算法注册机制。（当前）
2. **阶段二 算法引擎**：AlgorithmStep + 播放器 + 单步/播放/暂停/重置/速度/跳转 + 代码高亮映射。
3. **阶段三 排序模块**：冒泡、选择、插入、快速（真实算法 + 动画 + 自定义输入 + 代码同步 + 单测）。
4. **阶段四 线性结构**：顺序表、单链表、栈、队列（引入指针/堆内存可视化）。
5. **阶段五 树与查找**：二叉树、遍历、二叉排序树、折半查找。
6. **阶段六 图算法**：DFS、BFS、最小生成树、最短路径。
7. **阶段七 其余内容**：补齐九章全部模块 + 算法对比功能（同步执行 + 操作次数统计）。
8. **阶段八 完善与部署**：响应式、性能、错误处理、单测/端到端测试、文档、GitHub Actions、生产构建、静态部署。

---

## 6. 技术栈

- **前端**：React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + Lucide React
- **动画**：Framer Motion、SVG、D3.js（复杂图布局）
- **代码展示**：prism-react-renderer（轻量只读高亮，支持逐行高亮；后续按需引入 Monaco）
- **状态管理**：Zustand
- **测试**：Vitest（单测）、Playwright（E2E）
- **存储**：第一阶段 localStorage（学习进度、用户设置），保留账户系统扩展接口
- **路由**：React Router

---

## 7. 工程目录

```
datastruct-lab/
├── PLAN.md                     # 本文件
├── README.md
├── index.html
├── components.json             # shadcn/ui 配置
├── vite.config.ts
├── tsconfig*.json
├── public/
└── src/
    ├── main.tsx / App.tsx
    ├── index.css               # Tailwind + 主题变量
    ├── app/                    # 应用装配（路由、Provider）
    ├── components/
    │   ├── layout/             # TopNav / Sidebar / AlgorithmLayout
    │   ├── visualization/      # 画布（含内存可视化占位）
    │   ├── controls/           # 播放控制栏
    │   ├── code/               # 代码面板（行高亮）
    │   └── ui/                 # shadcn/ui 基础组件
    ├── algorithms/             # 九章算法模块（纯逻辑）
    ├── engine/                 # types / registry / step-generator / player
    ├── hooks/                  # useAlgorithm / usePlayer / useTheme
    ├── stores/                 # Zustand stores
    ├── pages/                  # 首页 / 算法详情页 / 对比页
    ├── data/                   # 章节数据、章节导航配置
    ├── utils/                  # cn 等工具
    └── tests/                  # 单测
```

---

## 8. 统一颜色语义（画布）

- 默认节点：**蓝色**（blue）
- 当前访问节点：**黄色**（yellow/amber）
- 正在比较节点：**橙色**（orange）
- 已完成节点：**绿色**（green）
- 删除/错误状态：**红色**（red）
- 排序中：已排序区间绿色、当前区间蓝色、基准/枢轴橙色、比较中黄色

---

## 9. 验收标准（阶段一）

- [x] 项目可启动（`npm run dev`），`tsc` 类型检查与生产构建通过。
- [x] 主界面布局完整：顶部导航、九章侧边栏、中央画布、右侧代码/知识面板、底部控制栏。
- [x] 章节导航可展开/折叠、搜索、高亮、显示进度。
- [x] 浅色/深色主题切换（localStorage 持久化）。
- [x] 算法模块注册机制可用，演示算法（冒泡排序）打通全链路。
- [x] 未实现模块明确显示「开发中」。
