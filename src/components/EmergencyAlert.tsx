import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, X } from "lucide-react";
import { AIAnalysis } from "@/services/aiService";

interface EmergencyAlertProps {
  emergency: AIAnalysis['emergency'];
  onDismiss: () => void;
}

export const EmergencyAlert = ({ emergency, onDismiss }: EmergencyAlertProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!emergency?.detected || !isVisible) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto-trigger emergency action
          handleEmergencyAction();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [emergency, isVisible]);

  const handleEmergencyAction = () => {
    // In a real app, this would contact emergency services
    window.open('tel:911', '_self');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!emergency?.detected || !isVisible) return null;

  return (
    <Card className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-4 bg-destructive/90 border-destructive text-destructive-foreground animate-pulse">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-400 animate-bounce" />
            <div>
              <h3 className="font-bold text-lg">Emergency Detected</h3>
              <p className="text-sm opacity-90 mb-3">
                {emergency.type === 'health' && "Health emergency detected in speech"}
                {emergency.type === 'danger' && "Danger situation detected"}
                {emergency.type === 'distress' && "Distress signal detected"}
              </p>
              
              <div className="flex items-center gap-2 text-xs">
                <span>Auto-calling 911 in {countdown}s</span>
                <div className="w-16 h-1 bg-destructive-foreground/20 rounded">
                  <div 
                    className="h-full bg-destructive-foreground rounded transition-all duration-1000"
                    style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-destructive-foreground hover:bg-destructive-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleEmergencyAction}
            className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90"
            size="sm"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call 911 Now
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="text-destructive-foreground hover:bg-destructive-foreground/10"
            size="sm"
          >
            False Alarm
          </Button>
        </div>
      </div>
    </Card>
  );
};