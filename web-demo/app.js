import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Enhanced Web API Service with proper image generation
class WebApiService {
  constructor() {
    this.userApiKeys = {
      elevenlabs: '',
      gemini: '',
      elevenlabsVoice: 'JBFqnCBsd6RMkjVDRZzb'
    };
    this.imageCache = new Map();
    console.log('WebApiService initialized');
  }

  setApiKeys(keys) {
    this.userApiKeys = { ...this.userApiKeys, ...keys };
    console.log('API keys set:', Object.keys(keys));
  }

  async validateGeminiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) {
      return false;
    }

    try {
      console.log('Validating Gemini API key...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      const isValid = response.ok;
      console.log('Gemini key validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error validating Gemini key:', error);
      return false;
    }
  }

  async validateElevenLabsKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) {
      return false;
    }

    try {
      console.log('Validating ElevenLabs API key...');
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey
        }
      });
      
      const isValid = response.ok;
      console.log('ElevenLabs key validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error validating ElevenLabs key:', error);
      return false;
    }
  }

  async generateAudio(text, bookId = null, chunkIndex = 0) {
    console.log('Generating audio for:', text.substring(0, 50) + '...');
    
    if (!this.userApiKeys.elevenlabs) {
      console.log('Using Web Speech API fallback');
      return `webspeech:${text}`;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.userApiKeys.elevenlabsVoice}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.userApiKeys.elevenlabs,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text.substring(0, 500),
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('ElevenLabs audio generated');
      return audioUrl;

    } catch (error) {
      console.warn('ElevenLabs failed, using Web Speech:', error.message);
      return `webspeech:${text}`;
    }
  }

  async generateImage(prompt, artStyle = 'realistic', previousImageUrl = null) {
    console.log('Generating image for:', prompt.substring(0, 50) + '...');
    
    if (!this.userApiKeys.gemini) {
      console.warn('No Gemini API key, using placeholder');
      return this.getPlaceholderImage(prompt);
    }

    const cacheKey = `img_${prompt.substring(0, 50)}_${artStyle}_${Date.now()}`;

    try {
      // Clean and enhance the prompt similar to mobile app
      const cleanPrompt = this.cleanPrompt(prompt);
      
      // Prepare contents array for Gemini - structure is critical for character consistency
      const contents = [];
      let enhancedPrompt;
      
      if (previousImageUrl) {
        try {
          // Convert previous image URL to base64 like mobile app
          const imageBase64 = await this.urlToBase64(previousImageUrl);
          
          if (imageBase64) {
            // CRITICAL: Send image first, then text - just like mobile app
            contents.push({
              role: "user",
              parts: [{
                inline_data: {
                  mime_type: "image/png",
                  data: imageBase64
                }
              }]
            });
            
            // Enhanced prompt for character continuity - matching mobile app exactly
            const basePrompt = prompt.length > 200 ? prompt.substring(0, 200) + '...' : prompt;
            const artStyleEnhancement = this.enhancePromptForArtStyle('', artStyle);
            
            enhancedPrompt = `${artStyleEnhancement} of: ${basePrompt}

Use the same character designs as shown in the reference image above. Maintain identical character appearances, facial features, clothing and visual style while changing only the scene or setting. Frame characters prominently with rich environmental details and atmospheric depth.`;
            
            console.log('Using previous image for character consistency');
          } else {
            // Fallback if image conversion fails
            enhancedPrompt = `${cleanPrompt}. Professional art style, consistent character design.`;
          }
        } catch (imageError) {
          console.warn('Could not load previous image for consistency:', imageError);
          enhancedPrompt = `${cleanPrompt}. Professional art style, consistent character design.`;
        }
      } else {
        // First image in sequence - establish character designs (matching mobile app)
        const basePrompt = prompt.length > 300 ? prompt.substring(0, 300) + '...' : prompt;
        const artStyleEnhancement = this.enhancePromptForArtStyle('', artStyle);
        
        enhancedPrompt = `${artStyleEnhancement} showing: ${basePrompt}

ESTABLISH CHARACTER DESIGNS:
- Create memorable, distinctive character appearances
- Detailed facial features, hair, clothing, and visual style
- Professional art quality that can be maintained in subsequent images
- Consistent visual style throughout
- FRAME characters prominently in the center of the image, fully visible
- ADD rich environmental details, background elements, and atmospheric depth`;
      }
      
      // Add the text prompt with proper role - separated from image for better content filtering
      contents.push({
        role: "user",
        parts: [{
          text: enhancedPrompt
        }]
      });
      
      console.log('Enhanced prompt:', enhancedPrompt.substring(0, 100) + '...');
      
      // Use Gemini 2.5 Flash Image Preview model - same as mobile app
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${this.userApiKeys.gemini}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              topP: 0.8,
              maxOutputTokens: 1024,
            },
            safetySettings: [
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
            ]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Gemini API error:', response.status, errorText);
        return this.getPlaceholderImage(prompt);
      }

      const data = await response.json();
      console.log('Gemini response received');
      
      const candidates = data.candidates;
      
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0];
        console.log('Candidate finish reason:', candidate.finishReason);
        
        if (candidate.finishReason === 'SAFETY') {
          console.warn('Content blocked by safety filters, using placeholder');
          return this.getPlaceholderImage(prompt);
        }
        
        const parts = candidate.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              const imageBlob = this.base64ToBlob(part.inlineData.data, 'image/png');
              const imageUrl = URL.createObjectURL(imageBlob);
              this.imageCache.set(cacheKey, imageUrl);
              console.log('Gemini image generated successfully');
              return imageUrl;
            }
          }
        }
      }
      
      console.warn('No image data in response, using placeholder');
      return this.getPlaceholderImage(prompt);
      
    } catch (error) {
      console.error('Image generation failed:', error);
      return this.getPlaceholderImage(prompt);
    }
  }


  enhancePromptForArtStyle(prompt, artStyle) {
    const artStyleEnhancements = {
      realistic: {
        prefix: 'Create a photorealistic illustration',
        style: 'Highly detailed, realistic lighting and textures, professional photography quality'
      },
      cinematic: {
        prefix: 'Create a cinematic, movie-quality scene',
        style: 'Dramatic lighting, depth of field, film grain, dynamic composition, Hollywood blockbuster quality'
      },
      artistic: {
        prefix: 'Create an artistic, painterly illustration',
        style: 'Oil painting style, visible brushstrokes, artistic composition, fine art quality'
      },
      anime: {
        prefix: 'Create a high-quality anime-style illustration',
        style: 'Anime art style, clean lineart, vibrant colors, detailed character design, professional anime quality'
      },
      vintage: {
        prefix: 'Create a vintage-style, classic illustration',
        style: 'Retro color palette, classic art techniques, nostalgic atmosphere, vintage poster style'
      },
      watercolor: {
        prefix: 'Create a watercolor painting',
        style: 'Soft watercolor techniques, flowing paint effects, artistic paper texture, delicate color blending'
      }
    };

    const enhancement = artStyleEnhancements[artStyle] || artStyleEnhancements.realistic;
    
    return `${enhancement.prefix} depicting: ${prompt}. ${enhancement.style}. Professional quality, detailed, no text overlays, suitable for all audiences.`;
  }

  cleanPrompt(prompt) {
    // Remove potentially problematic content
    return prompt
      .replace(/\b(kill|murder|weapon|gun|violence|fighting|battle|combat|war|sword|attack|blood|death|violent)\b/gi, 'encounter')
      .replace(/\b(brutal|savage|fierce|deadly)\b/gi, 'intense')
      .substring(0, 300);
  }

  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  async urlToBase64(url) {
    try {
      // Convert blob URL or regular URL to base64
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Remove data URL prefix to get just the base64 data
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Failed to convert URL to base64:', error);
      return null;
    }
  }

  getPlaceholderImage(prompt) {
    let seed = 0;
    for (let i = 0; i < Math.min(prompt.length, 50); i++) {
      seed += prompt.charCodeAt(i);
    }
    seed = seed % 1000;
    return `https://picsum.photos/seed/${seed}/800/600`;
  }

  async generateBookCover(title, content) {
    console.log('Generating book cover for:', title);
    
    if (!this.userApiKeys.gemini) {
      return this.getPlaceholderCover(title);
    }

    const coverCacheKey = `cover_${title}`;
    if (this.imageCache.has(coverCacheKey)) {
      return this.imageCache.get(coverCacheKey);
    }

    try {
      const excerpt = content.substring(0, 300);
      const coverPrompt = `Create a professional book cover design for "${title}". Based on this story excerpt: "${excerpt}". Design a beautiful, artistic book cover with rich colors and professional composition. No text in the image.`;
      
      const imageUrl = await this.generateImage(coverPrompt, 'artistic');
      this.imageCache.set(coverCacheKey, imageUrl);
      return imageUrl;
      
    } catch (error) {
      console.error('Book cover generation failed:', error);
      return this.getPlaceholderCover(title);
    }
  }

  getPlaceholderCover(title) {
    const seed = title.charCodeAt(0) % 1000;
    return `https://picsum.photos/seed/${seed}/300/400`;
  }
}

