import {
  APPROVAL_META,
  CHANNEL_META,
  Episode,
  getBlockingGate,
  PIPELINE_STAGES,
  PUBLISH_PLATFORMS,
  ApprovalGate,
  ApprovalStatus,
  PipelineStage,
  PublishPlatform,
  createEpisodeDefaults,
  useAppStore,
} from "@/store/AppContext";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "wouter";
import { ArrowDownToLine, ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, ExternalLink, FileText, Github, GripVertical, ImageIcon, Lightbulb, LockKeyhole, Plus, RefreshCw, Send, Sparkles, Video, X, Youtube } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const GATE_ORDER: ApprovalGate[] = ["script", "thumbnail", "render", "publish"];

const INTEL_ITEMS = [
  { id: "intel-owl", title: "Why Athena's owl became the symbol of seeing what others miss", source: "Mythology Weekly", timestamp: "2h ago", channel: "LO" as const },
  { id: "intel-robot", title: "The 1980s robot cartoon that quietly predicted the smart home", source: "Retro Tech Archive", timestamp: "5h ago", channel: "IL" as const },
  { id: "intel-lighthouse", title: "The engineering trick that kept Alexandria's lighthouse burning", source: "History Today", timestamp: "Yesterday", channel: "ED" as const },
];

const PLATFORM_ICONS: Record<PublishPlatform, typeof Youtube> = {
  youtube: Youtube,
  instagram: CircleDot,
  facebook: CircleDot,
  x: ArrowRight,
  linkedin: FileText,
};

