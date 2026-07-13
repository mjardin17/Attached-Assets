import { useAppStore } from "@/store/AppContext";
import { Bot } from "lucide-react";

export default function AgentSelector() {
  const { agents, activeAgentId, setActiveAgent } = useAppStore();

  return (
    <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center overflow-x-auto hide-scrollbar px-2">
        {agents.map((agent) => {
          const isActive = activeAgentId === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id)}
              className={`flex items-center gap-2 px-4 py-4 min-w-max border-b-2 transition-colors relative
                ${isActive 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              data-testid={`agent-tab-${agent.id}`}
            >
              <div className={`p-1.5 rounded-md ${agent.color} flex-shrink-0`}>
                <Bot size={16} />
              </div>
              <span className="font-semibold text-sm">{agent.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
