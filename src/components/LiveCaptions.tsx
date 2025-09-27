import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Settings, Save, Languages, FileText, Brain, Heart, AlertTriangle, Smile, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CaptionLine } from "./CaptionLine";
import { ContextualActions } from "./ContextualActions";
import { ContextualSuggestions } from "./ContextualSuggestions";
import { EmergencyAlert } from "./EmergencyAlert";
import { MemoryViewer } from "./MemoryViewer";
import { ThemeToggle } from "./theme-toggle";
import { SettingsDialog } from "./Settings";
import { aiService, AIAnalysis, ContextualSuggestion, ToneMode } from "@/services/aiService";
import { memoryService } from "@/services/memoryService";
import { translateService } from "@/services/translateService";
import { toneAdjuster } from "@/lib/toneAdjuster";
import { useTranslationSettings } from "@/hooks/useTranslationSettings";
import "../types/speech.d.ts";

interface Caption {
  id: string;
  text: string;
  timestamp: Date;
  saved?: boolean;
  translatedText?: string;
  isTranslating?: boolean;
  toneAdjustedText?: string;
  isAdjustingTone?: boolean;
  aiAnalysis?: AIAnalysis;
  suggested?: {
    action: 'save' | 'translate' | 'summarize';
    confidence: number;
  };
}

interface TranslatedItem {
  id: string;
  src: string;
  dst: string;
}

