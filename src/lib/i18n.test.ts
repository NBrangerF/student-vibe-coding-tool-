import { describe, expect, it } from "vitest";
import { translateUiText } from "@/lib/i18n";

describe("UI language support", () => {
  it("translates core studio copy to Chinese", () => {
    expect(translateUiText("What do you want to make happen?", "zh")).toBe("你想让什么事情发生？");
    expect(translateUiText("Start co-planning", "zh")).toBe("开始共同规划");
    expect(translateUiText("Goal understanding", "zh")).toBe("目标理解");
  });

  it("keeps English copy unchanged in English mode", () => {
    expect(translateUiText("System Trail Canvas", "en")).toBe("System Trail Canvas");
  });

  it("translates creative-tool planning choices", () => {
    expect(translateUiText("Upload a drawing", "zh")).toBe("上传一张画");
    expect(translateUiText("Show before and after", "zh")).toBe("显示前后对比");
  });
});
