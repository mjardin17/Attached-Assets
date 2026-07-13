import { useAppStore, Episode } from "@/store/AppContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ExternalLink, CheckCircle2, Clock, XCircle, RefreshCw, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EpisodesPage() {
  const { episodes, activeProjectId, updateEpisode } = useAppStore();
  const [filterChannel, setFilterChannel] = useState<string>("ALL");

  const filteredEpisodes = episodes
    .filter(e => filterChannel === "ALL" || e.channel === filterChannel)
    .sort((a, b) => b.id.localeCompare(a.id));

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "done") return <CheckCircle2 size={16} className="text-emerald-400" />;
    if (status === "pending") return <Clock size={16} className="text-muted-foreground" />;
    if (status === "error") return <XCircle size={16} className="text-rose-500" />;
    if (status === "rendering") return <RefreshCw size={16} className="text-indigo-400 animate-spin" />;
    return null;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Episode Tracker</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Channels</SelectItem>
              <SelectItem value="GG">Gods & Glory</SelectItem>
              <SelectItem value="IL">IL</SelectItem>
              <SelectItem value="LO">LO</SelectItem>
              <SelectItem value="ED">ED</SelectItem>
            </SelectContent>
          </Select>
          
          <CreateEpisodeDialog />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-card">
              <TableRow className="border-border/50">
                <TableHead>ID</TableHead>
                <TableHead className="min-w-[200px]">Title</TableHead>
                <TableHead className="text-center">Script</TableHead>
                <TableHead className="text-center">Render</TableHead>
                <TableHead className="text-center">Upload</TableHead>
                <TableHead>Metrics</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEpisodes.map(ep => (
                <TableRow key={ep.id} className="border-border/50 hover:bg-card/50">
                  <TableCell className="font-mono text-sm font-medium">{ep.id}</TableCell>
                  <TableCell className="font-semibold">{ep.title}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center"><StatusIcon status={ep.scriptStatus} /></div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center cursor-pointer" onClick={() => {
                      const next = ep.renderStatus === 'pending' ? 'rendering' : ep.renderStatus === 'rendering' ? 'done' : 'pending';
                      updateEpisode(ep.id, { renderStatus: next });
                    }}>
                      <StatusIcon status={ep.renderStatus} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center cursor-pointer" onClick={() => {
                      updateEpisode(ep.id, { uploadStatus: ep.uploadStatus === 'pending' ? 'done' : 'pending' });
                    }}>
                      <StatusIcon status={ep.uploadStatus} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground flex flex-col gap-1">
                      <span>{ep.duration}</span>
                      {ep.views > 0 && <span className="text-emerald-400 font-medium">{ep.views.toLocaleString()} views</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {ep.url && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                        <a href={ep.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={14} />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredEpisodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No episodes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function CreateEpisodeDialog() {
  const { addEpisode } = useAppStore();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "GG_EP",
    title: "",
    channel: "GG",
    duration: "10:00"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEpisode({
      id: formData.id,
      title: formData.title,
      channel: formData.channel as any,
      duration: formData.duration,
      scriptStatus: "pending",
      renderStatus: "pending",
      uploadStatus: "pending",
      url: "",
      views: 0
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="create-episode-btn"><Plus size={16} className="mr-2" /> New Episode</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Episode</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ep_id">Episode ID</Label>
              <Input id="ep_id" value={formData.id} onChange={e => setFormData(s => ({...s, id: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={formData.channel} onValueChange={v => setFormData(s => ({...s, channel: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GG">Gods & Glory</SelectItem>
                  <SelectItem value="IL">IL</SelectItem>
                  <SelectItem value="LO">LO</SelectItem>
                  <SelectItem value="ED">ED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep_title">Title</Label>
            <Input id="ep_title" value={formData.title} onChange={e => setFormData(s => ({...s, title: e.target.value}))} required />
          </div>
          <Button type="submit" className="w-full">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
