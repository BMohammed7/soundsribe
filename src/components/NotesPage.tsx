import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Play, Download, Upload, FileText, Calendar, PlayCircle, StopCircle, Languages } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { speechService } from "@/lib/speechSynthesis";
import { translateService } from "@/services/translateService";
import { useTranslationSettings } from "@/hooks/useTranslationSettings";

interface SavedNote {
  id: string;
  text: string;
  timestamp: Date;
  saved: boolean;
}

interface NotesPageProps {
  notes: SavedNote[];
  onImportNotes?: (importedNotes: SavedNote[]) => void;
}

const NotesPage = ({ notes, onImportNotes }: NotesPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [translatedNotes, setTranslatedNotes] = useState<Record<string, { dst: string; src: string }>>({});
  const [translating, setTranslating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { targetLang, setTargetLang, targetLangRef } = useTranslationSettings();

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

  const handlePlayTTS = async (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        await speechService.speak({ text });
        
        toast({
          title: "Playing Audio",
          description: "Text-to-speech is now playing with your volume and speed settings."
        });
      } catch (error) {
        toast({
          title: "TTS Error",
          description: "Failed to play text-to-speech.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "TTS Not Available",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive"
      });
    }
  };

  const handlePlayAllNotes = async () => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "TTS Not Available",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (filteredNotes.length === 0) {
      toast({
        title: "No Notes to Play",
        description: "Add some notes first to use this feature.",
        variant: "destructive"
      });
      return;
    }

    setIsPlayingAll(true);
    
    try {
      toast({
        title: "Playing All Notes",
        description: `Starting playback of ${filteredNotes.length} notes from oldest to newest...`
      });

      // Reverse the order to play oldest to newest
      const notesToPlay = [...filteredNotes].reverse();

      for (let i = 0; i < notesToPlay.length && speechService.isSpeaking() === false; i++) {
        const note = notesToPlay[i];
        
        // Play the note content directly without announcement
        await speechService.speak({ text: note.text });
        
        // Pause between notes
        if (i < notesToPlay.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast({
        title: "Playback Complete",
        description: "Finished playing all notes."
      });
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "An error occurred during playback.",
        variant: "destructive"
      });
    } finally {
      setIsPlayingAll(false);
    }
  };

  const handleStopAllNotes = () => {
    speechService.stop();
    setIsPlayingAll(false);
    toast({
      title: "Playback Stopped",
      description: "Audio playback has been stopped."
    });
  };

  const handleImportNotes = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({
        title: "Invalid File Type",
        description: "Please select a JSON file.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Validate the imported data structure
        if (!Array.isArray(jsonData)) {
          throw new Error("Invalid file format");
        }

        const importedNotes: SavedNote[] = jsonData.map((item: any, index: number) => ({
          id: `imported-${Date.now()}-${index}`,
          text: item.text || '',
          timestamp: new Date(item.timestamp || Date.now()),
          saved: true
        }));

        if (onImportNotes) {
          onImportNotes(importedNotes);
        }

        toast({
          title: "Notes Imported",
          description: `Successfully imported ${importedNotes.length} notes.`
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "The selected file is not a valid notes export.",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
    
    // Reset the input value so the same file can be selected again
    if (event.target) {
      event.target.value = '';
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

  const handleTranslateAllNotes = async () => {
    if (notes.length === 0) return;
    setTranslating(true);

    // 1) Insert placeholders so UI shows progress
    setTranslatedNotes(prev => {
      const next = { ...prev };
      for (const n of filteredNotes) {
        next[n.id] = { dst: "Translating…", src: n.text };
      }
      return next;
    });

    // 2) Translate sequentially or in small batches to avoid hammering
    const BATCH = 5;
    const queue = [...filteredNotes];
    while (queue.length) {
      const chunk = queue.splice(0, BATCH);
      await Promise.all(chunk.map(async (n) => {
        try {
          const out = await translateService.translate(n.text, targetLangRef.current);
          setTranslatedNotes(prev => ({ ...prev, [n.id]: { dst: out, src: n.text } }));
        } catch {
          setTranslatedNotes(prev => ({ ...prev, [n.id]: { dst: "(translation failed)", src: n.text } }));
        }
      }));
      // small gap to be gentle
      await new Promise(r => setTimeout(r, 120));
    }

    setTranslating(false);
    toast({
      title: "Translation Complete",
      description: `Translated ${filteredNotes.length} notes to ${targetLang}.`
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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="German">German</SelectItem>
                <SelectItem value="Italian">Italian</SelectItem>
                <SelectItem value="Portuguese">Portuguese</SelectItem>
                <SelectItem value="Chinese">Chinese</SelectItem>
                <SelectItem value="Japanese">Japanese</SelectItem>
                <SelectItem value="Korean">Korean</SelectItem>
                <SelectItem value="English">English</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              onClick={handleTranslateAllNotes}
              disabled={translating || filteredNotes.length === 0}
              className="gap-2"
            >
              <Languages className="h-4 w-4" />
              {translating ? "Translating…" : "Translate"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={isPlayingAll ? handleStopAllNotes : handlePlayAllNotes}
              disabled={filteredNotes.length === 0}
              className="gap-2"
            >
              {isPlayingAll ? (
                <>
                  <StopCircle className="h-4 w-4" />
                  Stop All
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Play All ({filteredNotes.length})
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleImportNotes}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
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
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

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
            {filteredNotes.map((note) => {
              const pair = translatedNotes[note.id];
              return (
                <Card 
                  key={note.id} 
                  className="p-4 cursor-pointer hover:shadow-medium transition-all duration-200 bg-caption-bg border-caption-border group"
                  onClick={() => toggleExpanded(note.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {pair ? (
                        <>
                          {/* Translated (top) */}
                          <p className={`text-foreground text-base leading-relaxed font-medium ${
                            expandedNote === note.id || pair.dst.length <= 100 
                              ? '' 
                              : 'line-clamp-2'
                          }`}>
                            {pair.dst}
                          </p>
                          {/* Original (bottom, gray) */}
                          <p className={`text-muted-foreground text-sm leading-relaxed mt-1 ${
                            expandedNote === note.id || pair.src.length <= 100 
                              ? '' 
                              : 'line-clamp-1'
                          }`}>
                            {pair.src}
                          </p>
                        </>
                      ) : (
                        // No translation yet: show original as before
                        <p className={`text-foreground leading-relaxed ${
                          expandedNote === note.id || note.text.length <= 100 
                            ? '' 
                            : 'line-clamp-2'
                        }`}>
                          {note.text}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(note.timestamp)}
                        </div>
                        <div className="text-success">Saved</div>
                        {pair && (
                          <div className="text-primary">Translated</div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTTS(pair ? pair.dst : note.text);
                      }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {(pair ? pair.dst.length > 100 : note.text.length > 100) && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {expandedNote === note.id ? 'Click to collapse' : 'Click to expand'}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;