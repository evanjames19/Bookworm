import { TextChunk } from '../types';
import { ApiService } from './apiService';
import { ArtDirector } from './artDirector';

interface BufferItem {
  chunk: TextChunk;
  audioUrl?: string;
  imageUrl?: string;
  isReady: boolean;
  isProcessing: boolean;
}

export class BufferManager {
  private buffer: Map<string, BufferItem> = new Map();
  private apiService: ApiService;
  private artDirector: ArtDirector;
  private bufferSize: number = 3; // Number of chunks to buffer ahead
  private voiceId: string;
  
  constructor(apiService: ApiService, artDirector: ArtDirector, voiceId: string = 'EXAVITQu4vr4xnSDxMaL') {
    this.apiService = apiService;
    this.artDirector = artDirector;
    this.voiceId = voiceId;
  }
  
  async initializeBuffer(chunks: TextChunk[], startIndex: number = 0): Promise<void> {
    // Clear existing buffer
    this.buffer.clear();
    
    // Initialize buffer items
    chunks.forEach(chunk => {
      this.buffer.set(chunk.id, {
        chunk,
        isReady: false,
        isProcessing: false,
      });
    });
    
    // Start buffering from the start index
    await this.bufferFromIndex(startIndex);
  }
  
  async bufferFromIndex(startIndex: number): Promise<void> {
    const chunks = Array.from(this.buffer.values()).map(item => item.chunk);
    const endIndex = Math.min(startIndex + this.bufferSize, chunks.length);
    
    const bufferPromises: Promise<void>[] = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      const chunk = chunks[i];
      bufferPromises.push(this.processChunk(chunk));
    }
    
    await Promise.all(bufferPromises);
  }
  
  async processChunk(chunk: TextChunk): Promise<void> {
    const bufferItem = this.buffer.get(chunk.id);
    if (!bufferItem || bufferItem.isReady || bufferItem.isProcessing) {
      return;
    }
    
    bufferItem.isProcessing = true;
    
    try {
      // Generate image prompt using Art Director
      const imagePrompt = await this.artDirector.generateImagePrompt(
        chunk.text,
        '', // API key would be passed here
        ''  // Model URL would be passed here
      );
      
      // Process audio and image in parallel
      const [audioUrl, imageUrl] = await Promise.all([
        this.apiService.generateAudio(chunk.text, this.voiceId),
        this.apiService.generateImage(imagePrompt),
      ]);
      
      bufferItem.audioUrl = audioUrl;
      bufferItem.imageUrl = imageUrl;
      bufferItem.isReady = true;
      
      // Update the chunk with generated content
      chunk.audioUrl = audioUrl;
      chunk.imageUrl = imageUrl;
      chunk.imagePrompt = imagePrompt;
    } catch (error) {
      console.error(`Error processing chunk ${chunk.id}:`, error);
      bufferItem.isReady = false;
    } finally {
      bufferItem.isProcessing = false;
    }
  }
  
  async getChunkContent(chunkId: string): Promise<BufferItem | undefined> {
    const item = this.buffer.get(chunkId);
    
    if (item && !item.isReady && !item.isProcessing) {
      // If not ready, process it immediately
      await this.processChunk(item.chunk);
    }
    
    return item;
  }
  
  async ensureNextChunksReady(currentIndex: number): Promise<void> {
    const chunks = Array.from(this.buffer.values()).map(item => item.chunk);
    const nextIndex = currentIndex + 1;
    
    // Check if we need to buffer more chunks
    if (nextIndex < chunks.length) {
      const lastBufferedIndex = Math.min(nextIndex + this.bufferSize - 1, chunks.length - 1);
      
      for (let i = nextIndex; i <= lastBufferedIndex; i++) {
        const chunk = chunks[i];
        const item = this.buffer.get(chunk.id);
        
        if (item && !item.isReady && !item.isProcessing) {
          // Process in background, don't await
          this.processChunk(chunk).catch(err => 
            console.error('Error buffering chunk:', err)
          );
        }
      }
    }
  }
  
  isChunkReady(chunkId: string): boolean {
    const item = this.buffer.get(chunkId);
    return item ? item.isReady : false;
  }
  
  getReadyChunks(): string[] {
    const readyChunks: string[] = [];
    
    this.buffer.forEach((item, chunkId) => {
      if (item.isReady) {
        readyChunks.push(chunkId);
      }
    });
    
    return readyChunks;
  }
  
  clearBuffer(): void {
    this.buffer.clear();
  }
  
  setBufferSize(size: number): void {
    this.bufferSize = Math.max(1, Math.min(size, 10)); // Limit between 1 and 10
  }
  
  setVoiceId(voiceId: string): void {
    this.voiceId = voiceId;
  }
}