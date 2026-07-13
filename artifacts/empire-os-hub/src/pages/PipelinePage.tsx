import { useAppStore, Episode } from "@/store/AppContext";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, RefreshCw, Film, ExternalLink, HardDrive, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PipelinePage() {
  const { 
    activeProjectId, 
    projects,
    episodes,
    settings,
    updateEpisode
  } = useAppStore();
  const { toast } = useToast();
  
  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectEpisodes = useMemo(() => episodes, [episodes]); // Assuming all for now, but usually filtered by project
  
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const isConfigured = Boolean(settings.githubPat && activeProject?.repoUrl);

  const fetchPipelineStatus = useCallback(async (opts?: { silent?: boolean }) => {
    if (!settings.githubPat || !activeProject?.repoUrl) {
      if (!opts?.silent) {
        toast({ 
          title: "Configuration Needed", 
          description: "Set your GitHub PAT and ensure project has a repo URL.", 
          variant: "destructive" 
        });
      }
      return;
    }
    
    setLoading(true);
    try {
      const match = activeProject.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) throw new Error("Invalid repo URL");
      
      const repoPath = `https://api.github.com/repos/${match[1]}/${match[2]}`;
      const headers = {
        'Authorization': `token ${settings.githubPat}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      // 1. Fetch renders/ directory
      let renders: any[] = [];
      try {
        const rendersRes = await fetch(`${repoPath}/contents/renders`, { headers });
        if (rendersRes.ok) {
          renders = await rendersRes.json();
        }
      } catch (e) { console.error("Could not fetch renders directory", e); }

      // 2. Fetch uploaded_videos.json
      let uploadedData: Record<string, string> = {};
      try {
        const uploadRes = await fetch(`${repoPath}/contents/uploaded_videos.json`, { headers });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          if (uploadJson.content) {
            const decoded = atob(uploadJson.content.replace(/\n/g, ''));
            uploadedData = JSON.parse(decoded);
          }
        }
      } catch (e) { console.error("Could not fetch uploaded_videos.json", e); }
      
      // 3. Fetch render_log.json (optional)
      let renderLogData: Record<string, any> = {};
      try {
        const logRes = await fetch(`${repoPath}/contents/render_log.json`, { headers });
        if (logRes.ok) {
          const logJson = await logRes.json();
          if (logJson.content) {
            const decoded = atob(logJson.content.replace(/\n/g, ''));
            renderLogData = JSON.parse(decoded);
          }
        }
      } catch (e) { console.error("Could not fetch render_log.json", e); }

      // 4. Correlate with episodes
      projectEpisodes.forEach(ep => {
        let updates: Partial<Episode> = {};
        
        // Check if uploaded
        if (uploadedData[ep.id]) {
          updates.uploadStatus = "done";
          updates.url = uploadedData[ep.id];
          updates.renderStatus = "done"; // Implied
        } else {
          // Check if rendered
          const renderFile = renders.find((r: any) => r.name.includes(ep.id) && r.name.endsWith('.mp4'));
          if (renderFile) {
            updates.renderStatus = "done";
            updates.fileSizeMb = (renderFile.size / (1024 * 1024)).toFixed(1);
          } else if (renderLogData[ep.id] && renderLogData[ep.id].status === "rendering") {
            updates.renderStatus = "rendering";
            updates.renderProgress = renderLogData[ep.id].progress || 0;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          updateEpisode(ep.id, updates);
        }
      });
      
      setLastChecked(new Date());
    } catch (e) {
      console.error(e);
      // Demo fallback if API fails
      setTimeout(() => {
        setLastChecked(new Date());
      }, 500);
    } finally {
      setLoading(false);
    }
  }, [settings.githubPat, activeProject?.repoUrl, projectEpisodes, updateEpisode, toast]);

  // Auto-refresh every 30s (silent when not configured to avoid repeated toasts)
  useEffect(() => {
    fetchPipelineStatus({ silent: true });
    const interval = setInterval(() => fetchPipelineStatus({ silent: true }), 30000);
    return () => clearInterval(interval);
  }, [fetchPipelineStatus]);

  const stats = useMemo(() => {
    const total = projectEpisodes.length;
    const rendered = projectEpisodes.filter(e => e.renderStatus === 'done').length;
    const uploaded = projectEpisodes.filter(e => e.uploadStatus === 'done').length;
    return { total, rendered, uploaded };
  }, [projectEpisodes]);

  const getStatusDisplay = (ep: Episode) => {
    if (ep.uploadStatus === 'done') {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Uploaded</Badge>;
    }
    if (ep.renderStatus === 'done') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Rendered</Badge>;
    }
    if (ep.renderStatus === 'rendering') {
      return <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 flex items-center gap-1">
        <RefreshCw size={10} className="animate-spin" /> Rendering {ep.renderProgress ? `${ep.renderProgress}%` : ''}
      </Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground border-border">Missing</Badge>;
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Pipeline Monitor</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Github size={14} /> 
            Reading from {activeProject?.repoUrl?.split('/').slice(-2).join('/') || "No Repo"}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto bg-card/50 border border-border/50 p-2 rounded-lg backdrop-blur-sm">
          <div className="flex gap-4 px-2 text-sm">
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Total</span>
              <span className="font-mono font-semibold">{stats.total}</span>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="flex flex-col items-center">
              <span className="text-blue-400 text-[10px] uppercase tracking-wider font-bold">Rendered</span>
              <span className="font-mono font-semibold text-blue-400">{stats.rendered}</span>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="flex flex-col items-center">
              <span className="text-emerald-400 text-[10px] uppercase tracking-wider font-bold">Uploaded</span>
              <span className="font-mono font-semibold text-emerald-400">{stats.uploaded}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-border/50 hidden sm:block"></div>
          <div className="flex flex-col items-end hidden sm:flex px-2">
             <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Last Checked</span>
             <span className="text-xs">{lastChecked ? Math.round((new Date().getTime() - lastChecked.getTime()) / 1000) + 's ago' : 'Never'}</span>
          </div>
          <Button size="icon" variant="ghost" onClick={() => fetchPipelineStatus()} disabled={loading || !isConfigured} className="h-8 w-8 ml-auto sm:ml-0 shrink-0" data-testid="button-refresh-pipeline">
            <RefreshCw size={16} className={loading ? 'animate-spin text-primary' : ''} />
          </Button>
        </div>
      </div>

      {!isConfigured && (
        <Card className="p-8 border-dashed border-rose-500/30 bg-rose-500/5 flex flex-col items-center justify-center text-center space-y-4 shrink-0">
          <AlertCircle className="text-rose-400" size={32} />
          <div>
            <h3 className="font-bold text-rose-100">Configuration Required</h3>
            <p className="text-rose-200/70 text-sm max-w-md mt-1">To monitor the pipeline, you need a GitHub Personal Access Token (PAT) and a configured repository URL for this project.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="border-rose-500/30 hover:bg-rose-500/10 text-rose-300" onClick={() => window.location.href = '/settings'} data-testid="button-go-settings">Go to Settings</Button>
          </div>
        </Card>
      )}

      <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm flex flex-col">
        {/* Desktop Table */}
        <div className="hidden md:block flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-card sticky top-0 z-10">
              <TableRow className="border-border/50">
                <TableHead>Episode</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">File Size</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectEpisodes.map(ep => (
                <TableRow key={ep.id} className="border-border/50 hover:bg-card/50">
                  <TableCell className="font-mono text-sm font-medium">{ep.id}</TableCell>
                  <TableCell className="font-semibold">{ep.title}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">{getStatusDisplay(ep)}</div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground font-mono text-xs">
                    {ep.fileSizeMb ? `${ep.fileSizeMb} MB` : '--'}
                  </TableCell>
                  <TableCell className="text-right">
                    {ep.url ? (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild data-testid={`link-watch-desktop-${ep.id}`}>
                        <a href={ep.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={14} />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground/30 px-3">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {projectEpisodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <Film className="mx-auto mb-2 opacity-20" size={24} />
                    No episodes tracked yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden flex-1 overflow-auto p-4 space-y-3 custom-scrollbar">
          {projectEpisodes.map(ep => (
            <Card key={ep.id} className="p-4 border-border/50 bg-card/50 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-xs text-muted-foreground mb-1">{ep.id}</div>
                  <div className="font-semibold">{ep.title}</div>
                </div>
                {getStatusDisplay(ep)}
              </div>
              <div className="flex justify-between items-center border-t border-border/50 pt-3 mt-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <HardDrive size={12} />
                  {ep.fileSizeMb ? `${ep.fileSizeMb} MB` : 'Unknown size'}
                </div>
                {ep.url && (
                   <Button size="sm" variant="ghost" className="h-7 text-xs text-primary" asChild data-testid={`link-watch-mobile-${ep.id}`}>
                     <a href={ep.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                       <ExternalLink size={12} /> Watch
                     </a>
                   </Button>
                )}
              </div>
            </Card>
          ))}
          {projectEpisodes.length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
              <Film className="mb-2 opacity-20" size={24} />
              <p className="text-sm">No episodes tracked yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