// Enhanced text chunking
function chunkText(text) {
  console.log('🔍 Chunking text of length:', text.length, 'words:', text.split(/\s+/).length);
  
  // First try paragraph-based chunking
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  console.log('📄 Found paragraphs:', paragraphs.length);
  
  if (paragraphs.length <= 1) {
    // No clear paragraph breaks, use sentence-based chunking
    return chunkBySentences(text);
  }
  
  const chunks = [];
  let currentChunk = '';
  let currentWordCount = 0;
  let chunkId = 0;
  const CHUNK_TARGET_SIZE = 100; // Target words per chunk
  const MIN_CHUNK_SIZE = 50;
  const MAX_CHUNK_SIZE = 200;
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    const paragraphWords = trimmedParagraph.split(/\s+/).length;
    
    // If adding this paragraph would exceed max size, finalize current chunk
    if (currentWordCount > 0 && currentWordCount + paragraphWords > MAX_CHUNK_SIZE) {
      chunks.push({
        id: `chunk_${chunkId++}`,
        text: currentChunk.trim(),
        audioUrl: null,
        imageUrl: null
      });
      
      // Start new chunk
      currentChunk = trimmedParagraph;
      currentWordCount = paragraphWords;
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
      currentWordCount += paragraphWords;
      
      // If we've reached target size and have meaningful content, create chunk
      if (currentWordCount >= CHUNK_TARGET_SIZE && currentWordCount >= MIN_CHUNK_SIZE) {
        chunks.push({
          id: `chunk_${chunkId++}`,
          text: currentChunk.trim(),
          audioUrl: null,
          imageUrl: null
        });
        
        // Reset for next chunk
        currentChunk = '';
        currentWordCount = 0;
      }
    }
  }
  
  // Add any remaining text as final chunk
  if (currentChunk.trim()) {
    chunks.push({
      id: `chunk_${chunkId++}`,
      text: currentChunk.trim(),
      audioUrl: null,
      imageUrl: null
    });
  }
  
  // Fallback: if still only one chunk, force sentence-based splitting
  if (chunks.length <= 1) {
    console.log('⚠️ Paragraph chunking failed, using sentence chunking');
    return chunkBySentences(text);
  }
  
  const result = chunks.slice(0, 12); // Allow up to 12 chunks for better stories
  console.log('✅ Created', result.length, 'paragraph-based chunks');
  return result;
}

// Fallback chunker for when paragraph chunking doesn't work
function chunkBySentences(text) {
  console.log('📝 Using sentence-based chunking');
  
  // Split by sentences while preserving punctuation
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  console.log('Found sentences:', sentences.length);
  
  const chunks = [];
  let currentChunk = '';
  let currentWordCount = 0;
  let chunkId = 0;
  const CHUNK_TARGET_SIZE = 80; // Smaller target for sentence-based
  const MAX_CHUNK_SIZE = 150;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    const sentenceWords = trimmedSentence.split(/\s+/).length;
    
    // If adding this sentence would make the chunk too long, finalize current chunk
    if (currentWordCount > 0 && currentWordCount + sentenceWords > MAX_CHUNK_SIZE) {
      chunks.push({
        id: `chunk_${chunkId++}`,
        text: currentChunk.trim(),
        audioUrl: null,
        imageUrl: null
      });
      currentChunk = trimmedSentence;
      currentWordCount = sentenceWords;
    } else {
      // Add sentence to current chunk
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      currentWordCount += sentenceWords;
      
      // Create chunk if we've reached target size OR have multiple sentences
      if (currentWordCount >= CHUNK_TARGET_SIZE || 
          (currentWordCount >= 30 && currentChunk.includes('.') && currentChunk.split(/[.!?]/).length >= 2)) {
        chunks.push({
          id: `chunk_${chunkId++}`,
          text: currentChunk.trim(),
          audioUrl: null,
          imageUrl: null
        });
        
        // Reset for next chunk
        currentChunk = '';
        currentWordCount = 0;
      }
    }
  }

  // Add the final chunk if there's remaining content
  if (currentChunk.trim()) {
    chunks.push({
      id: `chunk_${chunkId++}`,
      text: currentChunk.trim(),
      audioUrl: null,
      imageUrl: null
    });
  }

  const result = chunks.slice(0, 12); // Allow up to 12 chunks
  console.log('✅ Created', result.length, 'sentence-based chunks');
  return result;
}

// Note: Audio is generated fresh each time using user's API keys

// Sample texts - keeping the same as mobile app would have
const SAMPLE_TEXTS = [
  {
    title: "Alice's Adventure",
    content: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do. Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it. "What is the use of a book," thought Alice, "without pictures or conversations?" So she was considering in her own mind, when suddenly a White Rabbit with pink eyes ran close by her. There was nothing so very remarkable in that; but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it. Burning with curiosity, she ran across the field after it, and was just in time to see it pop down a large rabbit-hole under the hedge. In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down what seemed to be a very deep well.`
  },
  {
    title: "The Space Explorer", 
    content: `Captain Sarah Chen gazed out at the swirling nebula that dominated the viewport of her ship, the Stellar Wanderer. Three years into her deep space mission, she had seen countless wonders, but this cosmic cloud of gas and stardust took her breath away. The nebula pulsed with ethereal blues and purples, like a celestial heartbeat. Her instruments detected unusual energy signatures from within its depths. "Computer, prepare for closer investigation," she commanded. As the ship drew nearer, the nebula seemed to respond to their presence, its colors shifting and dancing as if welcoming them into its ancient mysteries. Sarah felt a thrill of discovery coursing through her veins. She had joined the Space Exploration Corps not just for adventure, but to push the boundaries of human knowledge. This nebula could contain secrets that would revolutionize their understanding of the universe. The ship's sensors began picking up structured patterns within the cosmic clouds, patterns that seemed almost... intentional.`
  },
  {
    title: "The Enchanted Forest",
    content: `Elara stepped carefully through the moss-covered forest floor, her elven ears alert to every sound. The ancient trees towered above her, their branches forming a canopy so thick that only scattered beams of golden sunlight reached the ground. She could hear the gentle babble of a nearby stream and the soft whisper of wind through leaves. Suddenly, a tiny blue light flickered between the trees ahead. Then another. And another. Soon, dozens of fairy lights danced around her, creating a magical constellation in the forest air. The fairies seemed to be leading her deeper into the woods, toward something important. With wonder in her heart, Elara followed their glowing trail. As she walked, she noticed the forest was changing around her. The trees grew taller and more majestic, their bark shimmering with an otherworldly luminescence. Flowers began to bloom in her path, releasing sweet fragrances that filled the air with magic. This was no ordinary forest—this was the heart of the ancient realm, where few mortals had ever tread.`
  }
];

