import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../app/App';

const { width, height } = Dimensions.get('window');
const MENU_RADIUS = 120;
const ITEM_RADIUS = 35;
const SIDEBAR_WIDTH = width * 0.7;

type NavigationProp = StackNavigationProp<RootStackParamList>;

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

interface MenuItem {
  icon: MaterialIconName;
  label: string;
  rotation: number;
  onPress?: () => void;
}

interface HeaderProps {
  onNotificationPress: () => void;
  onMenuPress: () => void;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  onNotificationPress, 
  onMenuPress, 
  notificationCount 
}) => (
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.headerIcon}
      onPress={onMenuPress}
    >
      <MaterialIcons name="menu" size={28} color="#333" />
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.headerIcon}
      onPress={onNotificationPress}
    >
      <MaterialIcons name="notifications" size={28} color="#333" />
      {notificationCount && notificationCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {notificationCount > 99 ? '99+' : notificationCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
            { rotate: `${rotation}deg` },
          ],
          opacity: isOpen ? 1 : 0,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} size={28} color="#1a73e8" />
        </View>
        <Text style={[styles.label, { transform: [{ rotate: `-${rotation}deg` }] }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Sidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}> = ({ isOpen, onClose, menuItems }) => {
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

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
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Menu</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sidebarItem}
            onPress={() => {
              if (item.onPress) {
                item.onPress();
              }
              onClose();
            }}
          >
            <MaterialIcons name={item.icon} size={24} color="#1a73e8" />
            <Text style={styles.sidebarItemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
};

const Homepage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [notificationCount, setNotificationCount] = useState<number>(3);

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

  const handleNotificationPress = () => {
    console.log('Notifications pressed');
  };

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

  const calculateSelectedSection = (x: number, y: number): number => {
    if (!isMenuOpen) return -1;
    const dx = x - width / 2;
    const dy = y - height / 2;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const normalizedAngle = (angle + 360) % 360;
    const sectionSize = 360 / menuItems.length;
    return Math.floor(normalizedAngle / sectionSize);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;
      const selected = calculateSelectedSection(locationX, locationY);
      setHighlightedIndex(selected);
    },
    onPanResponderRelease: (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;
      const selected = calculateSelectedSection(locationX, locationY);
      if (selected !== -1) {
        handleMenuItemPress(selected);
      }
      setHighlightedIndex(-1);
    },
  });

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setHighlightedIndex(-1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <Header
        onNotificationPress={handleNotificationPress}
        onMenuPress={handleMenuPress}
        notificationCount={notificationCount}
      />
      <View style={styles.container}>
        <View
          style={styles.menuContainer}
          {...(isMenuOpen ? panResponder.panHandlers : {})}
        >
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

          {isMenuOpen && (
            <View style={styles.pieBackground}>
              {menuItems.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pieSector,
                    {
                      transform: [{ rotate: `${index * (360 / menuItems.length)}deg` }],
                      backgroundColor:
                        highlightedIndex === index ? '#e3f2fd' : 'rgba(255,255,255,0.9)',
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </View>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        menuItems={menuItems}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#e53935',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 2,
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
    zIndex: 1,
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
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  pieBackground: {
    position: 'absolute',
    width: MENU_RADIUS * 2,
    height: MENU_RADIUS * 2,
    borderRadius: MENU_RADIUS,
    overflow: 'hidden',
    zIndex: 0,
  },
  pieSector: {
    position: 'absolute',
    width: MENU_RADIUS,
    height: MENU_RADIUS * 2,
    left: MENU_RADIUS,
    transformOrigin: '0 50%',
  },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sidebarItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
});

export default Homepage;