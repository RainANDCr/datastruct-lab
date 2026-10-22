/**
 * 串章节算法注册入口。
 */
import { registerAlgorithm } from '@/engine/registry';
import { stringBasicModule } from './basic';
import { kmpModule } from './kmp';
import { naiveMatchModule } from './naive-match';

registerAlgorithm(stringBasicModule);
registerAlgorithm(naiveMatchModule);
registerAlgorithm(kmpModule);
