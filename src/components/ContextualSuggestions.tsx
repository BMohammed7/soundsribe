import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Calendar, Search, Cloud, Plane } from "lucide-react";
import { ContextualSuggestion } from "@/services/aiService";

interface ContextualSuggestionsProps {
  suggestions: ContextualSuggestion[];
  onSuggestionClick: (suggestion: ContextualSuggestion) => void;
}

export const ContextualSuggestions = ({ suggestions, onSuggestionClick }: ContextualSuggestionsProps) => {
  if (suggestions.length === 0) return null;

  const getIcon = (type: ContextualSuggestion['type']) => {
    switch (type) {
      case 'maps': return MapPin;
      case 'events': return Calendar;
      case 'weather': return Cloud;
      case 'flights': return Plane;
      case 'search': return Search;
      default: return ExternalLink;
    }
  };

  return (
    <Card className="p-4 mt-4 bg-surface-elevated border-accent/20">
      <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <Search className="h-4 w-4" />
        Contextual Suggestions
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => {
          const Icon = getIcon(suggestion.type);
          
          return (
            <Button
              key={index}
              variant="ghost"
              onClick={() => onSuggestionClick(suggestion)}
              className="h-auto p-3 justify-start text-left hover:bg-accent/10 border border-transparent hover:border-accent/30"
            >
              <div className="flex items-start gap-3 w-full">
                <Icon className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {suggestion.description}
                  </p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};