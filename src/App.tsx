// 应用入口组件，处理设置状态和芯片数据加载（核心组件）
// 导入React核心库
import React from "react";
// 导入所有芯片定义数据
import allChips from "./chips";
// 导入芯片渲染组件
import { Chip } from "./Chip";
// 导入设置相关组件和上下文
import { Settings, SettingsContext } from "./Settings";

// 应用主组件
// 接收ics参数，指定要显示的芯片名称列表
export function App({ ics }: { ics: string[] }) {
  // 状态管理：应用设置
  // 包含数据对齐方式、字体大小和要显示的芯片列表
  const [settings, setSettings] = React.useState<Settings>({
    alignData: true, // 数据对齐方式，默认为true
    fontSize: 12,   // 字体大小，默认为12px
    ics,            // 要显示的芯片名称列表
  });

  // 根据设置筛选要显示的芯片
  const chips = settings.ics.length > 0
    ? allChips.filter((chip) => ics.includes(chip.name)) // 仅显示ics列表中指定的芯片
    : allChips; // 如果ics为空，则显示所有芯片 交集

    console.log(chips);
    

  // 渲染应用结构
  return (
    // {/* 设置上下文提供者，使子组件可以访问和修改设置 */}
    <SettingsContext.Provider
      value={{
        settings,  // 当前设置
        setSettings, // 更新设置的函数
      }}
    >
      {/* 遍历筛选后的芯片列表，渲染每个芯片的引脚图 */}
      {chips.map((chip) => (
        <Chip
          key={chip.name} // 唯一标识，使用芯片名称
          chip={chip}     // 芯片定义对象
          fontSize={settings.fontSize} // 字体大小
          showName={ics.length !== 1} // 当只显示一个芯片时不显示名称
        />
      ))}
      {/* 设置面板和免责声明容器 */}
      <div className="wrapper">
        {/* 渲染设置面板组件 */}
        <Settings />
        <hr />
        {/* 渲染免责声明组件 */}
        <Disclaimer />
      </div>
    </SettingsContext.Provider>
  );
}

// 免责声明组件，显示法律声明和项目信息
// 不重要，只是为了显示 disclaimer
function Disclaimer() {
  return (
    <p>
      Disclaimer: These unofficial pinout diagrams were created manually based on the original datasheets. Since this was a manual process, there may be errors in the diagrams. The diagrams come with absolutely no warranty of any kind. Please{
        }<a href="https://github.com/cmfcmf/ic-pinout-diagram-generator/issues/new">
          report errors here
        </a>{
        }if you find any.
      <br />
      <small>
        Pinout diagram generator made by{
          }<a href="https://github.com/cmfcmf">Christian Flach (@cmfcmf)</a>. The
        source code can be found at GitHub:{
          }<a href="https://github.com/cmfcmf/ic-pinout-diagram-generator">
            cmfcmf/ic-pinout-diagram-generator
          </a>
        .
      </small>
    </p>
  );
}
