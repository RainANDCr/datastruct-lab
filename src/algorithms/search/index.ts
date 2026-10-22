/**
 * 查找章节算法注册入口。
 */
import { registerAlgorithm } from '@/engine/registry';
import { avlModule } from './avl';
import { binarySearchModule } from './binary';
import { blockSearchModule } from './block';
import { bstModule } from './bst';
import { hashSearchModule } from './hash';
import { sequentialSearchModule } from './sequential';

registerAlgorithm(sequentialSearchModule);
registerAlgorithm(binarySearchModule);
registerAlgorithm(blockSearchModule);
registerAlgorithm(bstModule);
registerAlgorithm(avlModule);
registerAlgorithm(hashSearchModule);
