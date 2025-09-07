import axios from 'axios';
import * as FileSystem from 'expo-file-system';
<<<<<<< HEAD

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
=======
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ELEVENLABS_API_KEY, GOOGLE_API_KEY, ELEVENLABS_VOICE_ID } from '@env';

export class ApiService {
  private static instance: ApiService;
  private audioCache: Map<string, string> = new Map();
  private imageCache: Map<string, string> = new Map();
  private isProcessingAudio = false;
  private audioRequestDelay = 2000; // 2 second delay between requests
  private cacheLoaded = false;
  private lastImageRequestTime = 0;
  private imageRequestDelay = 1500; // 1.5 second delay between image requests
  private imageFailureCount = 0;
  private useSimpleMode = false;

  private constructor() {
    this.loadCoverCache();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async loadCoverCache(): Promise<void> {
    try {
      const cachedCovers = await AsyncStorage.getItem('bookCovers');
      if (cachedCovers) {
        const coverMap = JSON.parse(cachedCovers);
        this.imageCache = new Map(Object.entries(coverMap));
        console.log(`📚 Loaded ${this.imageCache.size} cached book covers`);
      }
      this.cacheLoaded = true;
    } catch (error) {
      console.error('Error loading cover cache:', error);
      this.cacheLoaded = true;
    }
  }

  async waitForCacheLoad(): Promise<void> {
    while (!this.cacheLoaded) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private async saveCoverCache(): Promise<void> {
    try {
      const coverObject = Object.fromEntries(this.imageCache);
      await AsyncStorage.setItem('bookCovers', JSON.stringify(coverObject));
    } catch (error) {
      console.error('Error saving cover cache:', error);
    }
  }
  
  // Audio directory for persistent storage
  private readonly audioDir = `${FileSystem.documentDirectory}audio/`;
  
  async generateAudio(text: string, bookId: string, chunkId: string, voiceId: string = ELEVENLABS_VOICE_ID): Promise<string> {
    // Create persistent audio filename based on book and chunk
    const audioFileName = `${bookId}_${chunkId}_${voiceId}.mp3`;
    const audioPath = `${this.audioDir}${audioFileName}`;
    
    // Check if audio file already exists and is valid
    const existingAudio = await this.checkExistingAudio(audioPath);
    if (existingAudio) {
      // Verify the file is not corrupted (has reasonable size)
      const fileInfo = await FileSystem.getInfoAsync(audioPath);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > 1000) { // At least 1KB
        console.log(`🎵 Using existing audio for ${chunkId}:`, audioPath);
        return audioPath;
      } else {
        console.log(`🗑️ Removing corrupted audio file: ${audioPath}`);
        await FileSystem.deleteAsync(audioPath, { idempotent: true });
      }
    }
    
    // Check memory cache as fallback
    const cacheKey = `${bookId}_${chunkId}_${voiceId}`;
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }
    
    try {
<<<<<<< HEAD
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
=======
      console.log('🔊 Generating audio...', text.substring(0, 50));
      console.log('🔑 API Key length:', ELEVENLABS_API_KEY?.length || 'undefined');
      console.log('🔑 API Key starts with:', ELEVENLABS_API_KEY?.substring(0, 10) || 'undefined');
      console.log('🔑 Voice ID:', voiceId);
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );
      
      if (!response.ok) {
        // Get the detailed error response
        const errorText = await response.text();
        console.error(`HTTP ${response.status} Details:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      // Ensure audio directory exists
      await this.ensureAudioDirectoryExists();
      
      // Get audio data as ArrayBuffer (React Native compatible)
      console.log(`💾 Saving audio file: ${audioFileName}`);
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`📊 Audio data size: ${arrayBuffer.byteLength} bytes`);
      
      // Convert ArrayBuffer to base64 using a more reliable method
      const bytes = new Uint8Array(arrayBuffer);
      const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
      const base64String = btoa(binary);
      
      await FileSystem.writeAsStringAsync(audioPath, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Verify file was created correctly
      const fileInfo = await FileSystem.getInfoAsync(audioPath);
      console.log(`✅ Audio file saved: ${audioPath}, size: ${fileInfo.size} bytes`);
      
      this.audioCache.set(cacheKey, audioPath);
      console.log(`✅ Audio generated and saved: ${audioFileName}`);
      return audioPath;
      
    } catch (error: any) {
      console.error('Audio generation failed:', error?.message || error);
      return 'placeholder_audio_path';
    }
  }
  
  // Removed processAudioQueue to prevent stack overflow
  
  private async makeAudioRequest(text: string, voiceId: string, cacheKey: string): Promise<string> {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text.substring(0, 500), // Limit text length to avoid long requests
          model_id: 'eleven_multilingual_v2',
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
<<<<<<< HEAD
            'xi-api-key': this.config.elevenLabsApiKey || '',
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
=======
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
        }
      );
      
      // Save audio to local file system
      const audioFileName = `audio_${Date.now()}.mp3`;
      const audioPath = `${FileSystem.documentDirectory}${audioFileName}`;
      
<<<<<<< HEAD
      const audioBase64 = Buffer.from(response.data).toString('base64');
=======
      // Convert ArrayBuffer to base64
      const audioBuffer = new Uint8Array(response.data);
      const audioBase64 = btoa(String.fromCharCode.apply(null, Array.from(audioBuffer)));
      
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      await FileSystem.writeAsStringAsync(audioPath, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      this.audioCache.set(cacheKey, audioPath);
      return audioPath;
<<<<<<< HEAD
    } catch (error) {
      console.error('Error generating audio:', error);
=======
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('Rate limited by ElevenLabs, waiting longer...');
        this.audioRequestDelay = Math.min(this.audioRequestDelay * 1.5, 10000); // Increase delay up to 10s
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        return this.makeAudioRequest(text, voiceId, cacheKey); // Retry once
      }
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      throw error;
    }
  }
  
<<<<<<< HEAD
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
=======
  async generateImagePrompt(text: string, artStyle: string = 'realistic', characterInfo: string = ''): Promise<string> {
    try {
      // Art style specific instructions
      const artStyleInstructions = {
        realistic: 'Create a photorealistic scene with natural lighting and authentic human features',
        cinematic: 'Create a cinematic, movie-quality scene with dramatic lighting and professional composition',
        artistic: 'Create an artistic, painterly scene with rich colors and expressive brushwork',
        anime: 'Create a high-quality anime-style scene with detailed character designs and vibrant colors',
        vintage: 'Create a vintage-style scene with classic composition and nostalgic atmosphere'
      };

      const promptInstructions = `Create a simple, direct image prompt based on this text. Return ONLY the prompt, no formatting, no explanations.

Text: "${text}"
Art style: ${artStyle}
${characterInfo ? `Character info: ${characterInfo}` : ''}

Requirements:
- Single scene from the text
- ${artStyleInstructions[artStyle as keyof typeof artStyleInstructions] || artStyleInstructions.realistic}
- No text or speech bubbles in image
- Professional quality

Return only a simple image prompt (no markdown, no headers):`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
        {
          contents: [{
            parts: [{
              text: promptInstructions
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            maxOutputTokens: 300,
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
<<<<<<< HEAD
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
=======
            'x-goog-api-key': GOOGLE_API_KEY,
          },
          timeout: 30000,
        }
      );
      
      const generatedPrompt = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedPrompt) {
        // Clean the prompt - remove markdown formatting and keep it simple
        let cleanPrompt = generatedPrompt.trim()
          .replace(/^#+\s*/gm, '') // Remove markdown headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
          .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
          .replace(/^-\s*/gm, '') // Remove bullet points
          .replace(/\n+/g, ' ') // Replace newlines with spaces
          .replace(/\s+/g, ' ') // Normalize spaces
          .substring(0, 300); // Keep reasonable length
        
        console.log(`🤖 Clean prompt generated: ${cleanPrompt.substring(0, 100)}...`);
        return cleanPrompt;
      }
      
      // Enhanced fallback with art style
      return `${artStyle} style scene depicting: ${text.substring(0, 150)}. Professional quality, detailed character design, no speech bubbles or text.`;
    } catch (error) {
      console.error('Error generating image prompt with LLM:', error);
      return `${artStyle} scene depicting: ${text.substring(0, 100)}. No speech bubbles or text.`;
    }
  }
  
  async generateImage(prompt: string, previousImagePath?: string): Promise<string> {
    // Create unique cache key using prompt + timestamp to ensure each chunk gets unique images
    // Don't use caching for story images to ensure variety and uniqueness
    const cacheKey = `${prompt.substring(0, 100)}_${Date.now()}`;
    console.log(`🎨 Generating fresh image (no cache) for unique story visuals`);
    
    // Check if we should use simple mode due to repeated failures
    if (this.imageFailureCount >= 3) {
      console.log(`⚠️ Switching to simple mode after ${this.imageFailureCount} failures`);
      this.useSimpleMode = true;
    }
    
    // Skip cache check for story images to ensure each chunk gets a unique image
    
    try {
      // PREVENTION MEASURE 6: Rate limiting to avoid overwhelming the API
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastImageRequestTime;
      if (timeSinceLastRequest < this.imageRequestDelay) {
        const waitTime = this.imageRequestDelay - timeSinceLastRequest;
        console.log(`⏱️ Rate limiting: waiting ${waitTime}ms before image generation`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.lastImageRequestTime = Date.now();
      
      // Check API key first
      if (!GOOGLE_API_KEY) {
        console.error('🚨 Missing GOOGLE_API_KEY - cannot generate images');
        return this.getPlaceholderImage(prompt);
      }
      
      // Use ultra-simple mode if we've had too many failures
      if (this.useSimpleMode) {
        return await this.generateImageSimpleMode(prompt);
      }
      
      // PREVENTION: Validate and clean the prompt before processing
      const validatedPrompt = await this.validateAndCleanPrompt(prompt);
      
      // Prepare the contents array for Gemini - structure is critical for character consistency
      const contents: any[] = [];
      
      // If we have a previous image for character consistency, include it FIRST
      let enhancedPrompt = validatedPrompt;
      if (previousImagePath && previousImagePath.startsWith('file://')) {
        try {
          const imagePath = previousImagePath.replace('file://', '');
          const imageBase64 = await FileSystem.readAsStringAsync(imagePath, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // PREVENTION MEASURE 4: Validate image data before sending
          const isValidImage = await this.validateImageData(imageBase64);
          if (isValidImage) {
            // CRITICAL FIX: Send image and text in a SINGLE message part to avoid confusion
            const basePrompt = prompt.length > 200 ? prompt.substring(0, 200) + '...' : prompt;
            enhancedPrompt = `Create an illustration of: ${basePrompt}

Use the same character designs as shown in the reference image above. Maintain identical character appearances, facial features, clothing and visual style while changing only the scene or setting. Frame characters prominently with rich environmental details and atmospheric depth.`;

            // Add the previous image with proper role structure
            contents.push({
              role: "user",
              parts: [{
                inline_data: {
                  mime_type: "image/png", 
                  data: imageBase64
                }
              }]
            });
          } else {
            console.warn('⚠️ Skipping invalid previous image to prevent 400 error');
            // Fall back to text-only generation for safety
            enhancedPrompt = `${validatedPrompt}. Professional art style, consistent character design.`;
          }
          
          console.log('🎨 Using previous image for character consistency with editing approach');
        } catch (imageError) {
          console.warn('Could not load previous image for consistency:', imageError);
          // Fallback to text-only generation
          enhancedPrompt = `${prompt}
          
Art style: Professional, consistent visual quality, detailed character designs`;
        }
      } else {
        // First image in sequence - establish character designs (with length limits)
        const basePrompt = prompt.length > 300 ? prompt.substring(0, 300) + '...' : prompt;
        enhancedPrompt = `${basePrompt}

ESTABLISH CHARACTER DESIGNS:
- Create memorable, distinctive character appearances
- Detailed facial features, hair, clothing, and visual style
- Professional art quality that can be maintained in subsequent images
- Consistent visual style throughout
- FRAME characters prominently in the center of the image, fully visible
- ADD rich environmental details, background elements, and atmospheric depth`;
      }
      
      // Add the text prompt with proper role - now separated from image for better content filtering
      contents.push({
        role: "user",
        parts: [{
          text: enhancedPrompt
        }]
      });
      
      // Use Google's Gemini 2.5 Flash Image Preview model with character consistency
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`,
        {
          contents: contents,
          generationConfig: this.getOptimizedGenerationConfig(false),
          safetySettings: this.getSafetySettings()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GOOGLE_API_KEY,
          },
          timeout: 60000, // 60 second timeout for images
        }
      );
      
      // Extract image from response following the Python code pattern
      const candidates = response.data?.candidates;
      console.log('🔍 Gemini response debug - candidates count:', candidates?.length || 0);
      
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0];
        console.log('🔍 Candidate structure:', {
          hasContent: !!candidate.content,
          partsCount: candidate.content?.parts?.length || 0,
          finishReason: candidate.finishReason,
          safetyRatings: candidate.safetyRatings?.length || 0,
          safetyDetails: candidate.safetyRatings?.map(sr => `${sr.category}: ${sr.probability}`) || []
        });
        
