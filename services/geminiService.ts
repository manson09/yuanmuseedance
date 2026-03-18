import { SYSTEM_PROMPT } from "../constants";
import { getLightingSetup } from './skills/lightingExpert';

export class GeminiService {
  async generateStoryboard(params: {
    projectName: string;
    styleType: string;
    kbContext: string;
    chapterContent: string;
    onStream: (chunk: string) => void;
  }) {
    const { projectName, styleType, kbContext, chapterContent, onStream } = params;

// 根据前端传入的 styleType，动态匹配大导演视觉滤镜
 let styleDescription = '';
    
    switch (styleType) {
      case 'anime':
        styleDescription = `
【2D 动漫风格专属执导指南】
- 视觉质感：赛璐璐风格结合新海诚式唯美光影，极致的色彩美学，情绪化打光。
- 镜头语言：夸张透视（大透视/鱼眼），平移/推拉镜头（Pan/Zoom），速度线，冲击帧。
- 动作与氛围：作画张力，利用光斑、微尘等微观光影元素拉满氛围。`;
        break;
        
      case 'villeneuve':
        styleDescription = `
【好莱坞大导视觉滤镜：丹尼斯·维伦纽瓦 (Denis Villeneuve) 光影风】
- 视觉质感：Directed by Denis Villeneuve, cinematography by Roger Deakins. 单色调配以强烈的点缀色 (Monochromatic with harsh accents)。极简主义光影，克制的低饱和度，大气空间感 (Atmospheric depth)。
- 镜头语言：沉稳的推轨镜头，强调人物与环境的比例反差（巨物感构图），拒绝花哨的运镜。
- 氛围：利用光线的切割和空气中的微尘颗粒感（Dust motes in light）。`;
        break;

      case 'wongkarwai':
        styleDescription = `
【华语大导视觉滤镜：王家卫 (Wong Kar-wai) 光影风】
- 视觉质感：Directed by Wong Kar-wai, cinematography by Christopher Doyle. Cinematic step-printing effect (抽帧残影感). 高饱和度浓郁色彩 (如环境光晕染的祖母绿、深红、琥珀色)。霓虹灯反射质感 (Neon reflection)。
- 镜头语言：幽闭构图 (claustrophobic framing)，前景遮挡，手持微晃，极近距离的特写，人物往往偏离画面中心。
- 氛围：暧昧、迷离的光影拉扯，强烈的胶片颗粒感。`;
        break;

      case 'zhangyimou':
        styleDescription = `
【华语大导视觉滤镜：张艺谋 (Zhang Yimou) 色彩光影风】
- 视觉质感：Directed by Zhang Yimou. Vibrant and highly saturated colors (极致饱和的环境色彩，擅长用大红、金黄等浓烈纯色光影烘托情绪). 极具东方古典美学的超现实光影对比。
- 镜头语言：工整且具有仪式感的绝对对称构图，大远景展现空间意境，注重利用光影的明暗交界线强化张力。
- 氛围：兼具形式美感与力量感，光影对比极其浓烈。`;
        break;

      case 'wesanderson':
        styleDescription = `
【好莱坞大导视觉滤镜：韦斯·安德森 (Wes Anderson) 光影风】
- 视觉质感：Directed by Wes Anderson. Pastel color palette (马卡龙/柔和粉彩色调). Vintage 1970s aesthetic. 
- 镜头语言：严格的绝对对称构图 (Strict symmetrical composition)，平面化打光 (Flat lighting)。
- 氛围：治愈、戏剧化反差，画面干净整洁。`;
        break;

      case 'nolan':
      case 'live-action':
      default:
        styleDescription = `
【好莱坞大导视觉滤镜：克里斯托弗·诺兰 (Christopher Nolan) 光影风】
- 视觉质感：Directed by Christopher Nolan, IMAX 70mm film aesthetic. Cinematic teal and orange color grading (青橙色调). 高对比度，冷峻写实的物理质感。
- 镜头语言：克制且客观的冷酷视角，极具压迫感的史诗级构图，35mm定焦，手持轻微呼吸感。
- 氛围：强调光影的物理沉重感，利用冷硬的环境光构建史诗氛围。`;
        break;
    }

    // 🌟 终极防越权补丁：死死锁住物理环境，禁止加戏！
    styleDescription += `\n\n⚠️【导演滤镜绝对隔离与光影融合原则】：
1. 动作隔离：以上大导风格绝对禁止影响【内容】字段中的人物动作、物理交互或叙事节奏！动作描写必须保持干脆利落的物理客观视角。
2. 光影层级（极其重要）：系统马上会提供一个【基础物理光源布控】（如顶光、侧逆光）。
   - 【基础布控】是灯光师，决定了光源的“物理位置与逻辑方向”。
   - 【导演风格】是调色师，决定了画面的“后期调色 (Color Grading)”、“色彩饱和度”与“胶片质感”。
   - 你必须 100% 尊重基础光源的位置，仅使用导演风格去改变光线的颜色和画面的整体影调。严禁制造“基础光源是暖阳光，导演风格是冷月光”的矛盾提示词！`;
    
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
