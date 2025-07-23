// 提供用户界面，允许调整显示设置（字体大小、对齐方式等）（核心组件）
// 导入React核心库和useContext钩子
import React, { useContext } from "react";

// 设置类型定义
// 包含应用的显示设置选项
export type Settings = {
  alignData: boolean; // 数据对齐方式开关
  fontSize: number;   // 字体大小
  ics: string[];      // 要显示的芯片名称列表
};

// 创建设置上下文
// 用于在组件树中共享设置状态和更新函数
export const SettingsContext = React.createContext<{
  settings: Settings; // 当前设置对象
  setSettings: React.Dispatch<React.SetStateAction<Settings>>; // 更新设置的函数
}>({
  // 默认上下文值（实际使用时会被Provider覆盖）
  settings: {
    alignData: true,  // 默认数据对齐
    fontSize: 12,    // 默认字体大小
    ics: [],         // 默认显示所有芯片
  },
  setSettings: () => {}, // 默认空函数
});

// 设置面板组件
// 提供用户界面用于修改应用显示设置
export function Settings() {
  // 从上下文中获取设置和更新函数
  const { settings, setSettings } = useContext(SettingsContext);

  return (
    <>
      <h2>Display Settings</h2> {/* 设置面板标题 */}
      {/* 数据对齐方式复选框 */}
      <label>
        Align data
        <input
          type="checkbox"
          value="1"
          checked={settings.alignData} // 绑定对齐状态
          onChange={(evt) => {
            // 当复选框状态变化时更新设置
            const alignData = evt.target.checked;
            return setSettings((settings) => ({ ...settings, alignData }));
          }}
        />
      </label>
      <br />
      {/* 字体大小输入框 */}
      <label>
        Font size{' '}
        <input
          type="number"
          value={settings.fontSize} // 绑定字体大小
           onChange={(evt) => { 
          //   当输入值变化时更新设置
            const fontSize = parseInt(evt.target.value);
            return setSettings((settings) => ({ ...settings, fontSize }));
          }}
        />
      </label> 
    </>
  );
}