        // Check if content was blocked by safety filters
        if (candidate.finishReason === 'SAFETY') {
          console.warn('🚨 Content was blocked by safety filters:', 
            candidate.safetyRatings?.map(sr => `${sr.category}: ${sr.probability}`) || 'unknown');
        } else if (candidate.finishReason === 'RECITATION') {
          console.warn('🚨 Content was blocked due to recitation concerns');
        } else if (candidate.finishReason !== 'STOP') {
          console.warn('🚨 Generation stopped unexpectedly:', candidate.finishReason);
        }
        
        const parts = candidate.content?.parts;
        if (parts && parts.length > 0) {
          console.log('🔍 Parts debug:', parts.map((part, i) => ({
            index: i,
            hasText: !!part.text,
            hasInlineData: !!part.inlineData,
            inlineDataType: part.inlineData?.mime_type,
            dataLength: part.inlineData?.data?.length || 0
          })));
          
          for (const part of parts) {
            if (part.inlineData?.data) {
              // Save image to local file system
              const imageFileName = `image_${Date.now()}.png`;
              const imagePath = `${FileSystem.documentDirectory}${imageFileName}`;
              
              await FileSystem.writeAsStringAsync(imagePath, part.inlineData.data, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              // FileSystem.documentDirectory already includes file:// protocol
              console.log('🔍 FileSystem.documentDirectory:', FileSystem.documentDirectory);
              console.log('🔍 Final imagePath (no extra file:// added):', imagePath);
              this.imageCache.set(cacheKey, imagePath);
              await this.saveCoverCache();
              
              // Reset failure count on successful generation
              this.imageFailureCount = Math.max(0, this.imageFailureCount - 1);
              
              return imagePath;
            }
          }
        } else {
          console.warn('🔍 No parts found in candidate content');
        }
      } else {
        console.warn('🔍 No candidates found in Gemini response');
      }
      
