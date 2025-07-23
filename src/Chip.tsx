// 核心渲染组件，负责绘制芯片引脚图和处理交互（核心组件）
// 导入React核心库和CSSProperties类型
import React, { CSSProperties } from "react";
// 导入工具函数：获取对比度颜色、数组反转、重复函数、查找最后索引、确保数组类型、数组分隔
import {
  getContrastColor,
  reversed,
  nTimes,
  findLastIndex,
  ensureIsArray,
  separateArrayBy,
} from "./util";
// 导入设置上下文，用于获取应用的配置信息
import { SettingsContext } from "./Settings";
// 导入芯片定义相关的类型：芯片定义、芯片变体、跳过引脚常量、带编号的跳过引脚常量
import {
  ChipDefinition,
  ChipVariant,
  SKIPPED_PIN,
  SKIPPED_PIN_WITH_NUMBER,
} from "./chips/common";

// 格式化变体名称，将第一行设置为粗体，其余行设置为小号字体
function formatVariantName(str: string) {
  return str.split("\n").flatMap((rawLine, i, lines) => {
    const line =
      i === 0 ? (
        <strong key={i}>{rawLine}</strong>
      ) : (
        <small key={i}>{rawLine}</small>
      );

    return i === 0 ? line : [<br key={`${i}_br`} />, line];
  });
}

// 将换行符转换为<br>标签，用于在JSX中正确显示换行文本
function nl2br(str: string) {
  return str.split("\n").flatMap((line, i) => {
    // 除第一行外，每行前添加换行符
    return i === 0 ? line : [<br key={`${i}_br`} />, line];
  });
}

// 定义带功能的引脚类型，T为true时可以是跳过的引脚
type PinWithFunctions<
  // T === true <=> can be a skipped pin
  T extends boolean
> =
  | {
      type: "pin";
      name: {
        value: string;
        style: CSSProperties;
      };
      tags: Array<null | { // 引脚功能标签数组
        values: string[]; // 功能值数组
        style: { background: string; color: string }; // 标签样式
      }>;
    }
  | (T extends true
      ? { // 当T为true时，可以是跳过的引脚类型
          type: "skipped"; // 引脚类型：跳过
          numFunctions: number; // 功能数量
        }
      : never);

// 在PinWithFunctions基础上添加引脚编号属性
type PinWithFunctionsAndNumber<T extends boolean = true> = PinWithFunctions<T> & {
  number: number | null; // 引脚编号，可为null（跳过的引脚）
};

// 处理引脚数据，生成包含功能和编号的引脚对象
function handlePin(
  chip: ChipDefinition, // 芯片定义对象
  variant: ChipVariant, // 芯片变体对象
  idx: number, // 引脚索引
  number: number | null, // 引脚编号
  reverse: boolean, // 是否反转数据顺序
  visibleData: string[] // 可见数据类型数组
): PinWithFunctionsAndNumber {
  const pinName = variant.pins[idx]!; // 获取引脚名称

  // 返回包含编号和引脚详细信息的对象
  return {
    number,
    ...handleAdditionalPin(chip, pinName, reverse, visibleData),
  };
}

