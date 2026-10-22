/**
 * 绪论章节算法注册入口。
 */
import { registerAlgorithm } from '@/engine/registry';
import { complexityModule } from './complexity';
import { knowledgeCardsModule } from './knowledge-cards';
import { operationCountModule } from './operation-count';

registerAlgorithm(complexityModule);
registerAlgorithm(operationCountModule);
registerAlgorithm(knowledgeCardsModule);
