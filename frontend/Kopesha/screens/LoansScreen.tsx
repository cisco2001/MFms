import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  ListRenderItem,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Client {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  loans: number;
}

interface Notification {
  id: string;
  message: string;
  time: string;
}

interface FinancialSummary {
  revenue: number;
  expenses: number;
}

const HomeScreen: React.FC = () => {
  const [isSidebarVisible, setSidebarVisible] = useState<boolean>(false);
  const [isNotificationVisible, setNotificationVisible] = useState<boolean>(false);
  const [isAddClientVisible, setAddClientVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newClientName, setNewClientName] = useState<string>('');

  const clients: Client[] = [
    { id: '1', name: 'John Doe', status: 'Active', loans: 2 },
    { id: '2', name: 'Jane Smith', status: 'Active', loans: 1 },
    { id: '3', name: 'Mike Johnson', status: 'Inactive', loans: 0 },
  ];

  const notifications: Notification[] = [
    { id: '1', message: 'New loan application from John Doe', time: '2h ago' },
    { id: '2', message: 'Payment due for Loan #123', time: '5h ago' },
  ];

  const financialSummary: FinancialSummary = {
    revenue: 50000,
    expenses: 30000,
  };

  const categories = ['All', 'With Loans', 'No Loans'];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategory === 'All' ? true :
      selectedCategory === 'With Loans' ? client.loans > 0 :
      selectedCategory === 'No Loans' ? client.loans === 0 : true;
    return matchesSearch && matchesCategory;
  });

  const AddClientModal: React.FC = () => (
    <Modal
      visible={isAddClientVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setAddClientVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setAddClientVisible(false)}
      >
        <View style={styles.addClientPanel}>
          <View style={styles.addClientHeader}>
            <Text style={styles.addClientTitle}>Add New Client</Text>
            <TouchableOpacity onPress={() => setAddClientVisible(false)}>
              <Feather name="x" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.addClientForm}>
            <Text style={styles.inputLabel}>Client Name</Text>
            <TextInput
              style={styles.input}
              value={newClientName}
              onChangeText={setNewClientName}
              placeholder="Enter client name"
            />
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                // Add client logic here
                setAddClientVisible(false);
                setNewClientName('');
              }}
            >
              <Text style={styles.addButtonText}>Add Client</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderClientItem: ListRenderItem<Client> = ({ item }) => (
    <TouchableOpacity style={styles.clientCard}>
      <View style={styles.clientInfo}>
        <View style={styles.clientMainInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.loanCount}>{item.loans} Loans</Text>
        </View>
        <View style={styles.clientDetails}>
          <Text style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'Active' ? '#E3FCF2' : '#FFE4E4' },
            { color: item.status === 'Active' ? '#14B8A6' : '#F43F5E' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Keep the existing Sidebar and NotificationsPanel components...

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Feather name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => setNotificationVisible(true)}>
          <View style={styles.notificationIcon}>
            <Feather name="bell" size={24} color="#1F2937" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>2</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Feather name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.financialContainer}>
          <View style={[styles.financialCard, { backgroundColor: '#E3FCF2' }]}>
            <Text style={styles.financialLabel}>Revenue</Text>
            <Text style={[styles.financialValue, { color: '#14B8A6' }]}>
              ${financialSummary.revenue.toLocaleString()}
            </Text>
          </View>
          
          <View style={[styles.financialCard, { backgroundColor: '#FFE4E4' }]}>
            <Text style={styles.financialLabel}>Expenses</Text>
            <Text style={[styles.financialValue, { color: '#F43F5E' }]}>
              ${financialSummary.expenses.toLocaleString()}
            </Text>
          </View>
        </View>

        <FlatList
          data={filteredClients}
          renderItem={renderClientItem}
          keyExtractor={(item) => item.id}
          style={styles.clientList}
          contentContainerStyle={styles.clientListContent}
        />
      </View>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setAddClientVisible(true)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>


      <AddClientModal />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... Keep existing styles and add these new ones:
  content: {
    flex: 1,
  },
  clientList: {
    flex: 1,
  },
  clientListContent: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addClientPanel: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addClientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  addClientTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addClientForm: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
  },
  categoryButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  financialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 8,
  },
  financialCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  financialLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllButton: {
    color: '#3B82F6',
    fontSize: 14,
  },
  clientCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  clientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientMainInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  clientCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  clientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  loanCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sidebarItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  notificationPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default HomeScreen;