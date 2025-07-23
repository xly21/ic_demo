// 工具与辅助函数：提供颜色计算、数组处理等辅助函数
// 导入颜色处理库：用于解析和操作颜色值
import onecolor from "onecolor/one-color-all";

/**
 * 根据背景颜色计算对比度文本颜色
 * @param {string} color - 背景颜色值（默认为白色）
 * @returns {string} 对比度文本颜色（黑色或白色）
 */
export function getContrastColor(color: string = "white") {
  const rgb = onecolor(color); // 解析颜色值为RGB对象
  // 计算亮度（使用YIQ公式）
  const brightness = Math.round(
    (rgb.red() * 0xff * 299 +  // 红色通道权重
      rgb.green() * 0xff * 587 + // 绿色通道权重
      rgb.blue() * 0xff * 114) / // 蓝色通道权重
      1000 // 总权重
  );
  // 根据亮度决定文本颜色（亮度>125使用黑色，否则使用白色）
  return brightness > 125 ? "black" : "white";
}

/**
 * 生成指定长度的索引数组
 * @param {number} n - 数组长度
 * @returns {number[]} 从0到n-1的索引数组
 */
export function nTimes(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

/**
 * 反向迭代数组的生成器函数
 * @template T
 * @param {T[]} arr - 要迭代的数组
 * @yields {T} 数组元素（从后往前）
 */
export function* reversed<T>(arr: T[]) {
  for (let i = arr.length - 1; i >= 0; i--) {
    yield arr[i]!; // 使用非空断言，假设数组元素不为null/undefined
  }
}

/**
 * 查找数组中最后一个满足条件的元素索引
 * @template T
 * @param {T[]} arr - 要搜索的数组
 * @param {(element: T) => boolean} cmp - 判断条件函数
 * @returns {number} 找到的元素索引，未找到返回-1
 */
export function findLastIndex<T>(arr: T[], cmp: (element: T) => boolean) {
  // 反向迭代数组并查找第一个满足条件的元素
  let lastIndex = [...reversed(arr)].findIndex(cmp);
  if (lastIndex === -1) {
    return lastIndex; // 未找到
  } else {
    // 转换为原数组中的索引
    return arr.length - lastIndex - 1;
  }
}

/**
 * 确保输入值为数组形式
 * @template T
 * @param {T | T[]} input - 可以是单个元素或数组
 * @returns {T[]} 包装后的数组
 */
export function ensureIsArray<T>(input: T | T[]): T[] {
  return Array.isArray(input) ? input : [input];
}

/**
 * 在数组元素之间插入分隔符
 * @template T, U
 * @param {T[]} input - 原始数组
 * @param {U} separator - 要插入的分隔符
 * @returns {(T | U)[]} 插入分隔符后的新数组
 */
export function separateArrayBy<T, U>(input: T[], separator: U): Array<T | U> {
  return input.flatMap((element, idx) =>
    idx === 0 ? [element] : [separator, element] // 第一个元素前不加分隔符
  );
}
