import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface Caption {
  id: string;
  text: string;
  timestamp: Date;
  saved?: boolean;
}

interface CaptionLineProps {
  caption: Caption;
  onSave?: () => void;
  isInterim?: boolean;
}

export const CaptionLine = ({ caption, onSave, isInterim = false }: CaptionLineProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card 
      className={`p-4 transition-all duration-300 cursor-pointer hover:shadow-medium ${
        isInterim 
          ? 'bg-muted/50 border-dashed opacity-70' 
          : caption.saved 
            ? 'bg-success/10 border-success/30' 
            : 'bg-caption-bg hover:bg-surface-elevated'
      }`}
      onClick={onSave}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className={`text-foreground leading-relaxed ${
            isInterim ? 'italic' : ''
          }`}>
            {caption.text}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatTime(caption.timestamp)}
            {isInterim && " (interim)"}
            {caption.saved && " • Saved"}
          </p>
        </div>
        
        {!isInterim && !caption.saved && onSave && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <Save className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};