// 处理额外引脚信息，生成引脚功能和样式
function handleAdditionalPin<T extends boolean>(
  chip: ChipDefinition, // 芯片定义对象
  pinName: T extends true
    ? string | SKIPPED_PIN | SKIPPED_PIN_WITH_NUMBER
    : string, // 引脚名称，可为字符串或跳过引脚常量
  reverse: boolean, // 是否反转数据顺序
  visibleData: string[] // 可见数据类型数组
): PinWithFunctions<T> {
  // 如果引脚名称不是字符串（即跳过引脚常量），返回跳过类型的引脚
  if (typeof pinName !== "string") {
    return {
      // @ts-expect-error
      type: "skipped",
      numFunctions: chip.data.filter((each) => visibleData.includes(each.name))
        .length,
    };
  }

  let functions = []; // 存储引脚功能标签
  const data = !reverse ? chip.data : reversed(chip.data); // 根据reverse参数决定数据顺序
  // 遍历数据类型，生成对应的功能标签
  for (const entry of data) {
    if (!visibleData.includes(entry.name)) { // 如果数据类型不可见，则跳过
      continue;
    }
    const pins = Object.entries(entry.pins); // 获取引脚映射
    const backgroundColor = entry.color ?? "white"; // 获取背景色，默认为白色
    const fontColor = getContrastColor(backgroundColor); // 获取对比色作为字体颜色

    const values = []; // 存储引脚功能值

    // 遍历引脚映射，查找匹配当前引脚名称的功能
    for (let [tagValue, pinKeys] of pins) {
      if (!Array.isArray(pinKeys)) { // 确保pinKeys是数组
        pinKeys = [pinKeys];
      }

      // 遍历引脚键，检查是否匹配当前引脚名称
      for (const pinKey of pinKeys) {
        if (pinKey === pinName) {
          values.push(tagValue); // 添加匹配的功能值
        }
      }
    }

    // 如果有功能值，添加功能标签；否则添加null
    if (values.length) {
      functions.push({
        values,
        style: {
          background: backgroundColor,
          color: fontColor,
        },
      });
    } else {
      functions.push(null);
    }
  }

  const nameStyle: CSSProperties = {}; // 引脚名称样式对象
  // 根据引脚名称设置不同的背景色和字体颜色
  if (chip.pins?.[pinName]?.color !== undefined) {
    // 如果芯片定义中指定了引脚颜色，则使用该颜色
    nameStyle.background = chip.pins[pinName]!.color;
    nameStyle.color = getContrastColor(nameStyle.background);
  } else if (["VCC", "VDD", "V5", "5V", "5V0"].includes(pinName)) {
    // 电源引脚：VCC系列
    nameStyle.background = "red";
    nameStyle.color = getContrastColor("red");
  } else if (["V33", "3V3", "VDDIO"].includes(pinName)) {
    // 3.3V电源引脚
    nameStyle.background = "#d00000";
    nameStyle.color = getContrastColor("#d00000");
  } else if (["V18", "1V8", "V11", "1V1", "Vcore"].includes(pinName)) {
    // 低压电源引脚
    nameStyle.background = "#700000";
    nameStyle.color = getContrastColor("#700000");
  } else if (["GND", "VSS", "AGND"].includes(pinName)) {
    // 地引脚
    nameStyle.background = "black";
    nameStyle.color = getContrastColor("black");
  } else if (["XI", "XO", "XI*", "XO*"].includes(pinName)) {
    // 晶振引脚
    nameStyle.background = "#ff8000";
    nameStyle.color = getContrastColor("#ff8000");
  } else if (["RST", "RSTn", "RES", "RESn", "RUN"].includes(pinName)) {
    // 复位引脚
    nameStyle.background = "#40c000";
    nameStyle.color = getContrastColor("#40c000");
  } else if (["TST"].includes(pinName)) {
    // 测试引脚
    nameStyle.background = "#404040";
    nameStyle.color = getContrastColor("#404040");
  } else if ("nc" === pinName) {
    // 未连接引脚
    nameStyle.background = "white";
    nameStyle.color = getContrastColor("white");
    nameStyle.borderStyle = "dashed"; // 虚线边框
  }

  // 返回引脚类型、名称和功能标签
  return {
    type: "pin",
    name: {
      value: pinName,
      style: nameStyle,
    },
    tags: functions,
  };
}

// 芯片组件，使用React.memo优化性能，避免不必要的重渲染
export const Chip = React.memo(function Chip({
  chip, // 芯片定义对象
  showName, // 是否显示芯片名称
  fontSize, // 字体大小
}: { chip: ChipDefinition; showName: boolean; fontSize: number }) {
  // 状态管理：可见数据类型，初始值为默认不隐藏的数据类型
  const [visibleData, setVisibleData] = React.useState(() =>
    chip.data
      .filter(({ defaultHidden }) => defaultHidden !== true) // 过滤默认隐藏的数据类型
      .map(({ name }) => name) // 提取数据类型名称
  );

  // 返回组件结构
  return (
    <>
      <div className="wrapper">
        {/* 如果显示名称，则渲染芯片标题 */}
        {showName && (
          <h2 id={`IC-${chip.name}`}>
            {chip.manufacturer} {chip.name}{' '}
            <small>
              ({chip.variants.length} package{' '}
              {chip.variants.length === 1 ? 'variant' : 'variants'})
            </small>
          </h2>
        )}
        {/* 如果有芯片说明，则渲染说明文本 */}
        {chip.notes && <p>{nl2br(chip.notes)}</p>}
        {/* 渲染图例组件 */}
        <Legend
          chip={chip}
          visibleData={visibleData}
          setVisibleData={setVisibleData}
        />
      </div>
      {/* 设置字体大小 */}
      <div style={{ fontSize }}>
        {/* 遍历芯片变体，渲染每个变体的引脚图 */}
        {chip.variants.map((variant, i) => (
          <Variant
            key={i}
            chip={chip}
            variant={variant}
            visibleData={visibleData}
            marginBottom={i < chip.variants.length - 1} // 除最后一个外都添加底部边距
          />
        ))}
      </div>
    </>
  );
});

