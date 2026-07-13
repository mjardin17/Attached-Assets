import { useAppStore, Mission, MissionStatus } from "@/store/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Bot, Download } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { executeHandoff } from "@/utils/handoff";
import { useToast } from "@/hooks/use-toast";

const COLUMNS: { id: MissionStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "complete", label: "Complete" }
];

export default function MissionBoardPage() {
  const { missions, activeProjectId, updateMission, addMission, agents } = useAppStore();
  const { toast } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const activeMissions = missions.filter(m => m.projectId === activeProjectId);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: MissionStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      updateMission(id, { status });
    }
    setDraggedId(null);
  };

  const handleExport = () => {
    const exportData = {
      missions: activeMissions.map(m => ({
        id: m.id,
        type: m.type,
        status: m.status,
        assigned_to: m.assigned_to,
        target: m.target,
        priority: m.priority,
        notes: m.notes
      }))
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "MISSION_BOARD.json");
    a.click();
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Mission Board</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="export-missions-btn">
            <Download size={16} className="mr-2" /> Export
          </Button>
          <CreateMissionDialog projectId={activeProjectId} />
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-x-auto overflow-y-hidden snap-x">
        {COLUMNS.map(col => (
          <div 
            key={col.id} 
            className="flex-shrink-0 w-full md:w-[320px] flex flex-col bg-card/40 rounded-xl border border-border/50 snap-center h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            data-testid={`kanban-col-${col.id}`}
          >
            <div className="p-3 border-b border-border/50 bg-card/60 flex justify-between items-center font-medium sticky top-0">
              {col.label}
              <Badge variant="secondary" className="bg-background">{activeMissions.filter(m => m.status === col.id).length}</Badge>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {activeMissions.filter(m => m.status === col.id).map(mission => (
                <div 
                  key={mission.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, mission.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={`bg-card border border-border p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-all hover:border-primary/50 ${draggedId === mission.id ? 'opacity-50 scale-95' : ''}`}
                  data-testid={`mission-card-${mission.id}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-semibold text-sm leading-tight">{mission.title}</h4>
                    <div className="flex items-center gap-1 cursor-grab">
                      <GripVertical size={14} className="text-muted-foreground opacity-50" />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {mission.priority === 1 && <Badge variant="destructive" className="text-[10px] py-0">P1</Badge>}
                    <Badge variant="outline" className="text-[10px] py-0 uppercase">{mission.type}</Badge>
                    <Badge variant="secondary" className="text-[10px] py-0 text-muted-foreground">{mission.target}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Bot size={14} />
                      <span className="capitalize">{mission.assigned_to || 'Unassigned'}</span>
                    </div>
                    {mission.assigned_to && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20"
                        onClick={() => {
                          if (mission.assigned_to) {
                            executeHandoff(mission.assigned_to, `Work on mission: ${mission.title}\nTarget: ${mission.target}\nNotes: ${mission.notes}`);
                            toast({ title: "Dispatched!", description: `Opened ${mission.assigned_to}`});
                          }
                        }}
                        data-testid={`dispatch-btn-${mission.id}`}
                      >
                        Dispatch
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {activeMissions.filter(m => m.status === col.id).length === 0 && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg text-sm text-muted-foreground">
                  Drop here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateMissionDialog({ projectId }: { projectId: string }) {
  const { addMission, agents } = useAppStore();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "feature",
    assigned_to: "claude",
    target: "",
    priority: "2",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMission({
      title: formData.title,
      type: formData.type,
      status: "pending",
      assigned_to: formData.assigned_to as any,
      target: formData.target,
      priority: parseInt(formData.priority),
      notes: formData.notes,
      projectId
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="create-mission-btn"><Plus size={16} className="mr-2" /> New Mission</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Mission</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={formData.title} onChange={e => setFormData(s => ({...s, title: e.target.value}))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={formData.assigned_to} onValueChange={v => setFormData(s => ({...s, assigned_to: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={v => setFormData(s => ({...s, priority: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">P1 - Urgent</SelectItem>
                  <SelectItem value="2">P2 - Normal</SelectItem>
                  <SelectItem value="3">P3 - Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input id="type" placeholder="e.g. render, code, write" value={formData.type} onChange={e => setFormData(s => ({...s, type: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              <Input id="target" placeholder="e.g. GG_EP014" value={formData.target} onChange={e => setFormData(s => ({...s, target: e.target.value}))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => setFormData(s => ({...s, notes: e.target.value}))} />
          </div>
          <Button type="submit" className="w-full">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
