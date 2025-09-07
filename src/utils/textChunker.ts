import { TextChunk } from '../types';

const CHUNK_TARGET_SIZE = 200; // Target words per chunk
const MIN_CHUNK_SIZE = 100;
const MAX_CHUNK_SIZE = 300;

export const chunkText = (text: string): TextChunk[] => {
  const chunks: TextChunk[] = [];
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = '';
  let currentStartIndex = 0;
  let currentWordCount = 0;
  let chunkId = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph) continue;
    
    const paragraphWords = paragraph.split(/\s+/).length;
    
    // If adding this paragraph would exceed max size, finish current chunk
    if (currentWordCount > 0 && currentWordCount + paragraphWords > MAX_CHUNK_SIZE) {
      chunks.push({
        id: `chunk_${chunkId++}`,
        text: currentChunk.trim(),
        startIndex: currentStartIndex,
        endIndex: currentStartIndex + currentChunk.length,
      });
      
      currentChunk = paragraph;
      currentStartIndex = text.indexOf(paragraph, currentStartIndex + currentChunk.length);
      currentWordCount = paragraphWords;
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentWordCount += paragraphWords;
      
      // If we've reached target size and at a good breaking point, create chunk
      if (currentWordCount >= CHUNK_TARGET_SIZE && isNaturalBreak(paragraph)) {
        chunks.push({
          id: `chunk_${chunkId++}`,
          text: currentChunk.trim(),
          startIndex: currentStartIndex,
          endIndex: currentStartIndex + currentChunk.length,
        });
        
        currentChunk = '';
        currentStartIndex = currentStartIndex + currentChunk.length;
        currentWordCount = 0;
      }
    }
  }
  
  // Add any remaining text as final chunk
  if (currentChunk.trim()) {
    chunks.push({
      id: `chunk_${chunkId++}`,
      text: currentChunk.trim(),
      startIndex: currentStartIndex,
      endIndex: text.length,
    });
  }
  
  return chunks;
};

function isNaturalBreak(text: string): boolean {
  // Check if paragraph ends with sentence-ending punctuation
  const lastChar = text.trim().slice(-1);
  return ['.', '!', '?', '"', "'"].includes(lastChar);
}

export const findChunkForPosition = (chunks: TextChunk[], position: number): number => {
  for (let i = 0; i < chunks.length; i++) {
    if (position >= chunks[i].startIndex && position <= chunks[i].endIndex) {
      return i;
    }
  }
  return 0;
};