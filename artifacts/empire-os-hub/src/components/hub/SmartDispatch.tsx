import { useAppStore, AgentId } from "@/store/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, Send, Search, Check, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generatePrompt, executeHandoff } from "@/utils/handoff";

export default function SmartDispatch() {
  const [taskDesc, setTaskDesc] = useState("");
  const { activeProjectId, agents } = useAppStore();
  const { toast } = useToast();
  
  const recommendAgent = (task: string): { agentId: AgentId; reason: string } => {
    const t = task.toLowerCase();
    if (t.includes("code") || t.includes("architecture") || t.includes("pipeline") || t.includes("script")) return { agentId: "claude", reason: "this is pipeline/code work" };
    if (t.includes("react") || t.includes("vite") || t.includes("frontend") || t.includes("ui")) return { agentId: "grok", reason: "this is frontend app build work" };
    if (t.includes("content") || t.includes("research") || t.includes("story") || t.includes("idea")) return { agentId: "gemini", reason: "this is content/research work" };
    if (t.includes("math") || t.includes("data") || t.includes("analyze") || t.includes("stats")) return { agentId: "deepseek", reason: "this is data analysis work" };
    return { agentId: "chatgpt", reason: "general writing and documentation" };
  };

  const recommendation = taskDesc.length > 5 ? recommendAgent(taskDesc) : null;
  const recommendedAgent = recommendation ? agents.find(a => a.id === recommendation.agentId) : agents.find(a => a.id === "claude");

  const handleDispatch = () => {
    if (!recommendedAgent) return;
    executeHandoff(recommendedAgent.id, taskDesc);
    toast({
      title: "Prompt Copied!",
      description: `Opening ${recommendedAgent.name}. Paste the prompt there.`,
    });
    setTaskDesc("");
  };

  return (
    <Card className="p-4 border-primary/20 bg-primary/5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Bot size={16} className="text-primary" />
        Smart Dispatch
      </h3>
      
      <div className="space-y-3">
        <textarea
          value={taskDesc}
          onChange={e => setTaskDesc(e.target.value)}
          placeholder="What needs to be done? e.g. 'Build the frontend for the new dashboard'"
          className="w-full bg-background border border-border/50 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
          data-testid="smart-dispatch-input"
        />
        
        {recommendation && (
          <div className="text-xs text-muted-foreground flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check size={14} className="text-emerald-400" />
            Recommended: <span className="text-foreground font-medium">{recommendedAgent?.name}</span> — {recommendation.reason}
          </div>
        )}

        <Button 
          className="w-full" 
          disabled={taskDesc.length < 5}
          onClick={handleDispatch}
          data-testid="smart-dispatch-btn"
        >
          <Send size={16} className="mr-2" />
          Dispatch to {recommendedAgent?.name || "Agent"}
        </Button>
      </div>
    </Card>
  );
}
