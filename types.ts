
export interface Project {
  id: string;
  name: string;
  description: string;
  styleType: 'anime' | 'live-action';
  createdAt: number;
  kbFiles: KBFile[];
  sessions: StoryboardSession[];
}

export interface KBFile {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: number;
}

export interface StoryboardSession {
  id: string;
  projectId: string;
  chapterTitle: string;
  inputContent: string;
  outputRaw: string;
  status: 'idle' | 'generating' | 'completed';
  lastUpdated: number;
}

export interface Shot {
  id: string;
  title: string;
  timeRange: string;
  camera: string;
  movement: string;
  content: string;
}

export interface ShotGroup {
  groupIndex: number;
  duration: string;
  style: string;
  lighting: string;
  quality: string;
  negativePrompt: string;
  shots: Shot[];
}
