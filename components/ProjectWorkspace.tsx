
import React, { useState } from 'react';
import { Project, StoryboardSession, KBFile } from '../types';
import KBManager from './KBManager';
import StoryboardWorkbench from './StoryboardWorkbench';
import { Database, PenTool } from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  onUpdate: (updatedProject: Project) => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'kb' | 'workbench'>('kb');

  const handleUpdateKB = (files: KBFile[]) => {
    onUpdate({
      ...project,
      kbFiles: files
    });
  };

  const handleUpdateSessions = (sessions: StoryboardSession[]) => {
    onUpdate({
      ...project,
      sessions: sessions
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 bg-slate-900/50 border-b border-white/5">
        <button 
          onClick={() => setActiveTab('kb')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'kb' 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          知识库 (视觉圣经)
          {project.kbFiles.length > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{project.kbFiles.length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('workbench')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'workbench' 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4" />
          分镜创作中心
          {project.sessions.length > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{project.sessions.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'kb' ? (
          <KBManager 
            files={project.kbFiles} 
            onUpdate={handleUpdateKB} 
          />
        ) : (
          <StoryboardWorkbench 
            project={project}
            sessions={project.sessions}
            onUpdate={handleUpdateSessions}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectWorkspace;
