import { SYSTEM_PROMPT } from "../constants";
import { getLightingSetup } from './skills/lightingExpert';

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
      : `【好莱坞大导视觉滤镜：克里斯托弗·诺兰 (Christopher Nolan) 风格】
- 视觉质感：IMAX 70mm胶片质感，极致的青橙色调 (Teal & Orange)。高对比度，冷峻写实的物理质感，强烈的胶片颗粒。
- 镜头语言：克制且客观的冷酷视角，极具压迫感的史诗级构图 (Monumental scale) (如：35mm定焦，85mm特写，手持摄影/Steadicam跟拍，无人机俯拍，景深控制/浅景深)。
- 动作与氛围：强调真人动作的物理重量感。必须利用烟雾、尘埃、火星、逆光剪影等环境元素构建史诗级或暗黑压抑的艺术氛围。`;
    
    const lightingGuidance = getLightingSetup(chapterContent);
    const fullPrompt = `
项目名称: ${projectName}
视觉风格设定: ${styleDescription}
${lightingGuidance}

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
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://openrouter.ai/api/v1';
      const modelName = import.meta.env.VITE_MODEL_NAME || 'anthropic/claude-opus-4.6';

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://yuanmuseedance.pages.dev",
          "X-Title": "Yuanmu Seedance",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: fullPrompt }
          ],
          temperature: 0.8,
          stream: true, 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 请求失败: ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0].delta.content;
                if (content) onStream(content);
              } catch (e) {}
            }
          }
        }
      }
      // 注意：这里已经没有 responseStream 循环了！
    } catch (error: any) {
      console.error("Storyboard Generation Error:", error);
      throw new Error("生成分镜脚本时被中断。");
    }
  }
}

export const geminiService = new GeminiService();
