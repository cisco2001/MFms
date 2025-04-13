import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  PanResponder,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.7;

interface MenuItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress?: () => void;
  screen?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const { logout, user } = useAuth();
  const navigation = useNavigation();

  const menuItems: MenuItem[] = [
    { 
      icon: 'group', 
      label: 'Clients', 
      screen: 'Clients'
    },
    { 
      icon: 'trending-up', 
      label: 'Revenue', 
      screen: 'Revenue'
    },
    { 
      icon: 'account-balance-wallet', 
      label: 'Expenses', 
      screen: 'ExpenseTracker'
    }
  ];

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx < 0; // Only respond to leftward swipes
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit translation to not go beyond the sidebar width
        const newX = Math.max(-SIDEBAR_WIDTH, gestureState.dx);
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Close if swiped more than 30% of the width
        if (gestureState.dx < -SIDEBAR_WIDTH * 0.3) {
          Animated.timing(translateX, {
            toValue: -SIDEBAR_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // Otherwise snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      useNativeDriver: true,
      friction: 8, // Lower value for smoother animation
      tension: 50, // Lower value for smoother animation
    }).start();
  }, [isOpen]);

  const navigateToScreen = (screen: string) => {
    // @ts-ignore - navigation typing issue
    navigation.navigate(screen);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.overlayContent} />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sidebarHeader}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <MaterialIcons name="person" size={40} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => item.screen ? navigateToScreen(item.screen) : item.onPress?.()}
            >
              <MaterialIcons name={item.icon} size={24} color="#1a73e8" />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#e53935" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  overlayContent: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: 'white',
    zIndex: 11,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sidebarHeader: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#e53935',
    fontWeight: '500',
  },
});

export default Sidebar;