      // If no image data found, try again without previous image (in case that's causing issues)
      if (previousImagePath && contents.length > 1) {
        console.warn('🔄 No image data found - retrying without previous image for consistency...');
        console.warn('🔍 Original response safety ratings:', 
          candidates?.[0]?.safetyRatings?.map(sr => `${sr.category}: ${sr.probability}`) || 'none');
        console.warn('🔍 Original response finish reason:', candidates?.[0]?.finishReason || 'unknown');
        
        try {
          // CRITICAL: Retry with explicit character consistency instructions but no image
          // This is the most common failure point - we MUST maintain character consistency here
          const fallbackResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`,
            {
              contents: [{
                role: "user",
                parts: [{
                  text: `GENERATE AN IMAGE: ${prompt}

CRITICAL CHARACTER CONSISTENCY REQUIREMENT:
- This image is part of a story sequence that must maintain character consistency
- If characters are mentioned (like "Evan", "Abby", etc.), they must have consistent appearances throughout
- Use professional illustration style with detailed, memorable character designs
- Maintain the same art style and visual quality as established in the story sequence
- Characters should be recognizable and consistent across all story images
- FRAME characters prominently in the center of the image, fully visible
- ADD rich environmental details, background elements, and atmospheric depth

This is an IMAGE GENERATION request for story illustration with character consistency.`
                }]
              }],
              generationConfig: this.getOptimizedGenerationConfig(false),
              safetySettings: this.getSafetySettings()
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GOOGLE_API_KEY,
              },
              timeout: 60000,
            }
          );
          
          const fallbackCandidates = fallbackResponse.data?.candidates;
          console.log('🔍 Fallback response candidates count:', fallbackCandidates?.length || 0);
          
          if (fallbackCandidates && fallbackCandidates.length > 0) {
            const fallbackCandidate = fallbackCandidates[0];
            console.log('🔍 Fallback candidate structure:', {
              hasContent: !!fallbackCandidate.content,
              partsCount: fallbackCandidate.content?.parts?.length || 0,
              finishReason: fallbackCandidate.finishReason,
              safetyRatings: fallbackCandidate.safetyRatings?.map(sr => `${sr.category}: ${sr.probability}`) || []
            });
            
            const fallbackParts = fallbackCandidate.content?.parts;
            if (fallbackParts) {
              for (const part of fallbackParts) {
                if (part.inlineData?.data) {
                  const imageFileName = `image_${Date.now()}.png`;
                  const imagePath = `${FileSystem.documentDirectory}${imageFileName}`;
                  
                  await FileSystem.writeAsStringAsync(imagePath, part.inlineData.data, {
                    encoding: FileSystem.EncodingType.Base64,
                  });
                  
                  console.log('✅ Fallback generation (without previous image) successful');
                  return imagePath;
                }
              }
              console.warn('🔍 No image data found in fallback parts either');
            } else {
              console.warn('🔍 No parts in fallback candidate');
            }
          }
        } catch (fallbackError) {
          console.warn('❌ Fallback generation also failed:', fallbackError);
        }
      }
      
      // If no image data found, fallback to placeholder
      console.warn('No image data in Gemini response, using placeholder');
      console.warn('🔍 Full response structure:', JSON.stringify(response.data, null, 2));
      return this.getPlaceholderImage(prompt);
    } catch (error: any) {
      // Log detailed error information to understand what's going wrong
      console.error('🚨 Image generation failed - detailed error:');
      console.error('Status:', error?.response?.status);
      console.error('Status Text:', error?.response?.statusText);
      console.error('Error Data:', error?.response?.data);
      console.error('Request URL:', error?.config?.url);
      console.error('Request Method:', error?.config?.method);
      console.error('Content Length:', error?.config?.data?.length);
      
      console.warn('Image generation failed, using fallback:', error?.response?.status || error?.code || 'Unknown error');
      
      // Track failures
      this.imageFailureCount++;
      
      // If it's a 400 error, try a simpler prompt but preserve art style and character consistency
      if (error?.response?.status === 400) {
        console.log('🔄 Retrying with simplified prompt while maintaining art style...');
        try {
          // Create a simplified but still art-style-aware prompt
          let retryPrompt: string;
          let retryContents: any[] = [];
          
          // Check if we had a previous image for consistency (preserve it in retry)
          if (previousImagePath && previousImagePath.startsWith('file://')) {
            try {
              const imagePath = previousImagePath.replace('file://', '');
              const imageBase64 = await FileSystem.readAsStringAsync(imagePath, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              // Include previous image in retry for consistency
              retryContents.push({
                role: "user",
                parts: [{
                  inline_data: {
                    mime_type: "image/png",
                    data: imageBase64
                  }
                }]
              });
              
              // Simplified editing prompt that maintains consistency
              retryPrompt = `Show the same characters in a new scene: ${prompt.substring(0, 120)}. 
Keep identical character appearances and art style. Professional quality.`;
            } catch (imageError) {
              // If we can't load the previous image, fall back to text-only
              retryPrompt = `${prompt.substring(0, 150)}. Professional art style, consistent character design.`;
            }
          } else {
            // No previous image - first scene retry
            retryPrompt = `${prompt.substring(0, 150)}. Professional art style, detailed character design.`;
          }
          
          // Add the text prompt with proper role
          retryContents.push({
            role: "user", 
            parts: [{
              text: retryPrompt
            }]
          });
          
          const retryResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`,
            {
              contents: retryContents,
              generationConfig: this.getOptimizedGenerationConfig(true), // Use retry-optimized config
              safetySettings: this.getSafetySettings()
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GOOGLE_API_KEY,
              },
              timeout: 60000,
            }
          );
          
