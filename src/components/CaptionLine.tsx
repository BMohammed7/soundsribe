import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Languages } from "lucide-react";

interface Caption {
  id: string;
  text: string;
  timestamp: Date;
  saved?: boolean;
  translatedText?: string;
  isTranslating?: boolean;
}

interface CaptionLineProps {
  caption: Caption;
  onDelete?: () => void;
  isInterim?: boolean;
}

export const CaptionLine = ({ caption, onDelete, isInterim = false }: CaptionLineProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card 
      className={`p-4 transition-all duration-300 group ${
        isInterim 
          ? 'bg-muted/50 border-dashed opacity-70' 
          : 'bg-caption-bg hover:bg-surface-elevated hover:shadow-medium'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-foreground leading-relaxed ${
                    isInterim ? 'italic' : ''
                  }`}>
                    {caption.text}
                  </p>
                  
                  {caption.translatedText && (
                    <div className="mt-3 p-3 bg-accent/10 rounded-lg border-l-2 border-accent">
                      <div className="flex items-center gap-2 mb-1">
                        <Languages className="h-3 w-3 text-accent" />
                        <p className="text-xs font-medium text-accent">
                          {localStorage.getItem('preferredLanguage') || 'Spanish'} Translation:
                        </p>
                      </div>
                      <p className="text-foreground text-sm">{caption.translatedText}</p>
                    </div>
                  )}
                  
                  {caption.isTranslating && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-muted">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-muted-foreground">
                          Translating to {localStorage.getItem('preferredLanguage') || 'Spanish'}...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatTime(caption.timestamp)}
                    {isInterim && " (interim)"}
                  </p>
                </div>
        
        {!isInterim && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};