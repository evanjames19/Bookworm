import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Book } from '../types';

const { width } = Dimensions.get('window');

interface BookLibraryProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onAddBook: () => void;
}

export const BookLibrary: React.FC<BookLibraryProps> = ({
  books,
  onSelectBook,
  onAddBook,
}) => {
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
        </TouchableOpacity>
      </View>
      
      {books.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="library-books" size={80} color="#666" />
          <Text style={styles.emptyText}>No books yet</Text>
          <TouchableOpacity style={styles.addFirstBook} onPress={onAddBook}>
            <Text style={styles.addFirstBookText}>Add your first book</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.bookGrid}
        />
      )}
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
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  addFirstBookText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});