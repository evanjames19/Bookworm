<<<<<<< HEAD
import React from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
<<<<<<< HEAD
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Book } from '../types';
=======
  ImageBackground,
  Image,
  LinearGradient,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Book } from '../types';
import { ApiService } from '../services/apiService';
import { BottomNavigation } from './BottomNavigation';
import { useStore, ArtStyle } from '../store';
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831

const { width } = Dimensions.get('window');

interface BookLibraryProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
<<<<<<< HEAD
  onAddBook: () => void;
}

=======
  onAddBook: (book: Book) => void;
}

interface BookOptionsPopupProps {
  book: Book;
  coverUrl?: string;
  visible: boolean;
  onClose: () => void;
  onPlay: () => void;
  onRemove: (book: Book) => void;
  onShare: (book: Book) => void;
  onLoadVersion: (versionId: string) => void;
}

const BookOptionsPopup: React.FC<BookOptionsPopupProps> = ({
  book,
  coverUrl,
  visible,
  onClose,
  onPlay,
  onRemove,
  onShare,
  onLoadVersion,
}) => {
  const { artStyle, setArtStyle } = useStore();
  const [showArtStyles, setShowArtStyles] = useState(false);
  const [showSavedVersions, setShowSavedVersions] = useState(false);
  
  const artStyleOptions: { value: ArtStyle; label: string; icon: string }[] = [
    { value: 'realistic', label: 'Realistic', icon: 'photo-camera' },
    { value: 'cinematic', label: 'Cinematic', icon: 'movie' },
    { value: 'artistic', label: 'Artistic', icon: 'brush' },
    { value: 'anime', label: 'Anime', icon: 'face' },
    { value: 'vintage', label: 'Vintage', icon: 'history' },
  ];
  
  if (!visible) return null;

  return (
    <View style={popupStyles.overlay}>
      <View style={popupStyles.popup}>
        {/* Book Preview */}
        <View style={popupStyles.bookPreview}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={popupStyles.previewImage} />
          ) : (
            <View style={popupStyles.previewPlaceholder}>
              <MaterialIcons name="auto-stories" size={32} color="#fff" />
            </View>
          )}
          <View style={popupStyles.bookInfo}>
            <Text style={popupStyles.bookTitle} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={popupStyles.bookDate}>
              {new Date(book.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Art Style Selection */}
        <View style={popupStyles.artStyleSection}>
          <Text style={popupStyles.sectionTitle}>Art Style</Text>
          <TouchableOpacity 
            style={popupStyles.artStyleSelector}
            onPress={() => setShowArtStyles(!showArtStyles)}
          >
            <View style={popupStyles.selectedStyle}>
              <MaterialIcons 
                name={artStyleOptions.find(option => option.value === artStyle)?.icon as any || 'brush'} 
                size={20} 
                color="#ffeb3b" 
              />
              <Text style={popupStyles.selectedStyleText}>
                {artStyleOptions.find(option => option.value === artStyle)?.label || 'Realistic'}
              </Text>
            </View>
            <MaterialIcons 
              name={showArtStyles ? "expand-less" : "expand-more"} 
              size={20} 
              color="rgba(0,0,0,0.6)" 
            />
          </TouchableOpacity>
          
          {showArtStyles && (
            <View style={popupStyles.artStyleOptions}>
              {artStyleOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    popupStyles.artStyleOption,
                    artStyle === option.value && popupStyles.selectedOption
                  ]}
                  onPress={() => {
                    setArtStyle(option.value);
                    setShowArtStyles(false);
                  }}
                >
                  <MaterialIcons 
                    name={option.icon as any} 
                    size={18} 
                    color={artStyle === option.value ? "#ffeb3b" : "rgba(0,0,0,0.6)"} 
                  />
                  <Text style={[
                    popupStyles.artStyleOptionText,
                    artStyle === option.value && popupStyles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* Saved Versions Section */}
        {book.savedVersions && book.savedVersions.length > 0 && (
          <View style={popupStyles.savedVersionsSection}>
            <Text style={popupStyles.sectionTitle}>Saved Versions</Text>
            <TouchableOpacity 
              style={popupStyles.artStyleSelector}
              onPress={() => setShowSavedVersions(!showSavedVersions)}
            >
              <MaterialIcons name="bookmarks" size={20} color="#8b4513" />
              <Text style={popupStyles.artStyleText}>
                {book.savedVersions.length} saved version{book.savedVersions.length !== 1 ? 's' : ''}
              </Text>
              <MaterialIcons 
                name={showSavedVersions ? "expand-less" : "expand-more"} 
                size={24} 
                color="#8b4513" 
              />
            </TouchableOpacity>
            
            {showSavedVersions && (
              <View style={popupStyles.versionsList}>
                {book.savedVersions.map((version) => (
                  <TouchableOpacity
                    key={version.id}
                    style={popupStyles.versionItem}
                    onPress={() => {
                      onLoadVersion(version.id);
                      onClose();
                    }}
                  >
                    <View style={popupStyles.versionInfo}>
                      <Text style={popupStyles.versionName}>{version.name}</Text>
                      <Text style={popupStyles.versionDetails}>
                        {version.artStyle} • {new Date(version.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <MaterialIcons name="play-arrow" size={20} color="#8b4513" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={popupStyles.actions}>
          <TouchableOpacity style={[popupStyles.actionButton, popupStyles.playButton]} onPress={onPlay}>
            <MaterialIcons name="play-arrow" size={24} color="#fff" />
            <Text style={popupStyles.actionText}>Play</Text>
          </TouchableOpacity>

          <TouchableOpacity style={popupStyles.actionButton} onPress={() => onShare(book)}>
            <MaterialIcons name="share" size={20} color="rgba(0,0,0,0.7)" />
            <Text style={[popupStyles.actionText, popupStyles.secondaryText]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={popupStyles.actionButton} onPress={() => onRemove(book)}>
            <MaterialIcons name="delete" size={20} color="#e53e3e" />
            <Text style={[popupStyles.actionText, popupStyles.dangerText]}>Remove</Text>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity style={popupStyles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={20} color="rgba(0,0,0,0.5)" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
export const BookLibrary: React.FC<BookLibraryProps> = ({
  books,
  onSelectBook,
  onAddBook,
}) => {
<<<<<<< HEAD
  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => onSelectBook(item)}
    >
      <View style={styles.bookCover}>
        <MaterialIcons name="menu-book" size={40} color="#fff" />
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookDate}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Library</Text>
        <TouchableOpacity onPress={onAddBook} style={styles.addButton}>
          <MaterialIcons name="add" size={30} color="#fff" />
=======
  const { artStyle, setArtStyle, removeBook, loadBookVersion } = useStore();
  const [bookCovers, setBookCovers] = useState<Map<string, string>>(new Map());
  const [apiService] = useState(ApiService.getInstance());
  const [activeTab, setActiveTab] = useState('library');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBookOptions, setShowBookOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyInput, setStoryInput] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [inputMode, setInputMode] = useState<'paste' | 'idea'>('idea');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Load covers for books (will use cache when available)
  useEffect(() => {
    const loadCovers = async () => {
      // Wait for API service cache to be loaded first
      await apiService.waitForCacheLoad();
      
      for (const book of books) {
        if (!bookCovers.has(book.id)) {
          try {
            // This will use cached covers when available, or generate new ones
            const coverUrl = await apiService.generateBookCover(book.title, book.content);
            setBookCovers(prev => new Map(prev.set(book.id, coverUrl)));
          } catch (error) {
            console.error(`Error loading cover for ${book.title}:`, error);
          }
        }
      }
    };
    
    if (books.length > 0) {
      loadCovers();
    }
  }, [books, apiService]);
  
  const renderBookItem = ({ item }: { item: Book }) => {
    const coverUrl = bookCovers.get(item.id);
    
    const handleBookPress = () => {
      setSelectedBook(item);
      setShowBookOptions(true);
    };


    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={handleBookPress}
        activeOpacity={0.8}
      >
        <View style={styles.bookCover}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <MaterialIcons name="auto-stories" size={40} color="#fff" />
            </View>
          )}
          
          {/* Title Overlay */}
          <ExpoLinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.titleOverlay}
          >
            <Text style={styles.overlayTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </ExpoLinearGradient>
        </View>
        
      </TouchableOpacity>
    );
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    // TODO: Implement navigation to other tabs
  };

  const generateStoryFromIdea = async (idea: string): Promise<string> => {
    try {
      const prompt = `You are a creative writing assistant. Based on the following idea or prompt, write a complete short story (800-1500 words). Make it engaging, well-structured with a clear beginning, middle, and end. Include dialogue, character development, and vivid descriptions.

Idea/Prompt: ${idea}

Write a complete short story based on this idea:`;

      const response = await apiService.callGeminiAPI(prompt);
      return response;
    } catch (error) {
      console.error('Error generating story from idea:', error);
      throw new Error('Failed to generate story. Please try again.');
    }
  };

  const handleCreateBook = async () => {
    if (!storyTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your story.');
      return;
    }

    if (!storyInput.trim()) {
      Alert.alert('Missing Content', inputMode === 'idea' ? 'Please enter a story idea.' : 'Please paste your story.');
      return;
    }

    setIsGenerating(true);
    try {
      let finalStoryText = storyInput.trim();
      
      // If it's an idea, generate the full story using AI
      if (inputMode === 'idea') {
        console.log('🤖 Generating story from idea...');
        finalStoryText = await generateStoryFromIdea(storyInput);
        console.log('✅ Story generated successfully');
      }

      // Create the book object
      const newBook: Book = {
        id: Date.now().toString(),
        title: storyTitle.trim(),
        content: finalStoryText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Close modal and reset state
      setShowStoryModal(false);
      setStoryInput('');
      setStoryTitle('');
      setInputMode('idea');
      
      // Call the original onAddBook with the new book
      onAddBook(newBook);
      
    } catch (error) {
      console.error('Error creating book:', error);
      Alert.alert('Error', 'Failed to create the book. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      <ExpoLinearGradient
        colors={['#ffeb3b', '#ff9800', '#ffeb3b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
      {/* Refined Header */}
      <View style={styles.refinedHeader}>
        <View style={styles.brandingSection}>
          <Text style={styles.refinedBrandingText}>Bookworm</Text>
          <Text style={styles.refinedSubtext}>My Library</Text>
        </View>
        <TouchableOpacity onPress={() => setShowStoryModal(true)} style={styles.refinedAddButton}>
          <MaterialIcons name="add" size={24} color="#fff" />
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
        </TouchableOpacity>
      </View>
      
      {books.length === 0 ? (
        <View style={styles.emptyState}>
<<<<<<< HEAD
          <MaterialIcons name="library-books" size={80} color="#666" />
          <Text style={styles.emptyText}>No books yet</Text>
          <TouchableOpacity style={styles.addFirstBook} onPress={onAddBook}>
=======
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="auto-stories" size={80} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.emptyText}>Your library awaits</Text>
          <Text style={styles.emptySubtext}>Add your first book to begin your AI storytelling journey</Text>
          <TouchableOpacity style={styles.addFirstBook} onPress={() => setShowStoryModal(true)}>
            <MaterialIcons name="add" size={20} color="#fff" style={styles.addIcon} />
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
            <Text style={styles.addFirstBookText}>Add your first book</Text>
          </TouchableOpacity>
        </View>
      ) : (
<<<<<<< HEAD
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.bookGrid}
        />
      )}
=======
        <View style={styles.booksContainer}>
          {/* Bookshelf shelves background */}
          <View style={styles.shelf} />
          <View style={[styles.shelf, styles.shelf2]} />
          <View style={[styles.shelf, styles.shelf3]} />
          
          <FlatList
            data={books}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.bookGrid}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={false}
            overScrollMode="never"
          />
        </View>
      )}
      </ExpoLinearGradient>
      <BottomNavigation 
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      {/* Book Options Popup */}
      {showBookOptions && selectedBook && (
        <BookOptionsPopup
          book={selectedBook}
          coverUrl={bookCovers.get(selectedBook.id)}
          visible={showBookOptions}
          onClose={() => setShowBookOptions(false)}
          onPlay={() => {
            setShowBookOptions(false);
            onSelectBook(selectedBook);
          }}
          onLoadVersion={async (versionId: string) => {
            if (selectedBook) {
              await loadBookVersion(selectedBook.id, versionId);
              setShowBookOptions(false);
              onSelectBook(selectedBook);
            }
          }}
          onRemove={(book) => {
            setShowDeleteConfirm(true);
          }}
          onShare={(book) => {
            setShowBookOptions(false);
            // TODO: Implement share functionality
            console.log('Share book:', book.title);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedBook && (
        <View style={popupStyles.overlay}>
          <View style={[popupStyles.popup, { maxWidth: width - 80 }]}>
            <Text style={popupStyles.confirmTitle}>Delete Book?</Text>
            <Text style={popupStyles.confirmMessage}>
              Are you sure you want to delete "{selectedBook.title}"? This action cannot be undone.
            </Text>
            
            <View style={popupStyles.confirmActions}>
              <TouchableOpacity 
                style={[popupStyles.actionButton, popupStyles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[popupStyles.actionText, popupStyles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[popupStyles.actionButton, popupStyles.deleteButton]}
                onPress={async () => {
                  await removeBook(selectedBook.id);
                  setShowDeleteConfirm(false);
                  setShowBookOptions(false);
                  setSelectedBook(null);
                  
                  // Also remove the book cover from state
                  setBookCovers(prev => {
                    const newCovers = new Map(prev);
                    newCovers.delete(selectedBook.id);
                    return newCovers;
                  });
                }}
              >
                <MaterialIcons name="delete" size={18} color="#fff" />
                <Text style={popupStyles.actionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Story Creation Modal */}
      <Modal
        visible={showStoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStoryModal(false)}
      >
        <KeyboardAvoidingView 
          style={storyModalStyles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ExpoLinearGradient
            colors={['#ffeb3b', '#ff9800', '#ffeb3b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={storyModalStyles.gradient}
          >
            {/* Header */}
            <View style={storyModalStyles.header}>
              <TouchableOpacity 
                onPress={() => setShowStoryModal(false)}
                style={storyModalStyles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="rgba(0,0,0,0.8)" />
              </TouchableOpacity>
              <Text style={storyModalStyles.headerTitle}>Create New Story</Text>
              <View style={storyModalStyles.placeholder} />
            </View>

            {/* Content */}
            <ScrollView style={storyModalStyles.content} showsVerticalScrollIndicator={false}>
              {/* Mode Toggle */}
              <View style={storyModalStyles.modeToggle}>
                <TouchableOpacity
                  style={[
                    storyModalStyles.modeButton,
                    inputMode === 'idea' && storyModalStyles.modeButtonActive
                  ]}
                  onPress={() => setInputMode('idea')}
                >
                  <MaterialIcons 
                    name="lightbulb" 
                    size={20} 
                    color={inputMode === 'idea' ? '#ff9800' : 'rgba(0,0,0,0.6)'} 
                  />
                  <Text style={[
                    storyModalStyles.modeText,
                    inputMode === 'idea' && storyModalStyles.modeTextActive
                  ]}>
                    Story Idea
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    storyModalStyles.modeButton,
                    inputMode === 'paste' && storyModalStyles.modeButtonActive
                  ]}
                  onPress={() => setInputMode('paste')}
                >
                  <MaterialIcons 
                    name="content-paste" 
                    size={20} 
                    color={inputMode === 'paste' ? '#ff9800' : 'rgba(0,0,0,0.6)'} 
                  />
                  <Text style={[
                    storyModalStyles.modeText,
                    inputMode === 'paste' && storyModalStyles.modeTextActive
                  ]}>
                    Paste Story
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title Input */}
              <View style={storyModalStyles.inputSection}>
                <Text style={storyModalStyles.inputLabel}>Story Title</Text>
                <TextInput
                  style={storyModalStyles.titleInput}
                  value={storyTitle}
                  onChangeText={setStoryTitle}
                  placeholder="Enter a captivating title..."
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  maxLength={100}
                />
              </View>

              {/* Story Input */}
              <View style={storyModalStyles.inputSection}>
                <Text style={storyModalStyles.inputLabel}>
                  {inputMode === 'idea' ? 'Story Idea' : 'Story Content'}
                </Text>
                <TextInput
                  style={storyModalStyles.storyInput}
                  value={storyInput}
                  onChangeText={setStoryInput}
                  placeholder={
                    inputMode === 'idea' 
                      ? "Describe your story idea... AI will create a full story from this!"
                      : "Paste your complete story here..."
                  }
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Info Text */}
              <Text style={storyModalStyles.infoText}>
                {inputMode === 'idea' 
                  ? "💡 Describe your story idea and AI will generate a complete short story for you!"
                  : "📝 Paste your complete story text and it will be processed into an interactive experience."
                }
              </Text>
            </ScrollView>

            {/* Footer */}
            <View style={storyModalStyles.footer}>
              <TouchableOpacity
                style={[
                  storyModalStyles.createButton,
                  (!storyTitle.trim() || !storyInput.trim() || isGenerating) && 
                  storyModalStyles.createButtonDisabled
                ]}
                onPress={handleCreateBook}
                disabled={!storyTitle.trim() || !storyInput.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                    <Text style={storyModalStyles.createButtonText}>
                      {inputMode === 'idea' ? 'Generating Story...' : 'Creating Book...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="auto-stories" size={20} color="#fff" />
                    <Text style={storyModalStyles.createButtonText}>Create Story</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ExpoLinearGradient>
        </KeyboardAvoidingView>
      </Modal>
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookGrid: {
    padding: 10,
  },
  bookCard: {
    width: (width - 40) / 2,
    margin: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bookCover: {
    height: 150,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    padding: 10,
  },
  bookTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  bookDate: {
    color: '#888',
    fontSize: 12,
=======
  },
  refinedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  brandingSection: {
    flexDirection: 'column',
    flex: 1,
  },
  refinedBrandingText: {
    fontSize: 28,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.85)',
    fontFamily: 'Zapfino',
    letterSpacing: 1.2,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  refinedSubtext: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.65)',
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  refinedAddButton: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  booksContainer: {
    flex: 1,
    backgroundColor: '#8b4513',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 25,
    marginTop: 5,
    backgroundImage: 'linear-gradient(45deg, #654321 25%, transparent 25%), linear-gradient(-45deg, #654321 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #654321 75%), linear-gradient(-45deg, transparent 75%, #654321 75%)',
    position: 'relative',
  },
  bookGrid: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 50,
  },
  bookCard: {
    width: (width - 100) / 3,
    height: 140,
    margin: 8,
    backgroundColor: 'transparent',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0,
  },
  bookCover: {
    height: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 6,
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< HEAD
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 30,
  },
  addFirstBook: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
=======
    paddingHorizontal: 40,
    marginTop: -50,
  },
  emptyIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
    padding: 20,
    marginBottom: 30,
  },
  emptyText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  addFirstBook: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addIcon: {
    marginRight: 8,
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  },
  addFirstBookText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
<<<<<<< HEAD
=======
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shelf: {
    position: 'absolute',
    width: '100%',
    height: 8,
    backgroundColor: '#654321',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    top: 190, // Moved down further: padding(15) + bookHeight(140) + margin(8) + shelfOffset(27)
  },
  shelf2: {
    top: 346, // Position for second row (190 + 156px spacing)
  },
  shelf3: {
    top: 502, // Position for third row (346 + 156px spacing)
  },
});

const popupStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    position: 'relative',
  },
  bookPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#667eea',
  },
  previewPlaceholder: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 15,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.9)',
    marginBottom: 5,
    fontFamily: 'Zapfino',
    letterSpacing: 0.5,
  },
  bookDate: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    minWidth: 80,
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#ffeb3b',
    shadowColor: '#ffeb3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryText: {
    color: 'rgba(0,0,0,0.7)',
  },
  dangerText: {
    color: '#e53e3e',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  artStyleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 10,
  },
  artStyleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedStyle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedStyleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.8)',
  },
  artStyleOptions: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  artStyleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginVertical: 1,
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 235, 59, 0.1)',
  },
  artStyleOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  selectedOptionText: {
    color: 'rgba(0,0,0,0.8)',
    fontWeight: '500',
  },
  savedVersionsSection: {
    marginBottom: 20,
  },
  versionsList: {
    marginTop: 8,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  versionInfo: {
    flex: 1,
  },
  versionName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 2,
  },
  versionDetails: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    textTransform: 'capitalize',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.9)',
    textAlign: 'center',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 25,
  },
  deleteButton: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 25,
    shadowColor: '#e53e3e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelText: {
    color: 'rgba(0,0,0,0.7)',
  },
});

const storyModalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'rgba(0,0,0,0.8)',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Zapfino',
  },
  placeholder: {
    width: 34, // Same as close button to center title
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#fff',
  },
  modeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.6)',
  },
  modeTextActive: {
    color: '#ff9800',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    color: 'rgba(0,0,0,0.8)',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    fontWeight: '500',
  },
  storyInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    fontWeight: '400',
  },
  infoText: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  createButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderColor: 'rgba(0,0,0,0.2)',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
>>>>>>> 305614773245d26d9c7a7f4491e6c41501d20831
  },
});