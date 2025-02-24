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
  const [profilePicture, setProfilePicture] = useState(client?.profile_picture || null);

  const fetchClientDetails = async () => {
    try {
      const response = await fetch(`http://192.168.100.23:8000/api/customers/${clientId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setClient(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load client details');
    }
  };

  const fetchLoanHistory = async () => {
    try {
      // Fetch loan applications and repayments in parallel
      const [loanResponse, repaymentResponse] = await Promise.all([
        fetch(`http://192.168.100.23:8000/api/loan-applications/?customer=${clientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`http://192.168.100.23:8000/api/loan-repayments/?customer=${clientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);
  
      const [loanData, repaymentData] = await Promise.all([
        loanResponse.json(),
        repaymentResponse.json()
      ]);
  
      const loanApplications = loanData.results || [];
      const repayments = repaymentData.results || [];

      //console.log('repayments', repayments);
      //console.log('loanResponse', loanApplications);
      // Create a map of loan ID to total repayments
      const repaymentsByLoan = repayments.reduce((acc: { [key: string]: number }, repayment: any) => {
        const loanId = repayment.loan_application;
        acc[loanId] = (acc[loanId] || 0) + parseFloat(repayment.amount_paid);
        return acc;
      }, {});
  
      // Combine loan data with repayment totals
      const loanHistoryWithRepayments = loanApplications.map((loan: LoanHistory) => ({
        ...loan,
        amount_paid: repaymentsByLoan[loan.id] || 0,
        repayments: repayments.filter(
          (repayment: any) => repayment.loan_application === loan.id
        )
      }));
  
      setLoanHistory(loanHistoryWithRepayments);
    } catch (error) {
      Alert.alert('Error', 'Failed to load loan history');
      console.error('Error fetching loan history:', error);
    }
  };

  const handleRepayment = (loan: LoanHistory) => {
    navigation.navigate('Revenue', {
      openForm: true,
      prefillData: {
        clientName: client?.full_name,
        loanId: loan.id.toString(),
        amount: '',
        paymentMethod: 'cash'
      }
    });
  };

  const calculateRepaymentProgress = (loan: LoanHistory) => {
    console.log(loan)
    // Use amount_approved if available, otherwise fall back to amount_requested
    const principal = loan.amount_approved || 0;
    const interest = loan.interest || 0;
    const totalAmount = +principal + +interest; // using unary operator to convert to number
    console.log(principal, interest, totalAmount)
    // Handle case where total amount is 0 to avoid division by zero
    if (totalAmount <= 0) {
      return 0;
    }
  
    const amountPaid = loan.amount_paid || 0;
    
    // Ensure percentage is between 0 and 100
    return (loan.status === 'APPROVED')? Math.min(Math.max((amountPaid / totalAmount) * 100, 0), 100) : 0;
  };

  useEffect(() => {
    Promise.all([fetchClientDetails(), fetchLoanHistory()])
      .finally(() => setLoading(false));
  }, [clientId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to upload images.');
      return;
    }
  
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  
    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
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

      <TouchableOpacity onPress={pickImage}>
        <View style={styles.profileSection}>
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={styles.profileImage}
            />
          ) : (
            <MaterialIcons name="person" size={80} color="#666" />
          )}
          <Text style={styles.name}>{client?.full_name}</Text>
          <Text style={styles.subtitle}>ID: {client?.id_number}</Text>
        </View>
      </TouchableOpacity>

      {/* Personal Information section remains the same */}
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
              
              {calculateRepaymentProgress(loan) < 100 && loan.status === 'APPROVED' 
              ? (
                  <TouchableOpacity
                    style={styles.repaymentButton}
                    onPress={() => handleRepayment(loan)}
                  >
                    <Text style={styles.repaymentButtonText}>Record Payment</Text>
                  </TouchableOpacity>
                ) 
                : null}
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
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
  repaymentButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  repaymentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ClientProfileScreen;