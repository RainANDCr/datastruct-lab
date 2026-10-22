/**
 * 基数排序（Radix Sort，LSD）
 *
 * 按最低位优先（LSD）逐位分配-收集：从个位到最高位，每轮按当前位
 * 分配到 0~9 号桶，再按桶序收集回数组。digit 标记当前处理的位。
 * 代码行号与 C / C++ / 伪代码严格对齐（三者均为 20 行）。
 */
import type { AlgorithmModule, AlgorithmStep } from '@/engine/types';
import { parseArrayInput } from './shared';
import { createSortState, type SortState } from './types';

const LINES = { digitLoop: [5, 6], count: [7, 8], prefix: [10, 11], place: [13, 14, 15, 16] } as const;

const cCode = `#define RADIX 10
void radixSort(int a[], int n) {
    int output[n];
    int max = a[0];
    for (int i = 1; i < n; i++)
        if (a[i] > max) max = a[i];
    for (int exp = 1; max / exp > 0; exp *= 10) {
        int count[RADIX] = {0};
        for (int i = 0; i < n; i++)
            count[(a[i] / exp) % 10]++;
        for (int i = 1; i < RADIX; i++)
            count[i] += count[i - 1];
        for (int i = n - 1; i >= 0; i--) {
            int d = (a[i] / exp) % 10;
            output[--count[d]] = a[i];
        }
        for (int i = 0; i < n; i++) a[i] = output[i];
    }
}`;

const cppCode = `void radixSort(vector<int>& a) {
    int max = *max_element(a.begin(), a.end());
    vector<int> output(a.size());
    for (int exp = 1; max / exp > 0; exp *= 10) {
        int count[10] = {0};
        for (int x : a) count[(x / exp) % 10]++;
        for (int i = 1; i < 10; i++) count[i] += count[i - 1];
        for (int i = a.size() - 1; i >= 0; i--) {
            int d = (a[i] / exp) % 10;
            output[--count[d]] = a[i];
        }
        a = output;
    }
}`;

const pseudocode = `常量 RADIX ← 10
函数 radixSort(a, n):
    output ← 辅助数组[0..n-1]
    max ← a 中最大值
    for exp ← 1, 10, 100, ...（max/exp > 0）do
        count[0..9] ← 0
        for i ← 0 to n-1 do
            count[(a[i]/exp) % 10] ← count[(a[i]/exp) % 10] + 1
        for i ← 1 to 9 do count[i] ← count[i] + count[i-1]
        for i ← n-1 downto 0 do
            d ← (a[i]/exp) % 10
            output[--count[d]] ← a[i]
        end for
        for i ← 0 to n-1 do a[i] ← output[i]
    end for
结束函数`;