// API Key Setup Component - matching Bookworm style
function ApiKeySetup({ onKeysSet }) {
  const [keys, setKeys] = useState({
    elevenlabs: '',
    gemini: '',
    elevenlabsVoice: 'JBFqnCBsd6RMkjVDRZzb'
  });
  const [showOptional, setShowOptional] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keys.gemini.trim()) {
      alert('Gemini API key is required for image generation');
      return;
    }

    setIsValidating(true);
    setValidationErrors({});

    try {
      // Create temporary service to validate keys
      const tempService = new WebApiService();
      
      // Validate Gemini key
      const geminiValid = await tempService.validateGeminiKey(keys.gemini);
      if (!geminiValid) {
        setValidationErrors({ gemini: 'Invalid Gemini API key. Please check your key and try again.' });
        setIsValidating(false);
        return;
      }

      // Validate ElevenLabs key if provided
      if (keys.elevenlabs.trim()) {
        const elevenlabsValid = await tempService.validateElevenLabsKey(keys.elevenlabs);
        if (!elevenlabsValid) {
          setValidationErrors({ elevenlabs: 'Invalid ElevenLabs API key. Please check your key or leave blank.' });
          setIsValidating(false);
          return;
        }
      }

      // If all keys are valid, proceed
      onKeysSet(keys);
    } catch (error) {
      console.error('Error validating API keys:', error);
      setValidationErrors({ general: 'Error validating API keys. Please try again.' });
    } finally {
      setIsValidating(false);
    }
  };

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 50%, #ffeb3b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }
  }, React.createElement('div', {
    style: {
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255, 255, 255, 0.5)'
    }
  }, [
    React.createElement('div', {
      key: 'header',
      style: { textAlign: 'center', marginBottom: '32px' }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: { 
          fontSize: '42px', 
          marginBottom: '12px', 
          color: 'rgba(0,0,0,0.9)',
          fontFamily: 'cursive, "Times New Roman", Times, serif',
          fontWeight: '700',
          letterSpacing: '2px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }
      }, 'Bookworm'),
      React.createElement('p', {
        key: 'subtitle',
        style: { 
          color: 'rgba(0,0,0,0.7)', 
          fontSize: '18px',
          fontWeight: '500',
          fontFamily: 'cursive, "Times New Roman", Times, serif',
          fontStyle: 'italic'
        }
      }, 'AI-Powered Audiovisual Reading Experience'),
      React.createElement('div', {
        key: 'underline',
        style: {
          width: '80px',
          height: '3px',
          background: 'linear-gradient(90deg, #ff9800, #ffeb3b)',
          margin: '16px auto 0',
          borderRadius: '2px'
        }
      })
    ]),
    React.createElement('form', {
      key: 'form',
      onSubmit: handleSubmit,
      style: { display: 'flex', flexDirection: 'column', gap: '20px' }
    }, [
      React.createElement('div', { key: 'gemini-field' }, [
        React.createElement('label', {
          key: 'gemini-label',
          style: { 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px', 
            fontWeight: '600',
            color: 'rgba(0,0,0,0.8)'
          }
        }, ['Gemini API Key ', React.createElement('span', {
          key: 'required',
          style: { color: '#e53e3e' }
        }, '(required)')]),
        React.createElement('input', {
          key: 'gemini-input',
          type: 'password',
          value: keys.gemini,
          onChange: (e) => setKeys(prev => ({ ...prev, gemini: e.target.value })),
          placeholder: 'Enter your Gemini API key',
          style: {
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: validationErrors.gemini ? '2px solid #e53e3e' : '2px solid rgba(0,0,0,0.15)',
            backgroundColor: '#fff',
            color: 'rgba(0,0,0,0.8)',
            fontSize: '15px',
            fontWeight: '500',
            fontFamily: '"Times New Roman", Times, serif'
          }
        }),
        validationErrors.gemini && React.createElement('div', {
          key: 'gemini-error',
          style: {
            color: '#e53e3e',
            fontSize: '13px',
            marginTop: '4px',
            fontWeight: '500'
          }
        }, validationErrors.gemini),
        React.createElement('p', {
          key: 'gemini-help',
          style: { fontSize: '12px', color: 'rgba(0,0,0,0.5)', marginTop: '4px' }
        }, [
          'Get your key from ',
          React.createElement('a', {
            href: 'https://aistudio.google.com',
            target: '_blank',
            style: { color: '#ff9800', fontWeight: '600' }
          }, 'Google AI Studio')
        ])
      ]),
      React.createElement('button', {
        key: 'toggle-optional',
        type: 'button',
        onClick: () => setShowOptional(!showOptional),
        style: {
          background: 'none',
          border: 'none',
          color: '#ff9800',
          fontSize: '14px',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '4px 0',
          fontWeight: '600'
        }
      }, showOptional ? 'Hide Advanced Settings' : 'Show Advanced Settings'),
      
      React.createElement('div', { key: 'elevenlabs-field', style: { marginTop: '20px' } }, [
        React.createElement('label', {
          key: 'elevenlabs-label',
          style: { 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px', 
            fontWeight: '600',
            color: 'rgba(0,0,0,0.8)'
          }
        }, ['ElevenLabs API Key ', React.createElement('span', {
          key: 'optional',
          style: { color: 'rgba(0,0,0,0.5)' }
        }, '(optional for premium voice)')]),
        React.createElement('input', {
          key: 'elevenlabs-input',
          type: 'password',
          value: keys.elevenlabs,
          onChange: (e) => setKeys(prev => ({ ...prev, elevenlabs: e.target.value })),
          placeholder: 'Enter your ElevenLabs API key (optional)',
          style: {
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: validationErrors.elevenlabs ? '2px solid #e53e3e' : '2px solid rgba(0,0,0,0.15)',
            backgroundColor: '#fff',
            color: 'rgba(0,0,0,0.8)',
            fontSize: '15px',
            fontWeight: '500',
            fontFamily: '"Times New Roman", Times, serif'
          }
        }),
        validationErrors.elevenlabs && React.createElement('div', {
          key: 'elevenlabs-error',
          style: {
            color: '#e53e3e',
            fontSize: '13px',
            marginTop: '4px',
            fontWeight: '500'
          }
        }, validationErrors.elevenlabs),
        React.createElement('p', {
          key: 'elevenlabs-help',
          style: { fontSize: '12px', color: 'rgba(0,0,0,0.6)', marginTop: '6px' }
        }, 'Leave blank to use browser speech synthesis instead')
      ]),
      
      showOptional && React.createElement('div', { key: 'voice-field', style: { marginTop: '16px' } }, [
        React.createElement('label', {
          key: 'voice-label',
          style: { 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px', 
            fontWeight: '600',
            color: 'rgba(0,0,0,0.8)'
          }
        }, 'ElevenLabs Voice ID'),
        React.createElement('input', {
          key: 'voice-input',
          type: 'text',
          value: keys.elevenlabsVoice,
          onChange: (e) => setKeys(prev => ({ ...prev, elevenlabsVoice: e.target.value })),
          placeholder: 'Voice ID for ElevenLabs',
          style: {
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: '2px solid rgba(0,0,0,0.15)',
            backgroundColor: '#fff',
            color: 'rgba(0,0,0,0.8)',
            fontSize: '15px',
            fontWeight: '500',
            fontFamily: '"Times New Roman", Times, serif'
          }
        }),
        React.createElement('p', {
          key: 'voice-help',
          style: { fontSize: '12px', color: 'rgba(0,0,0,0.6)', marginTop: '6px' }
        }, 'Default voice provided, or get voice IDs from your ElevenLabs dashboard')
      ]),
      React.createElement('button', {
        key: 'submit',
        type: 'submit',
        disabled: isValidating || !keys.gemini.trim(),
        style: {
          background: (isValidating || !keys.gemini.trim()) 
            ? 'rgba(0,0,0,0.3)' 
            : 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
          color: 'white',
          border: 'none',
          padding: '18px 32px',
          borderRadius: '12px',
          fontSize: '17px',
          fontWeight: '700',
          cursor: (isValidating || !keys.gemini.trim()) ? 'not-allowed' : 'pointer',
          marginTop: '24px',
          boxShadow: (isValidating || !keys.gemini.trim()) 
            ? 'none' 
            : '0 6px 20px rgba(139, 69, 19, 0.4)',
          fontFamily: 'cursive, "Times New Roman", Times, serif',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          width: '100%'
        }
      }, [
        isValidating && React.createElement('div', {
          key: 'spinner',
          style: {
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderLeft: '2px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }
        }),
        isValidating ? 'Validating API Keys...' : 'Enter Bookworm'
      ])
    ]),
    React.createElement('div', {
      key: 'privacy-notice',
      style: { 
        marginTop: '32px', 
        padding: '20px', 
        background: 'rgba(139, 69, 19, 0.08)', 
        borderRadius: '12px',
        fontSize: '14px',
        color: 'rgba(0,0,0,0.7)',
        border: '1px solid rgba(139, 69, 19, 0.2)',
        textAlign: 'center',
        lineHeight: '1.5'
      }
    }, [
      React.createElement('strong', { key: 'privacy-title' }, 'Privacy & Security'),
      React.createElement('br', { key: 'br1' }),
      'Your API keys are processed securely in your browser only. ',
      React.createElement('br', { key: 'br2' }),
      'They are never stored, logged, or transmitted to any third-party servers.'
    ])
  ]));
}

