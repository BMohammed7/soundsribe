import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Settings, Save, Languages, FileText, Brain, Heart, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CaptionLine } from "./CaptionLine";
import { ContextualActions } from "./ContextualActions";
import { ContextualSuggestions } from "./ContextualSuggestions";
import { EmergencyAlert } from "./EmergencyAlert";
import { MemoryViewer } from "./MemoryViewer";
import { aiService, AIAnalysis, ContextualSuggestion } from "@/services/aiService";
import { memoryService } from "@/services/memoryService";
import "../types/speech.d.ts";

interface Caption {
  id: string;
  text: string;
  timestamp: Date;
  saved?: boolean;
  translatedText?: string;
  aiAnalysis?: AIAnalysis;
  suggested?: {
    action: 'save' | 'translate' | 'summarize';
    confidence: number;
  };
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
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const captionsEndRef = useRef<HTMLDivElement>(null);

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
          setCurrentCaption('');
        } else {
          setCurrentCaption(interimTranscript);
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
        setCurrentCaption('');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [captions, currentCaption]);

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
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      aiAnalysis,
      suggested: detectContextualAction(text, aiAnalysis)
    };

    setCaptions(prev => [...prev, newCaption]);

    // Automatically save to notes
    onSaveToNotes(newCaption);

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
          id: Date.now().toString(),
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

  const handleTranslate = () => {
    if (recordingSession.trim()) {
      if (aiService.hasApiKey()) {
        toast({
          title: "🌐 Translating Session...",
          description: "Processing translation with AI."
        });
      } else {
        toast({
          title: "Translation",
          description: "Translation requires AI configuration."
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

  const handleCaptionTranslate = async (caption: Caption) => {
    try {
      toast({
        title: "🌐 Translating...",
        description: "Processing translation with AI."
      });
      
      const translatedText = await aiService.translateText(caption.text);
      
      // Update the caption with translation
      setCaptions(prev => 
        prev.map(c => c.id === caption.id ? 
          { ...c, translatedText } : c
        )
      );
      
      toast({
        title: "Translation Complete",
        description: `Translated to ${localStorage.getItem('preferredLanguage') || 'Spanish'}`
      });
    } catch (error) {
      toast({
        title: "Translation Failed",
        description: "Please check your AI configuration and try again.",
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
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 gap-6">
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Soundscribe Live Captions</h1>
          {aiService.hasApiKey() && (
            <Badge variant="secondary" className="bg-success/10 text-success border-success/30">
              AI Active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMemoryViewer(true)}
            className="text-muted-foreground hover:text-foreground"
            title="View Memory Bank"
          >
            <Brain className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Interactive Control Panel */}
      <Card className="bg-gradient-subtle border-primary/20 shadow-elegant">
        <div className="p-6 space-y-6">
          {/* Main Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={startRecording}
              disabled={isRecording}
              className={`w-24 h-24 rounded-full shadow-mic transition-all duration-300 ${
                isRecording 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'gradient-mic hover:scale-110'
              }`}
              size="lg"
            >
              <div className="flex flex-col items-center gap-2">
                <Mic className="h-8 w-8" />
                <span className="text-xs">START</span>
              </div>
            </Button>
            
            <Button
              onClick={stopRecording}
              disabled={!isRecording}
              variant="destructive"
              className={`w-24 h-24 rounded-full shadow-mic transition-all duration-300 ${
                !isRecording 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-110 animate-pulse'
              }`}
              size="lg"
            >
              <div className="flex flex-col items-center gap-2">
                <MicOff className="h-8 w-8" />
                <span className="text-xs">STOP</span>
              </div>
            </Button>
            
            <Button
              onClick={handleTranslate}
              variant="secondary"
              className="w-24 h-24 rounded-full shadow-mic hover:scale-110 transition-all duration-300"
              size="lg"
            >
              <div className="flex flex-col items-center gap-2">
                <Languages className="h-8 w-8" />
                <span className="text-xs">TRANSLATE</span>
              </div>
            </Button>
          </div>

          {/* Recording Status */}
          <div className="text-center space-y-2">
            {isRecording && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                <p className="text-destructive font-semibold">Recording Session...</p>
              </div>
            )}
            
            {recordingSession && (
              <div className="bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
                <p className="text-sm text-muted-foreground mb-2">Current Recording:</p>
                <p className="text-foreground">{recordingSession}</p>
              </div>
            )}
          </div>

          {/* Live Caption Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Live Captions:</span>
            <Button
              onClick={toggleListening}
              variant={isListening ? "default" : "outline"}
              size="sm"
              className="transition-all duration-200"
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Live
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Live
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Status Information */}
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          {isRecording 
            ? "🔴 Recording everything until you press STOP" 
            : isListening 
              ? "🎤 Live captions active" 
              : "Choose START for session recording or Live Captions for real-time transcription"
          }
        </p>
        {aiService.hasApiKey() && (
          <p className="text-xs text-accent">
            AI features active: Memory • Emotion • Emergency • Commands • Translation
          </p>
        )}
      </div>

      {/* Captions Area */}
      <Card className="flex-1 min-h-96 bg-caption-bg border-caption-border shadow-soft">
        <div className="p-6 h-full overflow-y-auto">
          {captions.length === 0 && !currentCaption && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Captions will appear here</p>
                <p className="text-sm mt-2">Start listening to see real-time transcription</p>
              </div>
            </div>
          )}
          
          {captions.map((caption) => (
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
          
          {currentCaption && (
            <div className="mb-4">
              <CaptionLine
                caption={{
                  id: 'current',
                  text: currentCaption,
                  timestamp: new Date()
                }}
                isInterim={true}
              />
            </div>
          )}
          
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