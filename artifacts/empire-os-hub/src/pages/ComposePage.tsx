import { useAppStore, Episode } from "@/store/AppContext";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCheck, Wand2, Youtube, Facebook, Instagram, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const HASHTAG_PRESETS: Record<string, string[]> = {
  GG: ["#GodsAndGlory", "#Mythology", "#AncientHistory", "#EpicBattles", "#Lore", "#Legends"],
  IL: ["#InnerLight", "#Mindfulness", "#Meditation", "#Peace", "#Zen", "#Wellness"],
  LO: ["#LoreOrigin", "#Storytelling", "#Fantasy", "#Worldbuilding", "#Creativity"],
  ED: ["#EduDeep", "#Learning", "#Science", "#Education", "#Discovery", "#Facts"],
};

export default function ComposePage() {
  const { episodes, updateEpisode } = useAppStore();
  const { toast } = useToast();
  
  const uploadedEpisodes = episodes.filter(e => e.uploadStatus === "done" || e.renderStatus === "done");
  
  const [selectedEpId, setSelectedEpId] = useState<string>("");
  const [baseCaption, setBaseCaption] = useState("");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const selectedEp = episodes.find(e => e.id === selectedEpId);
  const channelTags = selectedEp ? HASHTAG_PRESETS[selectedEp.channel] || [] : [];

  // Load draft when episode changes
  useEffect(() => {
    if (selectedEp) {
      setBaseCaption(selectedEp.socialDraft || "");
    } else {
      setBaseCaption("");
    }
  }, [selectedEpId]);

  // Save draft
  const handleCaptionChange = (val: string) => {
    setBaseCaption(val);
    if (selectedEpId) {
      updateEpisode(selectedEpId, { socialDraft: val });
    }
  };

  const generateFormats = () => {
    if (!selectedEp) return null;

    const title = selectedEp.title;
    const link = selectedEp.url || "https://youtube.com/...";
    const tags = channelTags.join(" ");
    
    // YouTube
    const yt = `${title}\n\n${baseCaption}\n\nTIMESTAMPS:\n0:00 - Intro\n1:00 - Chapter 1\n\n${tags}`;
    
    // Facebook
    const fb = `${title} is live! 🎬\n\n${baseCaption.slice(0, 150)}...\n\nWatch full episode here: ${link}\n\n${tags}`;
    
    // Instagram
    const ig = `${title} 🔥\n\n${baseCaption.slice(0, 100)}\n\n🔗 Link in bio to watch the full episode!\n\n${channelTags.map(t => t).join(" ")} #ExplorePage #Viral #Trending #NewVideo #Creator`;
    
    // TikTok (short)
    const tt = `${title} 🤯 ${channelTags.slice(0,3).join(" ")} #fyp #viral`;
    
    // X (Twitter)
    const tw = `${title}\n\n${baseCaption.slice(0, 100)}...\n\nWatch now: ${link} ${channelTags.slice(0,2).join(" ")}`;

    return { yt, fb, ig, tt, tw };
  };

  const formats = generateFormats();

  const handleCopy = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleCopyAll = () => {
    if (!formats) return;
    const all = `[YOUTUBE]\n${formats.yt}\n\n[FACEBOOK]\n${formats.fb}\n\n[INSTAGRAM]\n${formats.ig}\n\n[TIKTOK]\n${formats.tt}\n\n[X/TWITTER]\n${formats.tw}`;
    navigator.clipboard.writeText(all);
    toast({ title: "All formats copied!" });
  };

  const autoGenerate = () => {
    if (!selectedEp) return;
    setBaseCaption(`Dive into the epic story of ${selectedEp.title}. In this episode, we uncover the hidden secrets and legendary tales that changed history forever. Don't miss this one!`);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Social Post Composer</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Input Panel */}
        <Card className="lg:col-span-5 flex flex-col p-4 bg-card/40 border-border/50 border">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="space-y-2 shrink-0">
              <Label>Select Episode</Label>
              <Select value={selectedEpId} onValueChange={setSelectedEpId}>
                <SelectTrigger className="bg-background border-border/50" data-testid="select-episode">
                  <SelectValue placeholder="Select an uploaded episode..." />
                </SelectTrigger>
                <SelectContent>
                  {uploadedEpisodes.map(ep => (
                    <SelectItem key={ep.id} value={ep.id} data-testid={`option-episode-${ep.id}`}>
                      <span className="font-mono text-muted-foreground mr-2 text-xs">{ep.id}</span>
                      {ep.title}
                    </SelectItem>
                  ))}
                  {uploadedEpisodes.length === 0 && (
                    <SelectItem value="none" disabled>No ready episodes found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedEpId && (
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-end shrink-0">
                  <Label>Base Caption</Label>
                  <Button size="sm" variant="ghost" onClick={autoGenerate} className="h-6 px-2 text-xs text-indigo-400 hover:text-indigo-300" data-testid="button-autodraft">
                    <Wand2 size={12} className="mr-1" /> Auto-draft
                  </Button>
                </div>
                <Textarea 
                  className="flex-1 resize-none bg-background border-border/50 p-3 font-sans"
                  placeholder="Write a master caption here. It will be adapted for each platform automatically..."
                  value={baseCaption}
                  onChange={(e) => handleCaptionChange(e.target.value)}
                  data-testid="input-caption"
                />
                <div className="text-xs text-muted-foreground flex justify-between shrink-0">
                  <span>Draft saved automatically</span>
                  <span>{channelTags.length} tags loaded for {selectedEp?.channel}</span>
                </div>
              </div>
            )}

            {!selectedEpId && (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/30 rounded-lg">
                <p className="text-muted-foreground text-sm text-center px-8">
                  Select an episode above to start composing social posts.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Output Panel */}
        <Card className="lg:col-span-7 flex flex-col bg-card/40 border-border/50 border overflow-hidden">
          {formats ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/50 shrink-0">
                <h3 className="font-semibold text-sm">Platform Outputs</h3>
                <Button size="sm" variant="secondary" onClick={handleCopyAll} className="h-8" data-testid="button-copy-all">
                  <Copy size={14} className="mr-2" /> Copy All
                </Button>
              </div>
              
              <Tabs defaultValue="yt" className="flex-1 flex flex-col min-h-0">
                <div className="px-4 pt-4 shrink-0">
                  <TabsList className="w-full bg-background border border-border/50">
                    <TabsTrigger value="yt" className="flex-1"><Youtube size={14} className="mr-2 md:hidden" /><span className="hidden md:inline">YouTube</span></TabsTrigger>
                    <TabsTrigger value="fb" className="flex-1"><Facebook size={14} className="mr-2 md:hidden" /><span className="hidden md:inline">Facebook</span></TabsTrigger>
                    <TabsTrigger value="ig" className="flex-1"><Instagram size={14} className="mr-2 md:hidden" /><span className="hidden md:inline">Instagram</span></TabsTrigger>
                    <TabsTrigger value="tt" className="flex-1"><span>TikTok</span></TabsTrigger>
                    <TabsTrigger value="tw" className="flex-1"><Twitter size={14} className="mr-2 md:hidden" /><span className="hidden md:inline">X (Twitter)</span></TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden p-4">
                  {[
                    { id: 'yt', text: formats.yt },
                    { id: 'fb', text: formats.fb },
                    { id: 'ig', text: formats.ig },
                    { id: 'tt', text: formats.tt },
                    { id: 'tw', text: formats.tw },
                  ].map(platform => (
                    <TabsContent key={platform.id} value={platform.id} className="h-full mt-0 focus-visible:outline-none">
                      <div className="h-full relative group">
                        <ScrollArea className="h-full w-full rounded-md border border-border/50 bg-background/50 p-4">
                          <pre className="whitespace-pre-wrap font-sans text-sm">{platform.text}</pre>
                        </ScrollArea>
                        <Button 
                          size="icon" 
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleCopy(platform.text, platform.id)}
                          data-testid={`button-copy-${platform.id}`}
                        >
                          {copiedTab === platform.id ? <CheckCheck size={16} /> : <Copy size={16} />}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
               <div className="w-16 h-16 rounded-full bg-border/20 flex items-center justify-center mb-4">
                 <Copy className="opacity-20" size={32} />
               </div>
               <p>Output formats will appear here.</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
