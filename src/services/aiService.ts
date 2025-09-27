export interface AIAnalysis {
  memory?: {
    shouldRemember: boolean;
    keyInformation: string;
    context: string;
  };
  summary?: {
    keyPoints: string[];
    actionItems: string[];
  };
  entities?: {
    people: string[];
    places: string[];
    dates: string[];
    topics: string[];
  };
  emotion?: {
    tone: 'happy' | 'sad' | 'angry' | 'excited' | 'frustrated' | 'neutral' | 'urgent';
    confidence: number;
  };
  emergency?: {
    detected: boolean;
    type: 'health' | 'danger' | 'distress';
    confidence: number;
  };
  translation?: {
    originalLang: string;
    targetLang: string;
    translatedText: string;
  };
  command?: {
    type: 'recall' | 'summarize' | 'translate' | 'context' | 'none';
    parameters: Record<string, any>;
  };
}

export interface ContextualSuggestion {
  type: 'weather' | 'news' | 'events' | 'flights' | 'maps' | 'search';
  title: string;
  description: string;
  action: string;
  entity: string;
}

export type ToneMode = 'accurate' | 'friendly' | 'simplified';

export interface ToneAdjustment {
  originalText: string;
  adjustedText: string;
  mode: ToneMode;
}

class AIService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  hasApiKey(): boolean {
    return this.apiKey !== null;
  }

  async callAI(prompt: string, systemPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AI API key not configured');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    }
  }

  async translateText(text: string, targetLanguage?: string): Promise<string> {
    const target = targetLanguage || localStorage.getItem('preferredLanguage') || 'Spanish';

    try {
      // Try OpenAI first if we have an API key
      const { translateWithOpenAI } = await import('@/lib/openaiTranslate');
      const translated = await translateWithOpenAI(text, { targetLang: target });
      if (translated) return translated;
    } catch (e) {
      console.warn("OpenAI translate failed, falling back to LibreTranslate:", e);
    }

    // Fallback to LibreTranslate
    const languageMap: Record<string, string> = {
      'Spanish': 'es','French':'fr','German':'de','Italian':'it','Portuguese':'pt',
      'Russian':'ru','Chinese':'zh','Japanese':'ja','Korean':'ko','Arabic':'ar',
      'Hindi':'hi','Dutch':'nl','Swedish':'sv'
    };
    const targetLangCode = languageMap[target] || 'es';
    
    try {
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'auto', target: targetLangCode, format: 'text' })
      });
      if (!response.ok) throw new Error(`Translation API error: ${response.status}`);
      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('LibreTranslate failed:', error);
      return `[Translation unavailable]`;
    }
  }

  async analyzeText(text: string, conversationHistory: string[] = []): Promise<AIAnalysis> {
    if (!this.hasApiKey()) {
      return this.fallbackAnalysis(text);
    }

    const systemPrompt = `You are Soundscribe, an AI assistant analyzing speech for:
1. Memory: Detect "remember this" or important info to save
2. Entities: Extract people, places, dates, topics
3. Emotion: Detect tone (happy/sad/angry/excited/frustrated/neutral/urgent)
4. Emergency: Detect distress/danger/health issues
5. Commands: Detect queries like "what did I say about X", "summarize last X", "translate this"
6. Summary: Create key points and action items for long conversations

Return JSON only with detected features. Use null for undetected features.`;

    const context = conversationHistory.length > 0 ? 
      `\nRecent conversation: ${conversationHistory.slice(-5).join(' ')}` : '';
    
    const prompt = `Analyze this speech: "${text}"${context}`;

    try {
      const result = await this.callAI(prompt, systemPrompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.fallbackAnalysis(text);
    }
  }

  private fallbackAnalysis(text: string): AIAnalysis {
    const lowerText = text.toLowerCase();
    
    // Basic memory detection
    const shouldRemember = lowerText.includes('remember') || 
                          lowerText.includes('important') || 
                          lowerText.includes('don\'t forget');

    // Basic emotion detection
    let tone: AIAnalysis['emotion']['tone'] = 'neutral';
    if (lowerText.includes('great') || lowerText.includes('awesome')) tone = 'happy';
    if (lowerText.includes('angry') || lowerText.includes('mad')) tone = 'angry';
    if (lowerText.includes('urgent') || lowerText.includes('emergency')) tone = 'urgent';
    if (lowerText.includes('frustrated') || lowerText.includes('annoying')) tone = 'frustrated';

    // Basic emergency detection
    const emergencyKeywords = ['help', 'emergency', 'urgent', 'pain', 'hurt', 'danger'];
    const emergencyDetected = emergencyKeywords.some(keyword => lowerText.includes(keyword));

    // Basic command detection
    let command: AIAnalysis['command'] = { type: 'none', parameters: {} };
    if (lowerText.includes('what did i say')) {
      command = { type: 'recall', parameters: { query: text } };
    } else if (lowerText.includes('summarize')) {
      command = { type: 'summarize', parameters: { timeframe: 'recent' } };
    } else if (lowerText.includes('translate')) {
      command = { type: 'translate', parameters: { text: text } };
    }

    return {
      memory: shouldRemember ? {
        shouldRemember: true,
        keyInformation: text,
        context: 'User flagged as important'
      } : undefined,
      emotion: {
        tone,
        confidence: 0.7
      },
      emergency: emergencyDetected ? {
        detected: true,
        type: 'distress',
        confidence: 0.8
      } : undefined,
      command
    };
  }

  async generateContextualSuggestions(entities: string[]): Promise<ContextualSuggestion[]> {
    const suggestions: ContextualSuggestion[] = [];
    
    entities.forEach(entity => {
      // Check if entity looks like a place
      if (entity.includes('airport') || entity.includes('hotel') || entity.includes('city')) {
        suggestions.push({
          type: 'maps',
          title: `Map of ${entity}`,
          description: `View location and directions`,
          action: `https://maps.google.com/search/${encodeURIComponent(entity)}`,
          entity
        });
      }
      
      // Check if entity looks like a date/event
      if (entity.includes('meeting') || entity.includes('appointment')) {
        suggestions.push({
          type: 'events',
          title: `Calendar for ${entity}`,
          description: `Add to calendar or view schedule`,
          action: 'calendar',
          entity
        });
      }
      
      // General search suggestion
      suggestions.push({
        type: 'search',
        title: `Search ${entity}`,
        description: `Find more information`,
        action: `https://www.google.com/search?q=${encodeURIComponent(entity)}`,
        entity
      });
    });

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  async adjustTone(text: string, tone: ToneMode): Promise<string> {
    if (tone === 'accurate') {
      return text; // No adjustment needed for accurate mode
    }

    if (!this.hasApiKey()) {
      // Fallback for when no API key is available
      switch (tone) {
        case 'friendly':
          return text.replace(/\./g, '! 😊').replace(/\?/g, '? 🤔');
        case 'simplified':
          return text.replace(/\b\w{8,}\b/g, (match) => {
            // Simple word replacement for common long words
            const simplifications: Record<string, string> = {
              'unfortunately': 'sadly',
              'approximately': 'about',
              'immediately': 'right away',
              'definitely': 'for sure',
              'particularly': 'especially'
            };
            return simplifications[match.toLowerCase()] || match;
          });
        default:
          return text;
      }
    }

    try {
      let systemPrompt = '';
      let userPrompt = '';

      switch (tone) {
        case 'friendly':
          systemPrompt = 'You are a friendly, warm assistant who makes text more casual, playful, and engaging while preserving the original meaning. Add appropriate emojis and make it sound like a friendly conversation.';
          userPrompt = `Make this text more friendly and casual: "${text}"`;
          break;
        case 'simplified':
          systemPrompt = 'You are an expert at simplifying complex text. Make the text easier to understand by using simpler words, shorter sentences, and clearer explanations while preserving all important information.';
          userPrompt = `Simplify this text to make it easier to understand: "${text}"`;
          break;
        default:
          return text;
      }

      const result = await this.callAI(userPrompt, systemPrompt);
      return result || text;
    } catch (error) {
      console.error('Tone adjustment failed:', error);
      return text;
    }
  }
}

export const aiService = new AIService();