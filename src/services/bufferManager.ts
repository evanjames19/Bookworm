import { TextChunk } from '../types';
import { ApiService } from './apiService';
import { ArtDirector } from './artDirector';
import { ArtStyle } from '../store';

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
  private processedChunks: TextChunk[] = [];
  private currentBookId: string = '';
  private currentArtStyle: ArtStyle = 'realistic';
  private emergencyReferenceImage?: string; // Fallback reference for broken character chains
  
  constructor(apiService: ApiService, artDirector: ArtDirector, voiceId: string = 'JBFqnCBsd6RMkjVDRZzb') {
    this.apiService = apiService;
    this.artDirector = artDirector;
    this.voiceId = voiceId;
  }
  
  async initializeBuffer(chunks: TextChunk[], startIndex: number = 0, artStyle: ArtStyle = 'realistic', bookId?: string): Promise<void> {
    // Store art style FIRST before any processing
    this.currentArtStyle = artStyle;
    console.log(`🎨 BufferManager initialized with art style: ${artStyle}`);
    
    // Store book ID for persistent audio caching
    if (bookId) {
      this.currentBookId = bookId;
    }
    
    // Clear existing buffer
    this.buffer.clear();
    this.processedChunks = [];
    this.emergencyReferenceImage = undefined;
    this.artDirector.clearContext();
    
    // Store all chunks
    this.processedChunks = chunks;
    
    // Initialize buffer items
    chunks.forEach(chunk => {
      this.buffer.set(chunk.id, {
        chunk,
        isReady: false,
        isProcessing: false,
      });
    });
    
    // Start buffering from the start index
    await this.bufferFromIndex(startIndex, artStyle);
  }
  
  async bufferFromIndex(startIndex: number, artStyle: ArtStyle = 'realistic'): Promise<void> {
    const chunks = this.processedChunks;
    
    // Only process first 2 chunks for faster loading - others will be processed during playback
    const initialChunksToProcess = Math.min(2, chunks.length);
    console.log(`🚀 Fast loading: Processing first ${initialChunksToProcess} chunks, others during playback...`);
    
    // Process first chunks sequentially to avoid API rate limits
    for (let i = 0; i < initialChunksToProcess; i++) {
      const chunk = chunks[i];
      console.log(`📝 Initial processing chunk ${i + 1}/${initialChunksToProcess}: ${chunk.text.substring(0, 50)}...`);
      await this.processChunk(chunk, i, this.currentArtStyle);
      
      // Add small delay between requests to be extra safe
      if (i < initialChunksToProcess - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Initial ${initialChunksToProcess} chunks processed! Remaining chunks will process during playback.`);
  }
  
  async processChunk(chunk: TextChunk, chunkIndex: number, artStyle: ArtStyle = 'realistic'): Promise<void> {
    const bufferItem = this.buffer.get(chunk.id);
    if (!bufferItem || bufferItem.isReady || bufferItem.isProcessing) {
      return;
    }
    
    bufferItem.isProcessing = true;
    
    try {
      // CRITICAL FIX: Ensure proper previous image reference chain with emergency fallback
      let previousImagePath: string | undefined;
      if (chunkIndex > 0) {
        // Wait for previous chunk to be fully processed before continuing
        await this.waitForChunkReady(chunkIndex - 1);
        
        const previousChunk = this.processedChunks[chunkIndex - 1];
        const isPreviousPlaceholder = previousChunk?.imageUrl?.includes('picsum.photos');
        
        if (previousChunk && previousChunk.imageUrl && !isPreviousPlaceholder) {
          previousImagePath = previousChunk.imageUrl;
          console.log(`🔗 Using previous image from chunk ${chunkIndex - 1} for character consistency: ${previousImagePath.substring(0, 50)}...`);
        } else if (this.emergencyReferenceImage && !isPreviousPlaceholder) {
          // Use emergency reference if previous chunk failed but we have a good reference
          previousImagePath = this.emergencyReferenceImage;
          console.log(`🔄 Using emergency reference image for character consistency: ${previousImagePath.substring(0, 50)}...`);
        } else {
          console.warn(`⚠️ Previous chunk ${chunkIndex - 1} has placeholder/no image - consistency may be broken`);
          // Try to find the most recent non-placeholder image
          for (let i = chunkIndex - 1; i >= 0; i--) {
            const fallbackChunk = this.processedChunks[i];
            if (fallbackChunk?.imageUrl && !fallbackChunk.imageUrl.includes('picsum.photos')) {
              previousImagePath = fallbackChunk.imageUrl;
              console.log(`🔄 Using fallback reference from chunk ${i}: ${previousImagePath.substring(0, 50)}...`);
              break;
            }
          }
        }
      } else {
        console.log(`🎬 Processing first chunk ${chunkIndex} - establishing character baseline`);
      }
      
      // Generate image prompt using Art Director with direct text analysis
      const imagePrompt = await this.artDirector.generateImagePrompt(
        chunk.text, 
        previousImagePath, 
        chunkIndex,
        artStyle
      );
      
      // Process audio and image in parallel
      const [audioUrl, imageUrl] = await Promise.all([
        this.apiService.generateAudio(chunk.text, this.currentBookId, chunk.id, this.voiceId).catch(err => {
          console.warn('Audio generation failed, continuing silently');
          return '';
        }),
        this.apiService.generateImage(imagePrompt, previousImagePath).catch(err => {
          console.warn('Image generation failed, using placeholder');
          return `https://picsum.photos/seed/${chunk.id}/400/600`;
        }),
      ]);
      
      // Clean up any double file:// protocols that might come from cache
      const cleanImageUrl = imageUrl?.replace(/^file:\/\/file:\/\//, 'file://') || imageUrl;
      
      bufferItem.audioUrl = audioUrl;
      bufferItem.imageUrl = cleanImageUrl;
      bufferItem.isReady = true;
      
      // Update the chunk with generated content
      chunk.audioUrl = audioUrl;
      chunk.imageUrl = cleanImageUrl;
      chunk.imagePrompt = imagePrompt;
      
      // CRITICAL FIX: Check if we got a placeholder and this breaks the character chain
      const isPlaceholder = cleanImageUrl?.includes('picsum.photos');
      if (isPlaceholder && chunkIndex > 0) {
        console.warn(`🚨 CRITICAL: Chunk ${chunkIndex} got placeholder image - character consistency chain is broken!`);
        console.warn(`🔄 This will affect all subsequent chunks. Consider retrying this chunk or using chunk 0's image.`);
        
        // Emergency fallback: If we have chunk 0's image, try to use that for continuity
        const firstChunk = this.processedChunks[0];
        if (firstChunk?.imageUrl && !firstChunk.imageUrl.includes('picsum.photos')) {
          console.log(`🔄 Emergency fallback: Will use chunk 0's image (${firstChunk.imageUrl.substring(0, 50)}...) for subsequent chunks`);
          // Store this for potential use in subsequent chunks
          this.emergencyReferenceImage = firstChunk.imageUrl;
        }
      } else if (!isPlaceholder) {
        // Reset emergency reference if we got a good image
        this.emergencyReferenceImage = undefined;
        console.log(`✅ Processed chunk ${chunkIndex}: ${chunk.text.substring(0, 50)}...`);
        console.log(`🔗 Character consistency chain: chunk ${chunkIndex} image: ${cleanImageUrl ? cleanImageUrl.substring(0, 50) + '...' : 'NONE'}`);
      }
    } catch (error) {
      console.warn(`Chunk processing failed, using fallbacks for chunk ${chunk.id}`);
      // Set placeholder values so the chunk can still be shown
      const fallbackImageUrl = `https://picsum.photos/seed/${chunk.id}/400/600`;
      
      bufferItem.audioUrl = '';
      bufferItem.imageUrl = fallbackImageUrl;
      bufferItem.isReady = true;
      
      chunk.audioUrl = bufferItem.audioUrl;
      chunk.imageUrl = fallbackImageUrl;
    } finally {
      bufferItem.isProcessing = false;
    }
  }
  
  async getChunkContent(chunkId: string): Promise<BufferItem | undefined> {
    const item = this.buffer.get(chunkId);
    
    if (item && !item.isReady && !item.isProcessing) {
      // If not ready, find its index and process it immediately
      const chunkIndex = this.processedChunks.findIndex(c => c.id === chunkId);
      if (chunkIndex >= 0) {
        await this.processChunk(item.chunk, chunkIndex);
      }
    }
    
    return item;
  }
  
  async ensureNextChunksReady(currentIndex: number): Promise<void> {
    const chunks = this.processedChunks;
    const nextIndex = currentIndex + 1;
    
    // Check if we need to buffer more chunks
    if (nextIndex < chunks.length) {
      const lastBufferedIndex = Math.min(nextIndex + this.bufferSize - 1, chunks.length - 1);
      
      // CRITICAL FIX: Process chunks sequentially to maintain character consistency chain
      for (let i = nextIndex; i <= lastBufferedIndex; i++) {
        const chunk = chunks[i];
        const item = this.buffer.get(chunk.id);
        
        if (item && !item.isReady && !item.isProcessing) {
          console.log(`🎬 Dynamic processing chunk ${i} during playback...`);
          
          // Process this chunk and wait for completion to ensure proper sequencing
          try {
            await this.processChunk(chunk, i, this.currentArtStyle);
          } catch (err) {
            console.error(`Error processing chunk ${i}:`, err);
          }
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
    this.processedChunks = [];
    this.emergencyReferenceImage = undefined;
    this.artDirector.clearContext();
  }
  
  setBufferSize(size: number): void {
    this.bufferSize = Math.max(1, Math.min(size, 10)); // Limit between 1 and 10
  }
  
  setVoiceId(voiceId: string): void {
    this.voiceId = voiceId;
  }

  private async waitForChunkReady(chunkIndex: number, maxWaitTime: number = 30000): Promise<void> {
    // Wait for the previous chunk to be fully processed to ensure proper image chain
    const chunk = this.processedChunks[chunkIndex];
    if (!chunk) {
      console.warn(`⚠️ Chunk ${chunkIndex} does not exist, cannot wait for it`);
      return;
    }

    const bufferItem = this.buffer.get(chunk.id);
    if (!bufferItem) {
      console.warn(`⚠️ Buffer item for chunk ${chunkIndex} does not exist`);
      return;
    }

    if (bufferItem.isReady) {
      console.log(`✅ Chunk ${chunkIndex} already ready`);
      return;
    }

    console.log(`⏳ Waiting for chunk ${chunkIndex} to be ready for character consistency...`);
    
    const startTime = Date.now();
    while (!bufferItem.isReady && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Check every 100ms
    }

    if (!bufferItem.isReady) {
      console.warn(`⚠️ Timeout waiting for chunk ${chunkIndex} - proceeding without previous image`);
    } else {
      console.log(`✅ Chunk ${chunkIndex} is ready, continuing with character consistency`);
    }
  }
}