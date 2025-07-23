// 芯片定义：定义芯片和引脚的通用类型、常量和工具函数
// 导入工具函数：确保值为数组形式
import { ensureIsArray } from "../util";

/**
 * 引脚功能分类常量定义
 * 每个常量包含显示名称和颜色编码，用于引脚功能的可视化区分
 */

// 内部上拉/下拉引脚
export const PULL_UP_DOWN = {
  name: "Pins with Internal Pull-up/Pull-Down",
  color: "#FFC869",
  defaultHidden: true, // 默认隐藏该分类
};

// 最大灌电流/驱动电流引脚
export const MAXIMUM_CURRENT = {
  name: "Maximum Sink/Drive Current",
  color: "#FFC869",
  defaultHidden: true,
};

// LCD偏置电压发生器引脚
export const LCD = {
  name: "LCD Pins (VDD/2 LCD Bias Voltage Generator)",
  color: "#E5CDA2",
};

// 11位PWM输出引脚
export const PWM11 = {
  name: "11-bit PWM Output Pins",
  color: "#26B9E4",
};

// 8位PWM输出引脚
export const PWM8 = {
  name: "8-bit PWM Output Pins",
  color: "#26B9E4",
};

// 定时器PWM输出引脚
export const PWM_TIMER = {
  name: "Timer PWM Output Pins",
  color: "#67CEEC",
};

// 比较器输入/输出引脚
export const COMPARATOR = {
  name: "Comparator Input/Output Pins",
  color: "#BFD366",
};

// 外部中断引脚
export const EXTERNAL_INTERRUPT = {
  name: "External Interrupt Pins",
  color: "#FF9D07",
};

// 编程引脚
export const PROGRAMMING_PINS = {
  name: "Programming Pins",
};

// ADC输入通道引脚
export const ADC = {
  name: "ADC Input Channel",
  color: "#95B600",
};

// 定时器时钟源引脚
export const TIMER_CLOCK_SOURCES = {
  name: "Timer Clock Source Pins",
  color: "#F4D620",
};

// 外部晶振引脚
export const EXTERNAL_CRYSTAL = {
  ...TIMER_CLOCK_SOURCES,
  name: "External Crystal Pins",
};

// 外部晶振/定时器时钟源引脚
export const CRYSTAL_AND_TIMER_CLOCK_SOURCES = {
  ...EXTERNAL_CRYSTAL,
  name: "External Crystal / Timer Clock Source Pins",
};

// 表示一个不存在的引脚
// 详情参见`ChipVariant.pins`的描述
export const SKIPPED_PIN = Symbol();

// 表示一个不存在但仍需编号的引脚
// 详情参见`ChipVariant.pins`的描述
export const SKIPPED_PIN_WITH_NUMBER = Symbol();

// 类型定义：不存在的引脚类型
export type SKIPPED_PIN = typeof SKIPPED_PIN;
// 类型定义：不存在但需编号的引脚类型
export type SKIPPED_PIN_WITH_NUMBER = typeof SKIPPED_PIN_WITH_NUMBER;

/**
 * 芯片定义类型
 * 描述一个完整芯片的所有信息，包括名称、制造商、封装变体和引脚功能
 */
export type ChipDefinition = {
  // 芯片名称，应为通用名称，不特定于某个封装变体
  name: string;
  // 芯片制造商
  manufacturer?: string;
  // 芯片的附加说明
  notes?: string;
  // 芯片的封装变体列表，至少需要一个变体
  variants: ChipVariant[];
  // 引脚颜色的可选配置，可用于为特定引脚设置颜色
  // 键为引脚名称，值为包含颜色信息的对象
  pins?: Record<string, { color?: string }>;
  // 描述附加引脚功能的列表
  // 例如哪些引脚支持ADC、哪些支持PWM等
  data: ChipData[];
};

/**
 * 芯片封装变体类型
 * 描述芯片的特定封装形式，主要用于将引脚编号映射到引脚名称
 */
export type ChipVariant = {
  // 使用此封装变体的所有芯片名称
  name?: string | string[];
  // 封装类型，默认为"dual"（双列）
  // 支持"dual"（双列）和"quad"（四列）封装
  package?: "dual" | "quad";
  // 此封装使用的引脚名称数组
  // 例如，["GND", "PA0", "PB3", "VCC"]表示引脚1为GND，引脚2为PA0等
  // 对于双列封装，列表长度必须是2的倍数
  // 对于四列封装，列表长度必须是4的倍数
  // 对于缺少某些引脚的封装（如SOT-23-5），使用SKIPPED_PIN或SKIPPED_PIN_WITH_NUMBER符号
  // 两者区别示例：
  // ["A", SKIPPED_PIN, "C", "D"] vs ["A", SKIPPED_PIN_WITH_NUMBER, "C", "D"]
  //   _______           _______
  // A | 1   5 | E    A | 1   6 | E
  // B | 2     |      B | 2     |
  // C | 3   4 | D    C | 3   4 | D
  //   -------           -------
  pins: (string | SKIPPED_PIN | SKIPPED_PIN_WITH_NUMBER)[];
  // 额外引脚，将渲染在封装旁边
  // 用于QFP封装的底部焊盘等特殊引脚
  additionalPins?: {
    description: string; // 引脚描述（如"Bottom Pad"）
    pin: string; // 引脚名称（如"GND"）
  }[];
};

/**
 * 芯片数据类型
 * 表示具有共同功能的引脚组
 * 例如，所有可用作ADC输入的引脚被分组在一起
 */
export type ChipData = {
  // 功能名称，如"11-bit PWM Output Pins"或"ADC Input Channel"
  name: string;
  // 该组引脚使用的颜色
  color?: string;
  // 指示该组信息是否默认隐藏
  defaultHidden?: boolean;
  // 引脚映射，键为标签，值为引脚名称或引脚名称数组
  // 例如：{
  //   "PWM0": "PA0",
  //   "PWM1": ["PA3", "PB5"]
  // }
  // 这将在引脚"PA0"旁边显示"PWM0"标签，在"PA3"和"PB5"旁边显示"PWM1"标签
  pins: Record<string, string | string[]>;
};

/**
 * 复制芯片定义并替换名称中的特定字符串
 * @param chip - 要复制的芯片定义
 * @param oldName - 要替换的旧名称
 * @param newName - 替换后的新名称
 * @returns 新的芯片定义对象
 */
export function copyAndChangeName(chip: ChipDefinition, oldName: string, newName: string) {
  return {
    ...chip,
    // 替换芯片名称中的旧名称
    name: chip.name.replaceAll(oldName, newName),
    // 替换每个变体名称中的旧名称
    variants: chip.variants.map(variant => ({
      ...variant,
      name: variant.name !== undefined
        ? ensureIsArray(variant.name).map(name => name.replaceAll(oldName, newName))
        : variant.name,
    })),
  };
}
