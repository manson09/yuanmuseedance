
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

export class GeminiService {
  async generateStoryboard(params: {
    projectName: string;
    styleType: 'anime' | 'live-action';
    kbContext: string;
    chapterContent: string;
    onStream: (chunk: string) => void;
  }) {
    const { projectName, styleType, kbContext, chapterContent, onStream } = params;

    const styleDescription = styleType === 'anime' 
      ? `【2D 动漫风格专属执导指南】
- 视觉质感：赛璐璐风格 (Cel shading) 结合新海诚式唯美光影，极致的色彩美学，情绪化打光，画面充满艺术张力。
- 镜头语言：夸张透视 (大透视/鱼眼)，平移/推拉镜头 (Pan/Zoom)，速度线 (Speed lines)，冲击帧 (Impact frames)。
- 动作与氛围：作画张力 (Sakuga)，突破物理限制的夸张动作。必须利用飘落的花瓣、雨滴、光斑等微观元素拉满氛围感。` 
      : `【好莱坞真人电影风格专属执导指南】
- 视觉质感：大师级摄影构图，A24制片厂级别的浓郁电影氛围感。真实物理光影 (如：伦勃朗光，丁达尔效应，极具张力的明暗交界线)，胶片颗粒感。
- 镜头语言：使用具体的电影镜头语言 (如：35mm定焦，85mm特写，手持摄影/Steadicam跟拍，无人机俯拍，景深控制/浅景深)。
- 动作与氛围：强调真人动作的物理重量感。必须利用烟雾、尘埃、火星、逆光剪影等环境元素构建史诗级或暗黑压抑的艺术氛围。`;

    const fullPrompt = `
项目名称: ${projectName}
视觉风格设定: ${styleDescription}

【核心执导原则】:
1. 剧本忠实度：**严禁跳过剧情**。必须严格遵循剧本的事件顺序、台词和动作。分镜是剧本的视觉还原。
2. 导演意图：每一组分镜都应有明确的“导演意图”。是在交代环境？是在展现冲突？还是在刻画人物内心？
3. 高密度碎切：无论何种风格，镜头切分必须更“多”更“碎”。用多角度、多景别的短镜头拼凑出一个完整的动作或场景。
4. 极致连贯性：镜头越碎，越需要保证动作顺接（Action Match）。前一镜的动量、位置、视线必须在下一镜无缝延续。
5. 动机剪辑：每一个子镜头的切换必须有“动机”（如：动作引导、视线引导、情绪爆发）。严禁无意义的切镜。
6. 物理一致性：严禁“细节瞬移”。子镜头间必须严格保持物理状态（伤口、道具、环境破坏）的连续性。
7. 编号与时间重置：每个镜头组独立编号，从“镜头1”开始。**内部时间轴必须从 00:00 开始独立计算**，严禁继承前一组的时间。
8. 时长红线：单组总时长**严禁超过 15 秒**。
9. 动作连续性：严格遵守 SeedDance 2.0 协议，确保动量和逻辑无缝衔接。
10. 隐藏推理过程：**严禁在输出中包含“导演剪辑逻辑”或“推理过程”等文字**，这些逻辑仅用于指导你的分镜设计。
11. 负面约束精进：在【负面约束提示词】中明确禁止物体融合（如：锤子与木锥连在一起）、非物理形变和肢体错误，确保画面纯净度。
12. 极致艺术感与氛围渲染：严禁平铺直叙的画面。必须通过构图（如黄金分割、极低视角）、光影（如逆光、侧逆光）和环境元素（如雾气、尘埃）大幅提升画面的艺术格调与氛围感。

【视觉圣经/知识库锚定内容】:
${kbContext || "无特定外部参考"}

【当前待处理剧本章节】:
${chapterContent}

请作为 **SeedDance 2.0 视觉工程专家**，基于上述剧本生成符合协议的高级多镜头提示词。
注意：保持台词 100% 还原，但镜头视觉描述要极具冲击力、爽剧感和微观细节，确保物理动量绝对连续。
`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview', // 使用能力更强的 Pro 模型进行复杂分镜设计
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.8,
          topP: 0.95,
          // 适当增加输出限制，防止因输出过长被截断
          maxOutputTokens: 8192,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          onStream(chunk.text);
        }
      }
    } catch (error: any) {
      console.error("Gemini Storyboard Generation Error:", error);
      
      let errorMessage = "生成分镜脚本时被中断。";
      if (error?.message?.includes("finishReason: SAFETY")) {
        errorMessage = "检测到剧本内容可能触发了 AI 安全过滤机制，请尝试修改敏感词汇。";
      } else if (error?.message?.includes("status code: 0") || error?.message?.includes("unexpected")) {
        errorMessage = "网络连接异常或服务响应超时，请重试。";
      }
      
      throw new Error(errorMessage);
    }
  }
}

export const geminiService = new GeminiService();
