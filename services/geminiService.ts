// 优化后的 styleDescription 注入逻辑
let styleDescription = '';
switch (styleType) {
  case 'anime':
    styleDescription = `【2D 动漫风格】赛璐璐质感，新海诚式唯美光影，极高饱和度，利用速度线和冲击帧强化动作 [cite: 8]。`;
    break;
  case 'villeneuve':
    styleDescription = `【维伦纽瓦风格】Roger Deakins 电影感。单色调配强点缀色，极简构图，巨物感空间，沉稳推轨镜头 [cite: 9, 10]。`;
    break;
  case 'wongkarwai':
    styleDescription = `【王家卫风格】抽帧残影感 (Step-printing)，霓虹灯反射，高饱和幽闭构图，手持微晃。强调暧昧氛围 [cite: 11, 12]。`;
    break;
  case 'zhangyimou':
    styleDescription = `【张艺谋风格】极致饱和的环境色彩（大红/金黄），仪式感对称构图，浓烈的明暗对比，东方古典美学 [cite: 13, 14]。`;
    break;
  case 'wesanderson':
    styleDescription = `【韦斯·安德森风格】马卡龙粉彩色调，绝对对称构图，平面化打光，复古 1970s 质感 [cite: 15, 16]。`;
    break;
  default:
    styleDescription = `【诺兰风格】IMAX 70mm 质感，青橙调色 (Teal and Orange)，高对比度冷峻实拍感，物理沉重感 [cite: 17, 18]。`;
}

// 核心 Prompt 注入
const fullPrompt = `
项目名称: ${projectName}
视觉风格设定: ${styleDescription}
${lightingGuidance}

【强制指令】:
1. **启动“时间膨胀”机制**：剧本若短，必须通过穿插反应镜头和动作拆解，确保总时长 ≥ 100秒 [cite: 2]。
2. **禁止输出推理**：严禁输出“物理状态链路卡”或“内部剪辑逻辑” 。
3. **单组重置**：每个镜头组编号和时间（00:00）必须重置，单组上限 15s 。
4. **一致性锚定**：在镜头【内容】中反复通过服装特征锚定角色，严禁写脸 。

【待处理剧本】:
${chapterContent}
`;
export const geminiService = new GeminiService();
