import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Languages, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { translateService } from "@/services/translateService";
import { useNavigate } from "react-router-dom";

const LANGUAGE_OPTIONS = [
  { value: "French", label: "French" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "German", label: "German" },
  { value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Russian", label: "Russian" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
  { value: "Arabic", label: "Arabic" },
  { value: "Hindi", label: "Hindi" },
  { value: "Dutch", label: "Dutch" },
  { value: "Swedish", label: "Swedish" },
];

const Translate = () => {
  const navigate = useNavigate();
  const [sourceText, setSourceText] = useState("");
  const [targetLang, setTargetLang] = useState("French");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter text to translate.",
        variant: "destructive"
      });
      return;
    }

    if (!targetLang) {
      toast({
        title: "Target Language Required",
        description: "Please select a target language.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await translateService.translate(sourceText, targetLang);
      setTranslatedText(result);
      toast({
        title: "Translation Complete",
        description: `Text translated to ${targetLang} successfully.`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Translation failed";
      toast({
        title: "Translation Failed",
        description: errorMessage,
        variant: "destructive"
      });
      console.error('Translation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSourceText("");
    setTranslatedText("");
  };

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Languages className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Translate</h1>
              <p className="text-muted-foreground">Translate text between languages</p>
            </div>
          </div>
        </div>

        {/* Translation Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="bg-surface-elevated/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Source Text
              </CardTitle>
              <CardDescription>
                Enter the text you want to translate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                id="sourceText"
                placeholder="Enter text to translate..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="min-h-[200px] resize-vertical"
                disabled={isLoading}
              />
              
              <div className="space-y-2">
                <label htmlFor="targetLang" className="text-sm font-medium">
                  Target Language
                </label>
                <Select value={targetLang} onValueChange={setTargetLang} disabled={isLoading}>
                  <SelectTrigger id="targetLang">
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  id="runTranslate"
                  onClick={handleTranslate}
                  disabled={isLoading || !sourceText.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="h-4 w-4 mr-2" />
                      Translate
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="bg-surface-elevated/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                Translation
              </CardTitle>
              <CardDescription>
                Translated text will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                id="translatedOut"
                className={`min-h-[200px] p-4 rounded-md border bg-background/50 text-foreground ${
                  translatedText ? 'border-success/20' : 'border-border'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Translating...
                  </div>
                ) : translatedText ? (
                  <div className="whitespace-pre-wrap">{translatedText}</div>
                ) : (
                  <div className="text-muted-foreground italic">
                    Translation will appear here...
                  </div>
                )}
              </div>
              
              {translatedText && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(translatedText)}
                    className="w-full"
                  >
                    Copy Translation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Info */}
        <Card className="mt-8 bg-surface-elevated/30 backdrop-blur-sm border-border/30">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Powered by Google Translate proxy service. Supports translation between multiple languages
                with high accuracy and fast response times.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Translate;