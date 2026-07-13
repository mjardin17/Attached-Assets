import { useAppStore } from "@/store/AppContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github, Save, Download, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function SettingsPage() {
  const { settings, updateSettings, exportData, importData, clearData } = useAppStore();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    toast({ title: "Settings Saved", description: "Your configuration has been updated." });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          importData(content);
          toast({ title: "Data Imported", description: "Successfully restored from backup." });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm">Configure your OS connections and data.</p>
      </div>

      <Card className="p-6 space-y-6 bg-card/50 border-border/50">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Github size={18} /> GitHub Integration
          </h2>
          <div className="space-y-2">
            <Label htmlFor="github_pat">Personal Access Token (PAT)</Label>
            <Input 
              id="github_pat" 
              type="password"
              placeholder="ghp_xxxxxxxxxxxx" 
              value={localSettings.githubPat}
              onChange={e => setLocalSettings(s => ({ ...s, githubPat: e.target.value }))}
              data-testid="input-github-pat"
            />
            <p className="text-xs text-muted-foreground">Required to browse repo files. Stored only in your local browser.</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/50">
          <h2 className="text-lg font-semibold">Environment</h2>
          <div className="space-y-2">
            <Label htmlFor="ngrok">ngrok Public URL</Label>
            <Input 
              id="ngrok" 
              placeholder="https://xxxx-xx-xxx.ngrok-free.app" 
              value={localSettings.ngrokUrl}
              onChange={e => setLocalSettings(s => ({ ...s, ngrokUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credits">Higgsfield Credits</Label>
            <Input 
              id="credits" 
              type="number"
              value={localSettings.higgsfieldCredits}
              onChange={e => setLocalSettings(s => ({ ...s, higgsfieldCredits: e.target.value }))}
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full md:w-auto" data-testid="btn-save-settings">
          <Save size={16} className="mr-2" /> Save Settings
        </Button>
      </Card>

      <Card className="p-6 space-y-6 border-destructive/20 bg-destructive/5">
        <div>
          <h2 className="text-lg font-semibold text-destructive mb-1">Data Management</h2>
          <p className="text-sm text-muted-foreground">Export your data to move to another device, or wipe it completely.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" onClick={exportData} data-testid="btn-export-data">
            <Download size={16} className="mr-2" /> Export Backup
          </Button>
          <Button variant="outline" onClick={handleImport} data-testid="btn-import-data">
            <Upload size={16} className="mr-2" /> Import Backup
          </Button>
          <Button variant="destructive" className="sm:ml-auto" onClick={clearData} data-testid="btn-clear-data">
            <Trash2 size={16} className="mr-2" /> Wipe Data
          </Button>
        </div>
      </Card>
    </div>
  );
}
