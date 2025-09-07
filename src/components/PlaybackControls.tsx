import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Slider,
} from 'react-native';
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
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Chapter {playbackState.currentChunkIndex + 1} of {totalChunks}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={totalChunks - 1}
          value={playbackState.currentChunkIndex}
          onSlidingComplete={(value) => onSeek(Math.round(value))}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#fff"
        />
      </View>
      
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  },
});