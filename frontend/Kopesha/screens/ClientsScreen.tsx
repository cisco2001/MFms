import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Sidebar from '@/components/Sidebar';
import { getClients, registerClient } from '@/services/api';

// Define the Client type
interface Client {
  id: number;
  full_name: string;
  id_number: string;
  phone: string;
  profile_picture?: string;
  status?: string;
  amount_loaned: number;
  amount_paid: number;
  amount_owed: number; // New field to track the amount owed
  due_date?: string;
  ClientProfile: { clientId: number };
}

// Define the navigation parameters
type RootStackParamList = {
  ClientProfile: { clientId: number };
};

const ClientsScreen: React.FC = () => {
  const { token, user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [newClient, setNewClient] = useState({
    full_name: '',
    id_number: '',
    phone: '',
    email: '',
    occupation: '',
    monthly_income: '',
    loan_officer: user?.id,
  });

  // Totals for each category
  const [totals, setTotals] = useState({
    all: 0,
    due: 0,
    overdue: 0,
    paid: 0,
  });

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    try {
      let currentToken = token;
      
      let response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Log the raw response
      console.log('Raw response from server:', response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Request failed');
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  const fetchClients = async (query: string = '') => {
    if (!token || !user?.id) {
      console.log('No token or user ID available');
      return;
    }
  
    try {
      setLoading(true);
      const data = await getClients(token, query);
      
      // Calculate amount_owed for each client
      const clientsWithOwed = (data.results || []).map((client: Client) => ({
        ...client,
        amount_owed: client.amount_loaned - client.amount_paid
      }));
      
      setClients(clientsWithOwed);
      applyFilter(activeFilter, clientsWithOwed);
      calculateTotals(clientsWithOwed);
    } catch (error) {
      console.error('Error fetching clients:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };
  
  const registerClient = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }
  
    try {
      const clientData = {
        ...newClient,
        loan_officer: user.id,
      };
  
      const responseData = await registerClient(clientData, token);
      Alert.alert('Success', 'Client registered successfully');
      setModalVisible(false);
  
      setNewClient({
        full_name: '',
        id_number: '',
        phone: '',
        email: '',
        occupation: '',
        monthly_income: '',
        loan_officer: user.id,
      });
  
      navigation.navigate('ClientProfile', { clientId: responseData.id });
    } catch (error) {
      console.error('Error registering client:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to register client');
    }
  };

  // Calculate totals for each category
  const calculateTotals = (clientsList: Client[]) => {
    const newTotals = {
      all: 0,
      due: 0,
      overdue: 0,
      paid: 0,
    };

    clientsList.forEach(client => {
      // Total amount owed by all clients
      newTotals.all += client.amount_owed;

      // Categorize based on status
      if (client.status === 'Overdue') {
        newTotals.overdue += client.amount_owed;
      } else if (client.status === 'Due') {
        newTotals.due += client.amount_owed;
      } else if (client.amount_owed <= 0) {
        newTotals.paid += client.amount_loaned; // Track total that was fully paid
      }
    });

    setTotals(newTotals);
  };

  // Apply filter to clients list
  const applyFilter = (filter: string, clientsList: Client[] = clients) => {
    setActiveFilter(filter);
    
    let filtered;
    switch (filter) {
      case 'Due':
        filtered = clientsList.filter(client => client.status === 'Due');
        break;
      case 'Overdue':
        filtered = clientsList.filter(client => client.status === 'Overdue');
        break;
      case 'Paid':
        filtered = clientsList.filter(client => client.amount_owed <= 0);
        break;
      case 'All':
      default:
        filtered = clientsList;
        break;
    }
    
    setFilteredClients(filtered);
  };

  // Debounce search to avoid too many API calls
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    // Clear any existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set a new timeout
    window.searchTimeout = setTimeout(() => {
      fetchClients(text);
    }, 500); // Wait 500ms after user stops typing before fetching
  };
  
  useEffect(() => {
    if (token && user?.id) {
      fetchClients();
    }
    
    // Cleanup function to clear timeout
    return () => {
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
    };
  }, [token, user]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `Tsh ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity 
      style={styles.clientCard}
      onPress={() => navigation.navigate('ClientProfile', { clientId: item.id })}
    >
      <View style={styles.clientImageContainer}>
        {item.profile_picture ? (
          <Image 
            source={{ uri: item.profile_picture }} 
            style={styles.clientImage}
            onLoad={() => console.log(`Photo loaded successfully for client: ${item.full_name}`)}
            onError={(error) => console.log(`Photo load error for client ${item.full_name}:`, error.nativeEvent.error)}
          />
        ) : (
          <View style={styles.clientImagePlaceholder}>
            <Feather name="user" size={32} color="#666" />
          </View>
        )}
        <View style={[
          styles.onlineIndicator,
          item.status === 'Overdue' ? styles.overdueIndicator : 
          item.status === 'Due' ? styles.dueIndicator :
          styles.paidIndicator
        ]} />
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.full_name}</Text>
        <Text style={styles.loanAmount}>
          Owes: <Text style={[
            styles.amountText,
            item.amount_owed > 0 ? (item.status === 'Overdue' ? styles.overdueAmount : styles.dueAmount) : styles.paidAmount
          ]}>{formatCurrency(item.amount_owed)}</Text>
        </Text>
        {item.due_date && (
          <Text style={styles.dueDate}>Due: {item.due_date}</Text>
        )}
      </View>
      {item.status && (
        <View style={[
          styles.statusContainer,
          item.status === 'Overdue' && styles.overdueStatus,
          item.status === 'Due' && styles.dueStatus,
          item.amount_owed <= 0 && styles.paidStatus
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'Overdue' && styles.overdueStatusText,
            item.status === 'Due' && styles.dueStatusText,
            item.amount_owed <= 0 && styles.paidStatusText
          ]}>{item.amount_owed <= 0 ? 'Paid' : item.status}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setIsSidebarOpen(true)}
        >
          <Feather name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clients</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Feather name="bell" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#666"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                fetchClients('');
              }}
              style={styles.clearButton}
            >
              <MaterialIcons name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'All' && styles.activeFilterTab]}
            onPress={() => applyFilter('All')}
          >
            <Text style={[styles.filterText, activeFilter === 'All' && styles.activeFilterText]}>All</Text>
            <Text style={[styles.filterTotal, activeFilter === 'All' && styles.activeFilterTotal]}>
              {formatCurrency(totals.all)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'Due' && styles.activeFilterTab]}
            onPress={() => applyFilter('Due')}
          >
            <Text style={[styles.filterText, activeFilter === 'Due' && styles.activeFilterText]}>Due</Text>
            <Text style={[styles.filterTotal, activeFilter === 'Due' && styles.activeFilterTotal]}>
              {formatCurrency(totals.due)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'Overdue' && styles.activeFilterTab]}
            onPress={() => applyFilter('Overdue')}
          >
            <Text style={[styles.filterText, activeFilter === 'Overdue' && styles.activeFilterText]}>Overdue</Text>
            <Text style={[styles.filterTotal, activeFilter === 'Overdue' && styles.activeFilterTotal]}>
              {formatCurrency(totals.overdue)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'Paid' && styles.activeFilterTab]}
            onPress={() => applyFilter('Paid')}
          >
            <Text style={[styles.filterText, activeFilter === 'Paid' && styles.activeFilterText]}>Paid</Text>
            <Text style={[styles.filterTotal, activeFilter === 'Paid' && styles.activeFilterTotal]}>
              {formatCurrency(totals.paid)}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={item => item.id.toString()}
        style={styles.clientsList}
        refreshing={loading}
        onRefresh={() => fetchClients(searchQuery)}
      />

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Client</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Register New Client</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={newClient.full_name}
              onChangeText={(text) => setNewClient({...newClient, full_name: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="ID Number"
              value={newClient.id_number}
              onChangeText={(text) => setNewClient({...newClient, id_number: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={newClient.phone}
              onChangeText={(text) => setNewClient({...newClient, phone: text})}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email (Optional)"
              value={newClient.email}
              onChangeText={(text) => setNewClient({...newClient, email: text})}
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Occupation"
              value={newClient.occupation}
              onChangeText={(text) => setNewClient({...newClient, occupation: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Monthly Income"
              value={newClient.monthly_income}
              onChangeText={(text) => setNewClient({...newClient, monthly_income: text})}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={registerClient}
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* The Sidebar component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
  },
  filterTotal: {
    fontSize: 12,
    marginTop: 2,
    color: '#666',
  },
  activeFilterTotal: {
    color: '#fff',
  },
  clientsList: {
    flex: 1,
    marginTop: 10,
  },
  clientCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  clientImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  clientImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  clientImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  paidIndicator: {
    backgroundColor: '#4CAF50',
  },
  dueIndicator: {
    backgroundColor: '#FFC107',
  },
  overdueIndicator: {
    backgroundColor: '#FF4444',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  loanAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  amountText: {
    fontWeight: '600',
  },
  dueAmount: {
    color: '#FFC107',
  },
  overdueAmount: {
    color: '#FF4444',
  },
  paidAmount: {
    color: '#4CAF50',
  },
  dueDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dueStatus: {
    backgroundColor: '#FFF8E1',
  },
  overdueStatus: {
    backgroundColor: '#FFE5E5',
  },
  paidStatus: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
  },
  dueStatusText: {
    color: '#FFA000',
  },
  overdueStatusText: {
    color: '#FF4444',
  },
  paidStatusText: {
    color: '#4CAF50',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default ClientsScreen;