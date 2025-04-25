import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { getClientDetails, getLoanHistory, updateClientDetails } from '@/services/api';

interface LoanHistory {
  id: number;
  amount_requested: number;
  amount_approved: number;
  status: string;
  created_at: string;
  purpose: string;
  term_months: number;
  interest: number;
  amount_paid?: number;
}

interface ClientProfileScreenProps {
  route: { params: { clientId: number } };
  navigation: any;
}

const ClientProfileScreen: React.FC<ClientProfileScreenProps> = ({ route, navigation }) => {
  const { clientId } = route.params;
  const { token, user } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [loanHistory, setLoanHistory] = useState<LoanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [updatedClientData, setUpdatedClientData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('loans'); // Changed from 'profile' to 'loans'
  const { width, height } = useWindowDimensions();
  
  // Determine if device is in landscape mode
  const isLandscape = width > height;
  // Determine if the device is a tablet (simple check based on screen size)
  const isTablet = width > 768;

  const handleRepayment = (loan: LoanHistory) => {
    navigation.navigate('Revenue', {
      openForm: true,
      prefillData: {
        clientName: client?.full_name,
        customerId: client?.id.toString(),
        customerName: client?.full_name,
        loanId: loan.id.toString(),
        amount: '',
        paymentMethod: 'cash'
      }
    });
  };

  const handleLoanSummary = (loan: LoanHistory) => {
    navigation.navigate('LoanSummary', {
      loanId: loan.id,
      clientName: client?.full_name,
      loanAmount: loan.amount_approved || loan.amount_requested,
    });
  };

  const calculateRepaymentProgress = (loan: LoanHistory) => {
    const principal = loan.amount_approved || 0;
    const interest = loan.interest || 0;
    const totalAmount = +principal + +interest;
    
    if (totalAmount <= 0) {
      return 0;
    }
  
    const amountPaid = loan.amount_paid || 0;
    
    return (loan.status === 'APPROVED')? Math.min(Math.max((amountPaid / totalAmount) * 100, 0), 100) : 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientData, loanHistoryData] = await Promise.all([
          getClientDetails(clientId, token),
          getLoanHistory(clientId, token),
        ]);
        setClient(clientData);
        setLoanHistory(loanHistoryData);
        
        // Initialize updatedClientData with existing client data
        setUpdatedClientData({
          full_name: clientData.full_name,
          phone: clientData.phone,
          email: clientData.email || '',
          address: clientData.physical_address || clientData.location || clientData.address || '',
          occupation: clientData.occupation || '',
          monthly_income: clientData.monthly_income || '',
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [clientId, token]);

  const fetchClientDetails = async () => {
    try {
      const clientData = await getClientDetails(clientId, token);
      setClient(clientData);
      
      // Update the form data as well
      setUpdatedClientData({
        full_name: clientData.full_name,
        phone: clientData.phone,
        email: clientData.email || '',
        address: clientData.physical_address || clientData.location || clientData.address || '',
        occupation: clientData.occupation || '',
        monthly_income: clientData.monthly_income || '',
      });
    } catch (error) {
      console.error('Error fetching client details:', error);
      Alert.alert('Error', 'Failed to update client data');
    }
  };

  // Helper function to get the correct address field
  const getClientAddress = () => {
    if (client?.physical_address) return client.physical_address;
    if (client?.location) return client.location;
    if (client?.street_address) return client.street_address;
    if (client?.residential_address) return client.residential_address;
    
    if (typeof client?.address === 'number' || typeof client?.address === 'boolean') {
      return 'Address information not available';
    }
    
    return client?.address || 'N/A';
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }
    
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Sorry, we need camera permissions to take photos.');
        return;
      }
    
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('profile_picture', {
        uri,
        type: 'image/jpeg',
        name: 'profile_picture.jpg',
      } as any);
      
      const response = await fetch(`http://192.168.100.23:8000/api/customers/${clientId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload image');
      }
      
      fetchClientDetails();
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleEditPersonalInfo = () => {
    setEditModalVisible(true);
  };

  const handleUpdateClientInfo = async () => {
    try {
      setUploading(true);
      
      // Process monthly income to ensure it's a number
      const formattedData = {
        ...updatedClientData,
        monthly_income: updatedClientData.monthly_income ? Number(updatedClientData.monthly_income) : undefined,
      };
      
      await updateClientDetails(clientId, formattedData, token);
      await fetchClientDetails();
      
      setEditModalVisible(false);
      Alert.alert('Success', 'Personal information updated successfully');
    } catch (error) {
      console.error('Error updating client info:', error);
      Alert.alert('Error', 'Failed to update personal information');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Content for the Profile tab
  const ProfileContent = () => (
    <>
      <View style={[styles.infoSection, styles.cardShadow]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditPersonalInfo}
          >
            <Feather name="edit-2" size={18} color="#007AFF" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{client?.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{client?.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{getClientAddress()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Occupation:</Text>
          <Text style={styles.value}>{client?.occupation || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Monthly Income:</Text>
          <Text style={styles.value}>
            {client?.monthly_income ? `TZS ${client.monthly_income.toLocaleString()}` : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={[styles.infoSection, styles.cardShadow]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>ID Information</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>ID Number:</Text>
          <Text style={styles.value}>{client?.id_number || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Customer ID:</Text>
          <Text style={styles.value}>{client?.id || 'N/A'}</Text>
        </View>
      </View>
    </>
  );

  // Content for the Loans tab
  const LoansContent = () => (
    <View style={styles.loanHistorySection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Loan History</Text>
        <TouchableOpacity
          style={styles.newLoanButton}
          onPress={() => navigation.navigate('NewLoan', { clientId: clientId })}
        >
          <Feather name="plus" size={16} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.newLoanButtonText}>New Loan</Text>
        </TouchableOpacity>
      </View>

      {loanHistory.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Feather name="credit-card" size={50} color="#ccc" />
          <Text style={styles.emptyStateText}>No loan history yet</Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('NewLoan', { clientId: clientId })}
          >
            <Text style={styles.emptyStateButtonText}>Create First Loan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        loanHistory.map((loan) => (
          <View key={loan.id} style={[styles.loanCard, styles.cardShadow]}>
            <View style={styles.loanHeader}>
              <Text style={styles.loanAmount}>
                TZS {loan.amount_approved ? loan.amount_approved.toLocaleString() : loan.amount_requested.toLocaleString()}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: loan.status === 'APPROVED' ? '#4CAF50' : 
                                   loan.status === 'PENDING' ? '#FFC107' : 
                                   loan.status === 'REJECTED' ? '#FF3B30' : '#999' }
              ]}>
                <Text style={styles.statusText}>{loan.status}</Text>
              </View>
            </View>
            
            <Text style={styles.loanPurpose}>{loan.purpose}</Text>
            
            <View style={styles.loanDetails}>
              <Text style={styles.loanDetail}>Term: {loan.term_months} months</Text>
              {loan.interest && (
                <Text style={styles.loanDetail}>Interest: TZS {loan.interest.toLocaleString()}</Text>
              )}
            </View>

            <View style={styles.repaymentSection}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${calculateRepaymentProgress(loan)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {calculateRepaymentProgress(loan) >= 100 
                    ? 'Completed'
                    : `${calculateRepaymentProgress(loan).toFixed(1)}% Paid`
                  }
                </Text>
              </View>
              
              {loan.status === 'APPROVED' && (
                <View style={styles.actionButtonsContainer}>
                  {calculateRepaymentProgress(loan) < 100 && (
                    <TouchableOpacity
                      style={styles.repaymentButton}
                      onPress={() => handleRepayment(loan)}
                    >
                      <Feather name="dollar-sign" size={14} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.repaymentButtonText}>Record Payment</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.summaryButton}
                    onPress={() => handleLoanSummary(loan)}
                  >
                    <Feather name="file-text" size={14} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.summaryButtonText}>Loan Summary</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.loanDate}>
              Created on {new Date(loan.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Modern header with drop shadow */}
      <View style={[styles.header, styles.cardShadow]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Profile Section with Responsive Layout */}
          <View style={[
            styles.profileSection, 
            isLandscape && !isTablet && styles.profileSectionLandscape,
          ]}>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={() => {
                Alert.alert(
                  'Update Profile Picture',
                  'Choose an option',
                  [
                    {
                      text: 'Take Photo',
                      onPress: takePicture
                    },
                    {
                      text: 'Choose from Gallery',
                      onPress: pickImage
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    }
                  ]
                );
              }}
            >
              {client?.profile_picture ? (
                <View style={styles.profileImageWrapper}>
                  <Image
                    source={{ uri: client.profile_picture }}
                    style={styles.profileImage}
                  />
                  <View style={styles.editIconOverlay}>
                    <Feather name="camera" size={16} color="#fff" />
                  </View>
                </View>
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <MaterialIcons name="person" size={60} color="#666" />
                  <View style={styles.editIconOverlay}>
                    <Feather name="camera" size={16} color="#fff" />
                  </View>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadingIndicator}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.profileTextContainer}>
              <Text style={styles.name}>{client?.full_name}</Text>
              <View style={styles.idContainer}>
                <Feather name="credit-card" size={14} color="#666" />
                <Text style={styles.subtitle}>ID: {client?.id_number}</Text>
              </View>
            </View>
          </View>

          {/* Modern Tab Navigation - Reordered tabs to put Loans first */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'loans' && styles.activeTab]}
              onPress={() => setActiveTab('loans')}
            >
              <Feather 
                name="dollar-sign" 
                size={18} 
                color={activeTab === 'loans' ? "#007AFF" : "#666"} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === 'loans' && styles.activeTabText
              ]}>
                Loans
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
              onPress={() => setActiveTab('profile')}
            >
              <Feather 
                name="user" 
                size={18} 
                color={activeTab === 'profile' ? "#007AFF" : "#666"} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === 'profile' && styles.activeTabText
              ]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          <View style={styles.tabContent}>
            {activeTab === 'profile' ? <ProfileContent /> : <LoansContent />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Personal Information Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => {
          setEditModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Personal Information</Text>
                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </Pressable>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={updatedClientData.full_name}
                  onChangeText={(text) => setUpdatedClientData({...updatedClientData, full_name: text})}
                  placeholder="Full Name"
                />
                
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={updatedClientData.phone}
                  onChangeText={(text) => setUpdatedClientData({...updatedClientData, phone: text})}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                />
                
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={updatedClientData.email}
                  onChangeText={(text) => setUpdatedClientData({...updatedClientData, email: text})}
                  placeholder="Email Address"
                  keyboardType="email-address"
                />
                
                <Text style={styles.inputLabel}>Physical Address</Text>
                <TextInput
                  style={styles.input}
                  value={updatedClientData.address}
                  onChangeText={(text) => setUpdatedClientData({...updatedClientData, address: text})}
                  placeholder="Physical Address"
                />
                
                <Text style={styles.inputLabel}>Occupation</Text>
                <TextInput
                  style={styles.input}
                  value={updatedClientData.occupation}
                  onChangeText={(text) => setUpdatedClientData({...updatedClientData, occupation: text})}
                  placeholder="Occupation"
                />
                
                <Text style={styles.inputLabel}>Monthly Income (TZS)</Text>
                <TextInput
                  style={styles.input}
                  value={updatedClientData.monthly_income ? updatedClientData.monthly_income.toString() : ''}
                  onChangeText={(text) => setUpdatedClientData({...updatedClientData, monthly_income: text})}
                  placeholder="Monthly Income"
                  keyboardType="numeric"
                />
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleUpdateClientInfo}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  profileSection: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  profileSectionLandscape: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
    alignItems: 'center',
  },
  profileTextContainer: {
    marginLeft: 20,
    alignItems: 'center',
  },
  profileImageWrapper: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#f0f0f0',
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  profileImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,122,255,0.8)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 6,
    borderRadius: 12,
  },
  uploadingText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '500',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    textAlign: 'center',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  infoSection: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  label: {
    color: '#666',
    fontSize: 15,
    flex: 1,
  },
  value: {
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
    color: '#333',
    fontSize: 15,
  },
  loanHistorySection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  newLoanButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newLoanButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
  loanCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loanPurpose: {
    color: '#666',
    marginBottom: 10,
    fontSize: 14,
  },
  loanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loanDetail: {
    fontSize: 13,
    color: '#666',
  },
  loanDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  repaymentSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  repaymentButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  repaymentButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryButton: {
    backgroundColor: '#34C759',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  summaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    padding: 20,
    maxHeight: '70%',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ClientProfileScreen;