import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs = [
    { id: 'library', icon: 'library-books', label: 'Library' },
    { id: 'community', icon: 'people', label: 'Community' },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab,
          ]}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={tab.icon as any}
            size={22}
            color={activeTab === tab.id ? '#ffeb3b' : 'rgba(255,255,255,0.8)'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#8b4513',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 2,
    borderTopColor: '#654321',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 15,
  },
  activeTab: {
    backgroundColor: 'rgba(255,235,59,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,235,59,0.5)',
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
    fontFamily: 'Zapfino',
  },
  activeTabLabel: {
    color: '#ffeb3b',
    fontWeight: '600',
    fontFamily: 'Zapfino',
  },
});