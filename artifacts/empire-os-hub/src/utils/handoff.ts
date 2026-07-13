import { AppProvider, AgentId, Project, ContextFile, Agent, Mission, Episode, Settings, useAppStore } from "@/store/AppContext";

export function generatePromptText(
  agentId: AgentId,
  projectId: string,
  state: {
    projects: Project[];
    agents: Agent[];
    missions: Mission[];
    files: ContextFile[];
    loadedFileIds: string[];
    agentLogs: Record<string, string>;
  },
  customTask?: string
): string {
  const agent = state.agents.find(a => a.id === agentId);
  const project = state.projects.find(p => p.id === projectId);
  if (!agent || !project) return "";

  const activeMissions = state.missions.filter(
    m => m.projectId === projectId && (m.status === 'in_progress' || m.status === 'pending') && m.assigned_to === agentId
  );
  
  const loadedFiles = state.files.filter(f => state.loadedFileIds.includes(f.id));
  const sessionLog = state.agentLogs[`${projectId}_${agentId}`] || "No notes from last session.";
  
  const dateStr = new Date().toISOString().split('T')[0];

  let prompt = `EMPIRE OS AGENT — READ FIRST
Agent: ${agent.name}
Project: ${project.name}
Repo: ${project.repoUrl || "No repo"}
Date: ${dateStr}

`;

  if (loadedFiles.length > 0) {
    prompt += `=== CONTEXT FILES ===\n`;
    loadedFiles.forEach(f => {
      prompt += `\n--- ${f.name} ---\n${f.content}\n`;
    });
    prompt += `\n`;
  }

  prompt += `=== YOUR MISSIONS ===\n`;
  if (activeMissions.length > 0) {
    activeMissions.forEach(m => {
      prompt += `- [${m.status}] ${m.title} (Priority: P${m.priority})\n`;
      if (m.notes) prompt += `  Notes: ${m.notes}\n`;
    });
  } else {
    prompt += `No active missions assigned directly to you right now.\n`;
  }
  prompt += `\n`;

  prompt += `=== LAST SESSION ===\n${sessionLog}\n\n`;
  
  prompt += `=== START HERE ===\n`;
  prompt += customTask || `Analyze the context and let me know you're ready for instructions.`;

  return prompt;
}

export function generatePrompt(agentId: AgentId): string {
  const saved = localStorage.getItem("empire-os-state");
  if (!saved) return "";
  const state = JSON.parse(saved);
  return generatePromptText(agentId, state.activeProjectId, state);
}

export function executeHandoff(agentId: AgentId, customTask?: string) {
  const saved = localStorage.getItem("empire-os-state");
  if (!saved) return;
  const state = JSON.parse(saved);
  const prompt = generatePromptText(agentId, state.activeProjectId, state, customTask);
  
  navigator.clipboard.writeText(prompt).catch(e => console.error("Clipboard copy failed", e));
  
  const agentUrls: Record<string, string> = {
    claude: "https://claude.ai/new",
    gemini: "https://gemini.google.com/app",
    grok: "https://grok.x.ai",
    chatgpt: "https://chat.openai.com",
    deepseek: "https://chat.deepseek.com"
  };
  
  const url = agentUrls[agentId];
  if (url) {
    window.open(url, '_blank');
  }
}