// Loading Screen Component - matching Bookworm style
function LoadingScreen({ progress, message }) {
  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 50%, #ffeb3b 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }
  }, [
    React.createElement('h1', {
      key: 'title',
      style: {
        fontSize: '32px',
        fontWeight: '600',
        color: '#fff',
        fontFamily: 'cursive, "Times New Roman", Times, serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        letterSpacing: '1px',
        marginBottom: '8px'
      }
    }, 'Bookworm'),
    React.createElement('p', {
      key: 'subtitle',
      style: {
        fontSize: '14px',
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '400',
        letterSpacing: '0.5px',
        marginBottom: '40px'
      }
    }, 'AI Story Companion'),
    React.createElement('div', {
      key: 'progress-container',
      style: {
        width: '300px',
        marginBottom: '20px'
      }
    }, [
      React.createElement('div', {
        key: 'progress-bg',
        style: {
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: '2px',
          overflow: 'hidden'
        }
      }, React.createElement('div', {
        key: 'progress-bar',
        style: {
          height: '100%',
          backgroundColor: '#fff',
          borderRadius: '2px',
          width: `${Math.max(5, (progress || 0) * 100)}%`,
          transition: 'width 0.3s ease'
        }
      }))
    ]),
    React.createElement('p', {
      key: 'message',
      style: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: '16px',
        textAlign: 'center',
        fontWeight: '400'
      }
    }, message || 'Loading your stories...')
  ]);
}

