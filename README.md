# 🎭 VisualStory App

**Transform any book into an immersive audiovisual experience with AI-powered narration and real-time image generation.**

> A competition-ready React Native application that creates cinematic storytelling experiences by combining AI-generated visuals with high-quality voice narration.

## 🌟 Features

### Core Functionality
- **🎤 AI-Powered Narration**: Premium voice synthesis using ElevenLabs API with natural-sounding voices
- **🎨 Real-time Scene Visualization**: Dynamic AI-generated artwork that brings stories to life
- **🧠 Intelligent Text Processing**: Smart chunking algorithm for optimal scene breaks and flow
- **👥 Character Consistency Engine**: AI Art Director maintains visual continuity across scenes
- **⚡ Seamless Playback**: Advanced buffering system ensures smooth audio-visual synchronization
- **📚 Personal Library**: Local book storage with metadata management
- **🎛️ Intuitive Controls**: Professional media player interface with progress tracking

### Technical Excellence
- **Cross-platform**: Runs on iOS, Android, and Web via Expo
- **TypeScript**: Full type safety and modern development practices
- **State Management**: Zustand for predictable state handling
- **Performance Optimized**: Parallel processing and intelligent caching
- **Graceful Degradation**: Fallback systems for API failures

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Expo CLI** (`npm install -g @expo/cli`)
- **iOS Simulator** (macOS) or **Android Studio** emulator

### Installation

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd VisualStory/VisualStoryApp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   
   Copy the example environment file and add your API keys:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your actual API keys:
   ```env
   ELEVENLABS_API_KEY=your_elevenlabs_key_here
   GOOGLE_API_KEY=your_google_gemini_key_here  
   ELEVENLABS_VOICE_ID=your_preferred_voice_id
   ```
   
   ⚠️ **Security Note**: Never commit your `.env` file to version control. The `.gitignore` file is configured to exclude it automatically.

4. **Start Development Server**
   ```bash
   npm start
   # or
   npx expo start
   ```

5. **Launch Platform**
   - **iOS**: `npm run ios` or press `i` in the Expo CLI
   - **Android**: `npm run android` or press `a` in the Expo CLI  
   - **Web**: `npm run web` or press `w` in the Expo CLI

## 🔧 API Configuration

### Required API Keys