function getWeekKey(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  monday.setDate(monday.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function formatTimestamp(value?: string) {
  if (!value) return "Not yet";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getChannelClasses(channel: Episode["channel"]) {
  const accent = CHANNEL_META[channel].accent;
  const classes: Record<string, string> = {
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    sky: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    violet: "border-violet-400/30 bg-violet-400/10 text-violet-200",
    indigo: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  };
  return classes[accent];
}

function StageHeader({ stage, count }: { stage: typeof PIPELINE_STAGES[number]; count: number }) {
  return (
    <div className="flex items-center justify-between px-1 pb-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-amber-100/80">{stage.shortLabel}</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-background/80 px-1.5 font-mono text-[10px] text-muted-foreground">{count}</span>
      </div>
      {stage.id !== "ideas" && stage.id !== "live" && <LockKeyhole size={13} className="text-muted-foreground/50" />}
    </div>
  );
}

function EpisodeCard({
  episode,
  stageIndex,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
}: {
  episode: Episode;
  stageIndex: number;
  onOpen: () => void;
  onMove: (target: PipelineStage) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const nextStage = PIPELINE_STAGES[stageIndex + 1];
  const previousStage = PIPELINE_STAGES[stageIndex - 1];
  const blockingGate = nextStage ? getBlockingGate(episode, nextStage.id) : null;
  const channel = CHANNEL_META[episode.channel];
  const gate = blockingGate ? episode.approvals[blockingGate] : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className="group cursor-pointer rounded-xl border border-border/60 bg-card/80 p-3 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-amber-400/50 hover:bg-card"
      data-testid={`pipeline-card-${episode.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className={`h-7 rounded-full px-2 text-xs ${getChannelClasses(episode.channel)}`}>
          <span className="mr-1.5 text-base leading-none">{channel.emoji}</span>
          {channel.name}
        </Badge>
        <GripVertical size={16} className="mt-1 text-muted-foreground/40 group-hover:text-amber-200/70" />
      </div>
      <p className="mt-3 line-clamp-3 text-sm font-semibold leading-snug text-foreground">{episode.title}</p>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="font-mono">{episode.id}</span>
        {episode.stage === "live" ? (
          <span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 size={13} /> Live</span>
        ) : blockingGate ? (
          <span className="flex items-center gap-1 text-amber-200"><LockKeyhole size={12} /> {APPROVAL_META[blockingGate].label} gate</span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground"><ArrowRight size={12} /> Ready</span>
        )}
      </div>
      {gate?.status === "changes_requested" && (
        <div className="mt-2 flex items-center gap-1.5 rounded-md bg-rose-400/10 px-2 py-1.5 text-[11px] text-rose-200">
          <X size={12} /> Changes requested on {APPROVAL_META[blockingGate!].label}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          disabled={!previousStage}
          onClick={(event) => {
            event.stopPropagation();
            if (previousStage) onMove(previousStage.id);
          }}
          aria-label={`Move ${episode.title} back`}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Open details</span>
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 ${blockingGate ? "text-amber-300/60" : "text-amber-200 hover:text-amber-100"}`}
          disabled={!nextStage}
          onClick={(event) => {
            event.stopPropagation();
            if (nextStage) onMove(nextStage.id);
          }}
          aria-label={`Advance ${episode.title}`}
        >
          {blockingGate ? <LockKeyhole size={15} /> : <ChevronRight size={16} />}
        </Button>
      </div>
    </div>
  );
}

function WeeklyTracker({ episodes }: { episodes: Episode[] }) {
  const currentWeek = getWeekKey(new Date());
  const publishedThisWeek = episodes.filter(episode => episode.publishedAt && getWeekKey(new Date(episode.publishedAt)) === currentWeek).length;
  const progress = Math.min(100, Math.round((publishedThisWeek / 3) * 100));

  return (
    <Card className="border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-card/80 to-card/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200/70">Weekly cadence</p>
          <h2 className="mt-1 text-lg font-semibold">3 episodes / week</h2>
        </div>
        <span className="font-mono text-2xl font-bold text-amber-200">{publishedThisWeek}<span className="text-base text-muted-foreground">/3</span></span>
      </div>
      <Progress value={progress} className="mt-4 bg-amber-950/50 [&>div]:bg-amber-300" />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{publishedThisWeek === 0 ? "Your next release is waiting." : `${publishedThisWeek} release${publishedThisWeek === 1 ? "" : "s"} logged this week.`}</span>
        <span>Resets Monday</span>
      </div>
    </Card>
  );
}

function IntelFeed({ onMakeEpisode }: { onMakeEpisode: (item: typeof INTEL_ITEMS[number]) => void }) {
  return (
    <Card className="border-border/60 bg-card/50 p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200/70">Intel feed</p>
          <h2 className="mt-1 text-lg font-semibold">Signals worth turning into stories</h2>
        </div>
        <Lightbulb size={20} className="text-amber-300" />
      </div>
      <div className="space-y-3">
        {INTEL_ITEMS.map(item => (
          <div key={item.id} className="rounded-lg border border-border/50 bg-background/60 p-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">{CHANNEL_META[item.channel].emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.source} · {item.timestamp}</p>
              </div>
              <Button size="sm" variant="outline" className="min-h-10 shrink-0 border-amber-400/30 text-amber-200 hover:bg-amber-400/10" onClick={() => onMakeEpisode(item)}>
                <Plus size={14} /> <span className="hidden sm:inline">Make episode</span><span className="sm:hidden">Make</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ApprovalRow({ episode, gate, onUpdate }: { episode: Episode; gate: ApprovalGate; onUpdate: (status: ApprovalStatus) => void }) {
  const approval = episode.approvals[gate];
  const approved = approval.status === "approved";
  const changesRequested = approval.status === "changes_requested";

  return (
    <div className="rounded-xl border border-border/50 bg-background/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${approved ? "bg-emerald-400/15 text-emerald-300" : changesRequested ? "bg-rose-400/15 text-rose-300" : "bg-muted text-muted-foreground"}`}>
            {approved ? <Check size={16} /> : changesRequested ? <X size={16} /> : <CircleDot size={16} />}
          </div>
          <div>
            <p className="font-semibold">{APPROVAL_META[gate].label} gate</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{APPROVAL_META[gate].description}</p>
            {approval.updatedAt && <p className="mt-1 text-[11px] text-muted-foreground">Updated {formatTimestamp(approval.updatedAt)}</p>}
          </div>
        </div>
        <Badge variant="outline" className={approved ? "border-emerald-400/30 text-emerald-300" : changesRequested ? "border-rose-400/30 text-rose-300" : "text-muted-foreground"}>
          {approved ? "Approved" : changesRequested ? "Changes" : "Pending"}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button className="min-h-11 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25" variant="outline" onClick={() => onUpdate("approved")}>
          <Check size={15} /> Approve
        </Button>
        <Button className="min-h-11 border-rose-400/20 text-rose-200 hover:bg-rose-400/10" variant="outline" onClick={() => onUpdate("changes_requested")}>
          <X size={15} /> Request changes
        </Button>
      </div>
    </div>
  );
}

function EpisodeDetailDialog({ episode, open, onOpenChange }: { episode?: Episode; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { updateEpisode, updateApproval } = useAppStore();
  if (!episode) return null;
  const renderProgress = episode.renderStatus === "done" || episode.stage === "publish" || episode.stage === "live" ? 100 : episode.renderProgress || 0;
  const selectedVariant = episode.thumbnailVariants.find(variant => variant.status === "selected")?.id;

  const selectVariant = (variantId: string) => {
    updateEpisode(episode.id, {
      thumbnailVariants: episode.thumbnailVariants.map(variant => ({ ...variant, status: variant.id === variantId ? "selected" : "placeholder" })),
    });
  };

  const togglePublish = (platform: PublishPlatform) => {
    updateEpisode(episode.id, {
      publishChecklist: { ...episode.publishChecklist, [platform]: !episode.publishChecklist[platform] },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-amber-400/20 bg-background/95 p-0">
        <DialogHeader className="border-b border-border/50 bg-card/60 p-5 pr-12">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{CHANNEL_META[episode.channel].emoji}</span>
            <div className="min-w-0">
              <DialogTitle className="text-xl leading-tight">{episode.title}</DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={getChannelClasses(episode.channel)}>{CHANNEL_META[episode.channel].name}</Badge>
                <span className="font-mono text-xs text-muted-foreground">{episode.id}</span>
                {episode.intelSource && <span className="text-xs text-muted-foreground">from {episode.intelSource}</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-5">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText size={17} className="text-amber-300" />
              <h3 className="font-semibold">Script status</h3>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 p-4">
              <div>
                <p className="font-medium">{episode.scriptStatus === "done" ? "Script is ready for review" : "Script is still in progress"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Approval controls are below; an approved gate unlocks the next stage.</p>
              </div>
              <Badge className={episode.scriptStatus === "done" ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}>
                {episode.scriptStatus === "done" ? "Ready" : "Drafting"}
              </Badge>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon size={17} className="text-amber-300" />
              <h3 className="font-semibold">Thumbnail variants</h3>
              <span className="text-xs text-muted-foreground">Choose a cover when the options are ready.</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {episode.thumbnailVariants.map(variant => (
                <button key={variant.id} type="button" onClick={() => selectVariant(variant.id)} className={`flex min-h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition-colors ${selectedVariant === variant.id ? "border-amber-300 bg-amber-300/10 text-amber-100" : "border-border/70 bg-card/30 text-muted-foreground hover:border-amber-400/40"}`}>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70"><ImageIcon size={16} /></div>
                  <span className="text-sm font-semibold">{variant.label}</span>
                  <span className="mt-1 text-[11px]">{selectedVariant === variant.id ? "Selected" : "Placeholder"}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><Video size={17} className="text-amber-300" /><h3 className="font-semibold">Render progress</h3></div>
              <span className="font-mono text-sm text-amber-200">{renderProgress}%</span>
            </div>
            <Progress value={renderProgress} className="h-3 bg-muted [&>div]:bg-amber-300" />
            <p className="mt-2 text-xs text-muted-foreground">{episode.renderStatus === "rendering" ? "Render worker is processing this episode." : episode.renderStatus === "done" ? "Export is ready for the publish gate." : "Render has not started yet."}</p>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2"><Send size={17} className="text-amber-300" /><h3 className="font-semibold">Publish checklist</h3></div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PUBLISH_PLATFORMS.map(platform => {
                const Icon = PLATFORM_ICONS[platform.id];
                const checked = episode.publishChecklist[platform.id];
                return (
                  <button key={platform.id} type="button" onClick={() => togglePublish(platform.id)} className={`flex min-h-12 items-center justify-between rounded-lg border p-3 text-left transition-colors ${checked ? "border-emerald-400/30 bg-emerald-400/10" : "border-border/50 bg-card/30 hover:border-amber-400/30"}`}>
                    <span className="flex items-center gap-3"><Icon size={16} className={checked ? "text-emerald-300" : "text-muted-foreground"} />{platform.label}</span>
                    {checked ? <CheckCircle2 size={17} className="text-emerald-300" /> : <span className="h-4 w-4 rounded-full border border-muted-foreground/50" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2"><LockKeyhole size={17} className="text-amber-300" /><h3 className="font-semibold">Approval gates</h3></div>
            <div className="space-y-3">
              {GATE_ORDER.map(gate => <ApprovalRow key={gate} episode={episode} gate={gate} onUpdate={status => updateApproval(episode.id, gate, status)} />)}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
            <span className="text-xs text-muted-foreground">Created {formatTimestamp(episode.createdAt)}{episode.publishedAt ? ` · Published ${formatTimestamp(episode.publishedAt)}` : ""}</span>
            {episode.url && <Button variant="outline" asChild><a href={episode.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Watch live</a></Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PipelinePage() {
  const { activeProjectId, projects, episodes, settings, updateEpisode, moveEpisode, addEpisode } = useAppStore();
  const { toast } = useToast();
  const activeProject = projects.find(project => project.id === activeProjectId);
  const projectEpisodes = useMemo(() => episodes, [episodes]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const episodesRef = useRef(projectEpisodes);
  episodesRef.current = projectEpisodes;

  const selectedEpisode = selectedEpisodeId ? episodes.find(episode => episode.id === selectedEpisodeId) : undefined;
  const isConfigured = Boolean(settings.githubPat && activeProject?.repoUrl);

  const fetchPipelineStatus = useCallback(async (opts?: { silent?: boolean }) => {
    if (!settings.githubPat || !activeProject?.repoUrl) {
      if (!opts?.silent) toast({ title: "Configuration needed", description: "Set your GitHub PAT and ensure this project has a repo URL.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const match = activeProject.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) throw new Error("Invalid repo URL");
      const repoPath = `https://api.github.com/repos/${match[1]}/${match[2]}`;
      const headers = { Authorization: `token ${settings.githubPat}`, Accept: "application/vnd.github.v3+json" };
      let renders: any[] = [];
      try {
        const response = await fetch(`${repoPath}/contents/renders`, { headers });
        if (response.ok) renders = await response.json();
      } catch (error) { console.error("Could not fetch renders directory", error); }

      let uploadedData: Record<string, string> = {};
      try {
        const response = await fetch(`${repoPath}/contents/uploaded_videos.json`, { headers });
        if (response.ok) {
          const payload = await response.json();
          if (payload.content) uploadedData = JSON.parse(atob(payload.content.replace(/\n/g, "")));
        }
      } catch (error) { console.error("Could not fetch uploaded_videos.json", error); }

      let renderLogData: Record<string, any> = {};
      try {
        const response = await fetch(`${repoPath}/contents/render_log.json`, { headers });
        if (response.ok) {
          const payload = await response.json();
          if (payload.content) renderLogData = JSON.parse(atob(payload.content.replace(/\n/g, "")));
        }
      } catch (error) { console.error("Could not fetch render_log.json", error); }

      episodesRef.current.forEach(episode => {
        const updates: Partial<Episode> = {};
        if (uploadedData[episode.id]) {
          updates.uploadStatus = "done";
          updates.url = uploadedData[episode.id];
          updates.renderStatus = "done";
          updates.renderProgress = 100;
        } else {
          const renderFile = renders.find((file: any) => file.name.includes(episode.id) && file.name.endsWith(".mp4"));
          if (renderFile) {
            updates.renderStatus = "done";
            updates.renderProgress = 100;
            updates.fileSizeMb = (renderFile.size / (1024 * 1024)).toFixed(1);
          } else if (renderLogData[episode.id]?.status === "rendering") {
            updates.renderStatus = "rendering";
            updates.renderProgress = renderLogData[episode.id].progress || 0;
          }
        }
        if (Object.keys(updates).length > 0) updateEpisode(episode.id, updates);
      });
      setLastChecked(new Date());
    } catch (error) {
      console.error(error);
      if (!opts?.silent) toast({ title: "Pipeline sync failed", description: "The board is still available from local storage.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeProject?.repoUrl, settings.githubPat, toast, updateEpisode]);

  useEffect(() => {
    if (!isConfigured) return;
    void fetchPipelineStatus({ silent: true });
    const interval = window.setInterval(() => void fetchPipelineStatus({ silent: true }), 30000);
    return () => window.clearInterval(interval);
  }, [isConfigured, fetchPipelineStatus]);

  const moveToStage = (episode: Episode, targetStage: PipelineStage) => {
    const blockingGate = getBlockingGate(episode, targetStage);
    if (blockingGate) {
      toast({ title: `${APPROVAL_META[blockingGate].label} approval required`, description: `Approve the ${APPROVAL_META[blockingGate].label.toLowerCase()} gate in episode details before advancing.`, variant: "destructive" });
      setSelectedEpisodeId(episode.id);
      return;
    }
    moveEpisode(episode.id, targetStage);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetStage: PipelineStage) => {
    event.preventDefault();
    setDragOverStage(null);
    const episodeId = event.dataTransfer.getData("text/episode-id") || draggingId;
    const episode = episodes.find(item => item.id === episodeId);
    if (episode) moveToStage(episode, targetStage);
    setDraggingId(null);
  };

  const makeEpisodeFromIntel = (item: typeof INTEL_ITEMS[number]) => {
    const id = `${item.channel}_INTEL_${Date.now()}`;
    addEpisode(createEpisodeDefaults({
      id,
      title: item.title,
      channel: item.channel,
      stage: "ideas",
      intelSource: item.source,
      createdAt: new Date().toISOString(),
    }));
    toast({ title: "Added to Ideas", description: `${item.title} is ready for the next story pass.` });
  };

  const renderedCount = projectEpisodes.filter(episode => episode.renderStatus === "done").length;
  const uploadedCount = projectEpisodes.filter(episode => episode.uploadStatus === "done").length;

  return (
    <div className="mx-auto flex min-h-full max-w-[1600px] flex-col gap-5 p-4 pb-8 md:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300/80"><Sparkles size={14} /> Empire release control</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Episode Pipeline</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Move every story from signal to screen across Little Olympus, Iron Legends, and Empire Decoded.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="min-h-11" asChild><Link href="/episodes"><Plus size={15} /> New episode</Link></Button>
          <div className="flex min-h-11 items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-3 text-xs">
            <span className="flex items-center gap-1.5 text-blue-300"><Video size={13} /> {renderedCount} rendered</span>
            <span className="h-4 w-px bg-border/70" />
            <span className="flex items-center gap-1.5 text-emerald-300"><ArrowDownToLine size={13} /> {uploadedCount} uploaded</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => void fetchPipelineStatus()} disabled={loading || !isConfigured} aria-label="Refresh GitHub pipeline status">
              <RefreshCw size={15} className={loading ? "animate-spin text-amber-300" : ""} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden border-amber-400/15 bg-card/30 p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-xs text-muted-foreground">{projectEpisodes.length} tracked episodes · drag or use arrows to move</p>
            </div>
            {lastChecked && <span className="hidden text-xs text-muted-foreground sm:inline">Repo checked {Math.round((Date.now() - lastChecked.getTime()) / 1000)}s ago</span>}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {PIPELINE_STAGES.map((stage, stageIndex) => {
              const stageEpisodes = projectEpisodes.filter(episode => episode.stage === stage.id);
              return (
                <div
                  key={stage.id}
                  onDragOver={event => { event.preventDefault(); setDragOverStage(stage.id); }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={event => handleDrop(event, stage.id)}
                  className={`min-h-[220px] min-w-[270px] rounded-xl p-2 transition-colors ${dragOverStage === stage.id ? "bg-amber-300/10 ring-1 ring-amber-300/50" : "bg-background/20"}`}
                >
                  <StageHeader stage={stage} count={stageEpisodes.length} />
                  <div className="space-y-3">
                    {stageEpisodes.map(episode => (
                      <EpisodeCard
                        key={episode.id}
                        episode={episode}
                        stageIndex={stageIndex}
                        onOpen={() => setSelectedEpisodeId(episode.id)}
                        onMove={target => moveToStage(episode, target)}
                        onDragStart={event => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/episode-id", episode.id);
                          setDraggingId(episode.id);
                        }}
                        onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                      />
                    ))}
                    {stageEpisodes.length === 0 && (
                      <div className="flex min-h-[130px] flex-col items-center justify-center rounded-xl border border-dashed border-border/50 px-4 text-center text-xs text-muted-foreground">
                        <CircleDot size={18} className="mb-2 opacity-40" />
                        Drop an episode here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <WeeklyTracker episodes={projectEpisodes} />
          <IntelFeed onMakeEpisode={makeEpisodeFromIntel} />
        </div>
      </div>

      {!isConfigured && (
        <Card className="flex flex-col gap-3 border-dashed border-amber-400/20 bg-amber-400/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Github size={20} className="mt-0.5 text-amber-300" />
            <div>
              <p className="font-semibold">Local board is active</p>
              <p className="text-xs text-muted-foreground">Connect a GitHub PAT and repository URL to sync render and upload status automatically.</p>
            </div>
          </div>
          <Button variant="outline" className="min-h-11 shrink-0 border-amber-400/30 text-amber-200" asChild><Link href="/settings">Configure GitHub</Link></Button>
        </Card>
      )}

      <EpisodeDetailDialog episode={selectedEpisode} open={Boolean(selectedEpisode)} onOpenChange={open => { if (!open) setSelectedEpisodeId(null); }} />
    </div>
  );
}