interface TranslateRequest {
  text: string;
  targetLang: string;
}

interface TranslateResponse {
  translated: string;
}

class TranslateService {
  private baseUrl = 'https://aiproxy.deanpotat.workers.dev';

  async translate(text: string, targetLang: string): Promise<string> {
    if (!text.trim()) {
      throw new Error('Text cannot be empty');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          targetLang
        } as TranslateRequest),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
      }

      const data: TranslateResponse = await response.json();
      
      if (!data.translated) {
        throw new Error('Invalid response from translation service');
      }

      return data.translated;
    } catch (error) {
      console.error('Translation error:', error);
      throw error instanceof Error ? error : new Error('Translation failed');
    }
  }
}

export const translateService = new TranslateService();