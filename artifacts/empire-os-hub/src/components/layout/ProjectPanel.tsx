import { useAppStore } from "@/store/AppContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, FolderKanban } from "lucide-react";
import { Link } from "wouter";

export default function ProjectPanel() {
  const { projects, activeProjectId, setActiveProject } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-2 border-b border-border/50">
        <div className="bg-primary/20 text-primary p-2 rounded-md">
          <FolderKanban size={20} />
        </div>
        <h2 className="font-semibold text-lg tracking-tight">Empire OS</h2>
      </div>

      <ScrollArea className="flex-1 py-4">
        <div className="space-y-1 px-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Projects
          </h3>
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setActiveProject(project.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeProjectId === project.id 
                  ? "bg-primary/15 text-primary-foreground shadow-sm ring-1 ring-primary/30" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`project-select-${project.id}`}
            >
              <span className="text-xl flex-shrink-0">{project.emoji}</span>
              <span className="truncate flex-1 text-left">{project.name}</span>
              {activeProjectId === project.id && (
                <div className={`w-2 h-2 rounded-full ${project.color}`} />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border/50 mt-auto hidden md:block">
        <Link href="/settings" data-testid="sidebar-settings-link">
          <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-2 rounded-md hover:bg-muted">
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