// 图例组件，用于控制可见的数据类型
function Legend({
  chip, // 芯片定义对象
  visibleData, // 可见数据类型数组
  setVisibleData, // 更新可见数据类型的函数
}: { chip: ChipDefinition; visibleData: string[]; setVisibleData: React.Dispatch<React.SetStateAction<string[]>> }) {
  return (
    <div className="legend">
      {/* 遍历数据类型，生成复选框 */}
      {chip.data.map(({ color, name }) => (
        <label
          key={name}
          className="badge"
          style={{
            color: getContrastColor(color), // 字体颜色为背景色的对比度颜色
            background: color, // 背景色
          }}
        >
          {/* 复选框，用于切换数据类型的可见性 */}
          <input
            type="checkbox"
            value="1"
            checked={visibleData.includes(name)} // 是否选中
            onChange={(evt) => {
              // 复选框变化事件处理
              if (evt.target.checked) {
                // 如果选中，添加到可见数据类型
                setVisibleData((visibleData) => [...visibleData, name]);
              } else {
                // 如果取消选中，从可见数据类型中移除
                setVisibleData((visibleData) =>
                  visibleData.filter((each) => each !== name)
                );
              }
            }}
          />
          {name} {/* 数据类型名称 */}
        </label>
      ))}
    </div>
  );
}

// 变体组件，根据封装类型（dual或quad）渲染不同的引脚布局
function Variant({
  chip, // 芯片定义对象
  variant, // 芯片变体对象
  visibleData, // 可见数据类型数组
  marginBottom, // 是否添加底部边距
}: { chip: ChipDefinition; variant: ChipVariant; visibleData: string[]; marginBottom: boolean }) {
  const pkg = variant.package ?? "dual"; // 获取封装类型，默认为dual

  // 验证引脚数量是否符合封装类型要求
  switch (pkg) {
    case "dual":
      if (variant.pins.length % 2 !== 0) {
        throw new Error(`The variant ${variant.name} must have an even number of pins`);
      }
      break;
    case "quad":
      if (variant.pins.length % 4 !== 0) {
        throw new Error(
          `The variant ${variant.name} must have a number of pins divisible by 4, but has ${variant.pins.length} pins.`
        );
      }
      break;
    default:
      throw new Error("Unknown package Only 'dual' and 'quad' are supported.");
  }

  return (
    <>
      <div className="table-responsive"> {/* 响应式表格容器 */}
        <table className="pinout"> {/* 引脚图表 */}
          <tbody>
            {/* 根据封装类型渲染不同的布局 */}
            {pkg === "dual" ? (
              <DualPackage chip={chip} variant={variant} visibleData={visibleData} />
            ) : (
              <QuadPackage chip={chip} variant={variant} visibleData={visibleData} />
            )}
          </tbody>
        </table>
      </div>
      {/* 如果需要底部边距，则添加 */}
      {marginBottom && <div style={{ marginBottom: "5em" }} />
      }
    </>
  );
}

// 生成用于显示的引脚编号数组，将SKIPPED_PIN和SKIPPED_PIN_WITH_NUMBER转换为null
function generatePinNumbersForDisplay(
  pins: ChipVariant["pins"] // 引脚数组
): (number | null)[] {
  let number = 1; // 起始引脚编号
  return pins.map((pin) => {
    if (pin === SKIPPED_PIN) { // 如果是SKIPPED_PIN，返回null
      return null;
    }
    if (pin === SKIPPED_PIN_WITH_NUMBER) { // 如果是SKIPPED_PIN_WITH_NUMBER，编号递增并返回null
      ++number;
      return null;
    }
    return number++; // 其他情况返回当前编号并递增
  });
}

