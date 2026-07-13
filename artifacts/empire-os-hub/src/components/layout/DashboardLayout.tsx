import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAppStore } from "@/store/AppContext";
import { 
  Home, 
  KanbanSquare, 
  Film, 
  FolderOpen, 
  Settings,
  Menu,
  Activity,
  Bot
} from "lucide-react";
import ProjectPanel from "./ProjectPanel";
import AgentSelector from "./AgentSelector";
import StatusBar from "./StatusBar";
import HandoffDrawer from "./HandoffDrawer";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Hub" },
    { path: "/missions", icon: KanbanSquare, label: "Missions" },
    { path: "/episodes", icon: Film, label: "Episodes" },
    { path: "/files", icon: FolderOpen, label: "Files" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (Projects) */}
      <div className="hidden md:flex w-64 flex-col border-r border-border/50 bg-card/50">
        <ProjectPanel />
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
        {navItems.map((item) => {
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
        <Link href="/settings" data-testid="nav-settings">
          <div className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-colors ${location === '/settings' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Settings size={24} />
            <span className="text-[10px] mt-1 font-medium">Settings</span>
          </div>
        </Link>
      </div>

      {/* Mobile Pull-up Drawer for Status */}
      <div className="md:hidden">
        {/* We'll integrate a pull-up drawer inside StatusBar component */}
        <StatusBar mobile />
      </div>
    </div>
  );
}
