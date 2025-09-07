import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [imageApiKey, setImageApiKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [voiceId, setVoiceId] = useState('EXAVITQu4vr4xnSDxMaL');
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('apiSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setElevenLabsKey(parsed.elevenLabsKey || '');
        setImageApiKey(parsed.imageApiKey || '');
        setOpenAiKey(parsed.openAiKey || '');
        setVoiceId(parsed.voiceId || 'EXAVITQu4vr4xnSDxMaL');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const saveSettings = async () => {
    try {
      const settings = {
        elevenLabsKey,
        imageApiKey,
        openAiKey,
        voiceId,
      };
      
      await AsyncStorage.setItem('apiSettings', JSON.stringify(settings));
      Alert.alert('Success', 'Settings saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Keys</Text>
          <Text style={styles.sectionDescription}>
            Configure your API keys for voice narration and image generation
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ElevenLabs API Key</Text>
            <TextInput
              style={styles.input}
              value={elevenLabsKey}
              onChangeText={setElevenLabsKey}
              placeholder="Enter your ElevenLabs API key"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image Generation API Key</Text>
            <TextInput
              style={styles.input}
              value={imageApiKey}
              onChangeText={setImageApiKey}
              placeholder="Enter your image API key (e.g., Google Gemini)"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>OpenAI API Key (for Art Director)</Text>
            <TextInput
              style={styles.input}
              value={openAiKey}
              onChangeText={setOpenAiKey}
              placeholder="Enter your OpenAI API key"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Settings</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Voice ID</Text>
            <TextInput
              style={styles.input}
              value={voiceId}
              onChangeText={setVoiceId}
              placeholder="ElevenLabs Voice ID"
              placeholderTextColor="#666"
            />
            <Text style={styles.helpText}>
              Default: EXAVITQu4vr4xnSDxMaL (Sarah)
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Visual Story transforms books into immersive audiovisual experiences 
            using AI-powered narration and real-time image generation.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 14,
  },
  helpText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  aboutText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});