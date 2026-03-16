
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutGrid, 
  FolderPlus, 
  ChevronRight, 
  BookOpen, 
  PenTool, 
  Database, 
  Trash2, 
  ArrowLeft,
  Loader2,
  FileText,
  Download,
  Share2
} from 'lucide-react';
import { Project, StoryboardSession, KBFile } from './types';
import ProjectList from './components/ProjectList';
import ProjectWorkspace from './components/ProjectWorkspace';

const STORAGE_KEY = 'yuanmu_ai_v2_data';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'workspace'>('dashboard');

  // Load initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Add styleType to old projects
        const migrated = parsed.map((p: any) => ({
          ...p,
          styleType: p.styleType || 'anime'
        }));
        setProjects(migrated);
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const handleCreateProject = (name: string, description: string, styleType: 'anime' | 'live-action') => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      styleType,
      createdAt: Date.now(),
      kbFiles: [],
      sessions: []
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setView('dashboard');
    }
  };

  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setView('workspace');
  };

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 glass-effect sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutGrid className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 glow-text">
            元幕 AI 首席分镜导演 <span className="text-xs px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded-full ml-2 border border-indigo-700/50">SeedDance 2.0 旗舰版</span>
          </h1>
        </div>

        {view === 'workspace' && (
          <button 
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-800 transition-colors text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            返回项目列表
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#0a0a0c]">
        {view === 'dashboard' ? (
          <ProjectList 
            projects={projects} 
            onCreate={handleCreateProject} 
            onDelete={handleDeleteProject}
            onOpen={handleOpenProject}
          />
        ) : (
          activeProject && (
            <ProjectWorkspace 
              project={activeProject} 
              onUpdate={updateProject} 
            />
          )
        )}
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 bg-slate-900/80 border-t border-white/5 flex items-center px-4 justify-between text-[10px] text-slate-500 uppercase tracking-widest">
        <div className="flex gap-4">
          <span>Engine: Gemini 3 Pro</span>
          <span>Protocol: SeedDance 2.0.1</span>
        </div>
        <div>
          &copy; 2025 YUANMU AI SYSTEMS
        </div>
      </footer>
    </div>
  );
};

export default App;
