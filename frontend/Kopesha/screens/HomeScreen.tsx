import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../app/App';
import Sidebar from '@/components/Sidebar'; // Import the Sidebar component

const { width, height } = Dimensions.get('window');
const MENU_RADIUS = 120;
const ITEM_RADIUS = 35;

type NavigationProp = StackNavigationProp<RootStackParamList>;

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

interface MenuItem {
  icon: MaterialIconName;
  label: string;
  rotation: number;
  onPress?: () => void;
}

interface HeaderProps {
  onMenuPress: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuPress }) => (
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.headerIcon}
      onPress={onMenuPress}
    >
      <MaterialIcons name="menu" size={28} color="#333" />
    </TouchableOpacity>
    
    {/* App title/logo could go here */}
    <View style={styles.headerTitle}>
      <Text style={styles.headerTitleText}>Retawa Financial Service</Text>
    </View>
    
    {/* Empty view for layout balance */}
    <View style={{width: 44}} />
  </View>
);

interface PieMenuItemProps {
  icon: MaterialIconName;
  label: string;
  rotation: number;
  isOpen: boolean;
  onPress: () => void;
}

const PieMenuItem: React.FC<PieMenuItemProps> = ({
  icon,
  label,
  rotation,
  isOpen,
  onPress,
}) => {
  const angle = (rotation * Math.PI) / 180;
  const x = Math.cos(angle) * MENU_RADIUS;
  const y = Math.sin(angle) * MENU_RADIUS;

  return (
    <Animated.View
      style={[
        styles.menuItem,
        {
          transform: [
            { translateX: x },
            { translateY: y },
            { scale: isOpen ? 1 : 0 },
          ],
          opacity: isOpen ? 1 : 0,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} size={28} color="#1a73e8" />
        </View>
        <Text style={styles.label}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Homepage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const menuItems: MenuItem[] = [
    { 
      icon: 'group', 
      label: 'Clients', 
      rotation: 0,
      onPress: () => navigation.navigate('Clients')
    },
    { 
      icon: 'trending-up', 
      label: 'Revenue', 
      rotation: 120,
      onPress: () => navigation.navigate('Revenue')
    },
    { 
      icon: 'account-balance-wallet', 
      label: 'Expenses', 
      rotation: 240,
      onPress: () => navigation.navigate('ExpenseTracker')
    },
  ];

  const handleMenuPress = () => {
    setIsSidebarOpen(true);
  };

  const handleMenuItemPress = (index: number) => {
    const selectedItem = menuItems[index];
    if (selectedItem.onPress) {
      selectedItem.onPress();
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <Header onMenuPress={handleMenuPress} />
      
      <View style={styles.container}>
        {/* Main content - positioned higher when menu is open */}
        <View style={[
          styles.contentContainer,
          isMenuOpen && styles.contentContainerWithMenuOpen
        ]}>
          <Text style={styles.welcomeText}>Welcome to your dashboard</Text>
          <Text style={styles.instructionText}>Tap the + button to explore features</Text>
        </View>
        
        {/* Menu */}
        <View style={styles.menuWrapper}>
          <View style={styles.menuContainer}>
            {/* Show background sectors only when menu is open */}
            {isMenuOpen && (
              <View style={styles.pieBackground}>
                {menuItems.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.pieSector,
                      {
                        transform: [{ rotate: `${index * (360 / menuItems.length)}deg` }],
                      },
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Menu center button */}
            <TouchableOpacity
              style={[styles.centerButton, isMenuOpen && styles.centerButtonActive]}
              onPress={toggleMenu}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={isMenuOpen ? 'close' : 'add'}
                size={32}
                color="white"
              />
            </TouchableOpacity>

            {/* Menu items */}
            {menuItems.map((item, index) => (
              <PieMenuItem
                key={index}
                icon={item.icon}
                label={item.label}
                rotation={item.rotation}
                isOpen={isMenuOpen}
                onPress={() => handleMenuItemPress(index)}
              />
            ))}
          </View>
        </View>
      </View>
      
      {/* Sidebar component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  headerIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a73e8',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 160, // Space for closed menu
    // Add a smooth transition
    transition: '0.3s ease-in-out',
  },
  contentContainerWithMenuOpen: {
    paddingTop: 0,
    // Move content up when menu is open to avoid overlap
    marginTop: -160,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  menuWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300, // Taller container to ensure menu items aren't cut off
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 70, // Good balance for visibility
    alignSelf: 'center',
    width: MENU_RADIUS * 2 + 100, // Extra space for labels
    height: MENU_RADIUS * 2 + 100, // Extra space for labels
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 12, // Higher than pie background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centerButtonActive: {
    backgroundColor: '#1557b0',
  },
  menuItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11, // Higher than pie background
  },
  menuButton: {
    alignItems: 'center',
  },
  iconContainer: {
    width: ITEM_RADIUS * 2,
    height: ITEM_RADIUS * 2,
    borderRadius: ITEM_RADIUS,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pieBackground: {
    position: 'absolute',
    width: MENU_RADIUS * 2,
    height: MENU_RADIUS * 2,
    borderRadius: MENU_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    zIndex: 5, // Lower than buttons
  },
  pieSector: {
    position: 'absolute',
    width: MENU_RADIUS,
    height: MENU_RADIUS * 2,
    left: MENU_RADIUS,
    transformOrigin: '0 50%',
    backgroundColor: 'rgba(230,240,255,0.7)', // Light blue background
  },
});

export default Homepage;