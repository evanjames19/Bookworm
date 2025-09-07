import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, TextChunk, Character, PlaybackState } from '../types';

interface AppState {
  books: Book[];
  currentBook: Book | null;
  chunks: TextChunk[];
  currentChunk: TextChunk | null;
  characters: Record<string, Character>;
  playbackState: PlaybackState;
  isLoading: boolean;
  loadingMessage: string;
  
  setBooks: (books: Book[]) => void;
  addBook: (book: Book) => void;
  setCurrentBook: (book: Book | null) => void;
  setChunks: (chunks: TextChunk[]) => void;
  setCurrentChunk: (chunk: TextChunk | null) => void;
  updateCharacter: (name: string, character: Character) => void;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
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

  setBooks: (books) => set({ books }),
  
  addBook: async (book) => {
    const books = [...get().books, book];
    set({ books });
    await AsyncStorage.setItem('books', JSON.stringify(books));
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