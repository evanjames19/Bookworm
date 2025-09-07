<<<<<<< HEAD
=======
export interface BookVersion {
  id: string;
  name: string;
  artStyle: string;
  chunks: TextChunk[];
  createdAt: string;
}

>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
export interface Book {
  id: string;
  title: string;
  content: string;
  lastPosition: number;
<<<<<<< HEAD
  createdAt: Date;
  updatedAt: Date;
=======
  createdAt: string;
  updatedAt: string;
  savedVersions?: BookVersion[];
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
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