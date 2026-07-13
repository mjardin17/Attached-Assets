import { useAppStore, AgentId } from "@/store/AppContext";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { History, Save } from "lucide-react";

export default function AgentLog() {
  const { activeProjectId, activeAgentId, agentLogs, updateAgentLog } = useAppStore();
  const logKey = `${activeProjectId}_${activeAgentId}`;
  
  const [localLog, setLocalLog] = useState(agentLogs[logKey] || "");
  const initializedFor = useRef("");
  
  useEffect(() => {
    if (initializedFor.current !== logKey) {
      setLocalLog(agentLogs[logKey] || "");
      initializedFor.current = logKey;
    }
  }, [logKey, agentLogs]);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localLog !== agentLogs[logKey]) {
        updateAgentLog(activeProjectId, activeAgentId, localLog);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [localLog, logKey, updateAgentLog, activeProjectId, activeAgentId, agentLogs]);

  return (
    <Card className="flex flex-col h-full border-border/50 bg-card/30">
      <div className="p-3 border-b border-border/50 flex justify-between items-center bg-card/50">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <History size={16} className="text-muted-foreground" />
          Session Log
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Save size={12} /> Auto-saving
        </div>
      </div>
      <div className="flex-1 p-2">
        <Textarea
          value={localLog}
          onChange={(e) => setLocalLog(e.target.value)}
          placeholder={`What did this agent do last session?\n\nExample:\n- Updated bm_george voice\n- Built fix_yt_titles.py`}
          className="h-full min-h-[200px] resize-none bg-transparent border-none focus-visible:ring-0 text-sm font-mono"
          data-testid="agent-session-log"
        />
      </div>
    </Card>
  );
}
