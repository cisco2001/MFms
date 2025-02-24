import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  Dimensions,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';

// Define the Client type
interface Client {
  id: number;
  full_name: string;
  id_number: string;
  phone: string;
  photo?: string;
  status?: string;
  amount_loaned: number;
  amount_paid: number;
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
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newClient, setNewClient] = useState({
    full_name: '',
    id_number: '',
    phone: '',
    email: '',
    occupation: '',
    monthly_income: '',
    loan_officer: user?.id,
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
      const url = `http://192.168.100.23:8000/api/customers/${query ? `?search=${query}` : ''}`;
      const response = await makeAuthenticatedRequest(url);
      const data = await response.json();
      setClients(data.results || []);
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
  
      const response = await makeAuthenticatedRequest('http://192.168.100.23:8000/api/customers/', {
        method: 'POST',
        body: JSON.stringify(clientData),
      });
  
      const responseData = await response.json();
  
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

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity 
      style={styles.clientCard}
      onPress={() => navigation.navigate('ClientProfile', { clientId: item.id })}
    >
      <View style={styles.clientImageContainer}>
        {item.photo ? (
          <Image 
            source={{ uri: item.photo }} 
            style={styles.clientImage}
          />
        ) : (
          <Feather name="user" size={48} color="#666" />
        )}
        <View style={styles.onlineIndicator} />
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.full_name}</Text>
        <Text style={styles.loanAmount}>Phone: {item.phone}</Text>
      </View>
      {item.status && (
        <View style={[
          styles.statusContainer,
          item.status === 'Overdue' && styles.overdueStatus
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'Overdue' && styles.overdueStatusText
          ]}>{item.status}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retawa</Text>
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

      <FlatList
        data={clients}
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
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
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
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  overdueStatus: {
    backgroundColor: '#FFE5E5',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  overdueStatusText: {
    color: '#FF4444',
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