import { Character } from '../types';

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
      return prompt;
    } catch (error) {
      console.error('Error generating image prompt:', error);
      return this.fallbackPrompt(textChunk);
    }
  }
  
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
      if (textLower.includes(keyword)) {
        return description;
      }
    }
    
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
      }
    }
    
    return '';
  }
  
  clearCharacterRegistry(): void {
    this.characterRegistry.clear();
    this.previousSceneContext = '';
  }
}