// 四边封装布局组件
function QuadPackage({
  chip, // 芯片定义对象
  variant, // 芯片变体对象
  visibleData, // 可见数据类型数组
}: { chip: ChipDefinition; variant: ChipVariant; visibleData: string[] }) {
  // TODO: Not yet supported. 当前未支持的设置
  // const {
  //   settings: { alignData },
  // } = React.useContext(SettingsContext);
  const alignData = false; // 数据对齐方式，默认为false

  const pinsPerSide = variant.pins.length / 4; // 每边引脚数量
  const pinNumbers = generatePinNumbersForDisplay(variant.pins); // 生成引脚编号数组

  return (
    <>
      {/* 顶部引脚行 */}
      <QuadVerticalPins
        pinsPerSide={pinsPerSide}
        side="top"
        chip={chip}
        variant={variant}
        visibleData={visibleData}
        alignData={alignData}
        pinNumbers={pinNumbers}
      />
      {/* 左右两侧引脚行 */}
      {nTimes(pinsPerSide).map((leftIndex) => {
        const rightIndex = pinsPerSide - 1 - leftIndex + pinsPerSide * 2; // 右侧引脚索引

        // 处理左侧引脚
        const pinLeft = handlePin(
          chip,
          variant,
          leftIndex,
          pinNumbers[leftIndex]!,
          true,
          visibleData
        );
        // 处理右侧引脚
        const pinRight = handlePin(
          chip,
          variant,
          rightIndex,
          pinNumbers[rightIndex]!,
          false,
          visibleData
        );

        // 返回表格行
        return (
          <tr key={leftIndex}>
            <PinRow side="left" alignData={alignData} pin={pinLeft} />
            <ICBodyAndPinNames
              chip={chip}
              variant={variant}
              pinLeft={pinLeft}
              pinRight={pinRight}
              isTopRow={leftIndex === 0} // 是否为第一行
            />
            <PinRow side="right" alignData={alignData} pin={pinRight} />
          </tr>
        );
      })}
      {/* 底部引脚行 */}
      <QuadVerticalPins
        pinsPerSide={pinsPerSide}
        side="bottom"
        chip={chip}
        variant={variant}
        visibleData={visibleData}
        alignData={alignData}
        pinNumbers={pinNumbers}
      />
    </>
  );
}

// 垂直引脚行组件，用于四边封装的顶部和底部
function QuadVerticalPins({
  pinsPerSide, // 每边引脚数量
  side, // 边（top或bottom）
  chip, // 芯片定义对象
  variant, // 芯片变体对象
  visibleData, // 可见数据类型数组
  alignData, // 数据对齐方式
  pinNumbers, // 引脚编号数组
}: { pinsPerSide: number; side: "top" | "bottom"; chip: ChipDefinition; variant: ChipVariant; visibleData: string[]; alignData: boolean; pinNumbers: (number | null)[] }) {
  // 获取引脚索引的函数
  const getPinIdx = (i: number) =>
    side === "top" ? pinsPerSide * 4 - i : pinsPerSide + 1 + i;
  const writingMode = "vertical-lr"; // 垂直书写模式

  // 生成引脚数据数组
  const pinDatas = nTimes(pinsPerSide).map((i) => {
    const pinIdx = getPinIdx(i); // 获取引脚索引
    const pin = handlePin(
      chip,
      variant,
      pinIdx - 1,
      pinNumbers[pinIdx - 1]!,
      side === "top",
      visibleData
    );
    return [pinIdx, pin] as const;
  });

  // 构建表格行
  const rows = [
    // 引脚编号行
    <tr key="pin-number">
      <td colSpan={3} /> {/* 空单元格 */}
      {pinDatas.map(([pinIdx, pin]) =>
        pin.type === "pin" ? (
          <td key={pinIdx} className="pin-number">
            {pin.number} {/* 引脚编号 */}
          </td>
        ) : (
          <td key={pinIdx} /> 
          // {/* 跳过的引脚 */}
        )
      )}
      <td colSpan={3} />
    </tr>,
    // 引脚名称行
    <tr key="pin-name">
      <td colSpan={3} />
      {pinDatas.map(([pinIdx, pin]) =>
        pin.type === "pin" ? (
          <td
            key={pinIdx}
            className="badge pin-name"
            style={{ ...pin.name.style, writingMode }} // 应用样式和垂直书写
          >
            {pin.name.value} {/* 引脚名称 */}
          </td>
        ) : (
          <td key={pinIdx} />
        )
      )}
      <td />
      {/* 底部边额外引脚表格 */}
      <td colSpan={2} rowSpan={2} style={{ verticalAlign: "top" }}>
        {side === "bottom" && (
          <table>
            <tbody>
              <AdditionalPins
                chip={chip}
                variant={variant}
                visibleData={visibleData}
                alignData={alignData}
              />
            </tbody>
          </table>
        )}
      </td>
    </tr>,
    // 引脚数据行
    <tr key="pin-data">
      <td colSpan={3} />
      {pinDatas.map(([pinIdx, pin]) => (
        <PinRow key={pinIdx} side={side} alignData={alignData} pin={pin} />
      ))}
      <td />
    </tr>,
  ];

  // 如果是顶部，则反转行顺序
  if (side === "top") {
    rows.reverse();
  }

  return <>{rows}</>;
}

