import { ReactNode } from "react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/AppContext";
import { generatePrompt, executeHandoff } from "@/utils/handoff";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Bot } from "lucide-react";

export default function HandoffDrawer({ children, triggerBtn = false }: { children?: ReactNode, triggerBtn?: boolean }) {
  const { activeAgentId, agents } = useAppStore();
  const { toast } = useToast();
  const activeAgent = agents.find(a => a.id === activeAgentId);

  const handleCopy = () => {
    executeHandoff(activeAgentId);
    toast({
      title: "Handoff Prompt Copied",
      description: "Paste it directly into the chat.",
    });
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children || (triggerBtn ? (
          <Button size="lg" className="w-full text-base font-bold h-14 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-900/20" data-testid="generate-handoff-btn">
            <Bot className="mr-2 h-5 w-5" /> Generate Handoff Prompt
          </Button>
        ) : null)}
      </DrawerTrigger>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="text-2xl">Handoff to {activeAgent?.name}</DrawerTitle>
          <DrawerDescription>
            Review the generated context before handing off.
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 p-4 overflow-auto">
          <pre className="bg-muted p-4 rounded-lg text-xs font-mono text-muted-foreground overflow-auto h-full whitespace-pre-wrap border border-border/50">
            {generatePrompt(activeAgentId)}
          </pre>
        </div>

        <DrawerFooter className="flex-row gap-3">
          <Button className="flex-1 h-14 text-base" onClick={handleCopy} data-testid="drawer-copy-btn">
            <Copy className="mr-2 h-5 w-5" /> Copy & Open {activeAgent?.name}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
