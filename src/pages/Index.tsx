import { useState } from "react";
import LiveCaptions from "@/components/LiveCaptions";
import NotesPage from "@/components/NotesPage";
import Navigation from "@/components/Navigation";
import { SettingsDialog } from "@/components/Settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { MemoryViewer } from "@/components/MemoryViewer";

interface SavedNote {
  id: string;
  text: string;
  timestamp: Date;
  saved: boolean;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'captions' | 'notes'>('captions');
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [showMemoryViewer, setShowMemoryViewer] = useState(false);

  const handleImportNotes = (importedNotes: SavedNote[]) => {
    // Merge imported notes with existing ones, avoiding duplicates
    const existingTexts = new Set(savedNotes.map(note => note.text));
    const newNotes = importedNotes.filter(note => !existingTexts.has(note.text));
    
    setSavedNotes(prev => [...newNotes, ...prev]);
  };

  const handleSaveToNotes = (caption: any) => {
    const newNote: SavedNote = {
      id: caption.id,
      text: caption.text,
      timestamp: caption.timestamp,
      saved: true
    };
    
    setSavedNotes(prev => {
      const existing = prev.find(note => note.id === caption.id);
      if (existing) {
        return prev;
      }
      return [newNote, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-gradient-surface pb-16 sm:pb-20">
      {/* Memory Viewer */}
      <MemoryViewer 
        isOpen={showMemoryViewer} 
        onClose={() => setShowMemoryViewer(false)} 
      />

      {/* Header with Settings */}
      <header className="sticky top-0 z-40 bg-surface-elevated/80 backdrop-blur-md border-b border-border">
        <div className="w-full max-w-none sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 flex items-center justify-between">
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground truncate">Soundscribe AI</h1>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMemoryViewer(true)}
              className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10"
              title="View Memory Bank"
            >
              <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <SettingsDialog />
          </div>
        </div>
      </header>

      {currentPage === 'captions' ? (
        <LiveCaptions onSaveToNotes={handleSaveToNotes} />
      ) : (
        <NotesPage notes={savedNotes} onImportNotes={handleImportNotes} />
      )}
      
      <Navigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        notesCount={savedNotes.length}
      />
    </div>
  );
};

export default Index;
