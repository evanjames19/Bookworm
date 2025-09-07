import axios from 'axios';
import * as FileSystem from 'expo-file-system';

interface ApiConfig {
  elevenLabsApiKey?: string;
  imageApiKey?: string;
  openAiApiKey?: string;
}

export class ApiService {
  private config: ApiConfig;
  private audioCache: Map<string, string> = new Map();
  private imageCache: Map<string, string> = new Map();
  
  constructor(config: ApiConfig = {}) {
    this.config = config;
  }
  
  setConfig(config: ApiConfig): void {
    this.config = { ...this.config, ...config };
  }
  
  async generateAudio(text: string, voiceId: string = 'EXAVITQu4vr4xnSDxMaL'): Promise<string> {
    // Check cache first
    const cacheKey = `${text.substring(0, 50)}_${voiceId}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }
    
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.config.elevenLabsApiKey || '',
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );
      
      // Save audio to local file system
      const audioFileName = `audio_${Date.now()}.mp3`;
      const audioPath = `${FileSystem.documentDirectory}${audioFileName}`;
      
      const audioBase64 = Buffer.from(response.data).toString('base64');
      await FileSystem.writeAsStringAsync(audioPath, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      this.audioCache.set(cacheKey, audioPath);
      return audioPath;
    } catch (error) {
      console.error('Error generating audio:', error);
      throw error;
    }
  }
  
  async generateImage(prompt: string): Promise<string> {
    // Check cache first
    const cacheKey = prompt.substring(0, 100);
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }
    
    try {
      // Using Google's Gemini API for fast image generation
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        {
          contents: [{
            parts: [{
              text: `Generate an image: ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.config.imageApiKey || '',
          },
          params: {
            key: this.config.imageApiKey
          }
        }
      );
      
      // For prototype, we'll use a placeholder image service
      // In production, you'd parse the actual image from the response
      const placeholderUrl = await this.getPlaceholderImage(prompt);
      
      this.imageCache.set(cacheKey, placeholderUrl);
      return placeholderUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      // Fallback to placeholder
      return this.getPlaceholderImage(prompt);
    }
  }
  
  private async getPlaceholderImage(prompt: string): Promise<string> {
    // Using Unsplash for placeholder images based on keywords
    const keywords = this.extractKeywords(prompt);
    const query = keywords.join(',');
    
    // For demo purposes, using a stable image URL
    // In production, you'd want to use actual image generation API
    const imageUrls = [
      'https://picsum.photos/400/600?random=1',
      'https://picsum.photos/400/600?random=2',
      'https://picsum.photos/400/600?random=3',
    ];
    
    // Select image based on prompt hash for consistency
    const index = prompt.charCodeAt(0) % imageUrls.length;
    return imageUrls[index];
  }
  
  private extractKeywords(prompt: string): string[] {
    const keywords = prompt
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(word => word.length > 4)
      .slice(0, 3);
    
    return keywords.length > 0 ? keywords : ['landscape'];
  }
  
  async prefetchAudio(texts: string[], voiceId?: string): Promise<void> {
    const promises = texts.map(text => 
      this.generateAudio(text, voiceId).catch(err => 
        console.error('Error prefetching audio:', err)
      )
    );
    
    await Promise.all(promises);
  }
  
  async prefetchImages(prompts: string[]): Promise<void> {
    const promises = prompts.map(prompt => 
      this.generateImage(prompt).catch(err => 
        console.error('Error prefetching image:', err)
      )
    );
    
    await Promise.all(promises);
  }
  
  clearCache(): void {
    this.audioCache.clear();
    this.imageCache.clear();
  }
}