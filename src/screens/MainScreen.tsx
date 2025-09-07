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
  } = useStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(false);
  
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await addBook(newBook);
    setShowAddModal(false);
  };
  
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
        const firstChunk = await bufferManagerRef.current.getChunkContent(textChunks[0].id);
        if (firstChunk) {
          textChunks[0].audioUrl = firstChunk.audioUrl;
          textChunks[0].imageUrl = firstChunk.imageUrl;
          setCurrentChunk(textChunks[0]);
        }
      }
      
      setIsReaderMode(true);
      setLoading(false);
    } catch (error) {
      console.error('Error loading book:', error);
      Alert.alert('Error', 'Failed to load book');
      setLoading(false);
    }
  };
  
  const handleSkipForward = () => {
    const nextIndex = Math.min(
      playbackState.currentChunkIndex + 1,
      chunks.length - 1
    );
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
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <BookLibrary
        books={books}
        onSelectBook={handleSelectBook}
        onAddBook={() => setShowAddModal(true)}
      />
      <AddBookModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddBook={handleAddBook}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});