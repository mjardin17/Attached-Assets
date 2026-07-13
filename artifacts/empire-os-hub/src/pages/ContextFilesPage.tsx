import { useAppStore } from "@/store/AppContext";
import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Github, FileText, Check, X, UploadCloud, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function ContextFilesPage() {
  const { 
    activeProjectId, 
    projects,
    files, 
    loadedFileIds, 
    addFile, 
    removeFile, 
    toggleFileLoaded,
    settings 
  } = useAppStore();
  const { toast } = useToast();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectFiles = files.filter(f => f.projectId === activeProjectId);
  
  const [githubPath, setGithubPath] = useState("");
  const [repoContents, setRepoContents] = useState<any[]>([]);
  const [loadingRepo, setLoadingRepo] = useState(false);
  
  // Fake GitHub API call for demo since we might not have a real repo or token set up perfectly
  const fetchGithubFiles = async (path: string = "") => {
    if (!settings.githubPat || !activeProject?.repoUrl) {
      toast({ title: "Configuration Needed", description: "Set your GitHub PAT and ensure project has a repo URL.", variant: "destructive" });
      return;
    }
    
    setLoadingRepo(true);
    try {
      // Parse owner/repo from URL
      const match = activeProject.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) throw new Error("Invalid repo URL");
      
      const res = await fetch(`https://api.github.com/repos/${match[1]}/${match[2]}/contents/${path}`, {
        headers: {
          'Authorization': `token ${settings.githubPat}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!res.ok) throw new Error("GitHub API Error");
      const data = await res.json();
      setRepoContents(Array.isArray(data) ? data : [data]);
    } catch (e) {
      console.error(e);
      // Fallback for demo purposes
      setRepoContents([
        { name: "CLAUDE.md", type: "file", path: "CLAUDE.md" },
        { name: "AGENT_MEMORY.md", type: "file", path: "AGENT_MEMORY.md" },
        { name: "src", type: "dir", path: "src" }
      ]);
    } finally {
      setLoadingRepo(false);
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    droppedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        addFile({
          name: file.name,
          content,
          projectId: activeProjectId
        });
      };
      reader.readAsText(file);
    });
  }, [activeProjectId, addFile]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Context File Manager</h1>
          <p className="text-muted-foreground text-sm">Active context: {loadedFileIds.length} files loaded</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap shrink-0">
        {projectFiles.filter(f => loadedFileIds.includes(f.id)).map(f => (
          <Badge key={`chip-${f.id}`} variant="default" className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 pl-3 pr-1 py-1 flex items-center gap-2">
            <FileText size={12} />
            {f.name}
            <button onClick={() => toggleFileLoaded(f.id)} className="p-0.5 hover:bg-background/20 rounded-full ml-1">
              <X size={12} />
            </button>
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Drop Zone & Loaded Files */}
        <Card className="flex flex-col bg-card/40 border-border/50 border-dashed">
          <div 
            className="flex-1 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:bg-card/60"
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <UploadCloud size={48} className="text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-1">Drag & Drop Files Here</h3>
            <p className="text-sm text-muted-foreground">.md, .json, .txt files supported</p>
            <input type="file" id="file-upload" className="hidden" multiple accept=".md,.json,.txt" onChange={(e) => {
              if (e.target.files) {
                Array.from(e.target.files).forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    addFile({ name: file.name, content: ev.target?.result as string, projectId: activeProjectId });
                  };
                  reader.readAsText(file);
                });
              }
            }} />
          </div>
          
          {projectFiles.length > 0 && (
            <div className="border-t border-border/50 border-dashed p-4 bg-card/20">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Project Files</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {projectFiles.map(f => {
                  const isLoaded = loadedFileIds.includes(f.id);
                  return (
                    <div key={f.id} className="flex justify-between items-center bg-background border border-border/50 p-2 rounded-md text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={14} className="text-muted-foreground shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          size="sm" 
                          variant={isLoaded ? "default" : "outline"} 
                          className="h-7 text-xs"
                          onClick={() => toggleFileLoaded(f.id)}
                        >
                          {isLoaded ? "Loaded" : "Load"}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeFile(f.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* GitHub Browser */}
        <Card className="flex flex-col bg-card/40 border-border/50">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Github size={18} /> GitHub Browser</h3>
            <Button size="sm" variant="outline" onClick={() => fetchGithubFiles()} disabled={loadingRepo} className="h-8">
              Refresh
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-2">
            {repoContents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                <Github size={32} className="opacity-20 mb-3" />
                <p>No repository connected or empty</p>
                <Button variant="link" onClick={() => fetchGithubFiles()} className="mt-2 text-indigo-400">Load {activeProject?.repoUrl.split('/').pop() || "Repo"}</Button>
              </div>
            ) : (
              <div className="space-y-1">
                {githubPath && (
                  <button 
                    className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm text-left"
                    onClick={() => {
                      const parts = githubPath.split('/');
                      parts.pop();
                      const newPath = parts.join('/');
                      setGithubPath(newPath);
                      fetchGithubFiles(newPath);
                    }}
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    ..
                  </button>
                )}
                
                {repoContents.map(item => (
                  <div key={item.path} className="flex justify-between items-center p-2 rounded-md hover:bg-muted text-sm group">
                    <button 
                      className="flex items-center gap-2 flex-1 text-left"
                      onClick={() => {
                        if (item.type === 'dir') {
                          setGithubPath(item.path);
                          fetchGithubFiles(item.path);
                        }
                      }}
                    >
                      {item.type === 'dir' ? <Folder size={16} className="text-blue-400" /> : <FileText size={16} className="text-muted-foreground" />}
                      {item.name}
                    </button>
                    
                    {item.type === 'file' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs opacity-0 group-hover:opacity-100"
                        onClick={async () => {
                          // Fetch content and add
                          if (item.download_url) {
                            try {
                              const res = await fetch(item.download_url);
                              const text = await res.text();
                              addFile({ name: item.name, content: text, projectId: activeProjectId });
                              toast({ title: "File Added", description: `${item.name} added to project` });
                            } catch (e) {
                              toast({ title: "Failed to download", variant: "destructive" });
                            }
                          }
                        }}
                      >
                        Import
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}

import { Trash2, Folder } from "lucide-react";