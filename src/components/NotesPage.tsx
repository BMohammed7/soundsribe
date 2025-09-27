import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Play, Download, FileText, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SavedNote {
  id: string;
  text: string;
  timestamp: Date;
  saved: boolean;
}

interface NotesPageProps {
  notes: SavedNote[];
}

const NotesPage = ({ notes }: NotesPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const filteredNotes = notes.filter(note =>
    note.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const handlePlayTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
      
      toast({
        title: "Playing Audio",
        description: "Text-to-speech is now playing."
      });
    } else {
      toast({
        title: "TTS Not Available",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive"
      });
    }
  };

  const handleExportNotes = () => {
    const exportData = notes.map(note => ({
      text: note.text,
      timestamp: note.timestamp.toISOString(),
      date: formatDate(note.timestamp)
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions-notes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Notes Exported",
      description: "Your notes have been exported successfully."
    });
  };

  const toggleExpanded = (noteId: string) => {
    setExpandedNote(expandedNote === noteId ? null : noteId);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Notes</h1>
          <p className="text-muted-foreground">{notes.length} saved captions</p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportNotes}
          disabled={notes.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                {notes.length === 0 ? "No saved notes yet" : "No notes match your search"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {notes.length === 0 
                  ? "Start capturing captions to see them here" 
                  : "Try a different search term"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <Card 
                key={note.id} 
                className="p-4 cursor-pointer hover:shadow-medium transition-all duration-200 bg-caption-bg border-caption-border"
                onClick={() => toggleExpanded(note.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`text-foreground leading-relaxed ${
                      expandedNote === note.id || note.text.length <= 100 
                        ? '' 
                        : 'line-clamp-2'
                    }`}>
                      {note.text}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(note.timestamp)}
                      </div>
                      <div className="text-success">Saved</div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayTTS(note.text);
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
                
                {note.text.length > 100 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {expandedNote === note.id ? 'Click to collapse' : 'Click to expand'}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;