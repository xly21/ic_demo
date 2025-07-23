// 芯片注册表：整合所有厂商的芯片定义
// 作为中央入口点，统一导出项目支持的所有芯片型号

// 导入各厂商/系列的芯片定义
import { chips as other } from "./chips/other";           // 其他厂商芯片
// import { chips as padauk } from "./chips/padauk";       // 应广(Padauk)系列芯片
// import { chips as wch } from "./chips/wch";             // 沁恒(WCH)系列芯片
// import { chips as propeller } from "./chips/propeller"; // Parallax Propeller芯片
// import { chips as propeller1 } from "./chips/propeller1"; // Parallax Propeller 1芯片
// import { chips as raspberrypi } from "./chips/raspberrypi"; // 树莓派(Raspberry Pi)相关芯片
// import { chips as stm32g0 } from "./chips/stm32g0";     // STM32G0系列芯片
// import { chips as sn32f240b } from "./chips/sn32f240b"; // SN32F240B系列芯片
// import { chips as sn32f260 } from "./chips/sn32f260";   // SN32F260系列芯片
// import { chips as littlelogic } from "./chips/littlelogic"; // 小型逻辑芯片

/**
 * 合并所有芯片定义为单一数组
 * 使用展开运算符(...)将各厂商芯片数组合并为一个完整列表
 * 这使得应用可以通过单一导入获取所有支持的芯片型号
 */
export default [
  ...other,
  // ...padauk,
  // ...wch,
  // ...propeller,
  // ...propeller1,
  // ...raspberrypi,
  // ...stm32g0,
  // ...sn32f240b,
  // ...sn32f260,
  // ...littlelogic,
];
