import { useAppStore } from "@/store/AppContext";
import SmartDispatch from "@/components/hub/SmartDispatch";
import AgentLog from "@/components/hub/AgentLog";
import HandoffDrawer from "@/components/layout/HandoffDrawer";
import { Badge } from "@/components/ui/badge";

export default function HubPage() {
  const { projects, activeProjectId, activeAgentId, agents, missions } = useAppStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeAgent = agents.find(a => a.id === activeAgentId);
  const activeMissions = missions.filter(m => m.projectId === activeProjectId && (m.status === 'in_progress' || m.status === 'pending'));

  if (!activeProject) return null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">{activeProject.emoji}</span>
            {activeProject.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Active context: <span className="font-semibold text-foreground">{activeAgent?.name}</span>
          </p>
        </div>
        
        <div className="w-full md:w-auto">
          <HandoffDrawer triggerBtn={true} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="md:col-span-2 space-y-6">
          <AgentLog />
        </div>
        
        <div className="space-y-6">
          <SmartDispatch />
          
          <div className="bg-card/50 border border-border/50 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-4">Active Missions ({activeMissions.length})</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {activeMissions.map(m => (
                <div key={m.id} className="bg-background border border-border/50 p-3 rounded-lg text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium line-clamp-2">{m.title}</span>
                    {m.priority === 1 && <Badge variant="destructive" className="scale-75 origin-top-right">P1</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] uppercase">{m.status.replace('_', ' ')}</Badge>
                    <span>{m.assigned_to}</span>
                  </div>
                </div>
              ))}
              {activeMissions.length === 0 && (
                <div className="text-muted-foreground text-sm text-center py-4">No active missions for this project.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
