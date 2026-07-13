import { useAppStore } from "@/store/AppContext";
import { Film, UploadCloud, CheckCircle2, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

export default function StatusBar({ mobile = false }: { mobile?: boolean }) {
  const { episodes, missions, settings } = useAppStore();
  
  const renderingEpisodes = episodes.filter(e => e.renderStatus === "rendering");
  const uploadQueue = episodes.filter(e => e.uploadStatus === "pending" && e.renderStatus === "done");
  const lastUpload = episodes.filter(e => e.uploadStatus === "done").pop();
  const topPriority = missions.find(m => m.priority === 1 && m.status !== "complete");

  const Content = (
    <div className="flex flex-col md:flex-row md:items-center justify-between text-xs font-medium px-4 py-2 bg-card border-t border-border/50 text-muted-foreground gap-4 md:gap-6 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 text-indigo-400">
        <Film size={14} className="animate-pulse" />
        <span>Rendering: {renderingEpisodes.length > 0 ? renderingEpisodes.map(e => e.id).join(", ") : "None"}</span>
      </div>
      
      <div className="flex items-center gap-2 text-emerald-400">
        <UploadCloud size={14} />
        <span>Queue: {uploadQueue.length}</span>
      </div>

      <div className="flex items-center gap-2">
        <CheckCircle2 size={14} />
        <span className="truncate max-w-[200px]">Last: {lastUpload ? `${lastUpload.id}` : "None"}</span>
      </div>

      <div className="flex items-center gap-2 text-amber-400">
        <span>💰</span>
        <span>Credits: {settings.higgsfieldCredits}</span>
      </div>

      <div className="hidden xl:flex items-center gap-2 text-foreground flex-1 justify-end truncate">
        <span className="opacity-50">Priority:</span>
        <span className="truncate">{topPriority?.title || "None"}</span>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-4 py-1.5 shadow-lg flex items-center gap-2 cursor-pointer text-xs font-medium z-40 text-muted-foreground" data-testid="mobile-status-drawer">
            <Activity size={14} className="text-primary" />
            <span>Status</span>
            <ChevronUp size={14} />
          </div>
        </DrawerTrigger>
        <DrawerContent className="bg-card border-t border-border">
          <div className="p-4 pb-8 space-y-4">
            <h3 className="font-semibold text-lg border-b border-border/50 pb-2">Status Dashboard</h3>
            <div className="space-y-4">
              {Content}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return Content;
}
import { Activity } from "lucide-react";