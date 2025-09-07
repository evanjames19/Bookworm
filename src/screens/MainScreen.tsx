import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useStore } from '../store';
import { ReaderView } from '../components/ReaderView';
import { PlaybackControls } from '../components/PlaybackControls';
import { BookLibrary } from '../components/BookLibrary';
import { AddBookModal } from '../components/AddBookModal';
<<<<<<< HEAD
=======
import { LoadingScreen } from '../components/LoadingScreen';
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
import { chunkText } from '../utils/textChunker';
import { ApiService } from '../services/apiService';
import { ArtDirector } from '../services/artDirector';
import { BufferManager } from '../services/bufferManager';
import { Book, TextChunk } from '../types';

export const MainScreen: React.FC = () => {
  const {
    books,
    currentBook,
    chunks,
    playbackState,
    setBooks,
    addBook,
    setCurrentBook,
    setChunks,
    setCurrentChunk,
    setPlaybackState,
    setLoading,
    loadBooks,
    saveProgress,
<<<<<<< HEAD
=======
    artStyle,
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  } = useStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(false);
<<<<<<< HEAD
  
  const apiServiceRef = useRef<ApiService>(new ApiService());
  const artDirectorRef = useRef<ArtDirector>(new ArtDirector());
  const bufferManagerRef = useRef<BufferManager | null>(null);
  
  useEffect(() => {
    loadBooks();
    
    // Initialize buffer manager
    bufferManagerRef.current = new BufferManager(
      apiServiceRef.current,
      artDirectorRef.current
    );
=======
  const [isSwitching, setIsSwitching] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBookLoading, setIsBookLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Bookworm...');
  
  const apiServiceRef = useRef<ApiService>(ApiService.getInstance());
  const artDirectorRef = useRef<ArtDirector>(new ArtDirector(ApiService.getInstance()));
  const bufferManagerRef = useRef<BufferManager | null>(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      const startTime = Date.now();
      
      setLoadingMessage('Loading your library...');
      setLoadingProgress(0.1);
      
      await loadBooks();
      setLoadingProgress(0.2);
      
      // Initialize buffer manager
      bufferManagerRef.current = new BufferManager(
        apiServiceRef.current,
        artDirectorRef.current
      );
      
      setLoadingMessage('Generating beautiful covers...');
      setLoadingProgress(0.3);
      
      // Wait for books to be loaded from storage first
      let currentBooks = books;
      let retries = 0;
      while (currentBooks.length === 0 && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        currentBooks = books;
        retries++;
      }
      
      // Process book covers for existing books
      if (currentBooks.length > 0) {
        console.log(`📚 Processing covers for ${currentBooks.length} books...`);
        
        // Process all covers with progress tracking
        let completedCovers = 0;
        const updateProgress = (isFromCache = false) => {
          completedCovers++;
          setLoadingProgress(0.3 + (0.6 * completedCovers) / currentBooks.length);
          const action = isFromCache ? 'Loading' : 'Creating';
          setLoadingMessage(`${action} covers... ${completedCovers}/${currentBooks.length}`);
        };
        
        // Process each cover individually to show proper progress
        for (const book of currentBooks) {
          try {
            const coverUri = await apiServiceRef.current.generateBookCover(book.title, book.content);
            const isFromCache = !coverUri.includes(`cover_${book.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}_${Date.now()}`);
            updateProgress(isFromCache);
          } catch (error) {
            console.error(`Error processing cover for ${book.title}:`, error);
            updateProgress(false);
          }
        }
        
        console.log(`🎉 All ${currentBooks.length} book covers processed`);
      } else {
        // No books, just animate progress
        setLoadingProgress(0.9);
      }
      
      setLoadingMessage('Welcome to Bookworm!');
      setLoadingProgress(1);
      
      // Ensure minimum 2 seconds loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(2000 - elapsedTime, 500); // At least 500ms to show completion
      
      setTimeout(() => {
        setIsInitialLoading(false);
        console.log(`🎉 Loading completed in ${Date.now() - startTime}ms`);
      }, remainingTime);
    };
    
    initializeApp();
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  }, []);
  
  useEffect(() => {
    if (currentBook && chunks.length > 0) {
      const currentChunk = chunks[playbackState.currentChunkIndex];
      setCurrentChunk(currentChunk);
      
      // Ensure next chunks are buffered
      bufferManagerRef.current?.ensureNextChunksReady(playbackState.currentChunkIndex);
    }
  }, [currentBook, chunks, playbackState.currentChunkIndex]);
  
  const handleAddBook = async (title: string, content: string) => {
    const newBook: Book = {
      id: Date.now().toString(),
      title,
      content,
      lastPosition: 0,
<<<<<<< HEAD
      createdAt: new Date(),
      updatedAt: new Date(),
=======
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
    };
    
    await addBook(newBook);
    setShowAddModal(false);
  };
<<<<<<< HEAD
  
  const handleSelectBook = async (book: Book) => {
    setLoading(true, 'Processing book...');
    
    try {
      setCurrentBook(book);
      
      // Chunk the text
      const textChunks = chunkText(book.content);
      setChunks(textChunks);
      
      // Initialize buffer
      if (bufferManagerRef.current) {
        setLoading(true, 'Preparing audio and visuals...');
        await bufferManagerRef.current.initializeBuffer(textChunks, 0);
        
        // Get the first chunk ready
=======

  const handleAddBookFromLibrary = async (book: Book) => {
    await addBook(book);
  };
  
  const handleSelectBook = async (book: Book) => {
    setIsBookLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Opening your story...');
    
    try {
      setCurrentBook(book);
      setLoadingProgress(0.2);
      
      // Chunk the text
      setLoadingMessage('Preparing chapters...');
      const textChunks = chunkText(book.content);
      console.log(`📚 Created ${textChunks.length} chunks from book content`);
      setChunks(textChunks);
      setLoadingProgress(0.4);
      
      // Initialize buffer
      if (bufferManagerRef.current) {
        setLoadingMessage('Generating audio and visuals...');
        await bufferManagerRef.current.initializeBuffer(textChunks, 0, artStyle, book.id);
        setLoadingProgress(0.8);
        
        // Get the first chunk ready
        setLoadingMessage('Finalizing experience...');
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
        const firstChunk = await bufferManagerRef.current.getChunkContent(textChunks[0].id);
        if (firstChunk) {
          textChunks[0].audioUrl = firstChunk.audioUrl;
          textChunks[0].imageUrl = firstChunk.imageUrl;
          setCurrentChunk(textChunks[0]);
        }
      }
      
<<<<<<< HEAD
      setIsReaderMode(true);
      setLoading(false);
    } catch (error) {
      console.error('Error loading book:', error);
      Alert.alert('Error', 'Failed to load book');
      setLoading(false);
    }
  };
  
  const handleSkipForward = () => {
=======
      setLoadingProgress(1);
      setLoadingMessage('Ready to begin!');
      
      // Small delay to show completion
      setTimeout(() => {
        setIsReaderMode(true);
        setIsBookLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('Error loading book:', error);
      Alert.alert('Error', 'Failed to load book. Please try again.');
      setIsBookLoading(false);
    }
  };
  
  const handleSkipForward = async () => {
    if (isSwitching) return; // Prevent rapid switching
    
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
    const nextIndex = Math.min(
      playbackState.currentChunkIndex + 1,
      chunks.length - 1
    );
<<<<<<< HEAD
    setPlaybackState({ currentChunkIndex: nextIndex });
  };
  
  const handleSkipBackward = () => {
    const prevIndex = Math.max(playbackState.currentChunkIndex - 1, 0);
    setPlaybackState({ currentChunkIndex: prevIndex });
  };
  
  const handleSeek = (position: number) => {
    setPlaybackState({ currentChunkIndex: position });
  };
  
  const handlePlaybackComplete = () => {
    // Auto-advance to next chunk
    if (playbackState.currentChunkIndex < chunks.length - 1) {
      handleSkipForward();
    } else {
      // Book finished
      setPlaybackState({ isPlaying: false });
      Alert.alert('Book Complete', 'You have reached the end of the book!');
    }
  };
  
  if (isReaderMode && currentBook) {
    return (
      <View style={styles.container}>
        <ReaderView onPlaybackComplete={handlePlaybackComplete} />
        <PlaybackControls
          totalChunks={chunks.length}
          onSkipForward={handleSkipForward}
          onSkipBackward={handleSkipBackward}
          onSeek={handleSeek}
        />
=======
    
    if (nextIndex !== playbackState.currentChunkIndex) {
      setIsSwitching(true);
      setPlaybackState({ currentChunkIndex: nextIndex });
      await switchToChunk(nextIndex);
      setTimeout(() => setIsSwitching(false), 1000); // 1 second debounce
    }
  };
  
  const handleSkipBackward = async () => {
    if (isSwitching) return; // Prevent rapid switching
    
    const prevIndex = Math.max(playbackState.currentChunkIndex - 1, 0);
    
    if (prevIndex !== playbackState.currentChunkIndex) {
      setIsSwitching(true);
      setPlaybackState({ currentChunkIndex: prevIndex });
      await switchToChunk(prevIndex);
      setTimeout(() => setIsSwitching(false), 1000); // 1 second debounce
    }
  };
  
  const handleSeek = async (position: number) => {
    if (isSwitching) return; // Prevent rapid switching
    
    const newIndex = Math.floor(position);
    
    if (newIndex !== playbackState.currentChunkIndex) {
      setIsSwitching(true);
      setPlaybackState({ currentChunkIndex: newIndex });
      await switchToChunk(newIndex);
      setTimeout(() => setIsSwitching(false), 1000); // 1 second debounce
    }
  };
  
  const switchToChunk = async (chunkIndex: number) => {
    if (chunkIndex >= 0 && chunkIndex < chunks.length && bufferManagerRef.current) {
      const chunk = chunks[chunkIndex];
      
      // Get content from buffer
      const chunkContent = await bufferManagerRef.current.getChunkContent(chunk.id);
      if (chunkContent && chunkContent.audioUrl && chunkContent.audioUrl !== 'placeholder_audio_path' && chunkContent.audioUrl !== '') {
        chunk.audioUrl = chunkContent.audioUrl;
        chunk.imageUrl = chunkContent.imageUrl;
        setCurrentChunk(chunk);
        
        console.log(`📖 Switched to chunk ${chunkIndex}: ${chunk.text.substring(0, 50)}...`);
        console.log(`🎵 Audio URL: ${chunkContent.audioUrl.substring(0, 50)}...`);
        console.log(`🖼️ Image URL from buffer: ${chunkContent.imageUrl}`);
      } else {
        console.warn(`⚠️ Chunk ${chunkIndex} not ready yet - no valid audio URL`);
        // Don't switch if audio isn't ready
        setPlaybackState({ isPlaying: false });
      }
    }
  };
  
  const handlePlaybackComplete = async () => {
    if (isAdvancing) {
      console.log('⚠️ Already advancing, ignoring duplicate completion event');
      return;
    }
    
    console.log('🎵 Playback completed for current chunk');
    setIsAdvancing(true);
    
    try {
      // Auto-advance to the next chunk if available
      const nextIndex = playbackState.currentChunkIndex + 1;
      if (nextIndex < chunks.length) {
        console.log(`🚀 Auto-advancing to chunk ${nextIndex + 1}/${chunks.length}`);
        
        // Check if next chunk is ready before advancing
        if (bufferManagerRef.current) {
          const nextChunk = chunks[nextIndex];
          const chunkContent = await bufferManagerRef.current.getChunkContent(nextChunk.id);
          
          if (chunkContent && chunkContent.audioUrl && chunkContent.audioUrl !== 'placeholder_audio_path' && chunkContent.audioUrl !== '') {
            // Next chunk is ready, advance
            setPlaybackState({ currentChunkIndex: nextIndex, isPlaying: true });
            await switchToChunk(nextIndex);
          } else {
            console.log(`⏳ Waiting for chunk ${nextIndex} to be ready...`);
            setPlaybackState({ isPlaying: false });
            
            // Try again in a few seconds
            setTimeout(async () => {
              const retryContent = await bufferManagerRef.current?.getChunkContent(nextChunk.id);
              if (retryContent && retryContent.audioUrl && retryContent.audioUrl !== 'placeholder_audio_path' && retryContent.audioUrl !== '') {
                console.log(`✅ Chunk ${nextIndex} now ready, advancing...`);
                setPlaybackState({ currentChunkIndex: nextIndex, isPlaying: true });
                await switchToChunk(nextIndex);
              } else {
                console.log(`❌ Chunk ${nextIndex} still not ready after waiting`);
              }
            }, 3000);
          }
        }
      } else {
        console.log('📖 Reached end of story');
        setPlaybackState({ isPlaying: false });
      }
    } finally {
      // Reset the advancing flag after a shorter delay for more natural transitions  
      setTimeout(() => {
        setIsAdvancing(false);
      }, 500);
    }
  };
  
  const handleViewModeChange = (isImmersive: boolean, viewMode?: 'image' | 'text') => {
    if (!isImmersive) {
      // Exit reader mode and go back to library
      setIsReaderMode(false);
      setCurrentBook(null);
      setChunks([]);
      setCurrentChunk(null);
      setPlaybackState({ isPlaying: false, currentChunkIndex: 0 });
    } else {
      // Hide controls only in image mode, show them in text mode
      setShowControls(viewMode === 'text');
    }
  };
  
  // Show loading screen while initializing or loading a book
  if (isInitialLoading || isBookLoading) {
    return (
      <LoadingScreen 
        progress={loadingProgress} 
        message={loadingMessage} 
      />
    );
  }
  
  if (isReaderMode && currentBook) {
    return (
      <View style={styles.container}>
        <ReaderView 
          onPlaybackComplete={handlePlaybackComplete} 
          onViewModeChange={handleViewModeChange}
        />
        {showControls && (
          <PlaybackControls
            totalChunks={chunks.length}
            onSkipForward={handleSkipForward}
            onSkipBackward={handleSkipBackward}
            onSeek={handleSeek}
          />
        )}
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      </View>
    );
  }
  
  return (
<<<<<<< HEAD
    <SafeAreaView style={styles.container}>
      <BookLibrary
        books={books}
        onSelectBook={handleSelectBook}
        onAddBook={() => setShowAddModal(true)}
=======
    <View style={styles.container}>
      <BookLibrary
        books={books}
        onSelectBook={handleSelectBook}
        onAddBook={handleAddBookFromLibrary}
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      />
      <AddBookModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddBook={handleAddBook}
      />
<<<<<<< HEAD
    </SafeAreaView>
=======
    </View>
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});