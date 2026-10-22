/**
 * 树和二叉树章节算法注册入口。
 */
import { registerAlgorithm } from '@/engine/registry';
import { binaryTreeModule } from './binary';
import { createDeleteModule } from './create-delete';
import { generalTreeModule } from './general';
import { huffmanCodingModule } from './huffman-coding';
import { huffmanTreeModule } from './huffman-tree';
import { threadedTreeModule } from './threaded';
import { inorderModule, levelorderModule, postorderModule, preorderModule } from './traversal-modules';

registerAlgorithm(generalTreeModule);
registerAlgorithm(binaryTreeModule);
registerAlgorithm(preorderModule);
registerAlgorithm(inorderModule);
registerAlgorithm(postorderModule);
registerAlgorithm(levelorderModule);
registerAlgorithm(createDeleteModule);
registerAlgorithm(threadedTreeModule);
registerAlgorithm(huffmanTreeModule);
registerAlgorithm(huffmanCodingModule);
