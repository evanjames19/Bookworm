import { TextChunk } from '../types';

<<<<<<< HEAD
const CHUNK_TARGET_SIZE = 200; // Target words per chunk
const MIN_CHUNK_SIZE = 100;
const MAX_CHUNK_SIZE = 300;

export const chunkText = (text: string): TextChunk[] => {
  const chunks: TextChunk[] = [];
  const paragraphs = text.split(/\n\n+/);
=======
const CHUNK_TARGET_SIZE = 100; // Target words per chunk - reduced for shorter texts
const MIN_CHUNK_SIZE = 50;  // Minimum words per chunk
const MAX_CHUNK_SIZE = 200; // Maximum words per chunk - reduced for better chunking

export const chunkText = (text: string): TextChunk[] => {
  const chunks: TextChunk[] = [];
  
  console.log(`🔍 Text chunking: ${text.length} characters, ${text.split(/\s+/).length} words`);
  
  // First try paragraph-based chunking, then fallback to sentence-based if no paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  console.log(`📄 Found ${paragraphs.length} paragraphs`);
  
  if (paragraphs.length <= 1) {
    // No clear paragraph breaks, use sentence-based chunking
    console.log('🔄 Using sentence-based chunking (no paragraph breaks found)');
    return chunkBySentences(text);
  }
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  
  let currentChunk = '';
  let currentStartIndex = 0;
  let currentWordCount = 0;
  let chunkId = 0;
<<<<<<< HEAD
=======
  let textPosition = 0; // Track our position in the original text
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph) continue;
    
<<<<<<< HEAD
=======
    // Find the actual position of this paragraph in the text
    const paragraphStart = text.indexOf(paragraph, textPosition);
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
    const paragraphWords = paragraph.split(/\s+/).length;
    
    // If adding this paragraph would exceed max size, finish current chunk
    if (currentWordCount > 0 && currentWordCount + paragraphWords > MAX_CHUNK_SIZE) {
<<<<<<< HEAD
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
=======
      const chunkText = currentChunk.trim();
      chunks.push({
        id: `chunk_${chunkId++}`,
        text: chunkText,
        startIndex: currentStartIndex,
        endIndex: paragraphStart,
      });
      
      // Start new chunk
      currentChunk = paragraph;
      currentStartIndex = paragraphStart;
      currentWordCount = paragraphWords;
    } else {
      // Add paragraph to current chunk
      if (currentChunk === '') {
        // First paragraph in chunk
        currentChunk = paragraph;
        currentStartIndex = paragraphStart;
      } else {
        // Add with spacing
        currentChunk += '\n\n' + paragraph;
      }
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      currentWordCount += paragraphWords;
      
      // If we've reached target size and at a good breaking point, create chunk
      if (currentWordCount >= CHUNK_TARGET_SIZE && isNaturalBreak(paragraph)) {
<<<<<<< HEAD
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
=======
        const chunkText = currentChunk.trim();
        chunks.push({
          id: `chunk_${chunkId++}`,
          text: chunkText,
          startIndex: currentStartIndex,
          endIndex: paragraphStart + paragraph.length,
        });
        
        // Reset for next chunk
        currentChunk = '';
        currentWordCount = 0;
      }
    }
    
    // Update our position in the text
    textPosition = paragraphStart + paragraph.length;
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  }
  
  // Add any remaining text as final chunk
  if (currentChunk.trim()) {
<<<<<<< HEAD
    chunks.push({
      id: `chunk_${chunkId++}`,
      text: currentChunk.trim(),
=======
    const chunkText = currentChunk.trim();
    chunks.push({
      id: `chunk_${chunkId++}`,
      text: chunkText,
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      startIndex: currentStartIndex,
      endIndex: text.length,
    });
  }
  
<<<<<<< HEAD
  return chunks;
};

=======
  // Fallback: if still only one chunk, force sentence-based splitting
  if (chunks.length <= 1) {
    console.log('⚠️ Paragraph chunking failed, using sentence chunking');
    return chunkBySentences(text);
  }
  
  console.log(`✅ Successfully created ${chunks.length} chunks using paragraph-based chunking`);
  return chunks;
};

// Fallback chunker that splits by sentences when paragraphs don't work
function chunkBySentences(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  // Split by sentences while preserving punctuation using positive lookahead
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  console.log(`📝 Sentence-based chunking: found ${sentences.length} sentences`);
  
  let currentChunk = '';
  let currentStartIndex = 0;
  let currentWordCount = 0;
  let chunkId = 0;
  let textPosition = 0; // Track our position in the original text
  
  for (const sentence of sentences) {
    const sentenceStart = text.indexOf(sentence, textPosition);
    const sentenceWords = sentence.split(/\s+/).length;
    
    // If adding this sentence would exceed max size, finish current chunk
    if (currentWordCount > 0 && currentWordCount + sentenceWords > MAX_CHUNK_SIZE) {
      const chunkText = currentChunk.trim();
      chunks.push({
        id: `chunk_${chunkId++}`,
        text: chunkText,
        startIndex: currentStartIndex,
        endIndex: sentenceStart,
      });
      
      // Start new chunk
      currentChunk = sentence;
      currentStartIndex = sentenceStart;
      currentWordCount = sentenceWords;
    } else {
      // Add sentence to current chunk
      if (currentChunk === '') {
        // First sentence in chunk
        currentChunk = sentence;
        currentStartIndex = sentenceStart;
      } else {
        // Add with space
        currentChunk += ' ' + sentence;
      }
      currentWordCount += sentenceWords;
      
      // Create chunk if we've reached target size OR if we have multiple sentences and min size
      const shouldCreateChunk = currentWordCount >= CHUNK_TARGET_SIZE || 
                               (currentWordCount >= MIN_CHUNK_SIZE && currentChunk.split(/[.!?]/).length >= 2);
      
      if (shouldCreateChunk) {
        const chunkText = currentChunk.trim();
        chunks.push({
          id: `chunk_${chunkId++}`,
          text: chunkText,
          startIndex: currentStartIndex,
          endIndex: sentenceStart + sentence.length,
        });
        
        // Reset for next chunk
        currentChunk = '';
        currentWordCount = 0;
      }
    }
    
    // Update our position in the text
    textPosition = sentenceStart + sentence.length;
  }
  
  // Add any remaining text as final chunk
  if (currentChunk.trim()) {
    const chunkText = currentChunk.trim();
    chunks.push({
      id: `chunk_${chunkId++}`,
      text: chunkText,
      startIndex: currentStartIndex,
      endIndex: text.length,
    });
  }
  
  console.log(`✅ Sentence chunking created ${chunks.length} chunks`);
  return chunks;
}

>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
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