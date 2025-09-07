export interface BookVersion {
  id: string;
  name: string;
  artStyle: string;
  chunks: TextChunk[];
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  content: string;
  lastPosition: number;
  createdAt: string;
  updatedAt: string;
  savedVersions?: BookVersion[];
}

export interface TextChunk {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  sceneDescription?: string;
  imagePrompt?: string;
  audioUrl?: string;
  imageUrl?: string;
}

export interface Character {
  name: string;
  description: string;
  lastMentioned?: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentChunkIndex: number;
  currentPosition: number;
  duration: number;
}