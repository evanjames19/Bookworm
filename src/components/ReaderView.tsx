import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useStore } from '../store';

const { width, height } = Dimensions.get('window');

interface ReaderViewProps {
  onPlaybackComplete?: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ onPlaybackComplete }) => {
  const {
    currentChunk,
    playbackState,
    isLoading,
    loadingMessage,
  } = useStore();
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (currentChunk?.imageUrl) {
      // Fade transition for new images
      Animated.sequence([
        Animated.timing(imageOpacity, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
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
      // Clean up audio on unmount
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  const playAudio = async () => {
    if (!currentChunk?.audioUrl) return;
    
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: currentChunk.audioUrl },
        { shouldPlay: playbackState.isPlaying }
      );
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          onPlaybackComplete?.();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  
  useEffect(() => {
    if (currentChunk?.audioUrl) {
      playAudio();
    }
  }, [currentChunk?.audioUrl, playbackState.isPlaying]);
  
  useEffect(() => {
    if (sound) {
      if (playbackState.isPlaying) {
        sound.playAsync();
      } else {
        sound.pauseAsync();
      }
    }
  }, [playbackState.isPlaying, sound]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }
  
  const backgroundImage = currentChunk?.imageUrl || 'https://picsum.photos/400/600';
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageContainer, { opacity: imageOpacity }]}>
        <ImageBackground
          source={{ uri: backgroundImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
              <Text style={styles.narrationText}>
                {currentChunk?.text || ''}
              </Text>
            </Animated.View>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  textContainer: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
});