/**
 * 栈和队列章节算法注册入口。
 */
import { registerAlgorithm } from '@/engine/registry';
import { bracketMatchingModule } from './bracket-matching';
import { expressionEvalModule } from './expression-eval';
import { linkedQueueModule } from './linked-queue';
import { linkedStackModule } from './linked-stack';
import { circularQueueModule } from './sequential-queue';
import { sequentialQueueModule } from './sequential-queue-simple';
import { sequentialStackModule } from './sequential-stack';

registerAlgorithm(sequentialStackModule);
registerAlgorithm(linkedStackModule);
registerAlgorithm(sequentialQueueModule);
registerAlgorithm(circularQueueModule);
registerAlgorithm(linkedQueueModule);
registerAlgorithm(bracketMatchingModule);
registerAlgorithm(expressionEvalModule);
