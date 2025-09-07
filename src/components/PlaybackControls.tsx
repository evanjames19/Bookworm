import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store';

interface PlaybackControlsProps {
  totalChunks: number;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onSeek: (position: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  totalChunks,
  onSkipForward,
  onSkipBackward,
  onSeek,
}) => {
  const { playbackState, setPlaybackState } = useStore();
  
  const togglePlayPause = () => {
    setPlaybackState({ isPlaying: !playbackState.isPlaying });
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = totalChunks > 0 
    ? (playbackState.currentChunkIndex / totalChunks) 
    : 0;
  
  return (
    <View style={styles.container}>
      <View style={styles.compactControls}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onSkipBackward}
        >
          <MaterialIcons name="skip-previous" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.playPauseButton} 
          onPress={togglePlayPause}
        >
          <MaterialIcons 
            name={playbackState.isPlaying ? 'pause' : 'play-arrow'} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onSkipForward}
        >
          <MaterialIcons name="skip-next" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressInfo}>
        <Text style={styles.chapterText}>
          {playbackState.currentChunkIndex + 1}/{totalChunks}
        </Text>
        <Slider
          style={styles.compactSlider}
          minimumValue={0}
          maximumValue={totalChunks - 1}
          value={playbackState.currentChunkIndex}
          onSlidingComplete={(value) => onSeek(Math.round(value))}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#fff"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  compactControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  playPauseButton: {
    backgroundColor: '#ffeb3b',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#ffeb3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapterText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
  },
  compactSlider: {
    flex: 1,
    height: 30,
    marginLeft: 12,
  },
});