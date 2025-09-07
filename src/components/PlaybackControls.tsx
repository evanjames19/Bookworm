import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
<<<<<<< HEAD
  Slider,
} from 'react-native';
=======
} from 'react-native';
import Slider from '@react-native-community/slider';
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
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
<<<<<<< HEAD
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Chapter {playbackState.currentChunkIndex + 1} of {totalChunks}
        </Text>
        <Slider
          style={styles.slider}
=======
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
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
          minimumValue={0}
          maximumValue={totalChunks - 1}
          value={playbackState.currentChunkIndex}
          onSlidingComplete={(value) => onSeek(Math.round(value))}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#fff"
        />
      </View>
<<<<<<< HEAD
      
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={onSkipBackward}
          style={styles.controlButton}
        >
          <MaterialIcons name="replay-10" size={30} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={togglePlayPause}
          style={[styles.controlButton, styles.playButton]}
        >
          <MaterialIcons
            name={playbackState.isPlaying ? 'pause' : 'play-arrow'}
            size={40}
            color="#fff"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={onSkipForward}
          style={styles.controlButton}
        >
          <MaterialIcons name="forward-10" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
=======
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
<<<<<<< HEAD
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingBottom: 30,
    paddingTop: 15,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    padding: 10,
    marginHorizontal: 15,
  },
  playButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
=======
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
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  },
});