// Main Library Component - matching Bookworm exactly
function BookwormLibrary({ apiService, books, onSelectBook, onAddBook }) {
  const [bookCovers, setBookCovers] = useState(new Map());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showArtStyleModal, setShowArtStyleModal] = useState(false);

  // Load book covers
  useEffect(() => {
    const loadCovers = async () => {
      for (const book of books) {
        if (!bookCovers.has(book.id)) {
          try {
            const coverUrl = await apiService.generateBookCover(book.title, book.content);
            setBookCovers(prev => new Map(prev.set(book.id, coverUrl)));
          } catch (error) {
            console.error(`Error loading cover for ${book.title}:`, error);
          }
        }
      }
    };
    
    if (books.length > 0) {
      loadCovers();
    }
  }, [books, apiService]);

  const BookCard = ({ book }) => {
    const coverUrl = bookCovers.get(book.id);
    
    return React.createElement('div', {
      key: book.id,
      onClick: () => {
        setSelectedBook(book);
        setShowArtStyleModal(true);
      },
      style: {
        width: 'calc(33.333% - 16px)',
        height: '140px',
        margin: '8px',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
        position: 'relative',
        transition: 'transform 0.2s ease'
      },
      onMouseEnter: (e) => {
        e.target.style.transform = 'translateY(-2px)';
      },
      onMouseLeave: (e) => {
        e.target.style.transform = 'translateY(0)';
      }
    }, [
      React.createElement('div', {
        key: 'cover',
        style: {
          width: '100%',
          height: '100%',
          backgroundImage: coverUrl ? `url(${coverUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }
      }, [
        !coverUrl && React.createElement('div', {
          key: 'placeholder-icon',
          style: {
            fontSize: '40px',
            color: '#fff'
          }
        }, 'Read Story'),
        React.createElement('div', {
          key: 'title-overlay',
          style: {
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: '12px',
            color: '#fff'
          }
        }, React.createElement('div', {
          key: 'title',
          style: {
            fontSize: '10px',
            fontWeight: '700',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }
        }, book.title))
      ])
    ]);
  };

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 50%, #ffeb3b 100%)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: '60px',
        paddingLeft: '28px',
        paddingRight: '28px',
        paddingBottom: '20px'
      }
    }, [
      React.createElement('div', {
        key: 'branding',
        style: { flex: 1 }
      }, [
        React.createElement('h1', {
          key: 'title',
          style: {
            fontSize: '28px',
            fontWeight: '600',
            color: 'rgba(0,0,0,0.85)',
            fontFamily: 'cursive, "Times New Roman", Times, serif',
            letterSpacing: '1.2px',
            marginBottom: '4px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }
        }, 'Bookworm'),
        React.createElement('p', {
          key: 'subtitle',
          style: {
            fontSize: '14px',
            color: 'rgba(0,0,0,0.65)',
            fontWeight: '500',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginTop: '-2px'
          }
        }, 'My Library')
      ]),
      React.createElement('button', {
        key: 'add-button',
        onClick: () => setShowAddModal(true),
        style: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          borderRadius: '22px',
          width: '44px',
          height: '44px',
          border: '2px solid rgba(255,255,255,0.2)',
          color: '#fff',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 6px 15px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, '+')
    ]),
    
    // Books Container
    React.createElement('div', {
      key: 'books-container',
      style: {
        flex: 1,
        backgroundColor: '#8b4513',
        borderTopLeftRadius: '25px',
        borderTopRightRadius: '25px',
        paddingTop: '25px',
        marginTop: '5px',
        position: 'relative',
        minHeight: '600px'
      }
    }, books.length === 0 ? [
      // Empty State
      React.createElement('div', {
        key: 'empty-state',
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          height: '400px'
        }
      }, [
        React.createElement('div', {
          key: 'empty-icon-container',
          style: {
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '50px',
            padding: '20px',
            marginBottom: '30px'
          }
        }, React.createElement('div', {
          key: 'empty-icon',
          style: {
            fontSize: '80px',
            color: 'rgba(255,255,255,0.8)'
          }
        }, '')),
        React.createElement('h2', {
          key: 'empty-title',
          style: {
            color: '#fff',
            fontSize: '28px',
            fontWeight: '300',
            marginBottom: '10px',
            textAlign: 'center',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }
        }, 'Your library awaits'),
        React.createElement('p', {
          key: 'empty-subtitle',
          style: {
            color: 'rgba(255,255,255,0.8)',
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '40px',
            lineHeight: '22px'
          }
        }, 'Add your first book to begin your AI storytelling journey'),
        React.createElement('button', {
          key: 'add-first-book',
          onClick: () => setShowAddModal(true),
          style: {
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '18px 30px',
            borderRadius: '30px',
            border: '2px solid rgba(255,255,255,0.3)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        }, 'Add your first book')
      ])
    ] : [
      // Books Grid with Shelves
      React.createElement('div', {
        key: 'shelf-1',
        style: {
          position: 'absolute',
          width: '100%',
          height: '8px',
          backgroundColor: '#654321',
          borderRadius: '4px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
          top: '190px',
          zIndex: 1
        }
      }),
      React.createElement('div', {
        key: 'shelf-2',
        style: {
          position: 'absolute',
          width: '100%',
          height: '8px',
          backgroundColor: '#654321',
          borderRadius: '4px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
          top: '346px',
          zIndex: 1
        }
      }),
      React.createElement('div', {
        key: 'shelf-3',
        style: {
          position: 'absolute',
          width: '100%',
          height: '8px',
          backgroundColor: '#654321',
          borderRadius: '4px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
          top: '502px',
          zIndex: 1
        }
      }),
      React.createElement('div', {
        key: 'books-grid',
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          padding: '20px',
          paddingTop: '15px',
          paddingBottom: '50px',
          position: 'relative',
          zIndex: 2
        }
      }, books.map(book => React.createElement(BookCard, { key: book.id, book })))
    ]),

    // Add Book Modal
    showAddModal && React.createElement(AddBookModal, {
      key: 'add-modal',
      onClose: () => setShowAddModal(false),
      onAddBook: (book) => {
        onAddBook(book);
        setShowAddModal(false);
      },
      apiService
    }),

    // Art Style Selection Modal
    showArtStyleModal && React.createElement(ArtStyleModal, {
      key: 'art-style-modal',
      book: selectedBook,
      onClose: () => {
        setShowArtStyleModal(false);
        setSelectedBook(null);
      },
      onSelectArtStyle: (book, artStyle) => {
        setShowArtStyleModal(false);
        setSelectedBook(null);
        onSelectBook(book, artStyle);
      }
    })
  ]);
}

// Add Book Modal Component
function AddBookModal({ onClose, onAddBook, apiService }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('paste'); // 'paste' or 'idea'
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsGenerating(true);
    try {
      let finalContent = content.trim();
      
      if (mode === 'idea') {
        console.log('🎭 Generating full story from idea:', content);
        // Generate story from idea using Gemini - enhanced prompt for better storytelling
        const prompt = `You are a professional storyteller. Create a complete, engaging short story (1200-1800 words) based on this idea: "${content}"

REQUIREMENTS:
- Write a complete narrative with clear beginning, middle, and end
- Include vivid character descriptions and personalities
- Add rich environmental details and atmospheric descriptions
- Include dialogue that reveals character and advances plot
- Create engaging scenes that will translate well to visual imagery
- Use descriptive language that will help AI generate consistent, beautiful illustrations
- Structure the story in clear paragraphs that can be easily chunked
- Make it suitable for audiovisual presentation with narration
- Ensure each scene has enough visual detail for image generation

STYLE:
- Professional creative writing
- Rich sensory details
- Engaging dialogue
- Clear scene transitions
- Memorable characters with distinct appearances

Write the complete story now:`;
        
        try {
          console.log('📝 Sending story generation request to Gemini...');
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiService.userApiKeys.gemini}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.9,
                  topP: 0.95,
                  maxOutputTokens: 4096,
                  topK: 40,
                }
              })
            }
          );
          
          console.log('📡 Gemini response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📊 Gemini response data:', data);
            
            const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('📖 Generated text length:', generatedText?.length || 0);
            console.log('📖 Generated text preview:', generatedText?.substring(0, 200) + '...');
            
            if (generatedText && generatedText.length > 200) {
              console.log('✅ Story generation successful! Length:', generatedText.length);
              finalContent = generatedText.trim();
            } else {
              console.warn('⚠️ Generated story too short or empty, using enhanced fallback');
              finalContent = `${content}

Once upon a time, there was an incredible adventure waiting to unfold. This story began with a simple idea, but would grow into something magnificent. The characters would face challenges, discover new worlds, and learn important lessons along the way.

The journey started when our protagonist first encountered the mysterious situation that would change everything. With courage and determination, they stepped forward into the unknown, ready to face whatever lay ahead.

Through trials and triumphs, friendships and discoveries, this tale would become one worth remembering - a story that proves even the simplest ideas can bloom into extraordinary adventures.

And so the adventure begins...`;
            }
          } else {
            const errorText = await response.text();
            console.error('❌ Story generation API failed:', response.status, errorText);
            finalContent = `${content}

Once upon a time, there was an incredible adventure waiting to unfold. This story began with a simple idea, but would grow into something magnificent. The characters would face challenges, discover new worlds, and learn important lessons along the way.

The journey started when our protagonist first encountered the mysterious situation that would change everything. With courage and determination, they stepped forward into the unknown, ready to face whatever lay ahead.

Through trials and triumphs, friendships and discoveries, this tale would become one worth remembering - a story that proves even the simplest ideas can bloom into extraordinary adventures.

And so the adventure begins...`;
          }
        } catch (error) {
          console.error('❌ Story generation failed:', error);
          finalContent = `${content}

Once upon a time, there was an incredible adventure waiting to unfold. This story began with a simple idea, but would grow into something magnificent. The characters would face challenges, discover new worlds, and learn important lessons along the way.

The journey started when our protagonist first encountered the mysterious situation that would change everything. With courage and determination, they stepped forward into the unknown, ready to face whatever lay ahead.

Through trials and triumphs, friendships and discoveries, this tale would become one worth remembering - a story that proves even the simplest ideas can bloom into extraordinary adventures.

And so the adventure begins...`;
        }
      }

      const newBook = {
        id: Date.now().toString(),
        title: title.trim(),
        content: finalContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onAddBook(newBook);
      
    } catch (error) {
      console.error('Error creating book:', error);
      alert('Failed to create book. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }
  }, React.createElement('div', {
    style: {
      background: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 50%, #ffeb3b 100%)',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative'
    }
  }, [
    React.createElement('button', {
      key: 'close',
      onClick: onClose,
      style: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'rgba(0,0,0,0.1)',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        cursor: 'pointer',
        fontSize: '18px'
      }
    }, '×'),
    React.createElement('h2', {
      key: 'title',
      style: {
        color: 'rgba(0,0,0,0.8)',
        fontSize: '24px',
        fontWeight: '700',
        marginBottom: '20px',
        textAlign: 'center',
        fontFamily: 'Georgia, serif'
      }
    }, 'Create New Story'),
    React.createElement('div', {
      key: 'mode-toggle',
      style: {
        display: 'flex',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '20px'
      }
    }, [
      React.createElement('button', {
        key: 'paste-mode',
        onClick: () => setMode('paste'),
        style: {
          flex: 1,
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: mode === 'paste' ? '#fff' : 'transparent',
          color: mode === 'paste' ? '#ff9800' : 'rgba(0,0,0,0.6)',
          fontWeight: '600',
          cursor: 'pointer'
        }
      }, 'Paste Story'),
      React.createElement('button', {
        key: 'idea-mode',
        onClick: () => setMode('idea'),
        style: {
          flex: 1,
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: mode === 'idea' ? '#fff' : 'transparent',
          color: mode === 'idea' ? '#ff9800' : 'rgba(0,0,0,0.6)',
          fontWeight: '600',
          cursor: 'pointer'
        }
      }, 'Story Idea')
    ]),
    React.createElement('form', {
      key: 'form',
      onSubmit: handleSubmit,
      style: { display: 'flex', flexDirection: 'column', gap: '16px' }
    }, [
      React.createElement('div', { key: 'title-field' }, [
        React.createElement('label', {
          key: 'title-label',
          style: {
            display: 'block',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '700',
            color: 'rgba(0,0,0,0.8)'
          }
        }, 'Story Title'),
        React.createElement('input', {
          key: 'title-input',
          type: 'text',
          value: title,
          onChange: (e) => setTitle(e.target.value),
          placeholder: 'Enter a captivating title...',
          style: {
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: '2px solid rgba(0,0,0,0.1)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            fontSize: '16px',
            color: '#333',
            fontWeight: '500'
          }
        })
      ]),
      React.createElement('div', { key: 'content-field' }, [
        React.createElement('label', {
          key: 'content-label',
          style: {
            display: 'block',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '700',
            color: 'rgba(0,0,0,0.8)'
          }
        }, mode === 'idea' ? 'Story Idea' : 'Story Content'),
        React.createElement('textarea', {
          key: 'content-input',
          value: content,
          onChange: (e) => setContent(e.target.value),
          placeholder: mode === 'idea' 
            ? 'Describe your story idea... AI will create a full story from this!'
            : 'Paste your complete story here...',
          style: {
            width: '100%',
            minHeight: '200px',
            padding: '16px',
            borderRadius: '12px',
            border: '2px solid rgba(0,0,0,0.1)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            color: '#333',
            fontWeight: '400',
            resize: 'vertical',
            fontFamily: 'inherit'
          }
        })
      ]),
      React.createElement('button', {
        key: 'submit',
        type: 'submit',
        disabled: !title.trim() || !content.trim() || isGenerating,
        style: {
          backgroundColor: (!title.trim() || !content.trim() || isGenerating) 
            ? 'rgba(0,0,0,0.3)' 
            : 'rgba(0,0,0,0.8)',
          color: '#fff',
          border: 'none',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: (!title.trim() || !content.trim() || isGenerating) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }
      }, isGenerating ? [
        React.createElement('div', {
          key: 'spinner',
          style: {
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderLeft: '2px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }
        }),
        mode === 'idea' ? 'Generating Story...' : 'Creating Book...'
      ] : [
        '',
        'Create Story'
      ])
    ])
  ]));
}

// Art Style Selection Modal Component
function ArtStyleModal({ book, onClose, onSelectArtStyle }) {
  const [selectedStyle, setSelectedStyle] = useState('realistic');

  const artStyles = [
    {
      id: 'realistic',
      name: 'Realistic',
      description: 'Photorealistic, detailed illustrations',
      preview: 'https://picsum.photos/seed/realistic/100/80'
    },
    {
      id: 'cinematic',
      name: 'Cinematic',
      description: 'Movie-quality dramatic scenes',
      preview: 'https://picsum.photos/seed/cinematic/100/80'
    },
    {
      id: 'artistic',
      name: 'Artistic',
      description: 'Painterly, artistic illustrations',
      preview: 'https://picsum.photos/seed/artistic/100/80'
    },
    {
      id: 'anime',
      name: 'Anime',
      description: 'High-quality anime style',
      preview: 'https://picsum.photos/seed/anime/100/80'
    },
    {
      id: 'vintage',
      name: 'Vintage',
      description: 'Classic, retro aesthetic',
      preview: 'https://picsum.photos/seed/vintage/100/80'
    },
    {
      id: 'watercolor',
      name: 'Watercolor',
      description: 'Soft watercolor paintings',
      preview: 'https://picsum.photos/seed/watercolor/100/80'
    }
  ];

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }
  }, React.createElement('div', {
    style: {
      background: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 50%, #ffeb3b 100%)',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative'
    }
  }, [
    // Close button
    React.createElement('button', {
      key: 'close',
      onClick: onClose,
      style: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'rgba(0,0,0,0.1)',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        cursor: 'pointer',
        fontSize: '18px'
      }
    }, '×'),

    // Header
    React.createElement('div', {
      key: 'header',
      style: { textAlign: 'center', marginBottom: '25px' }
    }, [
      React.createElement('h2', {
        key: 'title',
        style: {
          color: 'rgba(0,0,0,0.8)',
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '8px',
          fontFamily: 'cursive, "Times New Roman", Times, serif'
        }
      }, book?.title || 'Select Story'),
      React.createElement('p', {
        key: 'subtitle',
        style: {
          color: 'rgba(0,0,0,0.6)',
          fontSize: '16px',
          fontWeight: '500'
        }
      }, 'Choose your visual art style')
    ]),

    // Art Style Grid
    React.createElement('div', {
      key: 'styles-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px',
        marginBottom: '25px'
      }
    }, artStyles.map(style => 
      React.createElement('div', {
        key: style.id,
        onClick: () => setSelectedStyle(style.id),
        style: {
          border: selectedStyle === style.id ? '3px solid #8b4513' : '2px solid rgba(0,0,0,0.1)',
          borderRadius: '12px',
          padding: '12px',
          backgroundColor: selectedStyle === style.id ? 'rgba(139, 69, 19, 0.1)' : 'rgba(255,255,255,0.9)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          textAlign: 'center'
        }
      }, [
        React.createElement('div', {
          key: 'preview',
          style: {
            width: '100%',
            height: '60px',
            backgroundImage: `url(${style.preview})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '8px',
            marginBottom: '10px'
          }
        }),
        React.createElement('h3', {
          key: 'name',
          style: {
            fontSize: '16px',
            fontWeight: '600',
            color: 'rgba(0,0,0,0.8)',
            marginBottom: '4px'
          }
        }, style.name),
        React.createElement('p', {
          key: 'desc',
          style: {
            fontSize: '12px',
            color: 'rgba(0,0,0,0.6)',
            lineHeight: '1.3'
          }
        }, style.description)
      ])
    )),

    // Start Reading Button
    React.createElement('button', {
      key: 'start-reading',
      onClick: () => onSelectArtStyle(book, selectedStyle),
      style: {
        width: '100%',
        backgroundColor: '#8b4513',
        color: '#fff',
        border: 'none',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '700',
        cursor: 'pointer',
        fontFamily: 'cursive, "Times New Roman", Times, serif',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        boxShadow: '0 6px 20px rgba(139, 69, 19, 0.4)'
      }
    }, 'Start Reading')
  ]));
}