#### 1. ElevenLabs (Voice Generation)
- **Purpose**: High-quality text-to-speech narration
- **Setup**: 
  1. Visit [ElevenLabs](https://elevenlabs.io)
  2. Create account and get API key
  3. Choose a voice ID from their library
- **Free Tier**: 10,000 characters/month

#### 2. Google Gemini (Image Generation)
- **Purpose**: AI-generated scene artwork
- **Setup**:
  1. Go to [Google AI Studio](https://aistudio.google.com)
  2. Create project and generate API key
  3. Enable Gemini API access
- **Free Tier**: Generous quota for testing

> **Note**: Configure these directly in the app's Settings screen after first launch, or via the `.env` file for development.

## 📱 Usage Guide

### Adding Your First Book
1. **Launch the app** and tap the **+** button in the library
2. **Import content** via:
   - Document picker (`.txt` files)
   - Paste text directly
   - Type/dictate content
3. **Add metadata** (title, author)
4. **Save** to your personal library

### Immersive Reading Experience
1. **Select a book** from your library grid
2. **Wait for processing** (text chunking and initial generation)
3. **Enjoy the experience**:
   - Automatic scene progression
   - Synchronized audio-visual playback
   - Intelligent scene transitions

### Playback Controls
- **⏯️ Play/Pause**: Control narration playback
- **⏮️⏭️ Skip**: Navigate between scenes
- **🔄 Progress Bar**: Jump to any point in the story
- **🔊 Volume**: Adjust audio levels
- **⚙️ Settings**: Configure APIs and preferences

## 🏗️ Architecture

### Technology Stack
- **React Native 0.79.6**: Cross-platform mobile framework
- **Expo SDK 53**: Simplified development and deployment
- **TypeScript 5.8**: Type safety and developer experience
- **Zustand**: Lightweight state management
- **React Native Paper**: Material Design components

### Key Dependencies
```json
{
  "expo-audio": "Audio playback and control",
  "expo-document-picker": "File import functionality", 
  "expo-file-system": "Local file management",
  "axios": "API communication",
  "react-native-async-storage": "Local data persistence",
  "@react-native-community/slider": "Progress control",
  "react-native-vector-icons": "UI iconography"
}
```

### Project Structure
```
VisualStoryApp/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── AddBookModal.tsx     # Book import interface
│   │   ├── BookLibrary.tsx      # Library grid view
│   │   ├── BottomNavigation.tsx # App navigation
│   │   ├── LoadingAnimation.tsx # Custom loading states
│   │   ├── LoadingScreen.tsx    # Full-screen loader
│   │   ├── PlaybackControls.tsx # Media controls
│   │   └── ReaderView.tsx       # Immersive reading UI
│   ├── screens/              # Main app screens
│   │   ├── MainScreen.tsx       # Primary interface
│   │   └── SettingsScreen.tsx   # Configuration panel
│   ├── services/             # Business logic
│   │   ├── apiService.ts        # External API management
│   │   ├── artDirector.ts       # AI scene generation
│   │   └── bufferManager.ts     # Content preloading
│   ├── store/                # State management
│   │   └── index.ts             # Zustand store
│   ├── types/                # TypeScript definitions
│   │   └── index.ts             # App-wide types
│   └── utils/                # Helper functions
│       └── textChunker.ts       # Smart text processing
├── assets/                   # App icons and images
├── App.tsx                   # Root component
├── app.json                  # Expo configuration
└── package.json             # Dependencies and scripts
```

## 🎯 Core Components

### ReaderView (`src/components/ReaderView.tsx`)
The immersive reading interface that combines:
- Real-time image generation and display
- Synchronized audio narration
- Smooth scene transitions
- Progress tracking

### ArtDirector (`src/services/artDirector.ts`)
AI service responsible for:
- Character consistency across scenes
- Scene description generation  
- Visual style coordination
- Prompt optimization

### BufferManager (`src/services/bufferManager.ts`)
Performance optimization system:
- Preloads upcoming scenes
- Manages memory usage
- Handles network failures gracefully
- Ensures smooth playback

### TextChunker (`src/utils/textChunker.ts`)
Intelligent text processing:
- Detects natural scene breaks
- Maintains narrative flow
- Optimizes chunk sizes
- Preserves context

## 🔧 Development

### Local Development
```bash
# Start with clearing cache
npm start -- --clear

# iOS development
npm run ios

# Android development  
npm run android

# Web development
npm run web
```

### Building for Production
```bash
# iOS build
npx expo build:ios

# Android build
npx expo build:android

# Web build
npx expo export:web
```

### Environment Variables
```env
# Required for full functionality
ELEVENLABS_API_KEY=your_key
GOOGLE_API_KEY=your_key  
ELEVENLABS_VOICE_ID=preferred_voice

# Optional enhancements
DEBUG_MODE=false
```

## 📊 Performance Features

- **Parallel Processing**: Simultaneous audio and image generation
- **Smart Caching**: Reduces API calls and improves response times
- **Memory Management**: Efficient asset loading and cleanup
- **Network Resilience**: Offline fallbacks and retry logic
- **Battery Optimization**: Intelligent background processing

## 🔒 Security & Privacy

- **API Key Protection**: All sensitive keys are stored in `.env` files (excluded from git)
- **Local Storage**: Books and generated content stay on your device
- **No Data Collection**: Zero telemetry or user tracking
- **Secure Communication**: All API calls use HTTPS encryption
- **Environment Isolation**: Development and production keys kept separate

## 🛠️ Troubleshooting

### Common Issues

**App won't start:**
```bash
npx expo install --fix
npm start -- --clear
```

**Audio playback issues:**
- Ensure device volume is up
- Check API key configuration
- Verify network connectivity

**Image generation slow:**
- Check Google API quota
- Verify API key permissions
- Consider upgrading API plan

**Build failures:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode
Enable detailed logging by setting `DEBUG_MODE=true` in your `.env` file.

## 🏆 Competition Highlights

- **Innovation**: First-of-its-kind audiovisual book experience
- **Technical Excellence**: Modern React Native with TypeScript
- **User Experience**: Intuitive interface with professional polish
- **Scalability**: Modular architecture ready for expansion
- **Performance**: Optimized for smooth real-time generation
- **Cross-platform**: Single codebase, multiple platforms

## 📄 License

MIT License - Feel free to use this project as inspiration for your own creative endeavors.

---

**Ready to transform reading forever?** 🚀

*For questions or issues, please check the troubleshooting section above or refer to the inline code documentation.*