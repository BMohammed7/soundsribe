import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Settings, Save, Languages, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CaptionLine } from "./CaptionLine";
import { ContextualActions } from "./ContextualActions";
import "../types/speech.d.ts";

interface Caption {
  id: string;
  text: string;
  timestamp: Date;
  saved?: boolean;
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
  const [showSettings, setShowSettings] = useState(false);
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
          const newCaption: Caption = {
            id: Date.now().toString(),
            text: finalTranscript.trim(),
            timestamp: new Date(),
            suggested: detectContextualAction(finalTranscript)
          };
          
          setCaptions(prev => [...prev, newCaption]);
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

  const detectContextualAction = (text: string): Caption['suggested'] => {
    const lowerText = text.toLowerCase();
    
    // Action item detection
    if (lowerText.includes('todo') || lowerText.includes('remember') || lowerText.includes('action item')) {
      return { action: 'save', confidence: 0.9 };
    }
    
    // Foreign language detection (simple heuristic)
    if (/[^\x00-\x7F]/.test(text)) {
      return { action: 'translate', confidence: 0.8 };
    }
    
    // Long content that might need summarizing
    if (text.split(' ').length > 20) {
      return { action: 'summarize', confidence: 0.7 };
    }
    
    return undefined;
  };

  const scrollToBottom = () => {
    captionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSaveCaption = (caption: Caption) => {
    const updatedCaption = { ...caption, saved: true };
    setCaptions(prev => 
      prev.map(c => c.id === caption.id ? updatedCaption : c)
    );
    onSaveToNotes(updatedCaption);
    toast({
      title: "Saved to Notes",
      description: "Caption saved successfully."
    });
  };

  const handleTranslate = (caption: Caption) => {
    // Placeholder for translation functionality
    toast({
      title: "Translation",
      description: "Translation feature coming soon!"
    });
  };

  const handleSummarize = (caption: Caption) => {
    // Placeholder for summarization functionality
    toast({
      title: "Summary",
      description: "Summarization feature coming soon!"
    });
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Live Captions</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Mic Button */}
      <div className="flex justify-center">
        <Button
          onClick={toggleListening}
          className={`w-32 h-32 rounded-full shadow-mic transition-all duration-300 ${
            isListening 
              ? 'gradient-mic animate-pulse scale-110' 
              : 'bg-primary hover:bg-primary-dark'
          }`}
          size="lg"
        >
          {isListening ? (
            <MicOff className="h-12 w-12 text-primary-foreground" />
          ) : (
            <Mic className="h-12 w-12 text-primary-foreground" />
          )}
        </Button>
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="text-muted-foreground">
          {isListening ? "Listening... Tap to stop" : "Tap the microphone to start listening"}
        </p>
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
              <CaptionLine
                caption={caption}
                onSave={() => handleSaveCaption(caption)}
              />
              {caption.suggested && (
                <ContextualActions
                  action={caption.suggested.action}
                  onSave={() => handleSaveCaption(caption)}
                  onTranslate={() => handleTranslate(caption)}
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
    </div>
  );
};

export default LiveCaptions;