// Reader View Component - matching mobile app experience
function BookwormReader({ apiService, currentBook, artStyle = 'realistic', onBack }) {
  const [chunks, setChunks] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Processing your story...');
  const [currentImage, setCurrentImage] = useState(null);
  const [showTextView, setShowTextView] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [currentWords, setCurrentWords] = useState([]);
  
  const audioRef = useRef(null);
  const speechUtteranceRef = useRef(null);
  const highlightInterval = useRef(null);
  const autoPlayTimeoutRef = useRef(null);
  const isTransitioningRef = useRef(false);
  
  // Helper function to generate content for a specific chunk
  const generateChunkContent = async (chunks, chunkIndex, artStyle, previousImageUrl, bookId) => {
    const chunk = chunks[chunkIndex];
    if (!chunk || chunk.imageUrl) return; // Skip if already generated
    
    console.log(`🎨 Generating content for chunk ${chunkIndex}:`, chunk.text.substring(0, 50) + '...');
    
    try {
      // Determine previous image for character continuity
      let referenceImage = previousImageUrl;
      if (!referenceImage && chunkIndex > 0) {
        // Look for the most recent chunk with an image
        for (let i = chunkIndex - 1; i >= 0; i--) {
          if (chunks[i]?.imageUrl) {
            referenceImage = chunks[i].imageUrl;
            break;
          }
        }
      }
      
      // Generate image and audio in parallel
      const [imageUrl, audioUrl] = await Promise.all([
        apiService.generateImage(chunk.text, artStyle, referenceImage),
        apiService.generateAudio(chunk.text, bookId, chunkIndex)
      ]);
      
      // Update the chunk with generated content
      chunk.imageUrl = imageUrl;
      chunk.audioUrl = audioUrl;
      
      console.log(`✅ Generated content for chunk ${chunkIndex}`);
      
    } catch (error) {
      console.error(`❌ Failed to generate content for chunk ${chunkIndex}:`, error);
    }
  };

  // Initialize book
  useEffect(() => {
    const initializeBook = async () => {
      try {
        setLoadingMessage('Preparing chapters...');
        setLoadingProgress(0.2);
        
        const textChunks = chunkText(currentBook.content);
        console.log('Created chunks:', textChunks.length);
        setChunks(textChunks);
        
        if (textChunks.length > 0) {
          setLoadingMessage('Generating first scene...');
          setLoadingProgress(0.4);
          
          const firstChunk = textChunks[0];
          
          // Generate content for first chunk with character continuity
          const [imageUrl, audioUrl] = await Promise.all([
            apiService.generateImage(firstChunk.text, artStyle),
            apiService.generateAudio(firstChunk.text, currentBook.id, 0)
          ]);
          
          firstChunk.imageUrl = imageUrl;
          firstChunk.audioUrl = audioUrl;
          setCurrentImage(imageUrl);
          
          // Start intelligent background generation
          if (textChunks.length > 1) {
            setLoadingProgress(0.6);
            setLoadingMessage('Preparing upcoming scenes...');
            
            // Generate the next few chunks in background with progressive loading
            generateChunkContent(textChunks, 1, artStyle, firstChunk.imageUrl, currentBook.id);
            
            if (textChunks.length > 2) {
              setTimeout(() => {
                generateChunkContent(textChunks, 2, artStyle, null, currentBook.id);
              }, 2000);
            }
            
            if (textChunks.length > 3) {
              setTimeout(() => {
                generateChunkContent(textChunks, 3, artStyle, null, currentBook.id);
              }, 4000);
            }
          }
          
          setLoadingProgress(1);
          setLoadingMessage('Ready to begin!');
          
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        }
      } catch (error) {
        console.error('Error initializing book:', error);
        setIsLoading(false);
      }
    };

    initializeBook();
  }, [currentBook, apiService, artStyle]);

  const playAudio = async () => {
    const chunk = chunks[currentChunkIndex];
    if (!chunk?.audioUrl) {
      console.warn('⚠️ No audio URL for chunk:', currentChunkIndex);
      return;
    }

    // Prevent overlapping audio operations
    if (isTransitioningRef.current) {
      console.log('🔄 Already transitioning, skipping play request');
      return;
    }

    console.log(`🎵 Playing audio for chunk ${currentChunkIndex}:`, chunk.text.substring(0, 50) + '...');

    // Ensure any previous audio is properly stopped
    pauseAudio();
    
    // Small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Setup text highlighting
    const words = chunk.text.split(/\s+/);
    setCurrentWords(words);
    setHighlightedWordIndex(0);

    try {
      if (chunk.audioUrl.startsWith('webspeech:')) {
        const text = chunk.audioUrl.replace('webspeech:', '');
        speechUtteranceRef.current = new SpeechSynthesisUtterance(text);
        speechUtteranceRef.current.rate = 0.9;
        speechUtteranceRef.current.onend = () => {
          console.log('🎤 Speech synthesis ended');
          setIsPlaying(false);
          setHighlightedWordIndex(-1);
          if (highlightInterval.current) {
            clearInterval(highlightInterval.current);
            highlightInterval.current = null;
          }
          // Only transition if not already transitioning
          if (!isTransitioningRef.current) {
            setTimeout(handleNextChunk, 500);
          }
        };
        
        // Start word highlighting animation
        const wordsPerSecond = 3; // Approximate reading speed
        const highlightDelay = 1000 / wordsPerSecond;
        let wordIndex = 0;
        
        highlightInterval.current = setInterval(() => {
          if (wordIndex < words.length) {
            setHighlightedWordIndex(wordIndex);
            wordIndex++;
          } else {
            if (highlightInterval.current) {
              clearInterval(highlightInterval.current);
              highlightInterval.current = null;
            }
          }
        }, highlightDelay);
        
        window.speechSynthesis.speak(speechUtteranceRef.current);
        console.log('Playing with Web Speech API');
      } else {
        // Ensure we have a fresh audio element state
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = chunk.audioUrl;
          
          audioRef.current.ontimeupdate = () => {
            // Safety check to prevent errors when audio element is cleared
            if (!audioRef.current) return;
            
            // Estimate word highlighting based on audio progress
            const progress = audioRef.current.currentTime / audioRef.current.duration;
            const wordIndex = Math.floor(progress * words.length);
            setHighlightedWordIndex(Math.min(wordIndex, words.length - 1));
          };
          
          audioRef.current.onended = () => {
            console.log('🔊 Audio playback ended');
            setIsPlaying(false);
            setHighlightedWordIndex(-1);
            // Only transition if not already transitioning
            if (!isTransitioningRef.current) {
              setTimeout(handleNextChunk, 500);
            }
          };
          
          audioRef.current.onerror = (error) => {
            console.error('Audio playback error:', error);
            setIsPlaying(false);
            setHighlightedWordIndex(-1);
          };
          
          await audioRef.current.play();
          console.log('Playing with ElevenLabs audio');
        }
      }
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setHighlightedWordIndex(-1);
    }
  };

  const pauseAudio = () => {
    // Cancel speech synthesis
    if (speechUtteranceRef.current) {
      window.speechSynthesis.cancel();
      speechUtteranceRef.current = null;
    }
    
    // Pause and reset audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.ontimeupdate = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }
    
    // Clear highlighting interval
    if (highlightInterval.current) {
      clearInterval(highlightInterval.current);
      highlightInterval.current = null;
    }
    
    // Clear auto-play timeout
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
    
    setIsPlaying(false);
    setHighlightedWordIndex(-1);
    isTransitioningRef.current = false;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleNextChunk = async () => {
    if (currentChunkIndex >= chunks.length - 1) {
      console.log('📖 Story complete!');
      setIsPlaying(false);
      return;
    }

    // Prevent multiple simultaneous transitions
    if (isTransitioningRef.current) {
      console.log('🔄 Already transitioning to next chunk, ignoring request');
      return;
    }

    isTransitioningRef.current = true;
    console.log(`📄 Transitioning from chunk ${currentChunkIndex} to ${currentChunkIndex + 1}`);

    try {
      const nextIndex = currentChunkIndex + 1;
      const nextChunk = chunks[nextIndex];
      
      // Stop current audio and clear any pending auto-play
      pauseAudio();
      
      // Only show loading if content isn't ready yet
      if (!nextChunk.imageUrl || !nextChunk.audioUrl) {
        setLoadingMessage('Preparing next scene...');
        setIsLoading(true);
        
        try {
          // Generate with character continuity from current image
          const previousImageUrl = chunks[currentChunkIndex]?.imageUrl;
          
          const promises = [];
          if (!nextChunk.imageUrl) {
            promises.push(
              apiService.generateImage(nextChunk.text, artStyle, previousImageUrl)
                .then(url => { nextChunk.imageUrl = url; })
            );
          }
          if (!nextChunk.audioUrl) {
            promises.push(
              apiService.generateAudio(nextChunk.text, currentBook.id, nextIndex)
                .then(url => { nextChunk.audioUrl = url; })
            );
          }
          
          await Promise.all(promises);
          console.log(`✅ Next chunk ${nextIndex} ready`);
        } catch (error) {
          console.error('Error generating next chunk:', error);
        } finally {
          setIsLoading(false);
        }
      }
      
      // Start background generation for the chunk after next (if exists)
      const futureIndex = nextIndex + 1;
      if (futureIndex < chunks.length && !chunks[futureIndex].imageUrl) {
        setTimeout(() => {
          const futureChunk = chunks[futureIndex];
          if (!futureChunk.imageUrl) {
            generateChunkContent(chunks, futureIndex, artStyle, nextChunk.imageUrl, currentBook.id);
          }
        }, 1000); // Start after a brief delay
      }
      
      // Update the UI state
      setCurrentChunkIndex(nextIndex);
      setCurrentImage(nextChunk.imageUrl);
      setIsPlaying(false);
      
      // Reset text highlighting
      setHighlightedWordIndex(-1);
      setCurrentWords([]);
      
      // Auto-play the next chunk after a brief pause for smooth transition
      autoPlayTimeoutRef.current = setTimeout(async () => {
        console.log(`🎬 Auto-playing chunk ${nextIndex}`);
        try {
          await playAudio();
        } catch (error) {
          console.error('Auto-play failed:', error);
        } finally {
          isTransitioningRef.current = false;
        }
      }, 800);
    } catch (error) {
      console.error('Error in handleNextChunk:', error);
      isTransitioningRef.current = false;
    }
  };

  const handlePrevChunk = () => {
    if (currentChunkIndex > 0) {
      const prevIndex = currentChunkIndex - 1;
      setCurrentChunkIndex(prevIndex);
      setCurrentImage(chunks[prevIndex]?.imageUrl);
      setIsPlaying(false);
      
      // Reset text highlighting
      setHighlightedWordIndex(-1);
      setCurrentWords([]);
      if (highlightInterval.current) {
        clearInterval(highlightInterval.current);
      }
    }
  };

  if (isLoading) {
    return React.createElement(LoadingScreen, {
      progress: loadingProgress,
      message: loadingMessage
    });
  }

  const currentChunk = chunks[currentChunkIndex];

  if (showTextView) {
    // Text View - similar to mobile app
    return React.createElement('div', {
      style: {
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        position: 'relative'
      }
    }, [
      // Text view controls
      React.createElement('div', {
        key: 'text-controls',
        style: {
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }
      }, [
        React.createElement('button', {
          key: 'back-to-image',
          onClick: () => setShowTextView(false),
          style: {
            backgroundColor: 'rgba(0,0,0,0.7)',
            border: 'none',
            color: 'white',
            padding: '12px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '20px',
            width: '48px',
            height: '48px'
          }
        }, ''),
        React.createElement('button', {
          key: 'close-text',
          onClick: onBack,
          style: {
            backgroundColor: 'rgba(0,0,0,0.7)',
            border: 'none',
            color: 'white',
            padding: '12px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '20px',
            width: '48px',
            height: '48px'
          }
        }, '✕')
      ]),
      
      // Text content
      React.createElement('div', {
        key: 'text-content',
        style: {
          padding: '80px 20px 140px',
          maxWidth: '800px',
          margin: '0 auto',
          lineHeight: '1.8',
          fontSize: '18px'
        }
      }, [
        React.createElement('h1', {
          key: 'title',
          style: {
            fontSize: '24px',
            marginBottom: '24px',
            color: '#00D4FF',
            textAlign: 'center'
          }
        }, currentBook.title),
        React.createElement('div', {
          key: 'story-text',
          style: {
            whiteSpace: 'pre-wrap',
            color: 'rgba(255,255,255,0.9)'
          }
        }, chunks.map((chunk, index) => 
          React.createElement('div', {
            key: index,
            style: {
              marginBottom: '24px',
              padding: index === currentChunkIndex ? '16px' : '0',
              backgroundColor: index === currentChunkIndex ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
              borderRadius: '8px',
              border: index === currentChunkIndex ? '1px solid rgba(0, 212, 255, 0.3)' : 'none'
            }
          }, index === currentChunkIndex && currentWords.length > 0 ? 
            currentWords.map((word, wordIndex) => 
              React.createElement('span', {
                key: wordIndex,
                style: {
                  backgroundColor: wordIndex === highlightedWordIndex ? '#00D4FF' : 'transparent',
                  color: wordIndex === highlightedWordIndex ? '#000' : 'inherit',
                  transition: 'all 0.3s ease',
                  borderRadius: '2px',
                  padding: wordIndex === highlightedWordIndex ? '1px 2px' : '0'
                }
              }, word + ' ')
            ) : chunk.text
          )
        ))
      ])
    ]);
  }

  // Image View - main reading experience
  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      backgroundColor: '#000',
      position: 'relative',
      overflow: 'hidden'
    }
  }, [
    // Prominent Image
    currentImage && React.createElement('div', {
      key: 'main-image',
      style: {
        position: 'absolute',
        top: '120px',
        left: '20px',
        right: '20px',
        bottom: '200px',
        backgroundImage: `url(${currentImage})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        zIndex: 5
      }
    }),
    
    // Dark overlay for better contrast
    React.createElement('div', {
      key: 'dark-overlay',
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.8) 100%)',
        zIndex: 1
      }
    }),
    
    // Controls
    React.createElement('div', {
      key: 'controls',
      style: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }
    }, [
      React.createElement('button', {
        key: 'back-btn',
        onClick: onBack,
        style: {
          background: 'rgba(0, 0, 0, 0.7)',
          border: 'none',
          color: 'white',
          padding: '12px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '20px',
          width: '48px',
          height: '48px'
        }
      }, '←'),
      
      React.createElement('button', {
        key: 'play-pause-btn',
        onClick: handlePlayPause,
        style: {
          background: 'rgba(0, 0, 0, 0.7)',
          border: 'none',
          color: 'white',
          padding: '12px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '20px',
          width: '48px',
          height: '48px'
        }
      }, isPlaying ? '⏸' : '▶')
    ]),

    // Progress indicator
    React.createElement('div', {
      key: 'progress',
      style: {
        position: 'absolute',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        zIndex: 10
      }
    }, `${currentChunkIndex + 1} / ${chunks.length}`),

    // Compact Text overlay with highlighting
    React.createElement('div', {
      key: 'text-overlay',
      onClick: () => setShowTextView(true),
      style: {
        position: 'absolute',
        bottom: '80px',
        left: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.85)',
        borderRadius: '12px',
        padding: '16px',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        zIndex: 10,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxHeight: '120px',
        overflow: 'hidden'
      }
    }, [
      React.createElement('div', {
        key: 'text-with-highlighting',
        style: { 
          fontSize: '14px', 
          lineHeight: '1.5', 
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '8px'
        }
      }, currentWords.length > 0 ? currentWords.map((word, index) => 
        React.createElement('span', {
          key: index,
          style: {
            backgroundColor: index === highlightedWordIndex ? '#00D4FF' : 'transparent',
            color: index === highlightedWordIndex ? '#000' : 'inherit',
            transition: 'all 0.3s ease',
            borderRadius: '2px',
            padding: index === highlightedWordIndex ? '1px 2px' : '0'
          }
        }, word + ' ')
      ) : currentChunk?.text),
      React.createElement('div', {
        key: 'tap-indicator',
        style: {
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontStyle: 'italic',
          textAlign: 'center'
        }
      }, 'Tap to view full text')
    ]),

    // Media Controls
    React.createElement('div', {
      key: 'media-controls',
      style: {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        zIndex: 10
      }
    }, [
      React.createElement('button', {
        key: 'prev-btn',
        onClick: handlePrevChunk,
        disabled: currentChunkIndex === 0,
        style: {
          background: currentChunkIndex === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)',
          border: 'none',
          color: currentChunkIndex === 0 ? 'rgba(255, 255, 255, 0.4)' : '#333',
          padding: '12px',
          borderRadius: '50%',
          cursor: currentChunkIndex === 0 ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          width: '48px',
          height: '48px'
        }
      }, '⏮'),
      
      React.createElement('button', {
        key: 'main-play-pause',
        onClick: handlePlayPause,
        style: {
          background: '#ffeb3b',
          border: 'none',
          color: '#333',
          padding: '16px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '20px',
          width: '64px',
          height: '64px',
          boxShadow: '0 4px 15px rgba(255,235,59,0.4)'
        }
      }, isPlaying ? '⏸' : '▶'),
      
      React.createElement('button', {
        key: 'next-btn',
        onClick: handleNextChunk,
        disabled: currentChunkIndex === chunks.length - 1,
        style: {
          background: currentChunkIndex === chunks.length - 1 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)',
          border: 'none',
          color: currentChunkIndex === chunks.length - 1 ? 'rgba(255, 255, 255, 0.4)' : '#333',
          padding: '12px',
          borderRadius: '50%',
          cursor: currentChunkIndex === chunks.length - 1 ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          width: '48px',
          height: '48px'
        }
      }, '⏭')
    ]),

    React.createElement('audio', {
      key: 'audio',
      ref: audioRef,
      onEnded: () => {
        setIsPlaying(false);
        setTimeout(handleNextChunk, 500);
      }
    })
  ]);
}

// Main App
function BookwormApp() {
  const [apiService, setApiService] = useState(null);
  const [showSetup, setShowSetup] = useState(true);
  const [isLoadingCovers, setIsLoadingCovers] = useState(false);
  const [books, setBooks] = useState([...SAMPLE_TEXTS.map(sample => ({
    ...sample,
    id: sample.title.replace(/\s+/g, '_').toLowerCase()
  }))]);
  const [currentBook, setCurrentBook] = useState(null);
  const [selectedArtStyle, setSelectedArtStyle] = useState('realistic');

  const handleApiKeysSet = async (keys) => {
    console.log('Setting up Bookworm with API keys');
    const service = new WebApiService();
    service.setApiKeys(keys);
    setApiService(service);
    setShowSetup(false);
    
    // Show loading screen while generating covers
    setIsLoadingCovers(true);
    
    // Generate covers for sample books
    try {
      const updatedBooks = [];
      for (const book of books) {
        const coverUrl = await service.generateBookCover(book.title, book.content);
        updatedBooks.push({ ...book, coverUrl });
      }
      setBooks(updatedBooks);
    } catch (error) {
      console.error('Error generating covers:', error);
    }
    
    setIsLoadingCovers(false);
  };

  const handleSelectBook = (book, artStyle = 'realistic') => {
    console.log('Selected book:', book.title, 'with art style:', artStyle);
    setCurrentBook(book);
    setSelectedArtStyle(artStyle);
  };

  const handleAddBook = (book) => {
    console.log('Adding book:', book.title);
    setBooks(prev => [...prev, book]);
  };

  const handleBackToLibrary = () => {
    console.log('Back to library');
    setCurrentBook(null);
  };

  if (showSetup) {
    return React.createElement(ApiKeySetup, { onKeysSet: handleApiKeysSet });
  }

  if (isLoadingCovers) {
    return React.createElement(LoadingScreen, { 
      progress: 0.5, 
      message: "Generating book covers..." 
    });
  }

  if (currentBook) {
    return React.createElement(BookwormReader, {
      apiService,
      currentBook,
      artStyle: selectedArtStyle,
      onBack: handleBackToLibrary
    });
  }

  return React.createElement(BookwormLibrary, {
    apiService,
    books,
    onSelectBook: handleSelectBook,
    onAddBook: handleAddBook
  });
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`;
document.head.appendChild(style);

// Initialize app
console.log('Bookworm Demo starting...');

try {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(container);
  root.render(React.createElement(BookwormApp));
  console.log('Bookworm rendered successfully');
} catch (error) {
  console.error('Failed to initialize Bookworm:', error);
  
  const container = document.getElementById('root');
  if (container) {
    container.innerHTML = `
      <div class="error-container">
        <div class="error-title">Initialization Error</div>
        <div class="error-message">
          Failed to load Bookworm. Please check the console for details.
          <br><br>
          Error: ${error.message}
        </div>
      </div>
    `;
  }
}