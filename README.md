# Visual Story App

Transform any book into an immersive audiovisual experience with AI-powered narration and real-time image generation.

## Features

- **AI Narration**: High-quality voice synthesis using ElevenLabs API
- **Real-time Art Generation**: Dynamic scene visualization with AI-generated artwork
- **Smart Text Processing**: Intelligent text chunking for optimal scene breaks
- **Character Consistency**: AI Art Director maintains visual consistency across scenes
- **Smooth Playback**: Advanced buffering system for seamless audio-visual experience
- **Book Library**: Save and manage multiple books locally

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on iOS:
```bash
npx expo run:ios
```

Or Android:
```bash
npx expo run:android
```

### API Configuration

The app requires API keys for full functionality:

1. **ElevenLabs API Key**: For voice narration
   - Sign up at https://elevenlabs.io
   - Get your API key from the dashboard

2. **Image Generation API Key**: For AI artwork
   - Google Gemini API or similar service
   - Get key from Google AI Studio

3. **OpenAI API Key**: For the AI Art Director
   - Sign up at https://platform.openai.com
   - Generate API key from account settings

Configure these in the app's Settings screen.

## Usage

1. **Add a Book**: 
   - Tap the + button in the library
   - Upload a .txt file or paste text content
   - Give your book a title

2. **Start Reading**:
   - Select a book from your library
   - The app will process the text and begin playback
   - Use playback controls to navigate

3. **Controls**:
   - Play/Pause: Control narration
   - Skip: Jump between scenes
   - Progress Bar: Navigate to any point in the book

## Architecture

- **React Native + Expo**: Cross-platform mobile framework
- **Zustand**: State management
- **Expo AV**: Audio playback
- **AsyncStorage**: Local book storage
- **Custom AI Art Director**: Maintains visual consistency
- **Smart Buffer Manager**: Preloads content for smooth experience

## Key Components

- `MainScreen`: Primary app interface and navigation
- `ReaderView`: Immersive reading experience with visuals
- `PlaybackControls`: Audio and navigation controls
- `BookLibrary`: Book management interface
- `ArtDirector`: AI service for generating scene prompts
- `BufferManager`: Handles content preloading
- `ApiService`: Manages external API calls

## Development

The app uses TypeScript for type safety and includes:
- Smart text chunking algorithm
- Character tracking for visual consistency
- Parallel API processing for performance
- Graceful fallbacks for API failures

## License

MIT