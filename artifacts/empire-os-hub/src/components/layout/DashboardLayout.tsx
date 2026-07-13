import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAppStore } from "@/store/AppContext";
import { 
  Home, 
  KanbanSquare, 
  Film, 
  FolderOpen, 
  Settings,
  Activity,
  Bot,
  MoreHorizontal,
  PenTool
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProjectPanel from "./ProjectPanel";
import AgentSelector from "./AgentSelector";
import StatusBar from "./StatusBar";
import HandoffDrawer from "./HandoffDrawer";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const primaryNavItems = [
    { path: "/", icon: Home, label: "Hub" },
    { path: "/missions", icon: KanbanSquare, label: "Missions" },
    { path: "/episodes", icon: Film, label: "Episodes" },
  ];

  const moreNavItems = [
    { path: "/files", icon: FolderOpen, label: "Files" },
    { path: "/pipeline", icon: Activity, label: "Pipeline" },
    { path: "/compose", icon: PenTool, label: "Compose" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (Projects) */}
      <div className="hidden md:flex w-64 flex-col border-r border-border/50 bg-card/50">
        <ProjectPanel />
        <div className="mt-auto border-t border-border/50 p-2 space-y-1">
          {moreNavItems.map(item => (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors ${location === item.path ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-card hover:text-foreground'}`}>
                <item.icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-16 md:pb-12">
        <AgentSelector />
        
        <main className="flex-1 overflow-auto bg-background/50">
          {children}
        </main>
      </div>

      {/* Persistent Bottom StatusBar (Desktop) */}
      <div className="hidden md:block fixed bottom-0 left-64 right-0 z-50">
        <StatusBar />
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card flex items-center justify-around p-2 pb-safe">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path} data-testid={`nav-${item.label.toLowerCase()}`}>
              <div className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon size={24} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
        
        <HandoffDrawer>
          <div className="flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer text-indigo-400 hover:text-indigo-300 transition-colors" data-testid="nav-handoff">
            <Bot size={24} />
            <span className="text-[10px] mt-1 font-medium">Handoff</span>
          </div>
        </HandoffDrawer>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-colors ${moreNavItems.some(i => i.path === location) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <MoreHorizontal size={24} />
              <span className="text-[10px] mt-1 font-medium">More</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreNavItems.map(item => (
              <DropdownMenuItem key={item.path} asChild>
                <Link href={item.path} className="flex items-center gap-2 cursor-pointer w-full" data-testid={`nav-${item.label.toLowerCase()}`}>
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer w-full" data-testid="nav-settings">
                <Settings size={16} />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Pull-up Drawer for Status */}
      <div className="md:hidden">
        {/* We'll integrate a pull-up drawer inside StatusBar component */}
        <StatusBar mobile />
      </div>
    </div>
  );
}