          const candidates = retryResponse.data?.candidates;
          if (candidates && candidates.length > 0) {
            const parts = candidates[0].content?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  const imageFileName = `image_${Date.now()}.png`;
                  const imagePath = `${FileSystem.documentDirectory}${imageFileName}`;
                  
                  await FileSystem.writeAsStringAsync(imagePath, part.inlineData.data, {
                    encoding: FileSystem.EncodingType.Base64,
                  });
                  
                  // FileSystem.documentDirectory already includes file:// protocol
                  console.log('🔍 Retry - FileSystem.documentDirectory:', FileSystem.documentDirectory);
                  console.log('🔍 Retry - Final imagePath (no extra file:// added):', imagePath);
                  this.imageCache.set(cacheKey, imagePath);
                  await this.saveCoverCache();
                  console.log('✅ Retry successful');
                  return imagePath;
                }
              }
            }
          }
        } catch (retryError) {
          console.warn('Retry also failed, using placeholder');
        }
      }
      
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      // Fallback to placeholder
      return this.getPlaceholderImage(prompt);
    }
  }
  
<<<<<<< HEAD
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
=======
  private async validateAndCleanPrompt(prompt: string): Promise<string> {
    // PREVENTION MEASURE 1: Enhanced content cleaning for PROHIBITED_CONTENT issues
    let cleanPrompt = prompt;
    
    // Enhanced list of problematic terms that trigger PROHIBITED_CONTENT
    const criticalReplacements = [
      { from: /\bkill\b/gi, to: 'stop' },
      { from: /\bmurder\b/gi, to: 'confront' },
      { from: /\bweapon\b/gi, to: 'tool' },
      { from: /\bgun\b/gi, to: 'device' },
      { from: /\bviolence\b/gi, to: 'conflict' },
      { from: /\bfighting\b/gi, to: 'confronting' },
      { from: /\bbattle\b/gi, to: 'encounter' },
      { from: /\bcombat\b/gi, to: 'confrontation' },
      { from: /\bwar\b/gi, to: 'conflict' },
      { from: /\bsword\b/gi, to: 'staff' },
      { from: /\baxe\b/gi, to: 'tool' },
      { from: /\battack\b/gi, to: 'approach' },
      { from: /\bstrike\b/gi, to: 'move toward' },
      { from: /\bblow\b/gi, to: 'motion' },
      { from: /\bparrying\b/gi, to: 'blocking' },
      { from: /\bslashing\b/gi, to: 'moving' },
      { from: /\bstabbing\b/gi, to: 'pointing' },
      { from: /\bblood\b/gi, to: 'energy' },
      { from: /\bwound\b/gi, to: 'mark' },
      { from: /\binjured\b/gi, to: 'tired' },
      { from: /\bbrutal\b/gi, to: 'intense' },
      { from: /\bsavage\b/gi, to: 'wild' },
      { from: /\bfierce\b/gi, to: 'determined' },
      { from: /\bhorde of orcs\b/gi, to: 'group of creatures' },
      { from: /\borcs\b/gi, to: 'creatures' },
    ];
    
    const originalPrompt = cleanPrompt;
    criticalReplacements.forEach(({from, to}) => {
      cleanPrompt = cleanPrompt.replace(from, to);
    });
    
    // Log sanitization for debugging
    if (originalPrompt !== cleanPrompt) {
      console.log(`🧹 Content sanitized for safety filters`);
      console.log(`📝 Before: ${originalPrompt.substring(0, 100)}...`);
      console.log(`✅ After: ${cleanPrompt.substring(0, 100)}...`);
    }
    
    // PREVENTION MEASURE 2: Ensure prompt length is reasonable
    if (cleanPrompt.length > 400) {
      cleanPrompt = cleanPrompt.substring(0, 400);
      console.log('🧹 Truncated long prompt for API compatibility');
    }
    
    // PREVENTION MEASURE 3: Simple professional framing (less likely to cause issues)
    cleanPrompt = `${cleanPrompt}. Professional illustration, no text overlays.`;
    
    return cleanPrompt;
  }

  private async validateImageData(imageBase64: string): Promise<boolean> {
    // PREVENTION MEASURE 4: Validate image data before sending
    try {
      // Basic validation - check if it's valid base64 and reasonable size
      const sizeInBytes = (imageBase64.length * 3) / 4;
      
      // Gemini has limits on image size - typically around 20MB
      if (sizeInBytes > 20 * 1024 * 1024) {
        console.warn('⚠️ Previous image too large, skipping for API safety');
        return false;
      }
      
      // Check if it looks like valid base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(imageBase64)) {
        console.warn('⚠️ Invalid base64 image data, skipping');
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Error validating image data:', error);
      return false;
    }
  }

  private getOptimizedGenerationConfig(isRetry: boolean = false) {
    // PREVENTION MEASURE 5: Use conservative, stable generation settings
    return {
      temperature: isRetry ? 0.5 : 0.6,  // Lower for retries
      topP: isRetry ? 0.7 : 0.8,          // More focused sampling
      maxOutputTokens: 1024,
    };
  }

  private getSafetySettings() {
    // Safety settings go at the root level, not in generationConfig
    return [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ];
  }

  private async generateImageSimpleMode(prompt: string): Promise<string> {
    try {
      console.log('🟡 Using ultra-simple mode - minimal processing');
      
      // Ultra-minimal request with absolute basics
      const simplePrompt = prompt.substring(0, 100) + ". Professional illustration.";
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`,
        {
          contents: [{
            role: "user",
            parts: [{
              text: simplePrompt
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.7,
            maxOutputTokens: 512,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GOOGLE_API_KEY,
          },
          timeout: 30000,
        }
      );
      
      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              const imageFileName = `image_${Date.now()}.png`;
              const imagePath = `${FileSystem.documentDirectory}${imageFileName}`;
              
              await FileSystem.writeAsStringAsync(imagePath, part.inlineData.data, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              // Reset failure count on success
              this.imageFailureCount = 0;
              
              console.log('✅ Simple mode generation successful');
              return imagePath;
            }
          }
        }
      }
      
      throw new Error('No image data in simple mode response');
    } catch (error) {
      console.error('❌ Simple mode also failed:', error);
      return this.getPlaceholderImage(prompt);
    }
  }

  private getPlaceholderImage(prompt: string): string {
    // Create a stable URL based on prompt for consistency
    // Use a more stable seed generation to maintain some consistency between related chunks
    let seed = 0;
    for (let i = 0; i < Math.min(prompt.length, 50); i++) {
      seed += prompt.charCodeAt(i);
    }
    seed = seed % 1000;
    
    console.warn(`🖼️ Using fallback placeholder image with seed ${seed} for failed generation`);
    return `https://picsum.photos/seed/${seed}/400/600`;
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  }
  
  async prefetchAudio(texts: string[], voiceId?: string): Promise<void> {
    const promises = texts.map(text => 
      this.generateAudio(text, voiceId).catch(err => 
        console.error('Error prefetching audio:', err)
      )
    );
    
    await Promise.all(promises);
  }
  
<<<<<<< HEAD
  async prefetchImages(prompts: string[]): Promise<void> {
    const promises = prompts.map(prompt => 
      this.generateImage(prompt).catch(err => 
        console.error('Error prefetching image:', err)
      )
    );
=======
  async prefetchImages(prompts: string[], previousImages?: string[]): Promise<void> {
    const promises = prompts.map((prompt, index) => {
      const previousImage = previousImages && previousImages[index - 1];
      return this.generateImage(prompt, previousImage).catch(err => 
        console.error('Error prefetching image:', err)
      );
    });
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
    
    await Promise.all(promises);
  }
  
<<<<<<< HEAD
  clearCache(): void {
    this.audioCache.clear();
    this.imageCache.clear();
=======
  private async ensureAudioDirectoryExists(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.audioDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.audioDir, { intermediates: true });
      console.log('📁 Created audio directory:', this.audioDir);
    }
  }
  
  private async checkExistingAudio(audioPath: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioPath);
      return fileInfo.exists && fileInfo.size && fileInfo.size > 0;
    } catch (error) {
      return false;
    }
  }
  
  // Get all audio files for a specific book
  async getBookAudioFiles(bookId: string): Promise<string[]> {
    try {
      await this.ensureAudioDirectoryExists();
      const files = await FileSystem.readDirectoryAsync(this.audioDir);
      return files.filter(file => file.startsWith(`${bookId}_`) && file.endsWith('.mp3'));
    } catch (error) {
      console.error('Error reading book audio files:', error);
      return [];
    }
  }
  
  // Clear audio for a specific book
  async clearBookAudio(bookId: string): Promise<void> {
    try {
      const audioFiles = await this.getBookAudioFiles(bookId);
      for (const file of audioFiles) {
        await FileSystem.deleteAsync(`${this.audioDir}${file}`, { idempotent: true });
      }
      console.log(`🗑️ Cleared ${audioFiles.length} audio files for book ${bookId}`);
    } catch (error) {
      console.error('Error clearing book audio:', error);
    }
  }
  
  async generateBookCover(title: string, content: string): Promise<string> {
    // Wait for cache to be loaded
    await this.waitForCacheLoad();
    
    // Create book-specific cache key
    const cacheKey = `cover_${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}`;
    
    if (this.imageCache.has(cacheKey)) {
      const cachedUri = this.imageCache.get(cacheKey)!;
      // Verify the cached file still exists
      try {
        const fileInfo = await FileSystem.getInfoAsync(cachedUri.replace('file://', ''));
        if (fileInfo.exists) {
          console.log(`📚 Using cached cover for: ${title}`);
          return cachedUri;
        } else {
          // File doesn't exist, remove from cache
          this.imageCache.delete(cacheKey);
          await this.saveCoverCache();
        }
      } catch (error) {
        // Error checking file, remove from cache
        this.imageCache.delete(cacheKey);
        await this.saveCoverCache();
      }
    }
    
    try {
      // Extract key themes and setting from first 500 characters
      const excerpt = content.substring(0, 500);
      
      const coverPrompt = `Create a beautiful, professional book cover design for "${title}". 
      
      Based on this excerpt: "${excerpt}"
      
      Design requirements:
      - Professional book cover layout with title placement area
      - Artistic, visually striking composition  
      - Rich colors and professional typography space
      - Style should match the book's genre and tone
      - High-quality, commercial book cover aesthetic
      - Leave space for title text overlay
      - No actual text in the image - just visual design
      - Cinematic, professional book cover style`;
      
      console.log(`🎨 Generating book cover for: ${title}`);
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`,
        {
          contents: [{
            parts: [{
              text: coverPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 1024,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GOOGLE_API_KEY,
          },
          timeout: 60000,
        }
      );
      
      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              // Save cover image
              const coverFileName = `cover_${Date.now()}.png`;
              const coverPath = `${FileSystem.documentDirectory}${coverFileName}`;
              
              await FileSystem.writeAsStringAsync(coverPath, part.inlineData.data, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              // Ensure proper file:// protocol without duplication
              const coverUri = coverPath.startsWith('file://') ? coverPath : `file://${coverPath}`;
              console.log('🔍 Cover URI:', coverUri);
              this.imageCache.set(cacheKey, coverUri);
              await this.saveCoverCache();
              console.log(`✅ Book cover generated: ${title}`);
              return coverUri;
            }
          }
        }
      }
      
      // Fallback to placeholder
      return this.getPlaceholderCover(title);
    } catch (error: any) {
      console.error('Error generating book cover:', error);
      return this.getPlaceholderCover(title);
    }
  }
  
  private getPlaceholderCover(title: string): string {
    // Create a stable placeholder based on title
    const seed = title.charCodeAt(0) % 1000;
    return `https://picsum.photos/seed/${seed}/300/400`;
  }
  
  async callGeminiAPI(prompt: string): Promise<string> {
    try {
      console.log('🤖 Calling Gemini API for text generation...');
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GOOGLE_API_KEY,
          },
          timeout: 60000, // 60 second timeout
        }
      );
      
      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        console.log('✅ Gemini API response received');
        return generatedText.trim();
      } else {
        throw new Error('No text content in Gemini API response');
      }
    } catch (error: any) {
      console.error('Error calling Gemini API:', error?.response?.data || error?.message || error);
      throw new Error(`Gemini API call failed: ${error?.response?.data?.error?.message || error?.message || 'Unknown error'}`);
    }
  }

  clearCache(): void {
    this.audioCache.clear();
    this.imageCache.clear();
    this.audioRequestDelay = 2000; // Reset delay
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  }
}