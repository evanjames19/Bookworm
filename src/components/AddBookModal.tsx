import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
  onAddBook: (title: string, content: string) => void;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({
  visible,
  onClose,
  onAddBook,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setIsLoading(true);
        const fileContent = await FileSystem.readAsStringAsync(result.uri);
        setContent(fileContent);
        
        // Try to extract title from filename
        const fileName = result.name.replace('.txt', '');
        if (!title) {
          setTitle(fileName);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to load file');
      setIsLoading(false);
    }
  };
  
  const handlePasteContent = () => {
    // This will use the content from the text input
    if (!content.trim()) {
      Alert.alert('Error', 'Please paste or type your book content');
    }
  };
  
  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a book title');
      return;
    }
    
    if (!content.trim()) {
      Alert.alert('Error', 'Please add book content');
      return;
    }
    
    onAddBook(title.trim(), content.trim());
    setTitle('');
    setContent('');
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Book</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Book Title</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter book title..."
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Book Content</Text>
            
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleFileUpload}
                disabled={isLoading}
              >
                <MaterialIcons name="upload-file" size={24} color="#007AFF" />
                <Text style={styles.uploadButtonText}>Upload .txt file</Text>
              </TouchableOpacity>
              
              <Text style={styles.orText}>or</Text>
            </View>
            
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Paste your book text here..."
              placeholderTextColor="#666"
              multiline
              textAlignVertical="top"
            />
            
            {content.length > 0 && (
              <Text style={styles.charCount}>
                {content.split(/\s+/).length} words
              </Text>
            )}
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!title.trim() || !content.trim()) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || !content.trim()}
          >
            <Text style={styles.submitButtonText}>Add Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    padding: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  titleInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  uploadOptions: {
    marginBottom: 15,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#007AFF',
    marginLeft: 10,
    fontSize: 16,
  },
  orText: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  contentInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 14,
    minHeight: 200,
    maxHeight: 300,
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 15,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#334455',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});