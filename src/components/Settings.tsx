import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Bot, Brain, Volume2, Gauge } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const SettingsDialog = () => {
  const [volume, setVolume] = useState([
    parseInt(localStorage.getItem('speechVolume') || '80')
  ]);
  const [speed, setSpeed] = useState([
    parseFloat(localStorage.getItem('speechSpeed') || '1.0')
  ]);

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

  return (
    <Dialog>
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

        </div>
      </DialogContent>
    </Dialog>
  );
};