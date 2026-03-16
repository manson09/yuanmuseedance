
import React, { useState } from 'react';
import { Project } from '../types';
// Fix: Added ChevronRight to imports
import { Plus, Trash2, FolderOpen, Clock, Calendar, ChevronRight } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onCreate: (name: string, description: string, styleType: 'anime' | 'live-action') => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onCreate, onDelete, onOpen }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [styleType, setStyleType] = useState<'anime' | 'live-action'>('anime');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName, newDesc, styleType);
      setNewName('');
      setNewDesc('');
      setStyleType('anime');
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white mb-2">项目管理</h2>
          <p className="text-slate-400">管理并开始您的分镜导演之旅</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          创建新项目
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">新建分镜项目</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">项目名称</label>
                <input 
                  autoFocus
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                  placeholder="例如：玄幻动作剧《破空》"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">项目描述</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white min-h-[100px] transition-all"
                  placeholder="简述项目的视觉风格或故事核心..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">视觉风格类型</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStyleType('anime')}
                    className={`px-4 py-3 rounded-xl border transition-all font-medium ${
                      styleType === 'anime' 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    2D 动漫风格
                  </button>
                  <button
                    type="button"
                    onClick={() => setStyleType('live-action')}
                    className={`px-4 py-3 rounded-xl border transition-all font-medium ${
                      styleType === 'live-action' 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    真人电影风格
                  </button>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  立即创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-10 h-10 text-slate-700" />
          </div>
          <p className="text-slate-500 text-lg">暂无活跃项目，快去创建一个吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div 
              key={project.id}
              className="group bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                  className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{project.name}</h3>
                <div className="flex gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    project.styleType === 'anime' 
                    ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' 
                    : 'bg-amber-900/20 border-amber-500/30 text-amber-400'
                  }`}>
                    {project.styleType === 'anime' ? '2D 动漫' : '真人电影'}
                  </span>
                </div>
                <p className="text-slate-500 text-sm line-clamp-2 h-10">{project.description || '暂无描述'}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-6 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{project.sessions.length} 个分镜稿</span>
                </div>
              </div>

              <button 
                onClick={() => onOpen(project.id)}
                className="w-full bg-slate-800 group-hover:bg-blue-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                进入工作台
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