interface LiveCaptionsProps {
  onSaveToNotes: (caption: Caption) => void;
}
const LiveCaptions = ({ onSaveToNotes }: LiveCaptionsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentCaption, setCurrentCaption] = useState("");
  const [recordingSession, setRecordingSession] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showMemoryViewer, setShowMemoryViewer] = useState(false);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);
  const [currentEmergency, setCurrentEmergency] = useState<AIAnalysis['emergency']>();
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [isLiveTranslationEnabled, setIsLiveTranslationEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedToneMode, setSelectedToneMode] = useState<ToneMode>('accurate');
  const [translatedItems, setTranslatedItems] = useState<TranslatedItem[]>([]);
  const [pendingBuffer, setPendingBuffer] = useState("");
  
  const { targetLang, setTargetLang, targetLangRef } = useTranslationSettings();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const captionsEndRef = useRef<HTMLDivElement>(null);
  
  // Track previous lengths to prevent scroll on initial mount
  const prevLengthsRef = useRef({ captions: 0, translatedItems: 0, pendingBuffer: "" });

  // Keep latest live translation state in ref to avoid stale closures
  const liveRef = useRef(isLiveTranslationEnabled);
  useEffect(() => { liveRef.current = isLiveTranslationEnabled; }, [isLiveTranslationEnabled]);

  useEffect(() => {
    // Load preferred tone mode from localStorage
    const savedToneMode = localStorage.getItem('preferredToneMode') as ToneMode;
    if (savedToneMode && ['accurate', 'friendly', 'simplified'].includes(savedToneMode)) {
      setSelectedToneMode(savedToneMode);
    }
  }, []);

  useEffect(() => {
    // Check if speech recognition is available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          if (isRecording) {
            setRecordingSession(prev => prev + (prev ? ' ' : '') + finalTranscript.trim());
          }
          processNewCaption(finalTranscript.trim());
          setPendingBuffer('');
        } else {
          setPendingBuffer(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Recognition Error",
          description: "There was an issue with speech recognition. Please try again.",
          variant: "destructive"
        });
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setPendingBuffer('');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const prevLengths = prevLengthsRef.current;
    const hasNewCaptions = captions.length > prevLengths.captions;
    const hasNewTranslations = translatedItems.length > prevLengths.translatedItems;
    const hasNewPendingBuffer = pendingBuffer !== prevLengths.pendingBuffer && pendingBuffer !== "";
    
    // Only scroll if new content was actually added
    if (hasNewCaptions || hasNewTranslations || hasNewPendingBuffer) {
      scrollToBottom();
    }
    
    // Update previous lengths for next comparison
    prevLengthsRef.current = {
      captions: captions.length,
      translatedItems: translatedItems.length,
      pendingBuffer: pendingBuffer
    };
  }, [captions, translatedItems, pendingBuffer]);

  const processNewCaption = async (text: string) => {
    // Add to conversation history
    const newHistory = [...conversationHistory, text].slice(-10); // Keep last 10 messages
    setConversationHistory(newHistory);

    // Analyze with AI
    let aiAnalysis: AIAnalysis | undefined;
    try {
      aiAnalysis = await aiService.analyzeText(text, newHistory);
    } catch (error) {
      console.error('AI analysis failed:', error);
      aiAnalysis = undefined;
    }

    const newCaption: Caption = {
  id: crypto.randomUUID(),   // ← instead of Date.now().toString()
  text,
  timestamp: new Date(),
  aiAnalysis,
  suggested: detectContextualAction(text, aiAnalysis),
  isTranslating: isLiveTranslationEnabled,
  isAdjustingTone: selectedToneMode !== 'accurate'
};

    setCaptions(prev => [...prev, newCaption]);

    // Live tone adjustment if not accurate mode
    if (selectedToneMode !== 'accurate') {
      adjustCaptionTone(newCaption);
    }

    // Automatically save to notes (use tone-adjusted text if available)
    setTimeout(() => {
      const captionToSave = { ...newCaption };
      if (captionToSave.toneAdjustedText && selectedToneMode !== 'accurate') {
        captionToSave.text = captionToSave.toneAdjustedText;
      }
      onSaveToNotes(captionToSave);
    }, 500); // Small delay to allow tone adjustment to complete

    // Live translation if enabled (use ref to avoid stale closure)
    if (liveRef.current) {
      translateCaptionLive(newCaption);
    }

    // Handle AI analysis results
    if (aiAnalysis) {
      // Handle memory
      if (aiAnalysis.memory?.shouldRemember) {
        memoryService.addMemory(
          aiAnalysis.memory.keyInformation,
          aiAnalysis.memory.context,
          'high'
        );
        toast({
          title: "💭 Memory Saved",
          description: "I'll remember this important information."
        });
      }

      // Handle emergency
      if (aiAnalysis.emergency?.detected) {
        setCurrentEmergency(aiAnalysis.emergency);
      }

      // Handle commands
      if (aiAnalysis.command && aiAnalysis.command.type !== 'none') {
        await handleVoiceCommand(aiAnalysis.command, text);
      }

      // Generate contextual suggestions
      if (aiAnalysis.entities) {
        const allEntities = [
          ...aiAnalysis.entities.people,
          ...aiAnalysis.entities.places,
          ...aiAnalysis.entities.topics
        ];
        if (allEntities.length > 0) {
          const suggestions = await aiService.generateContextualSuggestions(allEntities);
          setContextualSuggestions(suggestions);
        }
      }
    }
  };

  const detectContextualAction = (text: string, aiAnalysis?: AIAnalysis): Caption['suggested'] => {
    // AI-enhanced detection
    if (aiAnalysis?.memory?.shouldRemember) {
      return { action: 'save', confidence: 0.9 };
    }

    // Fallback to basic detection
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('todo') || lowerText.includes('remember') || lowerText.includes('action item')) {
      return { action: 'save', confidence: 0.9 };
    }
    
    if (/[^\x00-\x7F]/.test(text)) {
      return { action: 'translate', confidence: 0.8 };
    }
    
    if (text.split(' ').length > 20) {
      return { action: 'summarize', confidence: 0.7 };
    }
    
    return undefined;
  };

  const handleVoiceCommand = async (command: AIAnalysis['command'], originalText: string) => {
    if (!command) return;

    switch (command.type) {
      case 'recall':
        const memories = memoryService.searchMemories(command.parameters.query || originalText);
        if (memories.length > 0) {
          toast({
            title: "🧠 Memory Found",
            description: `Found ${memories.length} relevant memories. Opening memory viewer.`
          });
          setShowMemoryViewer(true);
        } else {
          toast({
            title: "🤔 No Memories Found",
            description: "I don't have any memories matching that query."
          });
        }
        break;
        
      case 'summarize':
        const recentCaptions = captions.slice(-5).map(c => c.text).join(' ');
        toast({
          title: "📝 Summary",
          description: "Generating summary of recent conversation..."
        });
        break;
        
      case 'translate':
        toast({
          title: "🌐 Translation",
          description: "Translation feature activated for this text."
        });
        break;
    }
  };

  const scrollToBottom = () => {
    captionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setIsRecording(true);
      setRecordingSession("");
      setTranslatedItems([]); // Clear previous translated items
      setCaptions([]); // Clear previous captions
      setPendingBuffer(""); // Clear pending buffer
      toast({
        title: "Recording Started",
        description: "Recording everything until you press stop."
      });
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: "Error Starting Recording",
        description: "Please make sure your microphone is enabled.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsRecording(false);
      
        if (recordingSession.trim()) {
        const recordingCaption: Caption = {
          id: crypto.randomUUID(),
          text: recordingSession.trim(),
          timestamp: new Date(),
          saved: true
        };
        onSaveToNotes(recordingCaption);
        toast({
          title: "Recording Saved",
          description: "Your recording session has been saved to notes."
        });
      }
    }
  };

  const handleTranslate = async () => {
    if (recordingSession.trim()) {
      try {
        toast({
          title: "🌐 Translating Session...",
          description: "Processing translation with LibreTranslate API."
        });
        
        const translatedText = await translateService.translate(recordingSession.trim(), targetLangRef.current);
        
        // Create a new caption with the translated recording session
        const translatedCaption: Caption = {
          id: crypto.randomUUID(),
          text: recordingSession.trim(),
          translatedText: translatedText,
          timestamp: new Date(),
          saved: true
        };
        
        // Add the translated session to captions and notes
        setCaptions(prev => [translatedCaption, ...prev]);
        onSaveToNotes(translatedCaption);
        
        toast({
          title: "Translation Complete",
          description: `Session translated to ${targetLang} and saved to notes.`
        });
      } catch (error) {
        toast({
          title: "Translation Failed",
          description: "Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "No Recording",
        description: "Start recording first to translate."
      });
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "Listening Started",
          description: "Start speaking to see live captions."
        });
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast({
          title: "Error Starting Recognition",
          description: "Please make sure your microphone is enabled.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteCaption = (captionId: string) => {
    setCaptions(prev => prev.filter(c => c.id !== captionId));
    toast({
      title: "Caption Deleted",
      description: "Caption removed successfully."
    });
  };

const translateCaptionLive = async (caption: Caption) => {
  const textToTranslate = caption.toneAdjustedText || caption.text;

  // Insert placeholder so UI shows something immediately
  setTranslatedItems(prev => [
    { id: caption.id, src: textToTranslate, dst: "Translating…" },
    ...prev,
  ]);

  try {
    const translatedText = await translateService.translate(textToTranslate, targetLangRef.current);

    // Replace placeholder with the final translation
    setTranslatedItems(prev =>
      prev.map(item =>
        item.id === caption.id ? { ...item, dst: translatedText } : item
      )
    );
  } catch (error) {
    // Keep the English line; mark failure
    setTranslatedItems(prev =>
      prev.map(item =>
        item.id === caption.id ? { ...item, dst: "(translation failed)" } : item
      )
    );
    toast({
      title: "Translation Failed",
      description: error instanceof Error ? error.message : String(error),
      variant: "destructive",
    });
  }
};

  const adjustCaptionTone = async (caption: Caption) => {
    try {
      // Use built-in non-AI tone adjustment
      const adjustedText = toneAdjuster.adjustTone(caption.text, selectedToneMode);
      
      setCaptions(prev => 
        prev.map(c => c.id === caption.id ? 
          { ...c, toneAdjustedText: adjustedText, isAdjustingTone: false } : c
        )
      );
    } catch (error) {
      console.error('Tone adjustment failed:', error);
      setCaptions(prev => 
        prev.map(c => c.id === caption.id ? 
          { ...c, isAdjustingTone: false } : c
        )
      );
    }
  };

  // Helper function to get current language
  const getCurrentLanguage = () => {
    return targetLang;
  };

  const toggleLiveTranslation = () => {
    setIsLiveTranslationEnabled(prev => {
      const newState = !prev;
      if (newState) {
        toast({
          title: "🌐 Live Translation Enabled",
          description: `New captions will be translated to ${targetLang}`
        });
      } else {
        toast({
          title: "Live Translation Disabled",
          description: "New captions will show in original language only"
        });
      }
      return newState;
    });
  };


  const handleToneModeChange = (mode: ToneMode) => {
    setSelectedToneMode(mode);
    localStorage.setItem('preferredToneMode', mode);
    toast({
      title: "🎭 Tone Mode Changed", 
      description: mode === 'accurate' 
        ? "New captions will show in original tone"
        : `New captions will use built-in ${mode} tone adjustments`
    });
  };

  const getToneModeLabel = (mode: ToneMode) => {
    switch (mode) {
      case 'accurate': return 'Accurate';
      case 'friendly': return 'Friendly';
      case 'simplified': return 'Simplified';
      default: return 'Accurate';
    }
  };

  const getToneModeIcon = (mode: ToneMode) => {
    switch (mode) {
      case 'accurate': return FileText;
      case 'friendly': return Smile;
      case 'simplified': return Zap;
      default: return FileText;
    }
  };

  const handleCaptionTranslate = async (caption: Caption) => {
    try {
      setCaptions(prev => 
        prev.map(c => c.id === caption.id ? 
          { ...c, isTranslating: true } : c
        )
      );
      
      const translatedText = await translateService.translate(caption.text, targetLangRef.current);
      
      setCaptions(prev => 
        prev.map(c => c.id === caption.id ? 
          { ...c, translatedText, isTranslating: false } : c
        )
      );
      
      toast({
        title: "Translation Complete",
        description: `Translated to ${targetLang}`
      });
    } catch (error) {
      setCaptions(prev => 
        prev.map(c => c.id === caption.id ? 
          { ...c, isTranslating: false } : c
        )
      );
      toast({
        title: "Translation Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSummarize = async (caption: Caption) => {
    if (aiService.hasApiKey()) {
      toast({
        title: "📝 Summarizing...",
        description: "Generating summary with AI."
      });
      // In a real implementation, this would call AI summarization
    } else {
      toast({
        title: "Summary",
        description: "Summarization feature requires AI configuration."
      });
    }
  };

  const handleSuggestionClick = (suggestion: ContextualSuggestion) => {
    if (suggestion.action.startsWith('http')) {
      window.open(suggestion.action, '_blank');
    }
    toast({
      title: "Opening Suggestion",
      description: suggestion.description
    });
  };

  const getEmotionIcon = (emotion?: AIAnalysis['emotion']) => {
    if (!emotion) return null;
    
    switch (emotion.tone) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'excited': return '🤩';
      case 'frustrated': return '😤';
      case 'urgent': return '⚠️';
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-none sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto p-3 sm:p-4 lg:p-6 gap-3 sm:gap-4 lg:gap-6">
      {/* Emergency Alert */}
      <EmergencyAlert 
        emergency={currentEmergency} 
        onDismiss={() => setCurrentEmergency(undefined)} 
      />

      {/* Memory Viewer */}
      <MemoryViewer 
        isOpen={showMemoryViewer} 
        onClose={() => setShowMemoryViewer(false)} 
      />


      {/* Interactive Control Panel */}
      <Card className="bg-gradient-subtle border-primary/20 shadow-elegant">
        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Main Controls */}
          <div className="flex justify-center gap-2 sm:gap-3 lg:gap-4 flex-wrap">
            <Button
              onClick={startRecording}
              disabled={isRecording}
              className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full shadow-mic transition-all duration-300 ${
                isRecording 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'gradient-mic hover:scale-110'
              }`}
              size="lg"
            >
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                <span className="text-[0.625rem] sm:text-xs font-medium">START</span>
              </div>
            </Button>
            
            <Button
              onClick={stopRecording}
              disabled={!isRecording}
              variant="destructive"
              className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full shadow-mic transition-all duration-300 ${
                !isRecording 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-110 animate-pulse'
              }`}
              size="lg"
            >
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <MicOff className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                <span className="text-[0.625rem] sm:text-xs font-medium">STOP</span>
              </div>
            </Button>
            
            <Button
              onClick={toggleLiveTranslation}
              variant={isLiveTranslationEnabled ? "default" : "secondary"}
              disabled={!isRecording}
              className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full shadow-mic transition-all duration-300 ${
                !isRecording
                  ? 'opacity-50 cursor-not-allowed'
                  : isLiveTranslationEnabled
                    ? 'hover:scale-110 ring-2 ring-primary/30'
                    : 'hover:scale-110'
              }`}
              size="lg"
            >
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <Languages className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ${isLiveTranslationEnabled ? 'animate-pulse' : ''}`} />
                <span className="text-[0.625rem] sm:text-xs font-medium text-center leading-tight">
                  {isLiveTranslationEnabled ? 'LIVE ON' : 'LIVE OFF'}
                </span>
              </div>
            </Button>
          </div>

          {/* Recording Status */}
          <div className="text-center space-y-2">
            {isRecording && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-destructive rounded-full animate-pulse"></div>
                <p className="text-destructive font-semibold text-sm sm:text-base">Recording Session...</p>
              </div>
            )}
            
            {recordingSession && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 max-w-full sm:max-w-2xl mx-auto">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Current Recording:</p>
                <p className="text-foreground text-sm sm:text-base break-words">{recordingSession}</p>
              </div>
            )}
          </div>


          {/* Translation & Tone Controls */}
          <div className="flex flex-col items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border/50">
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-xs sm:text-sm text-muted-foreground text-center">
                Translate to:
              </span>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-32 h-8 text-xs">
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
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-xs sm:text-sm text-muted-foreground text-center">
                Tone: <span className="font-medium text-foreground">{getToneModeLabel(selectedToneMode)}</span>
              </span>
              <div className="flex gap-1 flex-wrap justify-center">
                {(['accurate', 'friendly', 'simplified'] as ToneMode[]).map((mode) => {
                  const IconComponent = getToneModeIcon(mode);
                  return (
                    <Button
                      key={mode}
                      onClick={() => handleToneModeChange(mode)}
                      variant={selectedToneMode === mode ? "default" : "outline"}
                      size="sm"
                      className="h-6 sm:h-7 px-1.5 sm:px-2 text-[0.625rem] sm:text-xs"
                    >
                      <IconComponent className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      <span className="hidden xs:inline">{getToneModeLabel(mode)}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-muted text-[0.625rem] sm:text-xs">
              Built-in Tone Modes
            </Badge>
          </div>
        </div>
      </Card>


      {/* Captions Area */}
      <Card className="flex-1 min-h-64 sm:min-h-80 lg:min-h-96 bg-caption-bg border-caption-border shadow-soft">
        <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
          {/* Empty state */}
          {(isLiveTranslationEnabled ? translatedItems.length === 0 : captions.length === 0) && !pendingBuffer && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center px-4">
                <FileText className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-base sm:text-lg lg:text-xl font-medium">Captions will appear here</p>
                <p className="text-xs sm:text-sm lg:text-base mt-2 max-w-sm mx-auto">Start listening to see real-time transcription</p>
              </div>
            </div>
          )}
          
          {/* Interim preview line */}
          {pendingBuffer && (
            <div className="mb-2 px-3 py-2 bg-muted/30 rounded-lg border-l-2 border-primary/40">
              <p className="text-sm text-muted-foreground italic">{pendingBuffer}</p>
            </div>
          )}
          
          {/* Translated items (when Live Translate is ON) */}
          {isLiveTranslationEnabled && translatedItems.map((item) => (
            <div key={item.id} className="mb-4 p-4 bg-background/50 rounded-lg border border-border/50">
              {/* Translated text (main display) */}
              <div className="mb-2">
                <p className="text-foreground font-medium text-base leading-relaxed">
                  {item.dst}
                </p>
              </div>
              {/* Original English text (smaller, underneath) */}
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.src}
                </p>
              </div>
            </div>
          ))}

          
          {/* Regular captions (when Live Translate is OFF) */}
          {!isLiveTranslationEnabled && captions.map((caption) => (
            <div key={caption.id} className="mb-4">
              <div className="relative">
                <CaptionLine
                  caption={caption}
                  onDelete={() => handleDeleteCaption(caption.id)}
                />
                
                {/* AI Emotion Indicator */}
                {caption.aiAnalysis?.emotion && getEmotionIcon(caption.aiAnalysis.emotion) && (
                  <div className="absolute top-2 right-2 text-lg">
                    {getEmotionIcon(caption.aiAnalysis.emotion)}
                  </div>
                )}
              </div>
              
              {caption.suggested && caption.suggested.action !== 'save' && (
                <ContextualActions
                  action={caption.suggested.action}
                  onSave={() => {}} // No longer needed since auto-save is enabled
                  onTranslate={() => handleCaptionTranslate(caption)}
                  onSummarize={() => handleSummarize(caption)}
                />
              )}
            </div>
          ))}
          
          <div ref={captionsEndRef} />
        </div>
      </Card>

      {/* Contextual Suggestions */}
      <ContextualSuggestions 
        suggestions={contextualSuggestions}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
};

export default LiveCaptions;