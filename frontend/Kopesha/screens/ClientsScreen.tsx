import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';

const ClientsScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample data - replace with your actual data
  const clients = [
    { 
      id: '1', 
      name: 'John Doe', 
      loanAmount: '$5,000', 
      status: 'Due',
      profilePic: 'https://i.pravatar.cc/150?img=1'
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      loanAmount: '$7,500', 
      status: 'Overdue',
      profilePic: 'https://i.pravatar.cc/150?img=2'
    },
  ];

  const filterOptions = ['All', 'Due', 'Overdue', 'Pending'];

  // Filter and search logic
  const filteredClients = useCallback(() => {
    return clients.filter(client => {
      const matchesFilter = selectedFilter === 'All' || client.status === selectedFilter;
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [selectedFilter, searchQuery]);

  const renderClient = ({ item }) => (
    <TouchableOpacity style={styles.clientCard}>
      <View style={styles.clientImageContainer}>
        <Image 
          source={{ uri: item.profilePic }} 
          style={styles.clientImage}
         // defaultSource={require('./assets/default-avatar.png')} // Add a default avatar image to your assets
        />
        <View style={styles.onlineIndicator} />
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.loanAmount}>Loan Amount: {item.loanAmount}</Text>
      </View>
      <View style={[
        styles.statusContainer,
        item.status === 'Overdue' && styles.overdueStatus
      ]}>
        <Text style={[
          styles.statusText,
          item.status === 'Overdue' && styles.overdueStatusText
        ]}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retawa</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Feather name="bell" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <MaterialIcons name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        {filterOptions.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterOption,
              selectedFilter === item && styles.selectedFilter,
            ]}
            onPress={() => setSelectedFilter(item)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === item && styles.selectedFilterText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Clients List */}
      <FlatList
        data={filteredClients()}
        renderItem={renderClient}
        keyExtractor={item => item.id}
        style={styles.clientsList}
      />

      {/* Add Client Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add Client</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: Dimensions.get('window').width / 5,
    alignItems: 'center',
  },
  selectedFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#333',
    fontSize: 13,
  },
  selectedFilterText: {
    color: '#fff',
  },
  clientsList: {
    flex: 1,
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
});

export default ClientsScreen;