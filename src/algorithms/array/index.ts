/**
 * 数组和广义表章节算法注册入口。
 */
import { registerAlgorithm } from '@/engine/registry';
import { symmetricModule, triangularModule, tridiagonalModule } from './compressed';
import { generalizedListModule } from './generalized-list';
import { oneDimModule } from './one-dim';
import { sparseMatrixModule } from './sparse';
import { twoDimModule } from './two-dim';

registerAlgorithm(oneDimModule);
registerAlgorithm(twoDimModule);
registerAlgorithm(symmetricModule);
registerAlgorithm(triangularModule);
registerAlgorithm(tridiagonalModule);
registerAlgorithm(sparseMatrixModule);
registerAlgorithm(generalizedListModule);