// 双边封装布局组件
function DualPackage({
  chip, // 芯片定义对象
  variant, // 芯片变体对象
  visibleData, // 可见数据类型数组
}: { chip: ChipDefinition; variant: ChipVariant; visibleData: string[] }) {
  // 从设置上下文获取数据对齐方式
  const {
    settings: { alignData },
  } = React.useContext(SettingsContext);

  const pinNumbers = generatePinNumbersForDisplay(variant.pins); // 生成引脚编号数组

  return (
    <>
      {/* 遍历左侧引脚索引，生成每行左右引脚 */}
      {nTimes(variant.pins.length / 2).map((leftIndex) => {
        const rightIndex = variant.pins.length - leftIndex - 1; // 右侧引脚索引

        // 处理左侧引脚
        const pinLeft = handlePin(
          chip,
          variant,
          leftIndex,
          pinNumbers[leftIndex]!,
          true,
          visibleData
        );
        // 处理右侧引脚
        const pinRight = handlePin(
          chip,
          variant,
          rightIndex,
          pinNumbers[rightIndex]!,
          false,
          visibleData
        );

        // 返回表格行
        return (
          <tr key={leftIndex}>
            <PinRow side="left" alignData={alignData} pin={pinLeft} />
            <ICBodyAndPinNames
              chip={chip}
              variant={variant}
              pinLeft={pinLeft}
              pinRight={pinRight}
              isTopRow={leftIndex === 0} // 是否为第一行
            />
            <PinRow side="right" alignData={alignData} pin={pinRight} />
          </tr>
        );
      })}
      {/* 额外引脚行 */}
      <AdditionalPins
        chip={chip}
        variant={variant}
        visibleData={visibleData}
        alignData={alignData}
      />
    </>
  );
}

// 额外引脚组件，处理variant.additionalPins
const AdditionalPins = React.memo(function AdditionalPins({
  chip, // 芯片定义对象
  variant, // 芯片变体对象
  visibleData, // 可见数据类型数组
  alignData, // 数据对齐方式
}: { chip: ChipDefinition; variant: ChipVariant; visibleData: string[]; alignData: boolean }) {
  return (
    <>
      {/* 遍历额外引脚数组 */}
      {variant.additionalPins?.map(({ description, pin: pinName }, i) => {
        // 处理额外引脚
        const pin = handleAdditionalPin<false>(
          chip,
          pinName,
          false,
          visibleData
        );
        return (
          <tr key={i}>
            {/* 描述单元格 */}
            <td
              colSpan={(alignData ? chip.data.length : 1) + 4}
              style={{ textAlign: "right" }}
            >
              {description}
            </td>
            {/* 引脚名称单元格 */}
            <td className="badge pin-name" style={pin.name.style}>
              {pin.name.value}
            </td>
            {/* 引脚数据行 */}
            <PinRow side="right" alignData={alignData} pin={pin} />
          </tr>
        );
      })}
    </>
  );
});

