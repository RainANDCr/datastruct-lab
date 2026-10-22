/**
 * 线性表章节算法注册入口。
 */
import { registerAlgorithm } from '@/engine/registry';
import { circularDoublyLinkedListModule } from './circular-doubly-linked';
import { circularLinkedListModule } from './circular-linked';
import { doublyLinkedListModule } from './doubly-linked';
import { sequentialListModule } from './sequential';
import { singlyLinkedListModule } from './singly-linked';

registerAlgorithm(sequentialListModule);
registerAlgorithm(singlyLinkedListModule);
registerAlgorithm(circularLinkedListModule);
registerAlgorithm(doublyLinkedListModule);
registerAlgorithm(circularDoublyLinkedListModule);
