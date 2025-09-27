import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, Key, Sparkles } from "lucide-react";
import { aiService } from "@/services/aiService";
import { toast } from "@/hooks/use-toast";

interface AISetupProps {
  onComplete: () => void;
}

export const AISetup = ({ onComplete }: AISetupProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);

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
      
      onComplete();
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

  const handleSkip = () => {
    toast({
      title: "Basic Mode Enabled",
      description: "Some AI features will be limited without an API key."
    });
    onComplete();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md p-6 mx-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Bot className="h-16 w-16 text-primary" />
              <Sparkles className="h-6 w-6 text-accent absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Activate Jarvis AI</h1>
          <p className="text-muted-foreground">
            Enable advanced AI features for memory, summarization, translation, and contextual intelligence.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              OpenAI API Key (Optional)
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

          <div className="space-y-2">
            <Button 
              onClick={handleSetupAI}
              disabled={isConfiguring}
              className="w-full"
            >
              {isConfiguring ? "Configuring..." : "Activate AI Features"}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="w-full"
            >
              Skip (Basic Mode)
            </Button>
          </div>
        </div>

        <div className="mt-6 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>With AI:</strong> Memory, smart summarization, emotion detection, emergency alerts, natural commands
            <br />
            <strong>Without AI:</strong> Basic pattern detection and keyword matching
          </p>
        </div>
      </Card>
    </div>
  );
};