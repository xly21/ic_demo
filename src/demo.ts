// 工具与辅助：演示应用的入口点
import "./demo.css";
import "./sdk.min";

// @ts-expect-error PinoutDiagrams does not exist on window
window.PinoutDiagrams.render(document.getElementById("root"), {
  ics: ["74HC595"],
  maxWidth: undefined,
});
