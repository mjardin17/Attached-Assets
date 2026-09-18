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

export type PipelineStage = "ideas" | "script" | "thumbnail" | "render" | "publish" | "live";
export type ApprovalGate = "script" | "thumbnail" | "render" | "publish";
export type ApprovalStatus = "pending" | "approved" | "changes_requested";
export type PublishPlatform = "youtube" | "instagram" | "facebook" | "x" | "linkedin";

export interface GateApproval {
  status: ApprovalStatus;
  updatedAt?: string;
}

export interface ThumbnailVariant {
  id: string;
  label: string;
  status: "placeholder" | "selected";
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
  stage: PipelineStage;
  approvals: Record<ApprovalGate, GateApproval>;
  thumbnailVariants: ThumbnailVariant[];
  publishChecklist: Record<PublishPlatform, boolean>;
  createdAt: string;
  publishedAt?: string;
  intelSource?: string;
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

export const PIPELINE_STAGES: { id: PipelineStage; label: string; shortLabel: string }[] = [
  { id: "ideas", label: "Ideas", shortLabel: "Ideas" },
  { id: "script", label: "Script", shortLabel: "Script" },
  { id: "thumbnail", label: "Thumbnail", shortLabel: "Thumb" },
  { id: "render", label: "Render", shortLabel: "Render" },
  { id: "publish", label: "Publish", shortLabel: "Publish" },
  { id: "live", label: "Live", shortLabel: "Live" },
];

export const CHANNEL_META: Record<Episode["channel"], { name: string; emoji: string; accent: string }> = {
  LO: { name: "Little Olympus", emoji: "🏛️", accent: "amber" },
  IL: { name: "Iron Legends", emoji: "🤖", accent: "sky" },
  ED: { name: "Empire Decoded", emoji: "📜", accent: "violet" },
  GG: { name: "Gods & Glory", emoji: "⚡", accent: "indigo" },
};

export const APPROVAL_META: Record<ApprovalGate, { label: string; description: string }> = {
  script: { label: "Script", description: "Story beats, pacing, and narration are ready." },
  thumbnail: { label: "Thumbnail", description: "The selected cover communicates the hook." },
  render: { label: "Render", description: "The final video export is checked." },
  publish: { label: "Publish", description: "Distribution copy and links are ready." },
};

export const PUBLISH_PLATFORMS: { id: PublishPlatform; label: string }[] = [
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
];

const DEFAULT_APPROVALS: Record<ApprovalGate, GateApproval> = {
  script: { status: "pending" },
  thumbnail: { status: "pending" },
  render: { status: "pending" },
  publish: { status: "pending" },
};

const DEFAULT_THUMBNAIL_VARIANTS: ThumbnailVariant[] = [
  { id: "a", label: "Variant A", status: "placeholder" },
  { id: "b", label: "Variant B", status: "placeholder" },
  { id: "c", label: "Variant C", status: "placeholder" },
];

const DEFAULT_PUBLISH_CHECKLIST: Record<PublishPlatform, boolean> = {
  youtube: false,
  instagram: false,
  facebook: false,
  x: false,
  linkedin: false,
};

export function createEpisodeDefaults(overrides: Partial<Episode> = {}): Episode {
  return {
    ...overrides,
    id: overrides.id || `EP_${Date.now()}`,
    title: overrides.title || "Untitled episode",
    scriptStatus: overrides.scriptStatus || "pending",
    renderStatus: overrides.renderStatus || "pending",
    uploadStatus: overrides.uploadStatus || "pending",
    url: overrides.url || "",
    views: overrides.views || 0,
    duration: overrides.duration || "00:00",
    channel: overrides.channel || "LO",
    stage: overrides.stage || "ideas",
    approvals: { ...DEFAULT_APPROVALS, ...overrides.approvals },
    thumbnailVariants: overrides.thumbnailVariants?.length ? overrides.thumbnailVariants : DEFAULT_THUMBNAIL_VARIANTS,
    publishChecklist: { ...DEFAULT_PUBLISH_CHECKLIST, ...overrides.publishChecklist },
    createdAt: overrides.createdAt || new Date().toISOString(),
  };
}

export function getBlockingGate(episode: Episode, targetStage: PipelineStage): ApprovalGate | null {
  const currentIndex = PIPELINE_STAGES.findIndex(stage => stage.id === episode.stage);
  const targetIndex = PIPELINE_STAGES.findIndex(stage => stage.id === targetStage);
  if (targetIndex <= currentIndex) return null;

  for (let index = currentIndex; index < targetIndex; index += 1) {
    const stage = PIPELINE_STAGES[index].id;
    if (stage !== "script" && stage !== "thumbnail" && stage !== "render" && stage !== "publish") continue;
    if (episode.approvals[stage]?.status !== "approved") return stage;
  }
  return null;
}

function normalizeEpisode(raw: Partial<Episode>, fallbackIndex: number): Episode {
  const inferredStage: PipelineStage =
    raw.stage ||
    (raw.uploadStatus === "done" ? "live" :
      raw.renderStatus === "done" ? "publish" :
        raw.renderStatus === "rendering" ? "render" :
          raw.scriptStatus === "done" ? "thumbnail" : "ideas");

  return createEpisodeDefaults({
    ...raw,
    id: raw.id || `EP_IMPORTED_${fallbackIndex + 1}`,
    title: raw.title || "Imported episode",
    stage: inferredStage,
    createdAt: raw.createdAt || new Date().toISOString(),
  });
}

function seedEpisodeSet(existing: Episode[]): Episode[] {
  const seedEpisodes: Episode[] = [
    createEpisodeDefaults({
      id: "LO_EP001",
      title: "Athena's Owl and the Missing Map",
      channel: "LO",
      stage: "ideas",
      duration: "08:42",
      intelSource: "Mythology Weekly",
    }),
    createEpisodeDefaults({
      id: "IL_EP007",
      title: "The Robot Cartoon That Predicted Our Future",
      channel: "IL",
      stage: "thumbnail",
      scriptStatus: "done",
      duration: "12:18",
      approvals: {
        ...DEFAULT_APPROVALS,
        script: { status: "approved", updatedAt: new Date().toISOString() },
      },
      intelSource: "Retro Tech Archive",
    }),
    createEpisodeDefaults({
      id: "ED_EP003",
      title: "How Alexandria Kept Its Lighthouse Burning",
      channel: "ED",
      stage: "live",
      scriptStatus: "done",
      renderStatus: "done",
      uploadStatus: "done",
      renderProgress: 100,
      duration: "14:06",
      url: "https://youtube.com",
      publishedAt: new Date().toISOString(),
      approvals: {
        script: { status: "approved", updatedAt: new Date().toISOString() },
        thumbnail: { status: "approved", updatedAt: new Date().toISOString() },
        render: { status: "approved", updatedAt: new Date().toISOString() },
        publish: { status: "approved", updatedAt: new Date().toISOString() },
      },
      publishChecklist: {
        youtube: true,
        instagram: true,
        facebook: false,
        x: true,
        linkedin: false,
      },
      intelSource: "History Today",
    }),
  ];

  const byId = new Set(existing.map(episode => episode.id));
  return [...existing, ...seedEpisodes.filter(episode => !byId.has(episode.id))];
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

const DEFAULT_EPISODES: Episode[] = seedEpisodeSet([]);

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
  moveEpisode: (id: string, targetStage: PipelineStage) => void;
  updateApproval: (id: string, gate: ApprovalGate, status: ApprovalStatus) => void;
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
        const parsed = JSON.parse(saved);
        const savedEpisodes = Array.isArray(parsed.episodes)
          ? parsed.episodes.map((episode: Partial<Episode>, index: number) => normalizeEpisode(episode, index))
          : [];
        return { ...INITIAL_STATE, ...parsed, episodes: seedEpisodeSet(savedEpisodes) };
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

  const updateEpisode = (id: string, updates: Partial<Episode>) => setState(s => {
    const nextEpisodes = s.episodes.map(e => e.id === id ? { ...e, ...updates } : e);
    const changed = nextEpisodes.some((episode, index) => episode !== s.episodes[index] && JSON.stringify(episode) !== JSON.stringify(s.episodes[index]));
    return changed ? { ...s, episodes: nextEpisodes } : s;
  });

  const addEpisode = (episode: Episode) => setState(s => ({
    ...s,
    episodes: [...s.episodes, createEpisodeDefaults(episode)]
  }));

  const moveEpisode = (id: string, targetStage: PipelineStage) => setState(s => {
    const episode = s.episodes.find(item => item.id === id);
    if (!episode || getBlockingGate(episode, targetStage)) return s;
    const nextEpisodes = s.episodes.map(item => {
      if (item.id !== id) return item;
      const updates: Partial<Episode> = { stage: targetStage };
      if (targetStage === "render" && item.renderStatus === "pending") updates.renderStatus = "rendering";
      if (targetStage === "live") {
        updates.renderStatus = "done";
        updates.uploadStatus = "done";
        updates.renderProgress = 100;
        updates.publishedAt = item.publishedAt || new Date().toISOString();
      }
      return { ...item, ...updates };
    });
    return { ...s, episodes: nextEpisodes };
  });

  const updateApproval = (id: string, gate: ApprovalGate, status: ApprovalStatus) => setState(s => ({
    ...s,
    episodes: s.episodes.map(episode => {
      if (episode.id !== id) return episode;
      const approvalUpdates: Partial<Episode> = {
        approvals: {
          ...episode.approvals,
          [gate]: { status, updatedAt: new Date().toISOString() },
        },
      };
      if (gate === "script") approvalUpdates.scriptStatus = status === "approved" ? "done" : "pending";
      if (gate === "render" && status === "approved") approvalUpdates.renderStatus = "done";
      if (gate === "publish" && status === "approved") approvalUpdates.uploadStatus = "done";
      return { ...episode, ...approvalUpdates };
    }),
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
      const importedEpisodes = Array.isArray(parsed.episodes)
        ? parsed.episodes.map((episode: Partial<Episode>, index: number) => normalizeEpisode(episode, index))
        : [];
      setState({ ...INITIAL_STATE, ...parsed, episodes: seedEpisodeSet(importedEpisodes) });
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
      moveEpisode,
      updateApproval,
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