// 芯片主体和引脚名称组件
function ICBodyAndPinNames({
  chip, // 芯片定义对象
  variant, // 芯片变体对象
  pinLeft, // 左侧引脚
  pinRight, // 右侧引脚
  isTopRow, // 是否为第一行
}: { chip: ChipDefinition; variant: ChipVariant; pinLeft: PinWithFunctionsAndNumber; pinRight: PinWithFunctionsAndNumber; isTopRow: boolean }) {
  // 计算行跨度和列跨度
  const rowSpan = (variant.package ?? "dual") === "dual" ? variant.pins.length / 2 : variant.pins.length / 4;
  const colSpan = (variant.package ?? "dual") === "dual" ? 1 : variant.pins.length / 4;

  return (
    <>
      {/* 左侧引脚名称和编号 */}
      {pinLeft.type === "pin" ? (
        <>
          <td className="badge pin-name" style={pinLeft.name.style}>
            {pinLeft.name.value} {/* 引脚名称 */}
          </td>
          <td className="pin-number">{pinLeft.number} {/* 引脚编号 */}</td>
        </>
      ) : (
        <td colSpan={2} /> 
        // {/* 跳过的引脚，合并两列 */}
      )}
      {/* 如果是第一行，渲染芯片主体 */}
      {isTopRow && (
        <td className="ic" rowSpan={rowSpan} colSpan={colSpan}>
          {/* 制造商名称 */}
          {chip.manufacturer && (
            <>
              {chip.manufacturer}
              <br />
            </>
          )}
          {/* 芯片名称或变体名称 */}
          {ensureIsArray(variant.name ?? chip.name).map((name, i, names) => (
            <React.Fragment key={i}>
              {formatVariantName(name)} {/* 格式化变体名称 */}
              {i !== names.length - 1 && <hr />} {/* 不是最后一个名称则添加水平线 */}
            </React.Fragment>
          ))}
        </td>
      )}
      {/* 右侧引脚编号和名称 */}
      {pinRight.type === "pin" ? (
        <>
          <td className="pin-number">{pinRight.number} {/* 引脚编号 */}</td>
          <td className="badge pin-name" style={pinRight.name.style}>
            {pinRight.name.value} {/* 引脚名称 */}
          </td>
        </>
      ) : (
        <td colSpan={2} /> 
        // {/* 跳过的引脚，合并两列 */}
      )}
    </>
  );
}

// 引脚行组件，渲染引脚功能标签
function PinRow({
  side, // 位置：top, bottom, left, right
  alignData, // 数据对齐方式
  pin, // 引脚对象
}: { side: "top" | "bottom" | "left" | "right"; alignData: boolean; pin: PinWithFunctions<true> }) {
  // 如果是跳过的引脚，根据对齐方式返回合并列或空单元格
  if (pin.type === "skipped") {
    return alignData ? <td colSpan={pin.numFunctions} /> : <td />;
  }

  // 查找左侧第一个非空标签索引
  let leftFirstTagIndex = pin.tags.findIndex((each) => each !== null);
  if (leftFirstTagIndex === -1) {
    leftFirstTagIndex = Infinity; // 如果没有非空标签，设置为无穷大
  }

  // 查找右侧最后一个非空标签索引
  let rightLastTagIndex = findLastIndex(pin.tags, (each) => each !== null);
  if (rightLastTagIndex === -1) {
    rightLastTagIndex = 0; // 如果没有非空标签，设置为0
  }

  // 根据对齐方式渲染不同的内容
  return (
    <>
      {alignData ? (
        // 对齐方式：每个标签占用一个单元格
        <>{
          pin.tags.map((tag, i) =>
            tag === null ? (
              // 空标签，根据位置和索引决定是否添加空单元格
              <td
                key={i}
                className={
                  (side === "right" && i < rightLastTagIndex) ||
                  (side === "left" && i >= leftFirstTagIndex)
                    ? "empty"
                    : ""
                }
              />
            ) : (
              <Tag key={i} tag={tag} /> // 渲染标签
            )
          )
        }</>
      ) : (
        // 非对齐方式：所有标签在一个单元格内
        <td
          style={{
            textAlign: side === "left" || side === "top" ? "right" : "left", // 文本对齐方式
            writingMode: side === "bottom" || side === "top" ? "vertical-lr" : undefined, // 垂直书写模式
          }}
        >
          <div className="dense">
            {/* 过滤空标签并渲染 */}
            {pin.tags
              .flatMap((tag) => (tag !== null ? tag : []))
              .map((tag, i) => (
                <Tag key={i} element="div" tag={tag} />
              ))}
          </div>
        </td>
      )}
    </>
  );
}

// 标签组件，渲染引脚功能标签
function Tag({
  tag: { style, values }, // 标签样式和值数组
  element, // 容器元素类型
  onHover, // 悬停事件处理函数
}: { tag: { style: CSSProperties; values: string[] }; element?: string; onHover?: (hover: boolean) => void }) {
  // 悬停事件处理对象
  const eventHandlers = onHover
    ? { onMouseOver: () => onHover(true), onMouseOut: () => onHover(false) }
    : {};
  // 创建元素并应用样式和事件
  return React.createElement(
    element ?? "td", // 默认元素为td
    { className: "badge", style }, // 样式和类名
    ...separateArrayBy(
      values.map((value) => (
        <div className="badge-text" {...eventHandlers}>
          {value} {/* 标签值 */}
        </div>
      )),
      // 标签分隔符，添加空格
      <span className="badge-divider"> </span>
    )
  );
}
