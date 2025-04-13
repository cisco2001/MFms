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
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { getClientDetails, getLoanHistory } from '@/services/api';
interface LoanHistory {
  id: number;
  amount_requested: number;
  amount_approved: number;
  status: string;
  created_at: string;
  purpose: string;
  term_months: number;
  interest: number;
  amount_paid?: number; // New field for tracking repayments
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

  

  const handleRepayment = (loan: LoanHistory) => {
    navigation.navigate('Revenue', {
      openForm: true,
      prefillData: {
        clientName: client?.full_name,
        customerId: client?.id.toString(), // Pass the customer ID
        customerName: client?.full_name,  // Pass the customer name
        loanId: loan.id.toString(),
        amount: '',
        paymentMethod: 'cash'
      }
    });
  };

  const handleLoanSummary = (loan: LoanHistory) => {
    // Use the same direct navigation approach as in handleRepayment
    navigation.navigate('LoanSummary', {
      loanId: loan.id,
      clientName: client?.full_name,
      loanAmount: loan.amount_approved || loan.amount_requested,
    });
  };

  const calculateRepaymentProgress = (loan: LoanHistory) => {
    // Use amount_approved if available, otherwise fall back to amount_requested
    const principal = loan.amount_approved || 0;
    const interest = loan.interest || 0;
    const totalAmount = +principal + +interest; // using unary operator to convert to number
    
    // Handle case where total amount is 0 to avoid division by zero
    if (totalAmount <= 0) {
      return 0;
    }
  
    const amountPaid = loan.amount_paid || 0;
    
    // Ensure percentage is between 0 and 100
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
        
        // Debug: Log client data to see the actual field names and values
        console.log('Client Data:', clientData);
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
    } catch (error) {
      console.error('Error fetching client details:', error);
      Alert.alert('Error', 'Failed to update client data');
    }
  };

  // Helper function to get the correct address field
  const getClientAddress = () => {
    // Check for different potential address field names
    if (client?.physical_address) return client.physical_address;
    if (client?.location) return client.location;
    if (client?.street_address) return client.street_address;
    if (client?.residential_address) return client.residential_address;
    
    // If address is a number or boolean, convert to string
    if (typeof client?.address === 'number' || typeof client?.address === 'boolean') {
      return 'Address information not available';
    }
    
    // Return the address field or N/A if none exists
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
      
      // Create form data
      const formData = new FormData();
      formData.append('profile_picture', {
        uri,
        type: 'image/jpeg',
        name: 'profile_picture.jpg',
      } as any);
      
      // Send the request
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
      
      // Refresh client data to get the updated profile picture
      fetchClientDetails();
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload image');
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

  return (
    <ScrollView style={styles.container}>
      {/* Header and Profile sections remain the same */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileSection}>
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
                onLoad={() => console.log(`Photo loaded successfully for client: ${client.full_name}`)}
                onError={(error) => console.log(`Photo load error for client ${client.full_name}:`, error.nativeEvent.error)}
              />
              <View style={styles.editIconOverlay}>
                <Feather name="edit-2" size={16} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <MaterialIcons name="person" size={60} color="#666" />
              <View style={styles.editIconOverlay}>
                <Feather name="edit-2" size={16} color="#fff" />
              </View>
            </View>
          )}
        </TouchableOpacity>
        {uploading && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
        <Text style={styles.name}>{client?.full_name}</Text>
        <Text style={styles.subtitle}>ID: {client?.id_number}</Text>
      </View>

      {/* Personal Information section with improved address field */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
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

      {/* Updated Loan History section */}
      <View style={styles.loanHistorySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Loan History</Text>
          <TouchableOpacity
            style={styles.newLoanButton}
            onPress={() => navigation.navigate('NewLoan', { clientId: clientId })}
          >
            <Text style={styles.newLoanButtonText}>New Loan</Text>
          </TouchableOpacity>
        </View>

        {loanHistory.map((loan) => (
          <View key={loan.id} style={styles.loanCard}>
            <View style={styles.loanHeader}>
              <Text style={styles.loanAmount}>
                TZS {loan.amount_approved ? loan.amount_approved.toLocaleString() : loan.amount_requested.toLocaleString()}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: loan.status === 'APPROVED' ? '#4CAF50' : '#FFC107' }
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

            {/* New Repayment Progress Section */}
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
                      <Text style={styles.repaymentButtonText}>Record Payment</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.summaryButton}
                    onPress={() => handleLoanSummary(loan)}
                  >
                    <Text style={styles.summaryButtonText}>Loan Summary</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.loanDate}>
              {new Date(loan.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadingText: {
    marginLeft: 8,
    color: '#007AFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: '#666',
    flex: 1,
  },
  value: {
    flex: 2,
    textAlign: 'right',
  },
  loanHistorySection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  newLoanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newLoanButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  loanCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
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
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  loanPurpose: {
    color: '#666',
    marginBottom: 10,
  },
  loanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  loanDetail: {
    fontSize: 13,
    color: '#666',
  },
  loanDate: {
    fontSize: 12,
    color: '#999',
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
  repaymentSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
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
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  repaymentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryButton: {
    backgroundColor: '#34C759',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  summaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ClientProfileScreen;