import { Character } from '../types';
<<<<<<< HEAD

interface SceneElements {
  characters: string[];
  setting: string;
  mood: string;
  objects: string[];
  action: string;
}

export class ArtDirector {
  private characterRegistry: Map<string, Character> = new Map();
  private previousSceneContext: string = '';
  
  async generateImagePrompt(
    textChunk: string,
    aiApiKey: string,
    modelUrl: string = 'https://api.openai.com/v1/chat/completions'
  ): Promise<string> {
    try {
      const sceneElements = await this.extractSceneElements(textChunk, aiApiKey, modelUrl);
      const prompt = this.buildImagePrompt(sceneElements);
      this.previousSceneContext = prompt;
=======
import { ArtStyle } from '../store';
import * as FileSystem from 'expo-file-system';

interface CharacterProfile {
  name: string;
  description: string;
  appearance: string;
  firstMention: number;
  lastSeen: number;
  consistency: string; // Key phrases for consistency
}

export class ArtDirector {
  private characterProfiles: Map<string, CharacterProfile> = new Map();
  private previousImagePath: string | null = null;
  private storyContext: string = '';
  private globalCharacters: string[] = []; // Main story characters
  private apiService: any; // Will be injected
  
  constructor(apiService?: any) {
    this.apiService = apiService;
  }
  
  async generateImagePrompt(
    textChunk: string, 
    previousImagePath?: string,
    chunkIndex: number = 0,
    artStyle: ArtStyle = 'realistic'
  ): Promise<string> {
    try {
      // Store the previous image for consistency
      if (previousImagePath) {
        this.previousImagePath = previousImagePath;
      }
      
      // Extract and analyze characters in this chunk
      const currentCharacters = this.extractCharactersAdvanced(textChunk, chunkIndex);
      
      // Use LLM to generate better image prompt with enhanced consistency
      let prompt: string;
      if (this.apiService && this.apiService.generateImagePrompt) {
        // Build enhanced character consistency information for continuation images
        let characterInfo = '';
        if (currentCharacters.length > 0 && this.previousImagePath) {
          // For continuation images - focus on maintaining exact consistency
          characterInfo = `EDITING INSTRUCTIONS FOR CHARACTER CONSISTENCY:
- Use the reference image to maintain exact character appearances
- Keep identical facial features, hair, clothing, and body types
- Preserve the same visual style and art quality
- Only modify the scene, setting, or character actions/expressions
- Characters: ${currentCharacters.join(', ')}`;
        } else if (currentCharacters.length > 0) {
          // For first images - establish clear character designs
          characterInfo = `ESTABLISH CLEAR CHARACTER DESIGNS:
Characters in this scene (remember these for future images):
`;
          currentCharacters.forEach(charName => {
            const profile = this.characterProfiles.get(charName);
            if (profile) {
              characterInfo += `- ${charName}: ${profile.appearance}\n`;
            } else {
              characterInfo += `- ${charName}: distinctive, memorable appearance\n`;
            }
          });
          characterInfo += `
Art style: ${artStyle} with professional quality
Create consistent, detailed character designs that can be maintained across multiple images.`;
        }
        
        prompt = await this.apiService.generateImagePrompt(textChunk, artStyle, characterInfo);
      } else {
        // Fallback to old method
        prompt = await this.buildAdvancedPrompt(textChunk, currentCharacters, chunkIndex, artStyle);
      }
      
      // Update story context for next iteration
      this.storyContext += ` ${textChunk.substring(0, 200)}...`;
      if (this.storyContext.length > 1500) {
        // Keep only recent context
        this.storyContext = this.storyContext.substring(this.storyContext.length - 1500);
      }
      
      console.log(`🎭 Generated prompt for chunk ${chunkIndex}: ${prompt.substring(0, 100)}...`);
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      return prompt;
    } catch (error) {
      console.error('Error generating image prompt:', error);
      return this.fallbackPrompt(textChunk);
    }
  }
  
<<<<<<< HEAD
  private async extractSceneElements(
    text: string,
    apiKey: string,
    modelUrl: string
  ): Promise<SceneElements> {
    const systemPrompt = `You are an art director for a visual story app. Analyze the given text and extract visual elements for image generation. 
    Focus on: characters (with consistent descriptions), setting, mood, key objects, and main action.
    Keep track of character appearances for consistency.
    Previous context: ${this.previousSceneContext}
    
    Respond in JSON format with keys: characters, setting, mood, objects, action`;
    
    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      try {
        const elements = JSON.parse(data.choices[0].message.content);
        this.updateCharacterRegistry(elements.characters);
        return elements;
      } catch (parseError) {
        return this.extractSceneElementsFallback(text);
      }
    }
    
    return this.extractSceneElementsFallback(text);
  }
  
  private extractSceneElementsFallback(text: string): SceneElements {
    // Simple fallback extraction using regex and keywords
    const characters: string[] = [];
    const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
    
    capitalizedWords.forEach(word => {
      if (this.isLikelyName(word)) {
        characters.push(word);
      }
    });
    
    const setting = this.extractSetting(text);
    const mood = this.extractMood(text);
    const objects = this.extractObjects(text);
    const action = this.extractAction(text);
    
    return { characters, setting, mood, objects, action };
  }
  
  private buildImagePrompt(elements: SceneElements): string {
    const parts: string[] = [];
    
    // Add artistic style prefix
    parts.push('Digital painting, cinematic lighting');
    
    // Add setting
    if (elements.setting) {
      parts.push(elements.setting);
    }
    
    // Add characters with consistent descriptions
    elements.characters.forEach(charName => {
      const character = this.characterRegistry.get(charName);
      if (character) {
        parts.push(character.description);
      } else {
        parts.push(charName);
      }
    });
    
    // Add action
    if (elements.action) {
      parts.push(elements.action);
    }
    
    // Add objects
    if (elements.objects.length > 0) {
      parts.push(elements.objects.join(', '));
    }
    
    // Add mood
    if (elements.mood) {
      parts.push(`${elements.mood} atmosphere`);
    }
    
    // Add technical specifications
    parts.push('high detail, 4k, professional illustration');
    
    return parts.join(', ');
  }
  
  private updateCharacterRegistry(characters: string[]): void {
    characters.forEach(charDesc => {
      // Extract character name from description
      const nameMatch = charDesc.match(/^(\w+)/);
      if (nameMatch) {
        const name = nameMatch[1];
        if (!this.characterRegistry.has(name)) {
          this.characterRegistry.set(name, {
            name,
            description: charDesc,
          });
        }
      }
    });
  }
  
  private fallbackPrompt(text: string): string {
    // Simple fallback that creates a generic but relevant prompt
    const words = text.toLowerCase().split(' ').slice(0, 20);
    const hasDialog = text.includes('"') || text.includes("'");
    
    if (hasDialog) {
      return 'Two people in conversation, warm lighting, indoor scene, digital painting, cinematic';
    }
    
    if (words.some(w => ['forest', 'tree', 'woods'].includes(w))) {
      return 'Forest scene, natural lighting, trees, peaceful atmosphere, digital painting';
    }
    
    if (words.some(w => ['city', 'street', 'building'].includes(w))) {
      return 'Urban cityscape, modern buildings, street view, atmospheric lighting, digital painting';
    }
    
    return 'Atmospheric scene, warm colors, digital painting, cinematic lighting, detailed illustration';
  }
  
  private isLikelyName(word: string): boolean {
    const commonWords = ['The', 'This', 'That', 'These', 'Those', 'Some', 'Many', 'Few'];
    return !commonWords.includes(word) && word.length > 2;
  }
  
  private extractSetting(text: string): string {
    const locationKeywords = {
      'forest': 'deep forest with tall trees',
      'city': 'modern cityscape',
      'room': 'cozy interior room',
      'street': 'urban street scene',
      'house': 'residential house',
      'castle': 'medieval castle',
      'mountain': 'mountain landscape',
      'beach': 'sandy beach with ocean',
      'office': 'modern office space',
      'garden': 'lush garden',
    };
    
    const textLower = text.toLowerCase();
    for (const [keyword, description] of Object.entries(locationKeywords)) {
=======
  private extractCharactersAdvanced(text: string, chunkIndex: number): string[] {
    const foundCharacters: string[] = [];
    
    // Method 1: Extract from dialogue patterns (most reliable)
    const dialoguePatterns = [
      /"[^"]*"\s*,?\s*(?:said|asked|replied|answered|whispered|shouted|called|yelled|muttered|declared)\s+([A-Z][a-z]{2,20})/gi,
      /([A-Z][a-z]{2,20})\s+(?:said|asked|replied|answered|whispered|shouted|called|yelled|muttered|declared)\s*,?\s*"[^"]*"/gi,
    ];
    
    dialoguePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2 && match[1].length < 20) {
          foundCharacters.push(match[1]);
        }
      }
    });
    
    // Method 2: Look for "Name:" dialogue format
    const nameColonMatches = text.matchAll(/^([A-Z][a-z]+[A-Z]?[a-z]*):(?:\s|$)/gm);
    for (const match of nameColonMatches) {
      if (match[1] && match[1].length > 1) {
        foundCharacters.push(match[1]);
      }
    }
    
    // Method 3: Find names mentioned multiple times or in character actions
    const actionPatterns = [
      /([A-Z][a-z]+)\s+(?:walked|ran|moved|stepped|sat|stood|looked|watched|smiled|frowned|nodded|shook|turned|grabbed|held|picked|opened|closed)/gi,
      /(?:his|her|their)\s+(?:name\s+was|name\s+is)\s+([A-Z][a-z]+)/gi,
    ];
    
    actionPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 1) {
          foundCharacters.push(match[1]);
        }
      }
    });
    
    // Method 4: Find frequently mentioned proper nouns (likely character names)
    const properNouns = text.match(/\b[A-Z][a-z]{1,15}\b/g) || [];
    const nameFrequency: { [key: string]: number } = {};
    
    properNouns.forEach(name => {
      const excludedWords = ['The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'What', 'Who', 'Why', 'How', 'And', 'But', 'Or', 'In', 'On', 'At', 'To', 'For', 'With', 'By', 'From', 'Up', 'About', 'Into', 'Over', 'After', 'They', 'She', 'He', 'Her', 'His', 'Their', 'You', 'We', 'There', 'Then', 'Chapter', 'June', 'Night', 'City', 'Everything', 'First', 'Vincent', 'Ross', 'Finally', 'Reluctantly', 'Opinion', 'Doors', 'Suit'];
      if (!excludedWords.includes(name) && name.length > 2 && name.length < 20) {
        nameFrequency[name] = (nameFrequency[name] || 0) + 1;
      }
    });
    
    // Add names that appear 3+ times (more restrictive)
    Object.entries(nameFrequency).forEach(([name, count]) => {
      if (count >= 3 && !foundCharacters.includes(name)) {
        foundCharacters.push(name);
      }
    });
    
    // Update character profiles
    const uniqueCharacters = [...new Set(foundCharacters)];
    uniqueCharacters.forEach(charName => {
      this.updateCharacterProfile(charName, text, chunkIndex);
    });
    
    // Keep track of global characters (ones that appear in multiple chunks)
    uniqueCharacters.forEach(char => {
      if (!this.globalCharacters.includes(char)) {
        this.globalCharacters.push(char);
      }
    });
    
    return uniqueCharacters.slice(0, 4); // Max 4 characters per scene
  }
  
  private updateCharacterProfile(name: string, context: string, chunkIndex: number): void {
    const existing = this.characterProfiles.get(name);
    
    if (existing) {
      // Update existing character
      existing.lastSeen = chunkIndex;
      // Extract any new appearance details
      const newDetails = this.extractCharacterAppearance(name, context);
      if (newDetails && !existing.appearance.includes(newDetails)) {
        existing.appearance += `, ${newDetails}`;
      }
    } else {
      // Create new character profile
      const appearance = this.extractCharacterAppearance(name, context);
      const profile: CharacterProfile = {
        name,
        description: this.generateCharacterDescription(name, context),
        appearance: appearance || this.generateDefaultAppearance(name),
        firstMention: chunkIndex,
        lastSeen: chunkIndex,
        consistency: this.generateConsistencyKey(name, context)
      };
      this.characterProfiles.set(name, profile);
      console.log(`👤 New character discovered: ${name} - ${profile.appearance}`);
    }
  }
  
  private extractCharacterAppearance(name: string, context: string): string {
    const nameLower = name.toLowerCase();
    const contextLower = context.toLowerCase();
    
    // Look for appearance descriptions near the character's name
    const sentences = context.split(/[.!?]+/);
    let appearance = '';
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(nameLower)) {
        // Physical appearance terms
        const physicalTerms = [
          'tall', 'short', 'thin', 'broad', 'slender', 'muscular',
          'blonde', 'brunette', 'dark hair', 'red hair', 'gray hair', 'bald',
          'blue eyes', 'green eyes', 'brown eyes', 'hazel eyes',
          'beard', 'mustache', 'clean-shaven',
          'glasses', 'hat', 'cap', 'helmet',
          'young', 'old', 'middle-aged', 'elderly',
          'pale', 'tanned', 'dark skin', 'fair skin',
          'scar', 'tattoo', 'freckles'
        ];
        
        // Clothing terms
        const clothingTerms = [
          'coat', 'jacket', 'shirt', 'dress', 'suit', 'uniform', 'robe',
          'jeans', 'pants', 'skirt', 'boots', 'shoes', 'sandals',
          'red', 'blue', 'green', 'black', 'white', 'brown', 'gray', 'purple'
        ];
        
        const allTerms = [...physicalTerms, ...clothingTerms];
        
        allTerms.forEach(term => {
          if (sentence.toLowerCase().includes(term) && !appearance.includes(term)) {
            appearance += appearance ? `, ${term}` : term;
          }
        });
      }
    }
    
    return appearance;
  }
  
  private generateDefaultAppearance(name: string): string {
    // Generate consistent default appearance based on name
    const nameCode = name.charCodeAt(0) + name.length;
    
    const builds = ['athletic build', 'tall and lean', 'average height and build', 'petite frame'];
    const hair = ['dark brown hair', 'light brown hair', 'blonde hair', 'black hair', 'auburn hair'];
    const eyes = ['brown eyes', 'blue eyes', 'green eyes', 'hazel eyes', 'gray eyes'];
    const features = ['defined jawline', 'soft features', 'angular features', 'round face'];
    const age = ['young adult', 'middle-aged', 'mature adult'];
    
    return `${age[(nameCode * 5) % age.length]} with ${builds[nameCode % builds.length]}, ${hair[(nameCode * 2) % hair.length]}, ${eyes[(nameCode * 3) % eyes.length]}, ${features[(nameCode * 4) % features.length]}`;
  }
  
  private generateConsistencyKey(name: string, context: string): string {
    // Create a consistency key for the character
    return `${name} with consistent visual appearance throughout the scene`;
  }
  
  private generateCharacterDescription(name: string, context: string): string {
    const appearance = this.extractCharacterAppearance(name, context);
    if (appearance) {
      return `${name} is a character with ${appearance}`;
    }
    return `${name} is a distinctive character with memorable features`;
  }
  
  private async addCharacterConsistency(basePrompt: string, characters: string[]): Promise<string> {
    if (characters.length === 0) {
      return basePrompt;
    }
    
    let consistencyInfo = '';
    
    // Add character consistency information
    if (this.previousImagePath) {
      consistencyInfo += 'IMPORTANT: Maintain exact visual consistency with previous images. ';
    }
    
    characters.forEach(charName => {
      const profile = this.characterProfiles.get(charName);
      if (profile) {
        consistencyInfo += `${charName} should have: ${profile.appearance}. `;
      }
    });
    
    return `${basePrompt} ${consistencyInfo}`.trim();
  }
  
  private async buildAdvancedPrompt(text: string, characters: string[], chunkIndex: number, artStyle: ArtStyle): Promise<string> {
    let prompt = '';
    
    // Start with high quality and style instructions based on selected style
    const stylePrompts = {
      realistic: 'Create a photorealistic, cinematic digital photograph with professional lighting. Realistic humans, detailed facial features, natural skin textures, and authentic expressions. Studio-quality photography style. ',
      cinematic: 'Create a cinematic, movie-quality scene with dramatic lighting and composition. Film photography aesthetic, professional cinematography, dramatic shadows and highlights. ',
      artistic: 'Create an artistic, painterly illustration with rich colors and expressive brushstrokes. Fine art style, detailed composition, artistic interpretation. ',
      anime: 'Create a high-quality anime-style illustration with detailed character designs, vibrant colors, and clean line art. Japanese animation aesthetic. ',
      vintage: 'Create a vintage-style photograph with film grain, muted colors, and classic composition. Retro aesthetic, nostalgic atmosphere. '
    };
    
    prompt += stylePrompts[artStyle];
    
    // Character consistency instructions (most important part)
    if (characters.length > 0 && this.previousImagePath) {
      prompt += 'IMPORTANT: Maintain exact visual consistency with the previous image. ';
      prompt += 'Keep the same character appearances, facial features, clothing, and visual style. ';
      
      characters.forEach(charName => {
        const profile = this.characterProfiles.get(charName);
        if (profile) {
          prompt += `${charName} must look exactly the same as before: ${profile.appearance}. `;
        }
      });
    } else if (characters.length > 0) {
      // First appearance - establish character looks
      prompt += 'Establish consistent character designs: ';
      characters.forEach(charName => {
        const profile = this.characterProfiles.get(charName);
        if (profile) {
          prompt += `${charName} has ${profile.appearance}. `;
        }
      });
    }
    
    // Scene analysis from the actual text
    const sceneElements = this.analyzeSceneContent(text);
    
    // Add the main scene content directly from text
    const firstSentences = text.split(/[.!?]+/).slice(0, 2).join('. ').trim();
    if (firstSentences.length > 15) {
      prompt += `Scene depicts: ${firstSentences}. `;
    }
    
    // Add setting and atmosphere
    if (sceneElements.setting) {
      prompt += `Location: ${sceneElements.setting}. `;
    }
    
    if (sceneElements.mood) {
      prompt += `Atmosphere: ${sceneElements.mood}. `;
    }
    
    if (sceneElements.timeOfDay) {
      prompt += `Lighting: ${sceneElements.timeOfDay}. `;
    }
    
    // Technical quality specifications
    prompt += 'Professional photography, hyperrealistic, detailed human features, natural lighting, 8k quality, consistent character appearance, no cartoonish or illustrated style.';
    
    return prompt;
  }
  
  private analyzeSceneContent(text: string): any {
    return {
      setting: this.determineSettingFromText(text),
      timeOfDay: this.determineTimeOfDay(text),
      mood: this.determineMood(text),
      action: this.determineMainAction(text),
      objects: this.findImportantObjects(text)
    };
  }
  
  // Keep the existing helper methods but enhance them
  private determineSettingFromText(text: string): string {
    const textLower = text.toLowerCase();
    
    const settings = {
      'kitchen': 'warm kitchen with cooking area',
      'bedroom': 'cozy bedroom interior',
      'living room': 'comfortable living room',
      'office': 'modern office space',
      'restaurant': 'restaurant or dining establishment',
      'cafe': 'cozy cafe atmosphere',
      'bar': 'bar or tavern setting',
      'forest': 'natural forest environment with trees',
      'park': 'outdoor park setting',
      'street': 'urban street scene',
      'city': 'cityscape environment',
      'school': 'school or educational setting',
      'library': 'library with books and study areas',
      'hospital': 'medical facility',
      'car': 'inside vehicle',
      'house': 'residential home interior',
      'apartment': 'apartment interior',
      'garden': 'garden or outdoor space with plants'
    };
    
    for (const [keyword, description] of Object.entries(settings)) {
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      if (textLower.includes(keyword)) {
        return description;
      }
    }
    
<<<<<<< HEAD
    return 'atmospheric environment';
  }
  
  private extractMood(text: string): string {
    const moodKeywords = {
      'dark': 'dark and mysterious',
      'bright': 'bright and cheerful',
      'sad': 'melancholic',
      'happy': 'joyful',
      'tense': 'tense and dramatic',
      'peaceful': 'peaceful and serene',
      'scary': 'ominous and frightening',
      'romantic': 'romantic and warm',
    };
    
    const textLower = text.toLowerCase();
    for (const [keyword, mood] of Object.entries(moodKeywords)) {
      if (textLower.includes(keyword)) {
        return mood;
      }
    }
    
    return 'atmospheric';
  }
  
  private extractObjects(text: string): string[] {
    const objects: string[] = [];
    const objectKeywords = ['sword', 'book', 'table', 'chair', 'door', 'window', 'car', 'phone', 'computer', 'tree', 'flower'];
    
    const textLower = text.toLowerCase();
    objectKeywords.forEach(obj => {
      if (textLower.includes(obj)) {
        objects.push(obj);
      }
    });
    
    return objects.slice(0, 3); // Limit to 3 objects
  }
  
  private extractAction(text: string): string {
    const actionKeywords = {
      'running': 'person running',
      'walking': 'person walking',
      'sitting': 'person sitting',
      'standing': 'person standing',
      'talking': 'people in conversation',
      'fighting': 'action combat scene',
      'reading': 'person reading',
      'writing': 'person writing',
      'looking': 'person observing',
    };
    
    const textLower = text.toLowerCase();
    for (const [keyword, action] of Object.entries(actionKeywords)) {
      if (textLower.includes(keyword)) {
        return action;
=======
    // Look for indoor/outdoor clues
    if (textLower.includes('outside') || textLower.includes('outdoor')) {
      return 'outdoor environment';
    }
    if (textLower.includes('inside') || textLower.includes('indoor')) {
      return 'indoor environment';
    }
    
    return 'atmospheric environment';
  }
  
  private determineTimeOfDay(text: string): string {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('morning') || textLower.includes('sunrise') || textLower.includes('dawn') || textLower.includes('breakfast')) {
      return 'warm morning lighting';
    }
    if (textLower.includes('night') || textLower.includes('evening') || textLower.includes('dark') || textLower.includes('midnight') || textLower.includes('dinner')) {
      return 'atmospheric evening lighting';
    }
    if (textLower.includes('afternoon') || textLower.includes('noon') || textLower.includes('lunch')) {
      return 'bright afternoon lighting';
    }
    
    return 'natural lighting';
  }
  
  private determineMood(text: string): string {
    const textLower = text.toLowerCase();
    
    const moodKeywords = {
      'happy': ['happy', 'joy', 'laugh', 'smile', 'cheerful', 'excited', 'celebration', 'fun'],
      'sad': ['sad', 'cry', 'tear', 'sorrow', 'grief', 'melancholy', 'depressed'],
      'tense': ['tense', 'nervous', 'anxious', 'worried', 'stress', 'urgent', 'pressure'],
      'romantic': ['love', 'romantic', 'kiss', 'embrace', 'tender', 'intimate'],
      'mysterious': ['mystery', 'strange', 'odd', 'curious', 'unknown', 'secret', 'hidden'],
      'dramatic': ['dramatic', 'intense', 'powerful', 'conflict', 'argument', 'fight'],
      'peaceful': ['calm', 'peaceful', 'serene', 'quiet', 'tranquil', 'relaxed', 'gentle']
    };
    
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return `${mood} mood`;
      }
    }
    
    return 'engaging atmosphere';
  }
  
  private determineMainAction(text: string): string {
    const textLower = text.toLowerCase();
    
    const actionKeywords = {
      'conversation': ['said', 'asked', 'replied', 'talked', 'spoke', 'whispered', 'discussion'],
      'movement': ['walked', 'ran', 'moved', 'stepped', 'hurried', 'rushed', 'dancing'],
      'eating': ['eating', 'dinner', 'lunch', 'breakfast', 'food', 'meal', 'cooking'],
      'working': ['worked', 'job', 'office', 'computer', 'meeting', 'business'],
      'studying': ['reading', 'book', 'study', 'learning', 'school', 'homework']
    };
    
    for (const [action, keywords] of Object.entries(actionKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return `${action} scene`;
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
      }
    }
    
    return '';
  }
  
