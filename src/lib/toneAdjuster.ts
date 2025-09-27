export type ToneMode = 'accurate' | 'friendly' | 'simplified';

export class ToneAdjuster {
  private friendlyReplacements: Record<string, string> = {
    'hello': 'hey there',
    'thank you': 'thanks so much',
    'yes': 'absolutely',
    'no': 'nah',
    'okay': 'sounds good',
    'good': 'awesome',
    'nice': 'fantastic',
    'fine': 'perfect',
    'sure': 'definitely',
    'maybe': 'possibly',
    'I think': 'I feel like',
    'I believe': 'I think',
    'however': 'but',
    'therefore': 'so',
    'furthermore': 'plus',
  };

  private simplificationReplacements: Record<string, string> = {
    'utilize': 'use',
    'demonstrate': 'show',
    'approximately': 'about',
    'immediately': 'right away',
    'unfortunately': 'sadly',
    'definitely': 'for sure',
    'particularly': 'especially',
    'consequently': 'so',
    'furthermore': 'also',
    'nevertheless': 'but',
    'subsequently': 'then',
    'individuals': 'people',
    'assistance': 'help',
    'sufficient': 'enough',
    'accomplish': 'do',
    'requirements': 'needs',
    'currently': 'now',
    'previously': 'before',
    'frequently': 'often',
    'occasionally': 'sometimes',
    'understand': 'get',
    'participate': 'join',
    'extremely': 'very',
    'numerous': 'many',
    'essential': 'important',
    'additional': 'more',
    'significant': 'big',
    'purchase': 'buy',
    'location': 'place',
    'receive': 'get',
    'maintain': 'keep',
    'consider': 'think about',
    'establish': 'set up',
    'recommend': 'suggest',
    'communicate': 'talk',
    'concerning': 'about',
    'regarding': 'about',
    'commence': 'start',
    'terminate': 'end',
    'obtain': 'get',
    'provide': 'give',
    'indicate': 'show',
    'modify': 'change',
    'monitor': 'watch',
    'construct': 'build',
    'examine': 'look at',
    'investigate': 'check',
    'attempt': 'try',
    'achieve': 'reach',
    'initiate': 'start',
    'complete': 'finish',
    'organize': 'arrange',
    'identify': 'find',
    'discover': 'find out',
    'represent': 'stand for',
    'alternative': 'other choice',
    'opportunity': 'chance',
    'fundamental': 'basic',
    'component': 'part',
    'procedure': 'steps',
    'operation': 'work',
    'implement': 'put in place',
    'appropriate': 'right',
    'effective': 'works well',
    'efficient': 'fast',
    'beneficial': 'helpful',
    'substantial': 'large',
    'comprehensive': 'complete',
    'specific': 'exact',
    'particular': 'special',
    'obvious': 'clear',
    'apparent': 'clear',
    'evident': 'clear',
    'tremendous': 'huge',
    'excellent': 'great',
    'outstanding': 'great',
    'remarkable': 'amazing',
    'incredible': 'amazing',
    'extraordinary': 'amazing',
    'magnificent': 'great',
    'exceptional': 'great',
    'fantastic': 'great',
    'wonderful': 'great',
    'marvelous': 'great',
    'spectacular': 'amazing',
    'phenomenal': 'amazing',
    'enormous': 'huge',
    'massive': 'huge',
    'gigantic': 'huge',
    'immense': 'huge',
    'colossal': 'huge',
    'vast': 'huge',
    'extensive': 'big',
    'widespread': 'everywhere',
    'universal': 'for everyone',
    'global': 'worldwide',
    'international': 'worldwide',
    'national': 'country-wide',
    'regional': 'local area',
    'metropolitan': 'city area'
  };

  private friendlyEmojis = ['😊', '🙂', '😄', '👍', '✨', '🎉', '💪', '🌟'];
  
  private questionEmojis = ['🤔', '❓', '💭'];

  adjustTone(text: string, mode: ToneMode): string {
    if (mode === 'accurate') {
      return text;
    }

    let adjustedText = text;

    switch (mode) {
      case 'friendly':
        adjustedText = this.makeFriendly(adjustedText);
        break;
      case 'simplified':
        adjustedText = this.simplify(adjustedText);
        break;
    }

    return adjustedText;
  }

