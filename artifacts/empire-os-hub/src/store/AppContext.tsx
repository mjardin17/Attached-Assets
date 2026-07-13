import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AgentId = "claude" | "gemini" | "grok" | "chatgpt" | "deepseek";
export type MissionStatus = "pending" | "in_progress" | "complete" | "blocked";

export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  repoUrl: string;
}

export interface ContextFile {
  id: string;
  name: string;
  content: string;
  projectId: string;
}

export interface Agent {
  id: AgentId;
  name: string;
  color: string;
  url: string;
  lastSessionDate: string;
  lastWorkedOn: string;
}

export interface Mission {
  id: string;
  title: string;
  type: string;
  status: MissionStatus;
  assigned_to: AgentId | null;
  target: string;
  priority: number;
  notes: string;
  projectId: string;
}

export interface Episode {
  id: string;
  title: string;
  scriptStatus: "done" | "pending";
  renderStatus: "done" | "rendering" | "pending" | "error";
  uploadStatus: "done" | "pending";
  url: string;
  views: number;
  duration: string;
  channel: "GG" | "IL" | "LO" | "ED";
  fileSizeMb?: string;
  renderProgress?: number;
  socialDraft?: string;
}

export interface Settings {
  githubPat: string;
  ngrokUrl: string;
  higgsfieldCredits: string;
}

interface AppState {
  projects: Project[];
  agents: Agent[];
  missions: Mission[];
  episodes: Episode[];
  files: ContextFile[];
  agentLogs: Record<string, string>; // key: projectId_agentId
  settings: Settings;
  activeProjectId: string;
  activeAgentId: AgentId;
  loadedFileIds: string[];
}

const DEFAULT_PROJECTS: Project[] = [
  { id: "p1", name: "Gods & Glory Pipeline", emoji: "🎬", color: "bg-blue-500", repoUrl: "https://github.com/mjardin17/viral-engine" },
  { id: "p2", name: "Boss Listers", emoji: "🛒", color: "bg-green-500", repoUrl: "" },
  { id: "p3", name: "Empire OS", emoji: "🏛️", color: "bg-indigo-500", repoUrl: "" },
  { id: "p4", name: "StoryForge", emoji: "📚", color: "bg-amber-500", repoUrl: "" },
  { id: "p5", name: "Merch", emoji: "👕", color: "bg-rose-500", repoUrl: "" },
];

const DEFAULT_AGENTS: Agent[] = [
  { id: "claude", name: "Claude", color: "text-indigo-400 bg-indigo-500/10", url: "https://claude.ai", lastSessionDate: "", lastWorkedOn: "" },
  { id: "gemini", name: "Gemini", color: "text-blue-400 bg-blue-500/10", url: "https://gemini.google.com", lastSessionDate: "", lastWorkedOn: "" },
  { id: "grok", name: "Grok", color: "text-orange-400 bg-orange-500/10", url: "https://grok.x.ai", lastSessionDate: "", lastWorkedOn: "" },
  { id: "chatgpt", name: "ChatGPT", color: "text-emerald-400 bg-emerald-500/10", url: "https://chat.openai.com", lastSessionDate: "", lastWorkedOn: "" },
  { id: "deepseek", name: "DeepSeek", color: "text-purple-400 bg-purple-500/10", url: "https://chat.deepseek.com", lastSessionDate: "", lastWorkedOn: "" },
];

const DEFAULT_MISSIONS: Mission[] = [
  { id: "m001", title: "Setup auto-render for episode 13", type: "render", status: "in_progress", assigned_to: "claude", target: "GG_EP013", priority: 1, notes: "Voice model updated", projectId: "p1" },
  { id: "m002", title: "Draft book 2 outline", type: "write", status: "pending", assigned_to: "gemini", target: "Book2", priority: 2, notes: "", projectId: "p4" },
  { id: "m003", title: "Build frontend for new metrics dashboard", type: "code", status: "pending", assigned_to: "grok", target: "Dashboard", priority: 1, notes: "", projectId: "p3" },
];

const DEFAULT_EPISODES: Episode[] = [
  { id: "GG_EP012", title: "The Fall of Zeus", scriptStatus: "done", renderStatus: "done", uploadStatus: "done", url: "https://youtube.com/watch?v=123", views: 4500, duration: "10:24", channel: "GG" },
  { id: "GG_EP013", title: "Ares Ascending", scriptStatus: "done", renderStatus: "rendering", uploadStatus: "pending", url: "", views: 0, duration: "11:05", channel: "GG" },
];

