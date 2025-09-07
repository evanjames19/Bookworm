import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, BookVersion, TextChunk, Character, PlaybackState } from '../types';

export type ArtStyle = 'realistic' | 'cinematic' | 'artistic' | 'anime' | 'vintage';

interface AppState {
  books: Book[];
  currentBook: Book | null;
  chunks: TextChunk[];
  currentChunk: TextChunk | null;
  characters: Record<string, Character>;
  playbackState: PlaybackState;
  isLoading: boolean;
  loadingMessage: string;
  artStyle: ArtStyle;
  
  setBooks: (books: Book[]) => void;
  addBook: (book: Book) => void;
  removeBook: (bookId: string) => void;
  setCurrentBook: (book: Book | null) => void;
  setChunks: (chunks: TextChunk[]) => void;
  setCurrentChunk: (chunk: TextChunk | null) => void;
  updateCharacter: (name: string, character: Character) => void;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  setArtStyle: (style: ArtStyle) => void;
  saveBookVersion: (versionName: string) => Promise<void>;
  loadBookVersion: (bookId: string, versionId: string) => Promise<void>;
  saveProgress: () => Promise<void>;
  loadBooks: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  books: [],
  currentBook: null,
  chunks: [],
  currentChunk: null,
  characters: {},
  playbackState: {
    isPlaying: false,
    currentChunkIndex: 0,
    currentPosition: 0,
    duration: 0,
  },
  isLoading: false,
  loadingMessage: '',
  artStyle: 'realistic',

  setBooks: (books) => set({ books }),
  
  addBook: async (book) => {
    const books = [...get().books, book];
    set({ books });
    await AsyncStorage.setItem('books', JSON.stringify(books));
  },
  
  removeBook: async (bookId) => {
    const books = get().books.filter(book => book.id !== bookId);
    set({ books });
    await AsyncStorage.setItem('books', JSON.stringify(books));
    
    // Also remove any saved progress for this book
    try {
      await AsyncStorage.removeItem(`progress_${bookId}`);
    } catch (error) {
      console.error('Error removing book progress:', error);
    }
  },
  
  setCurrentBook: (book) => set({ currentBook: book }),
  
  setChunks: (chunks) => set({ chunks }),
  
  setCurrentChunk: (chunk) => set({ currentChunk: chunk }),
  
  updateCharacter: (name, character) => {
    const characters = { ...get().characters, [name]: character };
    set({ characters });
  },
  
  setPlaybackState: (state) => {
    const playbackState = { ...get().playbackState, ...state };
    set({ playbackState });
  },
  
  setLoading: (isLoading, message = '') => {
    set({ isLoading, loadingMessage: message });
  },
  
  setArtStyle: (style) => {
    set({ artStyle: style });
    AsyncStorage.setItem('artStyle', style);
  },

  saveBookVersion: async (versionName: string) => {
    const { currentBook, chunks, artStyle } = get();
    if (!currentBook || chunks.length === 0) {
      console.warn('No book or chunks to save version');
      return;
    }

    const version: BookVersion = {
      id: `version_${Date.now()}`,
      name: versionName,
      artStyle: artStyle,
      chunks: chunks.map(chunk => ({
        ...chunk,
        // Only include audio/image URLs if they exist and aren't placeholders
        audioUrl: chunk.audioUrl && !chunk.audioUrl.includes('placeholder') ? chunk.audioUrl : undefined,
        imageUrl: chunk.imageUrl && !chunk.imageUrl.includes('picsum.photos') ? chunk.imageUrl : undefined,
      })),
      createdAt: new Date().toISOString(),
    };

    const updatedBooks = get().books.map(book => {
      if (book.id === currentBook.id) {
        const existingVersions = book.savedVersions || [];
        return {
          ...book,
          savedVersions: [...existingVersions, version],
          updatedAt: new Date().toISOString(),
        };
      }
      return book;
    });

    set({ books: updatedBooks });
    await AsyncStorage.setItem('books', JSON.stringify(updatedBooks));
    console.log(`✅ Saved book version: ${versionName}`);
  },

  loadBookVersion: async (bookId: string, versionId: string) => {
    const { books } = get();
    const book = books.find(b => b.id === bookId);
    if (!book?.savedVersions) {
      console.warn('Book or saved versions not found');
      return;
    }

    const version = book.savedVersions.find(v => v.id === versionId);
    if (!version) {
      console.warn('Version not found');
      return;
    }

    // Load the version's chunks and art style
    set({ 
      chunks: version.chunks,
      artStyle: version.artStyle as ArtStyle,
      currentBook: book,
    });
    console.log(`✅ Loaded book version: ${version.name}`);
  },
  
  saveProgress: async () => {
    const { currentBook, playbackState } = get();
    if (currentBook) {
      const progress = {
        bookId: currentBook.id,
        position: playbackState.currentChunkIndex,
      };
      await AsyncStorage.setItem(`progress_${currentBook.id}`, JSON.stringify(progress));
    }
  },
  
  loadBooks: async () => {
    try {
      const booksJson = await AsyncStorage.getItem('books');
      if (booksJson) {
        const books = JSON.parse(booksJson);
        set({ books });
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  },
}));