  private makeFriendly(text: string): string {
    let result = text;

    // Apply word replacements
    for (const [formal, friendly] of Object.entries(this.friendlyReplacements)) {
      const regex = new RegExp(`\\b${formal}\\b`, 'gi');
      result = result.replace(regex, friendly);
    }

    // Add emojis to sentences
    result = result.replace(/\./g, (match, offset, string) => {
      // Don't add emoji if there's already one nearby
      const nearbyText = string.slice(Math.max(0, offset - 10), offset + 10);
      if (this.hasEmoji(nearbyText)) return match;
      
      // Randomly add a friendly emoji (30% chance)
      if (Math.random() < 0.3) {
        const emoji = this.friendlyEmojis[Math.floor(Math.random() * this.friendlyEmojis.length)];
        return ` ${emoji}.`;
      }
      return match;
    });

    // Add emojis to questions
    result = result.replace(/\?/g, (match, offset, string) => {
      const nearbyText = string.slice(Math.max(0, offset - 10), offset + 10);
      if (this.hasEmoji(nearbyText)) return match;
      
      if (Math.random() < 0.4) {
        const emoji = this.questionEmojis[Math.floor(Math.random() * this.questionEmojis.length)];
        return ` ${emoji}?`;
      }
      return match;
    });

    // Make exclamations more enthusiastic
    result = result.replace(/!/g, (match, offset, string) => {
      if (Math.random() < 0.2) {
        return '! 🎉';
      }
      return match;
    });

    // Add conversational fillers
    result = result.replace(/\bI think\b/g, 'I think');
    result = result.replace(/\bWell,/g, 'So,');
    result = result.replace(/\bActually,/g, 'You know what,');

    return result.trim();
  }

  private simplify(text: string): string {
    let result = text;

    // Apply word replacements
    for (const [complex, simple] of Object.entries(this.simplificationReplacements)) {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      result = result.replace(regex, simple);
    }

    // Break down long sentences (more than 20 words)
    result = result.replace(/[.!?]+/g, (match, offset, string) => {
      const sentence = this.getCurrentSentence(string, offset);
      const wordCount = sentence.split(/\s+/).length;
      
      if (wordCount > 20) {
        // Try to break at logical points
        const breakPoints = [', and ', ', but ', ', so ', ', then ', ', when ', ', where ', ', which '];
        for (const breakPoint of breakPoints) {
          if (sentence.includes(breakPoint)) {
            return match; // Let natural breaks handle it
          }
        }
      }
      return match;
    });

    // Replace passive voice indicators with active alternatives
    result = result.replace(/\bis being\b/gi, 'is');
    result = result.replace(/\bwas being\b/gi, 'was');
    result = result.replace(/\bhas been\b/gi, 'is');
    result = result.replace(/\bhave been\b/gi, 'are');
    result = result.replace(/\bwill be\b/gi, 'will');

    // Simplify contractions expansion
    result = result.replace(/\bcannot\b/gi, "can't");
    result = result.replace(/\bdo not\b/gi, "don't");
    result = result.replace(/\bwill not\b/gi, "won't");
    result = result.replace(/\bis not\b/gi, "isn't");
    result = result.replace(/\bare not\b/gi, "aren't");
    result = result.replace(/\bwas not\b/gi, "wasn't");
    result = result.replace(/\bwere not\b/gi, "weren't");

    return result.trim();
  }

  private hasEmoji(text: string): boolean {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(text);
  }

  private getCurrentSentence(text: string, position: number): string {
    const beforePosition = text.slice(0, position);
    const afterPosition = text.slice(position);
    
    const sentenceStart = Math.max(
      beforePosition.lastIndexOf('.'),
      beforePosition.lastIndexOf('!'),
      beforePosition.lastIndexOf('?'),
      0
    );
    
    const sentenceEnd = position + afterPosition.search(/[.!?]/);
    
    return text.slice(sentenceStart, sentenceEnd === -1 ? text.length : sentenceEnd);
  }
}

export const toneAdjuster = new ToneAdjuster();