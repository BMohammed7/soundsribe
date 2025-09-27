import { useState } from "react";
import LiveCaptions from "@/components/LiveCaptions";
import NotesPage from "@/components/NotesPage";
import Navigation from "@/components/Navigation";

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
