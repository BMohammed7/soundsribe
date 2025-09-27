import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Key, Bot } from "lucide-react";
import { aiService } from "@/services/aiService";
import { toast } from "@/hooks/use-toast";

export const SettingsDialog = () => {
  const [apiKey, setApiKey] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSetupAI = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key to enable AI features.",
        variant: "destructive"
      });
      return;
    }

    setIsConfiguring(true);
    
    try {
      aiService.setApiKey(apiKey.trim());
      
      // Test the API key with a simple request
      await aiService.analyzeText("Hello, this is a test.");
      
      toast({
        title: "AI Activated! 🤖",
        description: "Jarvis is now ready with advanced AI capabilities."
      });
      
      setIsOpen(false);
      setApiKey("");
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: "Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              OpenAI API Key {aiService.hasApiKey() ? "(Configured)" : "(Optional)"}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Get your API key from OpenAI dashboard
            </p>
          </div>

          <Button 
            onClick={handleSetupAI}
            disabled={isConfiguring}
            className="w-full"
          >
            {isConfiguring ? "Configuring..." : aiService.hasApiKey() ? "Update API Key" : "Add API Key"}
          </Button>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>With AI:</strong> Memory, smart summarization, emotion detection, emergency alerts
              <br />
              <strong>Without AI:</strong> Basic pattern detection and keyword matching
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};