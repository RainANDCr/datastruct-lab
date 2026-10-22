/**
 * 算法模块聚合入口：通过 side-effect import 触发各章节的模块注册。
 * 后续章节（线性表/栈队列/树/图等）在此追加导入即可自动完成注册，
 * 侧边栏与路由无需改动。
 */
import './array';
import './graph';
import './intro';
import './linear-list';
import './search';
import './sorting';
import './stack-queue';
import './string';
import './tree';