<<<<<<< HEAD
  clearCharacterRegistry(): void {
    this.characterRegistry.clear();
    this.previousSceneContext = '';
=======
  private findImportantObjects(text: string): string[] {
    const objects: string[] = [];
    const textLower = text.toLowerCase();
    
    const importantObjects = [
      'book', 'letter', 'phone', 'computer', 'laptop', 'table', 'chair', 'sofa',
      'door', 'window', 'car', 'bicycle', 'keys', 'bag', 'backpack', 'suitcase',
      'cup', 'glass', 'bottle', 'plate', 'food', 'coffee', 'tea',
      'picture', 'painting', 'mirror', 'clock', 'lamp', 'candle', 'flowers'
    ];
    
    importantObjects.forEach(obj => {
      if (textLower.includes(obj) && !objects.includes(obj)) {
        objects.push(obj);
      }
    });
    
    return objects.slice(0, 3);
  }
  
  private fallbackPrompt(text: string): string {
    const firstSentence = text.split(/[.!?]+/)[0] || text.substring(0, 100);
    return `Create a cinematic illustration depicting: ${firstSentence}. Professional quality, detailed, photorealistic, consistent character design.`;
  }
  
  // Method to get character profiles for debugging
  getCharacterProfiles(): Map<string, CharacterProfile> {
    return this.characterProfiles;
  }
  
  // Method to get previous image for Gemini consistency
  async getPreviousImageForConsistency(): Promise<string | null> {
    return this.previousImagePath;
  }
  
  clearContext(): void {
    this.characterProfiles.clear();
    this.previousImagePath = null;
    this.storyContext = '';
    this.globalCharacters = [];
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  }
}