function* radixSortSteps(input: number[]): Generator<AlgorithmStep<SortState>> {
  const arr = [...input];
  const n = arr.length;
  const sortedIndices: number[] = [];
  let moves = 0;

  const state = (comparing: [number, number] | null, digit: number): SortState => ({
    values: [...arr],
    comparing,
    swapping: null,
    sortedIndices: [...sortedIndices],
    pivotIndex: null,
    comparisons: 0,
    swaps: moves,
    pass: 0,
    digit,
    step: 10 ** digit,
  });

  const maxVal = Math.max(...arr.map((v) => Math.abs(v)));
  const maxDigit = maxVal === 0 ? 1 : Math.floor(Math.log10(maxVal)) + 1;

  yield {
    id: 'start',
    description: `基数排序（LSD）：最大数 ${maxVal} 共 ${maxDigit} 位，从个位开始`,
    state: state(null, 0),
    highlightedElements: [],
    highlightedLines: [...LINES.digitLoop],
    variables: { 最大位数: maxDigit },
  };

  for (let d = 0; d < maxDigit; d++) {
    const exp = 10 ** d;
    yield {
      id: `digit-${d}`,
      description: `第 ${d + 1} 轮：按 ${['个位', '十位', '百位', '千位'][d]}（exp=${exp}）分配`,
      state: state(null, d),
      highlightedElements: [],
      highlightedLines: [...LINES.digitLoop],
      variables: { 当前位: ['个位', '十位', '百位', '千位'][d], exp },
    };

    const buckets: number[][] = Array.from({ length: 10 }, () => []);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(arr[i] / exp) % 10;
      buckets[idx].push(arr[i]);
      yield {
        id: `dist-${d}-${i}`,
        description: `${arr[i]} 的该位数字为 ${idx}，放入 ${idx} 号桶`,
        state: state([i, i], d),
        highlightedElements: [`bar-${i}`],
        highlightedLines: [...LINES.count],
        variables: { 元素: arr[i], 桶: idx },
      };
    }

    let k = 0;
    for (let b = 0; b < 10; b++) {
      for (const v of buckets[b]) {
        arr[k++] = v;
        moves += 1;
      }
    }
    yield {
      id: `collect-${d}`,
      description: `按桶号 0~9 顺序收集回数组：${arr.join(', ')}`,
      state: state(null, d),
      highlightedElements: [],
      highlightedLines: [...LINES.place],
      variables: { 收集后: arr.join(', ') },
    };
  }

  for (let k = 0; k < n; k++) sortedIndices.push(k);
  yield {
    id: 'done',
    description: `基数排序完成，共移动 ${moves} 次`,
    state: state(null, maxDigit),
    highlightedElements: [],
    highlightedLines: [],
    variables: { 移动次数: moves },
  };
}

export const radixSortModule: AlgorithmModule<SortState, number[]> = {
  meta: {
    id: 'sorting.radix',
    name: '基数排序',
    nameEn: 'Radix Sort',
    chapter: 'sorting',
    order: 8,
    summary: '按位分配-收集（LSD），多关键字排序，稳定 O(d·n)。',
    coreIdea:
      '基数排序（LSD）从最低位到最高位逐位排序：每轮按当前位的数字（0~9）把元素分配到对应桶，再按桶序收集回数组。经过 d 轮（d 为最大位数）后序列有序。',
    operationSteps: [
      '确定最大数的位数 d。',
      '从个位开始，把每个元素按其当前位数字分配到 0~9 号桶。',
      '按桶号顺序收集回数组。',
      '处理下一位，直到最高位。',
    ],
    useCases: ['整数/定长字符串排序', '位数较少的大规模数据', '身份证号等定长关键字'],
    complexity: {
      time: { best: 'O(d·(n+k))', average: 'O(d·(n+k))', worst: 'O(d·(n+k))' },
      space: 'O(n+k) 桶/计数数组',
    },
    stable: true,
    pros: ['稳定、非比较排序', '对定长整数很高效', '可线性时间'],
    cons: ['只适合整数/定长串', '需要额外空间', '数据范围大时效率下降'],
    examPoints: [
      '基数排序是稳定排序。',
      '基数排序不是基于比较的排序，可突破 O(n log n) 下界。',
      'LSD 从低位到高位，MSD 从高位到低位。',
      '时间复杂度 O(d·(n+k))。',
    ],
    variableDocs: [
      { name: 'exp', meaning: '当前位权（1/10/100...）' },
      { name: 'count', meaning: '各桶计数（计数排序）' },
      { name: 'output', meaning: '收集用的辅助数组' },
    ],
    code: { c: cCode, cpp: cppCode, pseudocode },
    inputSchema: [
      { key: 'array', label: '待排序数组', type: 'array', placeholder: '如：170, 45, 75, 90, 802' },
    ],
    defaultInput: '170, 45, 75, 90, 802, 24, 2, 66',
    implemented: true,
    visualizer: 'bars',
  },
  generateSteps: radixSortSteps,
  parseInput: parseArrayInput,
  createInitialState: createSortState,
};
