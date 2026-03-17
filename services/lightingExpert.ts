// src/skills/lightingExpert.ts

/**
 * 技能节点：环境光影预判模块
 * 作用：扫描剧本中的环境关键词，为大模型生成强制的电影级光影约束条件。
 */
export const getLightingSetup = (scriptContent: string): string => {
  if (!scriptContent) return '';

  // 1. 设定默认的电影级兜底光影（规避平光与实体打光设备幻觉）
  let lightingRule = `
【本场强制光影约束】：
- 视觉结果：必须具备极强的电影感（Cinematic lighting），拒绝均匀的平光（Flat lighting）。
- 轮廓塑造：强制使用强烈的侧逆光（Rim Light / Edge lighting）勾勒角色身体与面部轮廓，将主体与背景剥离。
- 质感风格：高对比度（High Contrast），运用明暗交界线（Chiaroscuro）增加画面的戏剧张力与压迫感。`;

  // 2. 优先匹配特殊天气或时间环境，覆盖默认光影
  if (scriptContent.includes('雨') || scriptContent.includes('雷') || scriptContent.includes('风暴')) {
    lightingRule = `
【本场强制光影约束（冷酷雨夜风）】：
- 主光源：冷调的青蓝色环境光（Teal tone, 色温 8000K）。
- 质感强调：必须描写雨丝被逆光照亮的颗粒感，以及水面/湿润地面产生的高饱和度反光（Reflection）。
- 对比度：极高对比度，人物面部大面积隐藏在阴影中，仅用冷白光勾勒轮廓。`;
  } else if (scriptContent.includes('夜') || scriptContent.includes('晚') || scriptContent.includes('暗')) {
    lightingRule = `
【本场强制光影约束（夜景/压抑风）】：
- 色调：采取标准的电影“青橙色调”（Teal & Orange）。
- 主光源：硬朗的霓虹灯或清冷月光作为侧逆光。
- 辅助光：场景深处的暖色微光。
- 质感强调：大面积深邃的黑色阴影（Chiaroscuro），突出紧张压抑的氛围。`;
  } else if (scriptContent.includes('日') || scriptContent.includes('阳光') || scriptContent.includes('白天')) {
    lightingRule = `
【本场强制光影约束（通透日光风）】：
- 主光源：强烈的暖白色自然光（色温 5500K）。
- 质感强调：强制生成丁达尔效应（Volumetric Lighting / God Rays），重点描写光束穿透空气中悬浮的微尘。
- 阴影塑造：清晰的几何状投影（Gobo Lighting），如窗格、树叶落下的阴影切割画面与人物面部。`;
  }

  return lightingRule;
};
