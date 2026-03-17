import React, { useState, useRef, useEffect } from 'react';
import { Project, StoryboardSession } from '../types';
import { geminiService } from '../services/geminiService';
import { 
  Plus, 
  Send, 
  Copy, 
  Download, 
  RefreshCcw, 
  History, 
  ChevronRight,
  MonitorPlay,
  Settings2,
  Trash2,
  CheckCircle2,
  Loader2,
  PenTool,
  AlertCircle
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';

interface StoryboardWorkbenchProps {
  project: Project;
  sessions: StoryboardSession[];
  onUpdate: (sessions: StoryboardSession[]) => void;
}

const StoryboardWorkbench: React.FC<StoryboardWorkbenchProps> = ({ project, sessions, onUpdate }) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[0].id : null
  );
  
  // 🌟 新增：导演风格下拉框的状态管理，默认使用项目设定的风格，如果没有则默认诺兰风格
  const [styleType, setStyleType] = useState(project.styleType || 'nolan');
  
  const [inputContent, setInputContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState(''); // Local state for smooth streaming
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

const handleExportDocx = async () => {
    if (!activeSession || !activeSession.outputRaw) return;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: activeSession.chapterTitle,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `项目: ${project.name}`, bold: true }),
            ],
            spacing: { after: 400 }, // 这里我稍微加大了间距，让排版更好看
          }),
          // 【注意：这里已经删除了“原始剧本”和 inputContent 的相关代码】
          new Paragraph({
            text: "分镜脚本 (SeedDance 2.0 协议)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          }),
          ...parseOutputToDocxElements(activeSession.outputRaw),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${activeSession.chapterTitle}_分镜脚本.docx`);
  };

  const parseOutputToDocxElements = (text: string) => {
    const elements: any[] = [];
    
    // 【核心隐身术】：找到正片“镜头组”第一次出现的位置
    const firstShotIndex = text.indexOf('镜头组');
    // 如果找到了，就截取从“镜头组”开始往后的所有内容，彻底抛弃前面的统筹表
    const cleanText = firstShotIndex !== -1 ? text.substring(firstShotIndex) : text;

    const lines = cleanText.split('\n');
    
    let currentParagraph: string[] = [];

    lines.forEach(line => {
      if (line.startsWith('镜头组')) {
        if (currentParagraph.length > 0) {
          elements.push(new Paragraph({ text: currentParagraph.join('\n'), spacing: { after: 200 } }));
          currentParagraph = [];
        }
        elements.push(new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 100 },
        }));
      } else if (line.startsWith('镜头')) {
        // 智能切分标题和内容
        const splitIndex = line.indexOf('：') !== -1 ? line.indexOf('：') : line.indexOf(':');

        if (splitIndex !== -1) {
          const prefix = line.substring(0, splitIndex + 1);
          const content = line.substring(splitIndex + 1);

          elements.push(new Paragraph({
            children: [
              new TextRun({ text: prefix, bold: true, color: "2563EB" }), 
              new TextRun({ text: content }), 
            ],
            spacing: { before: 100, after: 50 },
          }));
        } else {
          elements.push(new Paragraph({
            text: line,
            spacing: { before: 100, after: 50 },
          }));
        }
      } else if (line.trim()) {
        elements.push(new Paragraph({
          text: line,
          spacing: { after: 50 },
        }));
      }
    });

    return elements;
  };

 const createNewSession = () => {
    // 1. 获取当前项目名称，如果没有获取到则兜底使用“未命名分镜稿”
    const baseName = project.name || '未命名分镜稿';

    // 2. 智能提取当前列表中最大的序号
    const maxIndex = sessions.reduce((max, session) => {
      // 检查标题是否以项目名称开头
      if (session.chapterTitle.startsWith(baseName)) {
        // 截取掉项目名称部分，去掉两端空格，看看剩下的是不是纯数字
        const suffix = session.chapterTitle.slice(baseName.length).trim();
        // 如果剩下的部分是纯数字（比如 "1", "2"），则比较并获取最大值
        if (/^\d+$/.test(suffix)) {
          return Math.max(max, parseInt(suffix, 10));
        }
      }
      return max;
    }, 0);

    // 3. 拼接新名称：项目名称 + 空格 + (最大序号 + 1)
    const newId = crypto.randomUUID();
    const newSession: StoryboardSession = {
      id: newId,
      projectId: project.id,
      chapterTitle: `${baseName} ${maxIndex + 1}`,
      inputContent: '',
      outputRaw: '',
      status: 'idle',
      lastUpdated: Date.now()
    };
    
    onUpdate([newSession, ...sessions]);
    setActiveSessionId(newId);
  };

  const handleGenerate = async () => {
    if (!activeSession || !inputContent.trim()) return;

    setIsGenerating(true);
    setError(null);
    setStreamingText(''); // Reset local stream display
    
    let fullOutput = '';
    
    try {
      const kbContext = project.kbFiles.map(f => `文件: ${f.name}\n内容: ${f.content}`).join('\n\n---\n\n');
      
      await geminiService.generateStoryboard({
        projectName: project.name,
        styleType: styleType, // 🌟 修改：这里直接传入下拉框选中的 styleType
        kbContext,
        chapterContent: inputContent,
        onStream: (chunk) => {
          fullOutput += chunk;
          setStreamingText(fullOutput); // Update local state only for high performance
        }
      });

      // Sync to global state only after completion
      updateActiveSession({ 
        inputContent,
        outputRaw: fullOutput, 
        status: 'completed',
        lastUpdated: Date.now()
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "生成失败，请重试。");
      // If failed, still sync what we got so far
      updateActiveSession({ 
        inputContent,
        outputRaw: fullOutput, 
        status: 'idle',
        lastUpdated: Date.now()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateActiveSession = (data: Partial<StoryboardSession>) => {
    if (!activeSessionId) return;
    onUpdate(sessions.map(s => s.id === activeSessionId ? { ...s, ...data } : s));
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onUpdate(sessions.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(sessions.length > 1 ? (sessions[0].id === id ? sessions[1].id : sessions[0].id) : null);
    }
  };

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current && isGenerating) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamingText, isGenerating]);

  // Sync state when switching sessions
  useEffect(() => {
    if (activeSession) {
      setInputContent(activeSession.inputContent);
      setStreamingText(activeSession.outputRaw); // Initialize with saved content
      setError(null);
    } else {
      setInputContent('');
      setStreamingText('');
    }
  }, [activeSessionId]);

  return (
    <div className="h-full flex">
      {/* Sessions Sidebar */}
      <div className="w-64 border-r border-white/5 bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <button 
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 py-3 rounded-xl border border-blue-500/20 transition-all font-semibold"
          >
            <Plus className="w-4 h-4" />
            新建分镜稿
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`p-3 rounded-xl cursor-pointer transition-all group relative ${
                activeSessionId === session.id 
                ? 'bg-blue-600/20 border border-blue-500/30' 
                : 'hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  session.status === 'completed' ? 'bg-green-500' : 
                  session.status === 'generating' || (isGenerating && activeSessionId === session.id) ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-slate-200 truncate">{session.chapterTitle}</h5>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(session.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Workspace Area */}
      {activeSession ? (
        <div className="flex-1 flex flex-col h-full bg-black/40">
          {/* Workspace Header */}
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-slate-500" />
              <input 
                value={activeSession.chapterTitle}
                onChange={e => updateActiveSession({ chapterTitle: e.target.value })}
                className="bg-transparent border-none text-white font-bold outline-none focus:ring-0 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
               <button className="flex items-center gap-2 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700">
                <Settings2 className="w-3 h-3" />
                参数配置
              </button>
              <button 
                onClick={handleExportDocx}
                disabled={!activeSession.outputRaw && !streamingText}
                className="flex items-center gap-2 text-xs bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-3 h-3" />
                导出 DOCX
              </button>
            </div>
          </div>

          {/* Workbench Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Input */}
            <div className="flex-1 flex flex-col border-r border-white/5">
              <div className="p-3 bg-slate-900/30 border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center justify-between">
                <span>粘贴剧本章节</span>
                <span className="text-blue-400">INPUT SOURCE</span>
              </div>
              
              {/* 🌟 新增：导演滤镜选择器 */}
              <div className="p-4 pb-0 bg-slate-900/50 border-b border-white/5">
                <div className="flex flex-col gap-2 mb-4">
                  <label className="text-xs font-bold text-slate-400">🎬 电影级视觉滤镜 (大导风格)</label>
                  <select 
                    value={styleType} 
                    onChange={(e) => setStyleType(e.target.value)}
                    className="p-2.5 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm cursor-pointer transition-colors hover:border-slate-500"
                  >
                    <option value="nolan">克里斯托弗·诺兰 (冷峻史诗 / 青橙色调)</option>
                    <option value="villeneuve">丹尼斯·维伦纽瓦 (废土巨物 / 沙丘压迫感)</option>
                    <option value="wongkarwai">王家卫 (迷离复古 / 抽帧残影)</option>
                    <option value="zhangyimou">张艺谋 (东方色彩 / 武侠写意)</option>
                    <option value="wesanderson">韦斯·安德森 (童话对称 / 马卡龙色)</option>
                    <option value="anime">2D 动漫 (赛璐璐 / 新海诚光影)</option>
                  </select>
                </div>
              </div>

              <textarea 
                value={inputContent}
                onChange={e => setInputContent(e.target.value)}
                placeholder="在此粘贴剧本章节内容..."
                disabled={isGenerating}
                className="flex-1 bg-transparent p-6 text-slate-300 resize-none outline-none focus:ring-0 leading-relaxed font-mono text-sm disabled:opacity-50"
              />
              <div className="p-4 bg-slate-900/50">
                {error && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !inputContent.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 group"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      导演正在执导中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      立即生成 SeedDance 分镜
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: AI Output */}
            <div className="flex-1 flex flex-col bg-slate-950/40 relative">
              <div className="p-3 bg-slate-900/30 border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center justify-between">
                <span>分镜导演建议</span>
                <span className="text-indigo-400">AI STORYBOARD</span>
              </div>
              <div 
                ref={outputRef}
                className="flex-1 overflow-auto p-6 text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap select-text"
              >
                {!streamingText && !isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                    <MonitorPlay className="w-16 h-16 mb-4" />
                    <p>等待执导...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {streamingText}
                    {isGenerating && <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse align-middle ml-1" />}
                  </div>
                )}
              </div>
              
              {activeSession.status === 'completed' && !isGenerating && (
                <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-500">
                  <div className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30 text-xs flex items-center gap-2 font-bold backdrop-blur-md">
                    <CheckCircle2 className="w-3 h-3" />
                    物理逻辑闭环已校对
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <PenTool className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-xl">选择或新建一个分镜稿开始作业</p>
        </div>
      )}
    </div>
  );
};

export default StoryboardWorkbench;
