import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Brain, Clock } from "lucide-react";
import { memoryService, MemoryItem } from "@/services/memoryService";
import { toast } from "@/hooks/use-toast";

interface MemoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryViewer = ({ isOpen, onClose }: MemoryViewerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [memories, setMemories] = useState<MemoryItem[]>(memoryService.getAllMemories());

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setMemories(memoryService.searchMemories(query));
    } else {
      setMemories(memoryService.getAllMemories());
    }
  };

  const handleDeleteMemory = (id: string) => {
    memoryService.deleteMemory(id);
    setMemories(memoryService.getAllMemories());
    toast({
      title: "Memory Deleted",
      description: "The memory has been removed."
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getImportanceColor = (importance: MemoryItem['importance']) => {
    switch (importance) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Memory Bank</h2>
              <Badge variant="secondary">{memories.length} memories</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {memories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No memories found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? "Try a different search term" : "Start capturing important moments"}
                </p>
              </div>
            ) : (
              memories.map((memory) => (
                <Card key={memory.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${getImportanceColor(memory.importance)}`} />
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(memory.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground leading-relaxed mb-2">
                        {memory.text}
                      </p>
                      
                      {memory.context && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Context: {memory.context}
                        </p>
                      )}
                      
                      {memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {memory.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};