export interface MemoryItem {
  id: string;
  text: string;
  timestamp: Date;
  context: string;
  tags: string[];
  importance: 'low' | 'medium' | 'high';
}

class MemoryService {
  private memories: MemoryItem[] = [];
  private readonly STORAGE_KEY = 'soundscribe_memories';

  constructor() {
    this.loadFromStorage();
  }

  addMemory(text: string, context: string = '', importance: MemoryItem['importance'] = 'medium'): MemoryItem {
    const memory: MemoryItem = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      context,
      tags: this.extractTags(text),
      importance
    };

    this.memories.push(memory);
    this.saveToStorage();
    return memory;
  }

  searchMemories(query: string): MemoryItem[] {
    const lowerQuery = query.toLowerCase();
    return this.memories.filter(memory => 
      memory.text.toLowerCase().includes(lowerQuery) ||
      memory.context.toLowerCase().includes(lowerQuery) ||
      memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getRecentMemories(limit: number = 10): MemoryItem[] {
    return this.memories
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getAllMemories(): MemoryItem[] {
    return this.memories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  deleteMemory(id: string): void {
    this.memories = this.memories.filter(memory => memory.id !== id);
    this.saveToStorage();
  }

  private extractTags(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were'].includes(word)
    );
    return importantWords.slice(0, 5); // Limit to 5 tags
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.memories));
    } catch (error) {
      console.error('Failed to save memories to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.memories = parsed.map((memory: any) => ({
          ...memory,
          timestamp: new Date(memory.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load memories from storage:', error);
      this.memories = [];
    }
  }
}

export const memoryService = new MemoryService();