const INITIAL_STATE: AppState = {
  projects: DEFAULT_PROJECTS,
  agents: DEFAULT_AGENTS,
  missions: DEFAULT_MISSIONS,
  episodes: DEFAULT_EPISODES,
  files: [],
  agentLogs: {},
  settings: { githubPat: "", ngrokUrl: "", higgsfieldCredits: "100" },
  activeProjectId: "p1",
  activeAgentId: "claude",
  loadedFileIds: [],
};

interface AppContextType extends AppState {
  setActiveProject: (id: string) => void;
  setActiveAgent: (id: AgentId) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  updateAgentLog: (projectId: string, agentId: AgentId, log: string) => void;
  addFile: (file: Omit<ContextFile, "id">) => void;
  removeFile: (id: string) => void;
  toggleFileLoaded: (id: string) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  addMission: (mission: Omit<Mission, "id">) => void;
  deleteMission: (id: string) => void;
  updateEpisode: (id: string, updates: Partial<Episode>) => void;
  addEpisode: (episode: Episode) => void;
  exportData: () => void;
  importData: (data: string) => void;
  clearData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("empire-os-state");
    if (saved) {
      try {
        return { ...INITIAL_STATE, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem("empire-os-state", JSON.stringify(state));
  }, [state]);

  const setActiveProject = (id: string) => setState(s => ({ ...s, activeProjectId: id, loadedFileIds: [] }));
  const setActiveAgent = (id: AgentId) => setState(s => ({ ...s, activeAgentId: id }));
  
  const updateSettings = (updates: Partial<Settings>) => setState(s => ({ 
    ...s, 
    settings: { ...s.settings, ...updates } 
  }));

  const updateAgentLog = (projectId: string, agentId: AgentId, log: string) => setState(s => ({
    ...s,
    agentLogs: { ...s.agentLogs, [`${projectId}_${agentId}`]: log }
  }));

  const addFile = (file: Omit<ContextFile, "id">) => {
    const id = `f_${Date.now()}`;
    setState(s => ({
      ...s,
      files: [...s.files, { ...file, id }],
      loadedFileIds: [...s.loadedFileIds, id]
    }));
  };

  const removeFile = (id: string) => setState(s => ({
    ...s,
    files: s.files.filter(f => f.id !== id),
    loadedFileIds: s.loadedFileIds.filter(fid => fid !== id)
  }));

  const toggleFileLoaded = (id: string) => setState(s => ({
    ...s,
    loadedFileIds: s.loadedFileIds.includes(id) 
      ? s.loadedFileIds.filter(fid => fid !== id)
      : [...s.loadedFileIds, id]
  }));

  const updateMission = (id: string, updates: Partial<Mission>) => setState(s => ({
    ...s,
    missions: s.missions.map(m => m.id === id ? { ...m, ...updates } : m)
  }));

  const addMission = (mission: Omit<Mission, "id">) => setState(s => ({
    ...s,
    missions: [...s.missions, { ...mission, id: `m_${Date.now()}` }]
  }));

  const deleteMission = (id: string) => setState(s => ({
    ...s,
    missions: s.missions.filter(m => m.id !== id)
  }));

  const updateEpisode = (id: string, updates: Partial<Episode>) => setState(s => ({
    ...s,
    episodes: s.episodes.map(e => e.id === id ? { ...e, ...updates } : e)
  }));

  const addEpisode = (episode: Episode) => setState(s => ({
    ...s,
    episodes: [...s.episodes, episode]
  }));

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "empire_os_backup.json");
    a.click();
  };

  const importData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      setState({ ...INITIAL_STATE, ...parsed });
    } catch (e) {
      alert("Invalid backup file");
    }
  };

  const clearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setState(INITIAL_STATE);
    }
  };

  return (
    <AppContext.Provider value={{
      ...state,
      setActiveProject,
      setActiveAgent,
      updateSettings,
      updateAgentLog,
      addFile,
      removeFile,
      toggleFileLoaded,
      updateMission,
      addMission,
      deleteMission,
      updateEpisode,
      addEpisode,
      exportData,
      importData,
      clearData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
}
