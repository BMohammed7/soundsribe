import { useState } from "react";
import LiveCaptions from "@/components/LiveCaptions";
import NotesPage from "@/components/NotesPage";
import Navigation from "@/components/Navigation";
import { SettingsDialog } from "@/components/Settings";

interface SavedNote {
  id: string;
  text: string;
  timestamp: Date;
  saved: boolean;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'captions' | 'notes'>('captions');
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);

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
    <div className="min-h-screen bg-gradient-surface pb-20">
      {/* Header with Settings */}
      <header className="sticky top-0 z-40 bg-surface-elevated/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Jarvis AI</h1>
          <SettingsDialog />
        </div>
      </header>

      {currentPage === 'captions' ? (
        <LiveCaptions onSaveToNotes={handleSaveToNotes} />
      ) : (
        <NotesPage notes={savedNotes} />
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
