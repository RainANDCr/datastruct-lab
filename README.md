# DataStruct Lab

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Tests](https://img.shields.io/badge/tests-177%20passed-2ea043)](./src/tests)
[![Algorithms](https://img.shields.io/badge/algorithms-59-8b5cf6)](./src/algorithms)

数据结构与算法可视化学习平台 —— 面向中国高校计算机专业学生的交互式教学工具。

将抽象的数据结构转化为动态、可交互、可回溯的可视化图形，同步高亮当前执行的代码行，
并逐步引入 **C/C++ 指针与堆内存结构可视化** 这一差异化特色。

> 核心原则：**所有动画由真实算法状态驱动，算法逻辑与 UI 渲染彻底解耦。**

## 功能特性

- 覆盖高校《数据结构》教材九章内容（绪论 / 线性表 / 栈和队列 / 串 / 数组和广义表 / 树和二叉树 / 图 / 查找 / 排序）
- 真实算法驱动动画：单步执行、连续播放、暂停、重置、进度条拖动、6 档速度调节
- 代码与动画同步：C / C++ / 伪代码逐行高亮，关键变量实时监视
- 学习辅助：核心思想、操作步骤、适用场景、复杂度分析、优缺点、考试考点、参考代码
- 自定义数据输入，统一处理空输入、重复值、非法输入
- 学习进度记录与主题切换（localStorage 持久化）
- 浅色 / 深色主题，桌面优先、兼容移动端

### 核心特色：C/C++ 代码执行过程与内存结构可视化

学习单链表时，不仅能看到节点之间的箭头，还能看到 **指针变量（栈）** 与 **堆内存节点** 的关系。
例如执行 `Node* p = new Node(20);` 时，软件同步展示新节点创建、指针赋值与后续连接操作。
该特性已在**单链表、双向链表、循环链表、链栈、链队列**等链式结构中落地，
由 `MemorySnapshot`（栈帧 / 堆对象 / 指针关系）数据模型驱动，见 `src/engine/types.ts`
与 `src/components/visualization/MemoryView.tsx`。

## 技术栈

- **前端**：React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + Lucide React
- **动画**：Framer Motion、SVG（图布局阶段引入 D3.js）
- **代码展示**：prism-react-renderer（轻量只读高亮，支持逐行高亮）
- **状态管理**：Zustand（含 persist 持久化）
- **测试**：Vitest（单元测试，Playwright 于部署阶段引入）
- **存储**：第一阶段 localStorage，保留账户系统扩展接口

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查 + 生产构建
npm run build

# 运行单元测试
npm test

# 代码检查
npm run lint
```

## 目录结构

```
src/
├── app/                 # 应用装配（路由、Provider）—— App.tsx
├── components/
│   ├── layout/          # TopNav / Sidebar / GlobalSearch
│   ├── visualization/   # 画布（BarsCanvas / ColorLegend）
│   ├── controls/        # 播放控制栏 ControlBar
│   ├── code/            # 代码面板（CodeViewer / CodePanel）
│   └── ui/              # shadcn/ui 基础组件
├── algorithms/          # 算法模块（纯逻辑，与 UI 解耦）
│   └── sorting/         # 冒泡排序等
├── engine/              # 算法引擎：types / registry / step-generator / player
├── hooks/               # useAutoPlay / useElementSize
├── stores/              # Zustand：settings / progress / player
├── pages/               # HomePage / AlgorithmPage
├── data/                # 章节与算法目录 chapters.ts
├── lib/                 # cn / icons
├── utils/               # colors（统一颜色语义）
└── tests/               # 单元测试
```

## 架构设计

分层架构，单向数据流：

```
用户输入 → parseInput → generateSteps(生成器) → AlgorithmStep<TState>[]
  → playerStore（游标/播放/速度） → 可视化组件（SVG 渲染 + 平滑过渡）
  → 代码面板（highlightedLines 高亮）
```

- **算法层**：纯函数/生成器，产出完整状态快照序列，不依赖 React/DOM。
- **引擎层**：`AlgorithmStep` 类型系统、模块注册中心、步骤收集器、播放器状态机。
- **视图层**：纯展示，消费引擎状态，不含算法逻辑。

新增算法只需在 `src/algorithms/<章节>/` 下实现模块并 `registerAlgorithm`，
章节导航与路由自动识别，无需改动布局代码。详见 `PLAN.md`。

## 当前进度

**阶段一（已完成）**

- [x] 项目初始化（React + Vite + TS + Tailwind + shadcn/ui + 路由）
- [x] 主界面布局（顶部导航 / 九章侧边栏 / 画布 / 代码面板 / 控制栏）
- [x] 算法引擎（步骤模型 + 播放器 + 注册机制）
- [x] 浅色 / 深色主题切换与学习进度（localStorage）
- [x] 演示算法：冒泡排序（真实算法 + 动画 + 代码同步 + 单元测试）

**阶段二（已完成）**

- [x] 可视化渲染分发（`Visualizer`，按算法声明的渲染器种类选择画布）
- [x] 绪论章「时间复杂度曲线」：O(1)/O(log n)/O(n)/O(n log n)/O(n²) 对数坐标对比，n 随播放增长
- [x] 输入栏按算法元信息（`inputSchema`）自适应
- [x] 单元测试扩充至 11 个

**阶段三（已完成）**

- [x] 简单选择排序、直接插入排序、快速排序（真实算法 + 动画 + 代码同步）
- [x] 画布增强：基准元素紫色高亮、分区区间背景、比较/交换次数统计
- [x] 排序章节共享工具（`parseArrayInput` / `makeSortState`）抽取复用
- [x] 单元测试扩充至 23 个

**阶段四（已完成）**

- [x] 顺序表、单链表、顺序栈、循环队列（操作脚本驱动）
- [x] **C/C++ 指针与堆内存可视化**（`MemoryView`：栈帧指针变量 ↔ 堆内存结点）
- [x] 单链表展示 `Node* p = new Node(...)`、指针赋值、连接、free 全过程
- [x] 通用数组视图（`ArrayView`）与链表视图（`LinkedListView`）
- [x] 链栈、链队列（复用链表渲染器，展示 top / front / rear 指针结构）
- [x] 双向链表（prev/next 双指针）、循环单链表（尾结点 next 回环）
- [x] 顺序队列（非循环，展示假溢出）、循环双向链表（双向 + 头尾回环）
- [x] `LinkedListView` 升级为 SVG 布局，支持单向/双向箭头、循环回环、head/tail 指针标签
- [x] 单元测试扩充至 58 个

**阶段五-A（已完成）：树与查找**

- [x] `TreeView` 渲染器：中序布局动态画树（节点 + 父子连线 + 状态着色 + 访问序列 + 辅助栈/队列）
- [x] 二叉树 `tree.binary`：层序构建 + 前序/中序/后序/层序四种遍历（显式栈/队列真实模拟递归展开）
- [x] 折半查找 `search.binary`：展示 low/mid/high 指针与查找区间缩小
- [x] 二叉排序树 `search.bst`：插入 / 查找 / 删除（叶子、单子、双子中序后继）
- [x] 单元测试扩充至 75 个

**阶段六-A（已完成）：图遍历**

- [x] `GraphView` 渲染器：顶点圆形布局 + 边连线（有向箭头）+ 权重标签 + 状态着色 + 访问序/栈队列
- [x] 图遍历 `graph.dfs` / `graph.bfs`：build 顶点 + edge 边 + dfs/bfs 遍历（真实算法驱动）
- [x] 单元测试扩充至 80 个

**阶段六-B（已完成）：最小生成树 + 最短路径**

- [x] 图状态扩展：顶点下方距离标注（vertexLabels）+ 信息面板（info）
- [x] `graph.prim` 最小生成树：key 数组 + 选中边高亮 + 总权值
- [x] `graph.dijkstra` 最短路径：dist 数组 + 松弛过程 + 已确定集合
- [x] 单元测试扩充至 83 个

**阶段六-C（已完成）：Kruskal + 拓扑排序**

- [x] `graph.kruskal` 最小生成树：边按权升序排序 + 并查集判环，选中边绿色、成环边红色，顶点标注并查集代表元
- [x] `graph.topological` 拓扑排序：有向图 Kahn 算法，入度标注 + 入度 0 队列 + 拓扑序 + 环检测
- [x] 单元测试扩充至 87 个

**阶段六-D（已完成）：Floyd + 关键路径**

- [x] `graph.floyd` 最短路径：三重循环动态规划，顶部 dist 距离矩阵（高亮更新 cell）+ 中转顶点高亮
- [x] `graph.critical-path` 关键路径：AOE 网拓扑排序 + 正推 ve / 逆推 vl + 关键活动高亮
- [x] `GraphView` 新增距离矩阵渲染（`matrix` 字段）
- [x] 单元测试扩充至 91 个

**阶段七（已完成）：补齐全部剩余教材内容**

九章共 **59 个算法模块** 全部实现，无「开发中」残留：

- [x] **排序**：希尔 / 堆 / 归并 / 基数（`BarsCanvas` 扩展辅助数组、当前位、增量展示）
- [x] **查找**：顺序查找、分块查找、散列查找（新 `HashView` 渲染器）、AVL（LL/RR/LR/RL 四种旋转）
- [x] **树**：前/中/后/层序遍历独立模块、创建与删除、线索二叉树、哈夫曼树、哈夫曼编码、普通树（孩子兄弟表示法）
- [x] **串**：字符串基本操作、朴素匹配、KMP（新 `StringView` 渲染器，next 数组展示）
- [x] **数组和广义表**：一维/二维数组、对称/三角/三对角矩阵压缩、稀疏矩阵三元组、广义表（新 `MatrixView` 渲染器）
- [x] **栈队列应用**：括号匹配、表达式求值（中缀转后缀 + 求值）
- [x] **图存储**：邻接矩阵（`matrix` 渲染）、邻接表
- [x] **绪论**：操作次数模拟、复杂度知识卡片
- [x] 单元测试扩充至 **116 个**（含章节完整性校验，保证无「开发中」残留）

**阶段八（已完成）：完善与本地交付**

- [x] 错误边界（`ErrorBoundary`）：画布 / 页面级隔离，单模块崩溃不再导致白屏，支持一键重试
- [x] 响应式优化：控制栏改为两行布局，窄屏不再拥挤
- [x] 动画性能优化：柱状图声明 `willChange`，柱多时降级为轻量 tween 过渡
- [x] 使用文档：键盘快捷键 + 九章操作命令速查表（见上文「使用指南」）
- [x] 修正过时文案（内存可视化特色已落地，非「规划中」）

> 部署相关（Playwright 端到端测试、GitHub Actions、GitHub Pages 静态部署）按用户要求暂缓，可随时继续。

**托管**

- 代码仓库：<https://github.com/RainANDCr/datastruct-lab>
- 默认分支：`main`

## 使用指南

### 键盘快捷键

| 按键 | 功能 |
|------|------|
| `Space` | 播放 / 暂停 |
| `→` | 下一步 |
| `←` | 上一步 |

底部控制栏提供：开始 / 暂停、上一步、下一步、重置、6 档速度（0.25x ~ 4x）、进度条拖动跳转。

### 各章节操作命令速查

每个算法页顶部输入框支持自定义命令（用 `,` 或 `;` 分隔多条）。常用语法如下：

| 章节 | 语法示例 | 说明 |
|------|---------|------|
| 排序 | `5, 3, 8, 1, 9, 2` | 逗号分隔待排序数字 |
| 线性表 | `append 10, insert 1 99, delete 0, search 99` | append 尾插 / insert 位置 值 / delete 下标 / search 值 |
| 单链表 | `insert 20, search 30, delete 20` | insert 头插 / delete 按值删 |
| 双向/循环链表 | `insert 10, append 30, delete 20` | 同上 |
| 顺序栈/链栈 | `push 10, pop, push 40` | 入栈 / 出栈 |
| 顺序/循环/链队列 | `enqueue 10, dequeue, enqueue 40` | 入队 / 出队 |
| 括号匹配 | `(a + b) * [c - {d / e}]` | 任意含括号表达式 |
| 表达式求值 | `3 + 4 * 2 / (1 - 5)` | 中缀表达式（含括号） |
| 字符串基本操作 | `text HelloWorld ; charAt 4` | text 定义串 + 操作 |
| 朴素匹配 / KMP | `text ABABDABACDABABCABAB ; pattern ABABCABAB` | 主串 + 模式串 |
| 二叉树/遍历 | `build 1,2,3,null,4,5 ; preorder` | build 层序构建(null=空) + 遍历 |
| 二叉树创建删除 | `build 1,2,3,4,5,6,7 ; delete 5` | build + delete 值 |
| 线索二叉树 | `build 1,2,3,4,5,6,7 ; thread` | build + thread 线索化 |
| 哈夫曼树/编码 | `A:5, B:3, C:2, D:4` | 字符:权值 |
| 普通树 | `A-B, A-C, A-D, B-E, B-F` | 父-子 边（孩子兄弟表示法） |
| 图（遍历/存储） | `build A,B,C ; edge A-B, A-C ; dfs A` | build 顶点 + edge 边 + 遍历 |
| 图（带权/有向） | `edge A->B-2, C-D-3 ; prim A` | `->`有向、`-权`带权 |
| 最小生成树/最短路 | `build A,B,C,D ; edge A-B-1, B-C-2 ; kruskal` | 带权边 + 算法命令 |
| 拓扑/关键路径 | `edge A->B, B->C ; topological` | 有向边 + topological/critical-path |
| 顺序查找/折半/分块 | `build 3,1,5,7,2 ; search 7` | build 数组 + search 值 |
| 二叉排序树 | `insert 8, insert 3, search 6, delete 8` | 插入/查找/删除 |
| AVL | `8, 3, 10, 1, 6, 4, 7, 14, 13` | 逗号分隔插入序列 |
| 散列查找 | `build 11 ; insert 5, 16, 27 ; search 38` | build 表长 + 插入/查找 |
| 数组/矩阵 | `1, 2, 3 ; 4, 5, 6` | 分号分隔行 |
| 广义表 | `(a, (b, c), d)` | 括号嵌套表示 |

> 说明：每个输入框下方的占位提示也给出了该算法的推荐格式；输入非法时会给出具体错误信息。

## 统一颜色语义

| 状态 | 颜色 |
|------|------|
| 默认节点 | 蓝色 |
| 当前访问节点 | 黄色 |
| 正在比较节点 | 橙色 |
| 已完成节点 | 绿色 |
| 删除 / 错误状态 | 红色 |

## License

本项目暂未附带开源许可证文件。在缺少 LICENSE 的情况下默认保留所有权利；
如需允许他人自由使用、修改与分发，建议补充 MIT 或 Apache-2.0 许可证。
