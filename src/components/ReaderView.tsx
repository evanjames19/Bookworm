import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Audio from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore, ArtStyle } from '../store';
import { LoadingAnimation } from './LoadingAnimation';

const { width, height } = Dimensions.get('window');

interface ReaderViewProps {
  onPlaybackComplete?: () => void;
  onViewModeChange?: (isImmersive: boolean, viewMode?: 'image' | 'text') => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ onPlaybackComplete, onViewModeChange }) => {
  const {
    currentChunk,
    chunks,
    playbackState,
    isLoading,
    loadingMessage,
    artStyle,
    setArtStyle,
    setPlaybackState,
    saveBookVersion,
  } = useStore();
  
  const player = Audio.useAudioPlayer();
  const status = Audio.useAudioPlayerStatus(player);
  const [viewMode, setViewMode] = useState<'image' | 'text'>('image');
  const [highlightedSentence, setHighlightedSentence] = useState(0);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showImageControls, setShowImageControls] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const imageOpacity2 = useRef(new Animated.Value(0)).current;
  const imageTextScrollRef = useRef<ScrollView>(null);
  const hasCompletedRef = useRef(false);
  const lastScrollPositionRef = useRef<number>(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('https://picsum.photos/400/600?blur=2');
  const [previousImageUrl, setPreviousImageUrl] = useState<string>('');
  const [virtualPlaybackTime, setVirtualPlaybackTime] = useState<number>(0);
  const [chunkDurations, setChunkDurations] = useState<number[]>([]);
  const [totalStoryDuration, setTotalStoryDuration] = useState<number>(0);
  const nextPlayerRef = useRef<any>(null); // For preloading next chunk

  // Notify parent about initial image mode
  useEffect(() => {
    onViewModeChange?.(true, 'image');
  }, []);

  // Calculate total story duration when chunks change
  useEffect(() => {
    if (chunks.length > 0) {
      // Initialize durations array - we'll populate as audio loads
      setChunkDurations(new Array(chunks.length).fill(0));
    }
  }, [chunks]);

  // Auto-scroll based on audio progress (using same logic as text view for consistency)
  useEffect(() => {
    if (imageTextScrollRef.current && chunks.length > 0) {
      // Use the same calculation logic as the text view for consistent scrolling
      const hasAllDurations = chunkDurations.filter(d => d > 0).length === chunks.length;
      const hasCurrentChunkDuration = chunkDurations[playbackState.currentChunkIndex] > 0;
      
      // Calculate total words across all chunks (same as text view)
      let totalAudioWords = 0;
      let chunkWordCounts: number[] = [];
      
      chunks.forEach((chunk) => {
        const audioWords = chunk.text.split(/\s+/).filter(word => word.trim());
        chunkWordCounts.push(audioWords.length);
        totalAudioWords += audioWords.length;
      });
      
      let currentGlobalWordIndex = 0;
      
      if (hasAllDurations && totalStoryDuration > 0) {
        // Use full story progress if available (same as text view)
        const globalProgress = virtualPlaybackTime / totalStoryDuration;
        currentGlobalWordIndex = Math.floor(globalProgress * totalAudioWords);
      } else if (hasCurrentChunkDuration && status.currentTime !== undefined && status.duration > 0) {
        // Use current chunk progress as fallback (same as text view)
        const currentChunkProgress = status.currentTime / status.duration;
        
        // Calculate words up to current chunk
        let wordsBeforeCurrentChunk = 0;
        for (let i = 0; i < playbackState.currentChunkIndex; i++) {
          wordsBeforeCurrentChunk += chunkWordCounts[i];
        }
        
        const currentChunkWords = chunkWordCounts[playbackState.currentChunkIndex];
        const currentChunkWordIndex = Math.floor(currentChunkProgress * currentChunkWords);
        currentGlobalWordIndex = wordsBeforeCurrentChunk + currentChunkWordIndex;
      } else {
        // Fallback: estimate position based on current chunk index and virtual time (same as text view)
        // Calculate words up to current chunk
        let wordsBeforeCurrentChunk = 0;
        for (let i = 0; i < playbackState.currentChunkIndex; i++) {
          wordsBeforeCurrentChunk += chunkWordCounts[i];
        }
        
        // Estimate progress within current chunk (assume average chunk duration of 20 seconds)
        const estimatedChunkDuration = 20;
        const timeInCurrentChunk = virtualPlaybackTime - (playbackState.currentChunkIndex * estimatedChunkDuration);
        const estimatedChunkProgress = Math.max(0, Math.min(1, timeInCurrentChunk / estimatedChunkDuration));
        
        const currentChunkWords = chunkWordCounts[playbackState.currentChunkIndex] || 50;
        const currentChunkWordIndex = Math.floor(estimatedChunkProgress * currentChunkWords);
        currentGlobalWordIndex = wordsBeforeCurrentChunk + currentChunkWordIndex;
      }
      
      // Ensure we don't exceed bounds
      currentGlobalWordIndex = Math.min(currentGlobalWordIndex, totalAudioWords - 1);
      
      // Calculate scroll position based on word position (same logic for both modes)
      let targetY = 0;
      
      if (viewMode === 'text') {
        // Text mode: larger line height and centering
        const lineHeight = 32; // From paragraphText style  
        const averageWordsPerLine = 7; // Realistic for mobile
        const currentLine = Math.floor(currentGlobalWordIndex / averageWordsPerLine);
        const targetScrollY = currentLine * lineHeight;
        const screenCenter = 300; // Center on screen
        targetY = Math.max(0, targetScrollY - screenCenter);
        
      } else {
        // Image mode: uses the same content as text mode (all chunks), so use similar calculation
        // but with smaller line height and different centering for the compact preview
        const lineHeight = 22; // From previewText style
        const averageWordsPerLine = 8; // Smaller font in image mode
        const currentLine = Math.floor(currentGlobalWordIndex / averageWordsPerLine);
        const targetScrollY = currentLine * lineHeight;
        
        // Account for the spacing between chunks (\n\n adds extra height)
        const chunksBeforeCurrent = playbackState.currentChunkIndex;
        const chunkSpacingHeight = chunksBeforeCurrent * 44; // 2 line breaks * 22px line height
        const totalTargetY = targetScrollY + chunkSpacingHeight;
        
        const screenCenter = 25; // Further reduced for faster, more responsive scrolling
        targetY = Math.max(0, totalTargetY - screenCenter);
      }
      
      // Only scroll if position changed significantly (reduce excessive scrolling)
      const currentScrollY = lastScrollPositionRef.current;
      if (Math.abs(targetY - currentScrollY) > 3) { // Reduced threshold for more responsive scrolling
        lastScrollPositionRef.current = targetY;
        imageTextScrollRef.current.scrollTo({
          y: targetY,
          animated: true,
        });
        
        // Debug logging for alignment
        if (currentGlobalWordIndex % 20 === 0) {
          console.log(`📜 ${viewMode} scroll: word ${currentGlobalWordIndex + 1}/${totalAudioWords}, targetY: ${targetY.toFixed(0)}px`);
        }
      }
    }
  }, [virtualPlaybackTime, totalStoryDuration, chunks, playbackState.currentChunkIndex, viewMode, status.currentTime, status.duration, chunkDurations]);
  
  // Handle seamless image transitions
  useEffect(() => {
    if (currentChunk?.imageUrl && 
        currentChunk.imageUrl !== currentImageUrl) { // Update for any valid image URL, including placeholders
      
      console.log(`🖼️ Updating image: ${currentChunk.imageUrl.substring(0, 50)}...`);
      
      // Clean up any double file protocols before using the image
      const cleanImageUrl = currentChunk.imageUrl.replace(/^file:\/\/file:\/\//, 'file://');
      console.log(`🔍 Clean image URL: ${cleanImageUrl.substring(0, 50)}...`);
      
      // Always use cross-fade for smooth transitions, except for the very first load
      const isVeryFirstLoad = !currentImageUrl || currentImageUrl.includes('picsum.photos');
      
      if (isVeryFirstLoad) {
        setCurrentImageUrl(cleanImageUrl);
        console.log('🖼️ Initial image load (no transition)');
        return;
      }
      
      // Validate that we have a valid new image URL
      if (!cleanImageUrl || cleanImageUrl === currentImageUrl) {
        console.log('🚨 Invalid or duplicate image URL, skipping transition');
        return;
      }
      
      // Instant image change for dynamic feel - no loading animations
      setCurrentImageUrl(cleanImageUrl);
      
      console.log(`🔄 Instant image change to: ${cleanImageUrl.substring(0, 50)}...`);
      
      // No animation - just immediate change for dynamic, live feel
      imageOpacity.setValue(1);
      imageOpacity2.setValue(0);
      setPreviousImageUrl('');
      console.log('✨ Image changed instantly');
    } else if (currentChunk?.imageUrl && !currentImageUrl) {
      // Initial image load - accept any valid image URL
      setCurrentImageUrl(currentChunk.imageUrl);
      console.log(`🖼️ Initial image load: ${currentChunk.imageUrl.substring(0, 50)}...`);
    }
  }, [currentChunk?.imageUrl]);
  
  useEffect(() => {
    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [currentChunk?.text]);
  
  useEffect(() => {
    return () => {
      // Clean up audio on unmount - hooks manage cleanup automatically
      console.log('🧹 Component unmounting, audio cleanup handled by hooks');
    };
  }, []);
  
  const playAudio = async () => {
    if (!currentChunk?.audioUrl || currentChunk.audioUrl === 'placeholder_audio_path') {
      console.log('🔇 Audio disabled, skipping audio playback');
      return;
    }
    
    try {
      console.log('🔊 Loading audio with hooks API:', currentChunk.audioUrl);
      console.log('🎮 Current playback state:', playbackState.isPlaying);
      
      // Load the audio source using the hook-based API
      player.replace(currentChunk.audioUrl);
      
      // Start playback automatically when a new chunk loads
      console.log('🎯 Starting auto-play for new chunk');
      player.play();
      
      // Update playback state to playing
      setPlaybackState({ isPlaying: true });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  
  useEffect(() => {
    if (currentChunk?.audioUrl && currentChunk.audioUrl !== 'placeholder_audio_path') {
      // Reset completion flag when new chunk loads
      hasCompletedRef.current = false;
      playAudio();
    }
  }, [currentChunk?.audioUrl]); // Removed playbackState.isPlaying to prevent restarts
  
  useEffect(() => {
    // Control playback based on state (fixed to prevent restarts)
    if (!status.isLoaded) return;
    
    if (playbackState.isPlaying && !status.isPlaying) {
      console.log('▶️ Playing audio due to state change');
      player.play();
    } else if (!playbackState.isPlaying && status.isPlaying) {
      console.log('⏸️ Pausing audio due to state change');
      player.pause();
    }
  }, [playbackState.isPlaying, status.isLoaded]);
  
  // Update chunk durations when audio loads and stabilizes
  useEffect(() => {
    if (status.isLoaded && status.duration > 0 && playbackState.currentChunkIndex < chunkDurations.length) {
      const currentIndex = playbackState.currentChunkIndex;
      const currentAudioUrl = currentChunk?.audioUrl;
      
      // Only update if this chunk hasn't been measured yet AND duration seems stable AND we have an audio URL
      if (chunkDurations[currentIndex] === 0 && status.currentTime !== undefined && currentAudioUrl) {
        // Wait a moment for duration to stabilize
        setTimeout(() => {
          // Double-check we're still on the same chunk and duration is valid
          if (status.duration > 0 && playbackState.currentChunkIndex === currentIndex) {
            const newDurations = [...chunkDurations];
            newDurations[currentIndex] = status.duration;
            setChunkDurations(newDurations);
            
            // Calculate total duration
            const total = newDurations.reduce((sum, duration) => sum + duration, 0);
            setTotalStoryDuration(total);
            
            console.log(`📊 MEASURED Chunk ${currentIndex} (${currentAudioUrl?.substring(0, 20)}...): ${status.duration.toFixed(2)}s, Total: ${total.toFixed(2)}s`);
            console.log(`📊 Durations: [${newDurations.map(d => d ? d.toFixed(1) : '?').join(', ')}]`);
          }
        }, 200); // Small delay to let audio stabilize
      }
    }
  }, [status.isLoaded, status.duration, playbackState.currentChunkIndex, status.currentTime, currentChunk?.audioUrl]);

  // Calculate virtual playback time across all chunks (throttled)
  useEffect(() => {
    if (status.isLoaded && status.currentTime !== undefined && chunkDurations.length > 0) {
      // Calculate time elapsed in previous chunks
      let timeInPreviousChunks = 0;
      for (let i = 0; i < playbackState.currentChunkIndex; i++) {
        if (chunkDurations[i] > 0) {
          timeInPreviousChunks += chunkDurations[i];
        }
      }
      
      // Add current chunk progress - throttle updates to every 100ms equivalent
      const newVirtualTime = timeInPreviousChunks + status.currentTime;
      const timeDifference = Math.abs(newVirtualTime - virtualPlaybackTime);
      
      if (timeDifference > 0.05) { // Update if changed by more than 50ms for smoother highlighting
        setVirtualPlaybackTime(newVirtualTime);
      }
      
      // Less frequent debug logging
      if (Math.floor(newVirtualTime) % 10 === 0 && Math.abs(newVirtualTime % 1) < 0.2) {
        console.log(`🕐 Virtual: ${newVirtualTime.toFixed(1)}s/${totalStoryDuration.toFixed(1)}s (${Math.round((newVirtualTime / totalStoryDuration) * 100)}%)`);
      }
    }
  }, [status.currentTime, playbackState.currentChunkIndex, chunkDurations]);
  
  // Handle text highlighting based on virtual timeline (continuous across chunks)
  useEffect(() => {
    if (totalStoryDuration > 0 && virtualPlaybackTime > 0 && chunks.length > 0) {
      // Calculate total words across all chunks (only audio portions)
      let totalAudioWords = 0;
      let chunkWordCounts: number[] = [];
      
      chunks.forEach((chunk, idx) => {
        // Use the full text for each chunk, not just first 400 chars
        // since chunks are already reasonably sized
        const audioWords = chunk.text.split(/\s+/).filter(word => word.trim());
        chunkWordCounts.push(audioWords.length);
        totalAudioWords += audioWords.length;
        
        // Debug logging
        if (Math.floor(virtualPlaybackTime) % 10 === 0 && Math.abs(virtualPlaybackTime % 1) < 0.1) {
          console.log(`🔍 Chunk ${idx} words: ${audioWords.length} (text length: ${chunk.text.length})`);
        }
      });
      
      // Log total occasionally
      if (Math.floor(virtualPlaybackTime) % 10 === 0 && Math.abs(virtualPlaybackTime % 1) < 0.1) {
        console.log(`🔍 Total audio words: ${totalAudioWords}, Word counts: [${chunkWordCounts.join(', ')}]`);
      }
      
      // Calculate which word should be highlighted - work even without all durations
      const hasAllDurations = chunkDurations.filter(d => d > 0).length === chunks.length;
      const hasCurrentChunkDuration = chunkDurations[playbackState.currentChunkIndex] > 0;
      
      let globalProgress = 0;
      let globalWordIndex = 0;
      
      if (hasAllDurations && totalStoryDuration > 0) {
        // Use full story progress if available
        globalProgress = virtualPlaybackTime / totalStoryDuration;
        globalWordIndex = Math.floor(globalProgress * totalAudioWords);
      } else if (hasCurrentChunkDuration && status.currentTime !== undefined && status.duration > 0) {
        // Use current chunk progress as fallback
        const currentChunkProgress = status.currentTime / status.duration;
        
        // Calculate words up to current chunk
        let wordsBeforeCurrentChunk = 0;
        for (let i = 0; i < playbackState.currentChunkIndex; i++) {
          const chunkWords = chunks[i].text.split(/\s+/).filter(w => w.trim()).length;
          wordsBeforeCurrentChunk += chunkWords;
        }
        
        const currentChunkWords = chunks[playbackState.currentChunkIndex].text.split(/\s+/).filter(w => w.trim()).length;
        const currentChunkWordIndex = Math.floor(currentChunkProgress * currentChunkWords);
        globalWordIndex = wordsBeforeCurrentChunk + currentChunkWordIndex;
        globalProgress = globalWordIndex / totalAudioWords;
      }
      
      // Debug the progress calculation
      if (Math.floor(virtualPlaybackTime) % 10 === 0 && Math.abs(virtualPlaybackTime % 1) < 0.1) {
        console.log(`🕐 Progress: virtual=${virtualPlaybackTime.toFixed(1)}s, progress=${(globalProgress * 100).toFixed(1)}%`);
        console.log(`🔍 Word: ${globalWordIndex}/${totalAudioWords}, AllDur: ${hasAllDurations}, CurrDur: ${hasCurrentChunkDuration}`);
      }
      
      // Find which chunk and local word index this corresponds to
      let runningWordCount = 0;
      let targetChunkIndex = 0;
      let localWordIndex = 0;
      
      for (let i = 0; i < chunkWordCounts.length; i++) {
        if (globalWordIndex < runningWordCount + chunkWordCounts[i]) {
          targetChunkIndex = i;
          localWordIndex = globalWordIndex - runningWordCount;
          break;
        }
        runningWordCount += chunkWordCounts[i];
      }
      
      // Only update if we're in the current chunk and have moved to a different word
      const shouldUpdate = targetChunkIndex === playbackState.currentChunkIndex && 
                          localWordIndex !== highlightedSentence && 
                          localWordIndex >= 0 &&
                          (hasAllDurations || hasCurrentChunkDuration); // Allow highlighting with current chunk timing
      
      if (shouldUpdate) {
        const newHighlightIndex = Math.min(localWordIndex, chunkWordCounts[targetChunkIndex] - 1);
        setHighlightedSentence(newHighlightIndex);
        
        // Log less frequently
        if (globalWordIndex % 20 === 0) {
          console.log(`📝 Synced highlight: word ${globalWordIndex + 1}/${totalAudioWords} (chunk ${targetChunkIndex}, local ${localWordIndex + 1}) - ${Math.round(globalProgress * 100)}%`);
        }
        
        // Note: Auto-scroll is now handled by the main timeline-based effect above
        // This ensures smooth, centered scrolling that's synchronized with the virtual playback time
        // rather than jumping around based on individual word positions
      }
    }
  }, [virtualPlaybackTime, totalStoryDuration, chunks, playbackState.currentChunkIndex, viewMode]);
  
  // Handle scroll position on chunk changes (maintain seamless scrolling)
  useEffect(() => {
    if (imageTextScrollRef.current && currentChunk) {
      if (viewMode === 'text') {
        // For text mode: maintain scroll position across chunks for seamless experience
        console.log(`📜 Maintaining seamless scroll for chunk ${playbackState.currentChunkIndex} in text mode`);
      } else {
        // For image mode: Don't reset scroll position - let the main scroll effect handle continuity
        // This ensures seamless scrolling across chunks just like text mode
        console.log(`📜 Chunk ${playbackState.currentChunkIndex} transition in image mode - maintaining scroll continuity`);
        // No reset - let the main auto-scroll effect handle positioning
      }
    }
  }, [currentChunk?.id, viewMode]); // Minimal dependencies
  
  // Handle playback completion
  useEffect(() => {
    if (status.isLoaded && status.didJustFinish && !hasCompletedRef.current) {
      console.log('🏁 Audio playback completed');
      hasCompletedRef.current = true;
      setPlaybackState({ isPlaying: false });
      onPlaybackComplete?.();
      
      // Reset completion flag after a shorter delay
      setTimeout(() => {
        hasCompletedRef.current = false;
      }, 300);
    }
  }, [status.didJustFinish, status.isLoaded]);
  
  const toggleViewMode = () => {
    const newViewMode = viewMode === 'image' ? 'text' : 'image';
    setViewMode(newViewMode);
    // Notify parent about immersive mode and current view mode
    onViewModeChange?.(true, newViewMode);
  };

  const handleSaveVersion = () => {
    Alert.prompt(
      'Save Book Version',
      'Give this version a name to save it with the current images and settings:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save',
          onPress: async (versionName) => {
            if (versionName && versionName.trim()) {
              try {
                await saveBookVersion(versionName.trim());
                Alert.alert('Success', `Version "${versionName}" saved successfully!`);
              } catch (error) {
                Alert.alert('Error', 'Failed to save version. Please try again.');
                console.error('Save version error:', error);
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };
  
  const artStyleOptions: { value: ArtStyle; label: string }[] = [
    { value: 'realistic', label: 'Realistic' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'anime', label: 'Anime' },
    { value: 'vintage', label: 'Vintage' },
  ];
  
  const renderTextView = () => {
    if (!chunks || chunks.length === 0) return null;
    
    // Combine all chunks into one continuous text display
    const fullText = chunks.map(chunk => chunk.text).join('\n\n');
    const allWords = fullText.split(/\s+/);
    
    // Calculate total words processed so far for highlighting
    let totalWordsProcessed = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunkWords = chunks[i].text.split(/\s+/).filter(w => w.trim()).length;
      totalWordsProcessed += chunkWords;
    }
    
    // Use the SAME highlighting calculation as image view for consistency
    let currentGlobalWordIndex = 0;
    
    // Calculate chunk word counts (same as image view)
    let chunkWordCounts: number[] = [];
    chunks.forEach((chunk, idx) => {
      const audioWords = chunk.text.split(/\s+/).filter(word => word.trim());
      chunkWordCounts.push(audioWords.length);
    });
    
    // Check if we have duration data (same logic as image view)
    const hasAllDurations = chunkDurations.filter(d => d > 0).length === chunks.length;
    const hasCurrentChunkDuration = chunkDurations[playbackState.currentChunkIndex] > 0;
    
    let globalProgress = 0;
    
    if (hasAllDurations && totalStoryDuration > 0) {
      // Use full story progress if available (same as image view)
      globalProgress = virtualPlaybackTime / totalStoryDuration;
      currentGlobalWordIndex = Math.floor(globalProgress * totalWordsProcessed);
    } else if (hasCurrentChunkDuration && status.currentTime !== undefined && status.duration > 0) {
      // Use current chunk progress as fallback (same as image view)
      const currentChunkProgress = status.currentTime / status.duration;
      
      // Calculate words up to current chunk
      let wordsBeforeCurrentChunk = 0;
      for (let i = 0; i < playbackState.currentChunkIndex; i++) {
        wordsBeforeCurrentChunk += chunkWordCounts[i];
      }
      
      const currentChunkWords = chunkWordCounts[playbackState.currentChunkIndex];
      const currentChunkWordIndex = Math.floor(currentChunkProgress * currentChunkWords);
      currentGlobalWordIndex = wordsBeforeCurrentChunk + currentChunkWordIndex;
      globalProgress = currentGlobalWordIndex / totalWordsProcessed;
    } else {
      // Fallback: estimate position based on current chunk index and virtual time
      // Calculate words up to current chunk
      let wordsBeforeCurrentChunk = 0;
      for (let i = 0; i < playbackState.currentChunkIndex; i++) {
        wordsBeforeCurrentChunk += chunkWordCounts[i];
      }
      
      // Estimate progress within current chunk (assume average chunk duration of 20 seconds)
      const estimatedChunkDuration = 20;
      const timeInCurrentChunk = virtualPlaybackTime - (playbackState.currentChunkIndex * estimatedChunkDuration);
      const estimatedChunkProgress = Math.max(0, Math.min(1, timeInCurrentChunk / estimatedChunkDuration));
      
      const currentChunkWords = chunkWordCounts[playbackState.currentChunkIndex] || 50;
      const currentChunkWordIndex = Math.floor(estimatedChunkProgress * currentChunkWords);
      currentGlobalWordIndex = wordsBeforeCurrentChunk + currentChunkWordIndex;
      globalProgress = currentGlobalWordIndex / totalWordsProcessed;
    }
    
    // Ensure we don't exceed bounds
    currentGlobalWordIndex = Math.min(currentGlobalWordIndex, totalWordsProcessed - 1);
    
    // Only log occasionally to reduce spam (same frequency as image view)
    if (currentGlobalWordIndex % 50 === 0) {
      console.log(`📖 Text view synced: word ${currentGlobalWordIndex + 1}/${totalWordsProcessed} (${Math.round(globalProgress * 100)}%) AllDur: ${hasAllDurations}, CurrDur: ${hasCurrentChunkDuration}`);
    }
    
    // Function to handle word tap for seeking
    const handleWordTap = (wordIndex: number) => {
      if (totalWordsProcessed > 0) {
        const wordProgress = wordIndex / totalWordsProcessed;
        
        // Find which chunk this word belongs to
        let targetChunkIndex = 0;
        let runningWordCount = 0;
        for (let i = 0; i < chunks.length; i++) {
          const chunkWordCount = chunks[i].text.split(/\s+/).filter(w => w.trim()).length;
          if (wordIndex < runningWordCount + chunkWordCount) {
            targetChunkIndex = i;
            break;
          }
          runningWordCount += chunkWordCount;
        }
        
        // If different chunk, switch to it
        if (targetChunkIndex !== playbackState.currentChunkIndex) {
          setPlaybackState({ currentChunkIndex: targetChunkIndex, isPlaying: true });
        }
        
        // Calculate local word position and seek within chunk
        const localWordIndex = wordIndex - runningWordCount;
        const localProgress = localWordIndex / chunks[targetChunkIndex].text.split(/\s+/).length;
        
        if (status.isLoaded && status.duration) {
          const seekTime = localProgress * status.duration;
          setTimeout(() => {
            player.seekTo(seekTime);
            setTimeout(() => {
              if (!playbackState.isPlaying) {
                setPlaybackState({ isPlaying: true });
              }
            }, 100);
          }, 50);
        }
        
        console.log(`🎯 Seeking to word ${wordIndex + 1}/${totalWordsProcessed} in chunk ${targetChunkIndex}`);
      }
    };
    
    return (
      <ScrollView 
        ref={imageTextScrollRef}
        style={styles.textViewContainer} 
        contentContainerStyle={styles.textViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.paragraph}>
          <Text style={styles.paragraphText}>
            {allWords.map((word, idx) => {
              const isHighlighted = idx <= currentGlobalWordIndex;
              const isCurrentWord = idx === currentGlobalWordIndex;
              
              return (
                <Text
                  key={idx}
                  style={[
                    styles.word,
                    isHighlighted && styles.highlightedWord,
                    isCurrentWord && styles.currentWord
                  ]}
                  onPress={() => handleWordTap(idx)}
                >
                  {word}{idx < allWords.length - 1 ? ' ' : ''}
                </Text>
              );
            })}
          </Text>
        </View>
      </ScrollView>
    );
  };
  
  const renderImageView = () => {
    // Calculate progress for dynamic visual effects
    const progress = status.isLoaded ? (status.currentTime / status.duration) : 0;
    const opacity = 0.3 + (progress * 0.4); // Dynamic opacity based on progress
    const scale = 1 + (progress * 0.1); // Subtle zoom effect as story progresses
    
    return (
      <View style={styles.imageContainer}>
        {/* Primary image layer */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
          <TouchableOpacity 
            style={styles.imageClickArea}
            activeOpacity={1}
          onPress={() => setShowImageControls(!showImageControls)}
        >
          <ImageBackground
            source={{ 
              uri: currentImageUrl || previousImageUrl || 'https://picsum.photos/400/600?blur=2'
            }}
            style={[styles.backgroundImage, { 
              transform: [{ scale }] 
            }]}
            resizeMode="cover"
            onLoad={() => {
              console.log('✅ Primary image loaded successfully');
            }}
            onError={(error) => {
              console.log('🚨 Primary image load error:', error.nativeEvent.error);
              // Fallback to placeholder if image fails to load
              if (currentImageUrl && !currentImageUrl.includes('picsum.photos')) {
                console.log('🔄 Falling back to placeholder image');
                setCurrentImageUrl('https://picsum.photos/400/600?blur=2');
              }
            }}
          >
          {/* Dynamic overlay that responds to narration progress */}
          <Animated.View 
            style={[
              styles.progressOverlay, 
              { opacity: opacity }
            ]} 
          />
          
          
          {/* Synchronized text highlighting in image mode */}
          {currentChunk?.text && (
            <TouchableOpacity 
              style={styles.textPreview} 
              onPress={() => {
                setViewMode('text');
                onViewModeChange?.(true, 'text');
              }}
              activeOpacity={0.8}
            >
              <ScrollView 
                ref={imageTextScrollRef}
                style={styles.imageTextScroll} 
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.previewText}>
                  {chunks.map((chunk, chunkIdx) => {
                    const isActiveChunk = chunkIdx === playbackState.currentChunkIndex;
                    // Use full text for each chunk since they're already properly sized
                    const allWords = chunk.text.split(/\s+/).filter(word => word.trim());
                    const audioWords = allWords; // Full chunk has audio
                    
                    return (
                      <Text key={chunk.id}>
                        {/* Add spacing between chunks */}
                        {chunkIdx > 0 && '\n\n'}
                        {allWords.map((word, idx) => {
                          const hasAudio = idx < audioWords.length;
                          const isHighlighted = isActiveChunk && hasAudio && idx <= highlightedSentence;
                          const isCurrentWord = isActiveChunk && hasAudio && idx === highlightedSentence;
                          const isInactiveChunk = !isActiveChunk;
                          
                          return (
                            <Text
                              key={`${chunk.id}_${idx}`}
                              style={[
                                styles.imageWord,
                                isInactiveChunk && styles.inactiveChunkWord,
                                !hasAudio && styles.imageNoAudioWord,
                                isHighlighted && styles.imageHighlightedWord,
                                isCurrentWord && styles.imageCurrentWord
                              ]}
                            >
                              {word}{idx < allWords.length - 1 ? ' ' : ''}
                            </Text>
                          );
                        })}
                      </Text>
                    );
                  })}
                </Text>
              </ScrollView>
            </TouchableOpacity>
          )}
          </ImageBackground>
        </TouchableOpacity>
        </Animated.View>
        
        {/* Secondary image layer for cross-fade transitions */}
        {previousImageUrl && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity2 }]}>
            <ImageBackground
              source={{ uri: previousImageUrl }}
              style={styles.backgroundImage}
              resizeMode="cover"
              onLoad={() => {
                console.log('✅ Previous image loaded successfully');
              }}
              onError={(error) => {
                console.log('🚨 Previous image load error:', error.nativeEvent.error);
                // Clear the previous image if it fails to load
                setPreviousImageUrl('');
              }}
            />
          </Animated.View>
        )}
      </View>
    );
  };
  
  if (isLoading) {
    return <LoadingAnimation message={loadingMessage} />;
  }
  
  return (
    <View style={styles.container}>
      {/* Image Mode Clean Controls */}
      {viewMode === 'image' && showImageControls && (
        <View style={styles.imageControls}>
          {/* Back Button */}
          <TouchableOpacity style={styles.imageBackButton} onPress={() => {
            // Navigate back to library - need to pass this up to MainScreen
            onViewModeChange?.(false);
          }}>
            <MaterialIcons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          
          {/* Play/Pause Button */}
          <TouchableOpacity 
            style={styles.imagePlayButton} 
            onPress={() => {
              if (playbackState.isPlaying) {
                player.pause();
                setPlaybackState({ isPlaying: false });
              } else {
                if (currentChunk?.audioUrl && status.isLoaded) {
                  player.play();
                  setPlaybackState({ isPlaying: true });
                }
              }
            }}
          >
            <MaterialIcons 
              name={playbackState.isPlaying ? 'pause' : 'play-arrow'} 
              size={32} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Text Mode Controls */}
      {viewMode === 'text' && (
        <>
          {/* Text Mode Controls */}
          <TouchableOpacity style={styles.backToImageButton} onPress={() => {
            setViewMode('image');
            onViewModeChange?.(true, 'image');
          }}>
            <MaterialIcons name="image" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.textModeRightControls}>
            <TouchableOpacity 
              style={styles.saveVersionButton} 
              onPress={handleSaveVersion}
            >
              <MaterialIcons 
                name="save" 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.styleButton} 
              onPress={() => setShowStyleMenu(!showStyleMenu)}
            >
              <MaterialIcons 
                name="palette" 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.backButton} onPress={() => {
              // Navigate back to library
              onViewModeChange?.(false);
            }}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {/* Style Selection Menu */}
      {showStyleMenu && (
        <View style={styles.styleMenu}>
          {artStyleOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.styleOption,
                artStyle === option.value && styles.selectedStyleOption
              ]}
              onPress={() => {
                setArtStyle(option.value);
                setShowStyleMenu(false);
              }}
            >
              <Text style={[
                styles.styleOptionText,
                artStyle === option.value && styles.selectedStyleOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Main Content */}
      {viewMode === 'image' ? renderImageView() : renderTextView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageClickArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  imageBackButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlayButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToImageButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  textModeRightControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    zIndex: 100,
  },
  saveVersionButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  styleButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleMenu: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 10,
    padding: 10,
    zIndex: 101,
    minWidth: 120,
  },
  styleOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginVertical: 2,
  },
  selectedStyleOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  styleOptionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  selectedStyleOptionText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  progressIndicator: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00D4FF',
    borderRadius: 2,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  textPreview: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    backdropFilter: 'blur(10px)',
    maxHeight: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textPreviewIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  indicatorText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginRight: 6,
    fontStyle: 'italic',
  },
  imageTextScroll: {
    maxHeight: 120,
  },
  previewText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
  },
  imageWord: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  imageNoAudioWord: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontStyle: 'italic',
  },
  imageHighlightedWord: {
    color: '#fff',
  },
  imageCurrentWord: {
    color: '#00D4FF',
    fontWeight: '600',
  },
  inactiveChunkWord: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'normal',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 120,
  },
  textOverlay: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  narrationText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    textAlign: 'center',
  },
  textViewContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  textViewContent: {
    padding: 20,
    paddingTop: 100,
    paddingBottom: 140,
  },
  paragraph: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  paragraphText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'justify',
  },
  word: {
    color: 'rgba(255, 255, 255, 0.6)',
    transition: 'all 0.3s ease',
  },
  noAudioWord: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontStyle: 'italic',
  },
  highlightedWord: {
    color: '#fff',
    textShadowColor: 'rgba(0, 122, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  currentWord: {
    color: '#00D4FF',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: '600',
  },
});