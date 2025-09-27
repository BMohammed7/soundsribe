import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Key, Bot, Languages, Brain, Volume2, Gauge } from "lucide-react";
import { aiService } from "@/services/aiService";
import { toast } from "@/hooks/use-toast";

export const SettingsDialog = () => {
  const [apiKey, setApiKey] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState(
    localStorage.getItem('preferredLanguage') || 'Spanish'
  );
  const [volume, setVolume] = useState([
    parseInt(localStorage.getItem('speechVolume') || '80')
  ]);
  const [speed, setSpeed] = useState([
    parseFloat(localStorage.getItem('speechSpeed') || '1.0')
  ]);

  const languages = [
    'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Swedish'
  ];

  const handleLanguageChange = (language: string) => {
    setPreferredLanguage(language);
    localStorage.setItem('preferredLanguage', language);
    toast({
      title: "Language Updated",
      description: `Translation language set to ${language}`
    });
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    localStorage.setItem('speechVolume', newVolume[0].toString());
    toast({
      title: "Volume Updated",
      description: `Speech volume set to ${newVolume[0]}%`
    });
  };

  const handleSpeedChange = (newSpeed: number[]) => {
    setSpeed(newSpeed);
    localStorage.setItem('speechSpeed', newSpeed[0].toString());
    toast({
      title: "Speed Updated", 
      description: `Speech speed set to ${newSpeed[0]}x`
    });
  };

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
        description: "Soundscribe is now ready with advanced AI capabilities."
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
        
        <div className="space-y-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Memory
              </label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Auto-save important information and key insights
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Translation
              </label>
              <Select value={preferredLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Speech Controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Speech Controls</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Volume ({volume[0]}%)
                </label>
                <div className="px-3">
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Speed ({speed[0]}x)
                </label>
                <div className="px-3">
                  <Slider
                    value={speed}
                    onValueChange={handleSpeedChange}
                    max={2.0}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0.5x</span>
                    <span>2.0x</span>
                  </div>
                </div>
              </div>
            </div>
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
              <strong>With AI:</strong> Memory, smart summarization, emotion detection, emergency alerts, translation
              <br />
              <strong>Without AI:</strong> Basic pattern detection and keyword matching
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};