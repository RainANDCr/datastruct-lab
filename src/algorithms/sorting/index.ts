/**
 * 排序章节算法注册入口。
 * 新增排序算法时：新建模块文件 → 在此 import 并 registerAlgorithm。
 */
import { registerAlgorithm } from '@/engine/registry';
import { bubbleSortModule } from './bubble';
import { heapSortModule } from './heap';
import { insertionSortModule } from './insertion';
import { mergeSortModule } from './merge';
import { quickSortModule } from './quick';
import { radixSortModule } from './radix';
import { selectionSortModule } from './selection';
import { shellSortModule } from './shell';

registerAlgorithm(bubbleSortModule);
registerAlgorithm(selectionSortModule);
registerAlgorithm(insertionSortModule);
registerAlgorithm(shellSortModule);
registerAlgorithm(quickSortModule);
registerAlgorithm(heapSortModule);
registerAlgorithm(mergeSortModule);
registerAlgorithm(radixSortModule);
