import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { 
  Feather,
  MaterialCommunityIcons 
} from '@expo/vector-icons';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const Card: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

interface PortfolioData {
  totalClients: number;
  activeLoans: number;
  portfolioValue: number;
  collectionRate: number;
  overdueLoans: number;
  meetingsToday: number;
  revenueThisMonth: number;
  expensesThisMonth: number;
  collectionTarget: number;
  expensesTarget: number;
  currentCollection: number;
}

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.75;

const Sidebar: React.FC<{ isVisible: boolean; onClose: () => void }> = ({ isVisible, onClose }) => {
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const renderNavItem = (icon: string, label: string, isActive: boolean = false) => (
    <TouchableOpacity 
      style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
      onPress={onClose}
    >
      <Feather name={icon as any} size={20} color={isActive ? "#1D4ED8" : "#4B5563"} />
      <Text style={[styles.sidebarItemText, isActive && styles.sidebarItemTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={styles.overlayPress} onPress={onClose} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarContent}>
            {renderNavItem('home', 'Dashboard', true)}
            {renderNavItem('users', 'Clients')}
            {renderNavItem('dollar-sign', 'Loans')}
            {renderNavItem('calendar', 'Schedule')}
            {renderNavItem('bar-chart-2', 'Reports')}
            {renderNavItem('settings', 'Settings')}
          </View>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.profileSection}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitials}>SA</Text>
              </View>
              <View>
                <Text style={styles.profileName}>Sarah Anderson</Text>
                <Text style={styles.profileRole}>Loan Officer</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const HomeScreen: React.FC = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  
  const portfolioData: PortfolioData = {
    totalClients: 156,
    activeLoans: 142,
    portfolioValue: 450000,
    collectionRate: 96.5,
    overdueLoans: 8,
    meetingsToday: 5,
    revenueThisMonth: 12500,
    expensesThisMonth: 3200,
    collectionTarget: 15000,
    expensesTarget: 4000,
    currentCollection: 12000
  };

  const collectionProgress = (portfolioData.currentCollection / portfolioData.collectionTarget) * 100;
  const expensesProgress = (portfolioData.expensesThisMonth / portfolioData.expensesTarget) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Feather name="menu" size={24} color="#4B5563" />
        </TouchableOpacity>
        <View style={styles.breadcrumbTextContainer}>
          <Text style={styles.breadcrumbText}>Home</Text>
          <Feather name="chevron-right" size={16} color="#9CA3AF" />
          <Text style={styles.breadcrumbText}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.notificationContainer}>
          <Feather name="bell" size={24} color="#4B5563" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Sidebar 
        isVisible={isSidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
      />

      <ScrollView style={styles.scrollView}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Welcome back, Sarah</Text>
            <Text style={styles.headerSubtitle}>Monday, January 11</Text>
          </View>
          <View style={styles.timeContainer}>
            <Feather name="clock" size={20} color="#1D4ED8" />
            <Text style={styles.timeText}>9:41 AM</Text>
          </View>
        </View>

        {/* Portfolio Summary */}
        <Card>
          <Text style={styles.cardTitle}>Portfolio Overview</Text>
          <View style={styles.portfolioGrid}>
            <View style={styles.portfolioItem}>
              <Feather name="users" size={24} color="#1D4ED8" />
              <View>
                <Text style={styles.itemLabel}>Total Clients</Text>
                <Text style={styles.itemValue}>{portfolioData.totalClients}</Text>
              </View>
            </View>

            <View style={styles.portfolioItem}>
              <MaterialCommunityIcons name="wallet" size={24} color="#059669" />
              <View>
                <Text style={styles.itemLabel}>Portfolio Value</Text>
                <Text style={styles.itemValue}>${portfolioData.portfolioValue.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.portfolioItem}>
              <Feather name="trending-up" size={24} color="#7C3AED" />
              <View>
                <Text style={styles.itemLabel}>Collection Rate</Text>
                <Text style={styles.itemValue}>{portfolioData.collectionRate}%</Text>
              </View>
            </View>

            <View style={styles.portfolioItem}>
              <Feather name="alert-circle" size={24} color="#DC2626" />
              <View>
                <Text style={styles.itemLabel}>Overdue Loans</Text>
                <Text style={styles.itemValue}>{portfolioData.overdueLoans}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: '#EFF6FF' }]}>
            <View style={styles.quickActionHeader}>
              <Feather name="users" size={24} color="#1D4ED8" />
              <Text style={styles.quickActionTitle}>Clients</Text>
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionText}>Active Loans: {portfolioData.activeLoans}</Text>
              <Text style={[styles.quickActionLink, { color: '#1D4ED8' }]}>View All Clients →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: '#F5F3FF' }]}>
            <View style={styles.quickActionHeader}>
              <Feather name="calendar" size={24} color="#7C3AED" />
              <Text style={styles.quickActionTitle}>Today</Text>
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionText}>Meetings: {portfolioData.meetingsToday}</Text>
              <Text style={[styles.quickActionLink, { color: '#7C3AED' }]}>View Schedule →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Monthly Summary */}
        <Card>
          <Text style={styles.cardTitle}>Monthly Summary</Text>
          <View style={styles.summaryCardsRow}>
            {/* Collections Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <MaterialCommunityIcons name="cash-multiple" size={24} color="#059669" />
                <Text style={styles.summaryCardTitle}>Collections</Text>
              </View>
              <View style={styles.summaryCardContent}>
                <Text style={styles.currentValue}>
                  ${portfolioData.currentCollection.toLocaleString()}
                </Text>
                <Text style={styles.targetValue}>
                  Target: ${portfolioData.collectionTarget.toLocaleString()}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${Math.min(collectionProgress, 100)}%`, backgroundColor: '#059669' }]} />
                </View>
                <Text style={styles.progressText}>{collectionProgress.toFixed(1)}% of target</Text>
              </View>
            </View>

            {/* Expenses Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Feather name="credit-card" size={24} color="#DC2626" />
                <Text style={styles.summaryCardTitle}>Expenses</Text>
              </View>
              <View style={styles.summaryCardContent}>
                <View style={styles.expenseRow}>
                  <View>
                    <Text style={styles.expenseLabel}>Amount Spent</Text>
                    <Text style={styles.currentValue}>
                      ${portfolioData.expensesThisMonth.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.expenseAligned}>
                    <Text style={styles.expenseLabel}>Allocated Budget</Text>
                    <Text style={styles.budgetValue}>
                      ${portfolioData.expensesTarget.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${Math.min(expensesProgress, 100)}%`, backgroundColor: '#DC2626' }]} />
                </View>
                <Text style={styles.progressText}>{expensesProgress.toFixed(1)}% of budget used</Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="users" size={24} color="#6B7280" />
          <Text style={styles.navText}>Clients</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Feather name="home" size={24} color="#1D4ED8" />
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="bank" size={24} color="#6B7280" />
          <Text style={styles.navText}>Loans</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  breadcrumbTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 16,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  portfolioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '45%',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  quickActionContent: {
    marginTop: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  quickActionLink: {
    fontSize: 14,
  },
  itemLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    minWidth: 0,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryCardContent: {
    gap: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expenseLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  expenseAligned: {
    alignItems: 'flex-end',
  },
  currentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: '500',
    color: '#6B7280',
  },
  targetValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  activeNavItem: {
    backgroundColor: '#E0F2FE',
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activeNavText: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  overlayPress: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: 'white',
    paddingTop: 40,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  sidebarContent: {
    flex: 1,
    gap: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sidebarItemActive: {
    backgroundColor: '#EFF6FF',
  },
  sidebarItemText: {
    fontSize: 16,
    color: '#4B5563',
  },
  sidebarItemTextActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  profileRole: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default HomeScreen;