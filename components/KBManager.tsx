
import React, { useCallback } from 'react';
import { KBFile } from '../types';
// Fix: Added Database to imports
import { Upload, FileText, Trash2, ShieldCheck, HelpCircle, Database } from 'lucide-react';

interface KBManagerProps {
  files: KBFile[];
  onUpdate: (files: KBFile[]) => void;
}

const KBManager: React.FC<KBManagerProps> = ({ files, onUpdate }) => {
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newFile: KBFile = {
          id: crypto.randomUUID(),
          name: file.name,
          content: content || '文件内容解析失败',
          type: file.type || 'text/plain',
          uploadedAt: Date.now()
        };
        onUpdate([...files, newFile]);
      };
      
      // Simple text file reader
      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file);
      } else {
        // Mocking DOCX/other binary support for this environment
        reader.readAsText(file); // In real app, use Mammoth for docx
      }
    });
  }, [files, onUpdate]);

  const removeFile = (id: string) => {
    onUpdate(files.filter(f => f.id !== id));
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              视觉圣经锚定
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </h2>
            <p className="text-slate-400">上传剧本大纲、人设档案或全本，确保 AI 分镜不会偏离项目基调。</p>
          </div>
          
          <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-xl cursor-pointer transition-all border border-slate-700 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            上传文件
            <input 
              type="file" 
              multiple 
              className="hidden" 
              accept=".txt,.md,.docx"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
            <div className="p-6 bg-slate-800/50 rounded-full mb-6">
              <Database className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">知识库暂空</h3>
            <p className="text-slate-500 max-w-sm text-center">
              上传项目的核心设定文件，分镜生成器将以此为语境进行精准创作。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {files.map(file => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-5 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{file.name}</h4>
                    <p className="text-xs text-slate-500">
                      上传于 {new Date(file.uploadedAt).toLocaleString()} · {(file.content.length / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(file.id)}
                  className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            <div className="mt-8 p-6 bg-blue-900/10 border border-blue-900/20 rounded-2xl">
              <div className="flex gap-3">
                <HelpCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <div>
                  <h5 className="text-blue-200 font-semibold mb-1">使用建议</h5>
                  <p className="text-blue-300/60 text-sm leading-relaxed">
                    在分镜工作台粘贴章节内容前，请确保此处的知识库已包含对应的角色设定。AI 会自动扫描此处的文本，识别出角色的外貌特征、武器形态及特殊动作风格，从而生成更具表现力的分镜提示词。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KBManager;
