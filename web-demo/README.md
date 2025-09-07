# 🎭 VisualStory Web Demo

**AI-Powered Audiovisual Reading Experience**

This is a web-based demo version of VisualStory, optimized for Google AI Studio and web browsers. It transforms text into immersive stories with real-time AI-generated visuals and voice narration.

## 🌟 Demo Features

### ✅ **User-Provided API Keys**
- **Secure**: Users provide their own API keys for zero cost to you
- **Gemini API**: Required for AI image generation 
- **ElevenLabs API**: Optional for premium voice narration
- **Fallback**: Uses browser Web Speech API when ElevenLabs unavailable

### 🎨 **AI-Generated Visuals**
- Real-time scene illustration using Gemini 2.0 Flash
- Character consistency across story scenes
- Professional art style with safety filtering
- Fallback to curated placeholder images

### 🎤 **Voice Narration**
- **Premium**: ElevenLabs TTS with natural voices (user's API key)
- **Free**: Browser Web Speech API as fallback
- Automatic scene progression with audio

### 📚 **Demo Content**
- **3 Sample Stories**: Alice's Adventure, Space Explorer, Enchanted Forest
- **Custom Text Input**: Users can create stories (2000 char limit)
- **Smart Text Processing**: Automatic scene chunking (max 10 scenes)

### 🛡️ **Safety & Performance**
- Content filtering for AI safety guidelines
- Rate limiting and error handling
- Mobile-responsive design
- Progress tracking and loading states

## 🚀 Deployment Instructions

### For Google AI Studio:

1. **Upload Files**: Upload all files (`index.html`, `app.js`, `metadata.json`) to AI Studio
2. **Set Permissions**: The metadata.json includes microphone permissions for speech
3. **Share**: Users will see the API key setup screen first
4. **Usage**: Users provide their own Gemini API keys (required) and ElevenLabs keys (optional)

### API Key Requirements:

**For Users (Required):**
- **Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com)
  - Used for: AI image generation
  - Cost: Gemini 2.0 Flash has generous free tier
  
**For Users (Optional):**
- **ElevenLabs API Key**: Get from [ElevenLabs](https://elevenlabs.io)
  - Used for: Premium voice narration
  - Fallback: Browser speech synthesis (free)
  - Cost: 10,000 characters/month free tier

## 💡 How It Works

### 1. **API Key Setup**
```javascript
// Users enter their API keys securely in browser
const apiService = new WebApiService();
apiService.setApiKeys({
  gemini: 'user_gemini_key',
  elevenlabs: 'user_elevenlabs_key' // optional
});
```

### 2. **Story Processing**
```javascript
// Text is chunked into scenes (max 10 for demo)
const chunks = chunkText(storyText);
// Each chunk gets AI-generated image and audio
```

### 3. **AI Generation**
```javascript
// Image generation with Gemini
const imageUrl = await generateImage(sceneText);
// Audio with ElevenLabs or Web Speech fallback
const audioUrl = await generateAudio(sceneText);
```

### 4. **Playback**
- Synchronized audio-visual experience
- Automatic scene progression  
- Manual navigation controls
- Progress tracking

## 🔒 Security Features

- **No Server Storage**: All API keys stay in user's browser session
- **Content Filtering**: Automatic filtering of problematic content for AI safety
- **Rate Limiting**: Prevents API abuse
- **Error Handling**: Graceful fallbacks for API failures

## 📊 Demo Limitations

- **Story Length**: Max 2000 characters for custom stories
- **Scene Count**: Max 10 scenes per story
- **Session Storage**: No persistent storage (resets on refresh)
- **Image Cache**: Limited to session memory
- **Audio Quality**: Web Speech fallback has robotic voice

## 🎯 Competition Highlights

### **Innovation**
- First web-based audiovisual story generator
- Real-time AI image generation with character consistency
- Hybrid audio system (premium + free options)

### **User Experience** 
- Zero-setup for users with Gemini API key
- Professional UI with smooth transitions
- Mobile-responsive design
- Intuitive controls

### **Technical Excellence**
- Modern React with ES modules
- Efficient API management and caching
- Error handling and graceful degradation
- Cross-browser compatibility

### **Scalability**
- User-provided API keys = zero ongoing costs
- Modular architecture for easy expansion
- Compatible with Google AI Studio platform

## 🔧 Development Notes

### Dependencies Used:
- **React 18**: Modern UI framework via ESM
- **Gemini 2.0 Flash**: Latest image generation model
- **ElevenLabs TTS**: Premium voice synthesis
- **Web Speech API**: Browser fallback for narration

### Performance Optimizations:
- Image blob caching for session
- Audio URL object management
- Lazy loading of scene content
- Rate limiting for API calls

## 🎪 Ready for Demo!

This demo showcases the core VisualStory experience while being:
- **Cost-effective**: Users provide their own API keys
- **Secure**: No server-side key storage
- **Accessible**: Works in any modern browser
- **Impressive**: Full AI-powered audiovisual experience

Perfect for competition submission and user demonstrations! 🚀