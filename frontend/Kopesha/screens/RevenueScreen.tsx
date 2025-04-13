import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  RefreshControl,
  Alert,
  Image,
  UIManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getCollections, addCollection, getCustomers, getCustomerLoans, getLoanApplications } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { generateReceiptPDF } from '@/utils/pdfGenerator';
import * as SMS from 'expo-sms'; // Import expo-sms
import * as Permissions from 'expo-permissions';

// Update interfaces to match API response
interface Customer {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  monthly_income: string;
  occupation: string;
  branch: number;
  loan_officer: number;
  is_active: boolean;
}

interface Collection {
  id: number;
  amount_paid: string;
  payment_date: string;
  payment_method: PaymentMethod;
  withdrawal_fees: string;
  loan_application: number;
  receipt: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string; // Add customer name to the collection
}

type PaymentMethod = 'cash' | 'mobile_money' | 'bank_transfer';

interface Loan {
  id: string;
  amount: number;
  amount_approved: string | null;
  amount_requested: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  customer_name: string; // Add customer name to the loan
  interest: number; // Add interest to the loan
  total_paid: number; // Add total paid to the loan
}

interface FormData {
  customerId: string;
  customerName: string;
  loanId: string;
  amount: string;
  paymentMethod: PaymentMethod;
  withdrawalFee?: string;
  mobileMoneyProvider?: string;
  receiptImage?: string;
}

interface Props {
  navigation?: any;
  route?: any;
}

const PAYMENT_METHODS: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: 'Cash', value: 'cash', icon: 'cash-outline' },
  { label: 'Mobile Money', value: 'mobile_money', icon: 'phone-portrait-outline' },
  { label: 'Bank Transfer', value: 'bank_transfer', icon: 'card-outline' },
];

const MOBILE_MONEY_PROVIDERS = ['M-Pesa', 'Mixx by Yas', 'Halopesa', 'Airtel Money'];

const RevenueScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    customerName: '',
    loanId: '',
    amount: '',
    paymentMethod: 'cash',
  });
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (route.params?.openForm) {
      setIsModalVisible(true);
  
      // Check if prefillData is available
      if (route.params?.prefillData) {
        const { customerId, customerName, loanId, amount, paymentMethod } = route.params.prefillData;
  
        // Set the form data with the prefill values
        setFormData({
          customerId: customerId || '',
          customerName: customerName || '',
          loanId: loanId || '',
          amount: amount || '',
          paymentMethod: paymentMethod || 'cash',
        });
  
        // Fetch loans for the pre-selected customer
        if (customerId) {
          fetchCustomerLoans(customerId);
        }
      }
    }
  }, [route.params?.openForm, route.params?.prefillData]);

  const fetchCollections = async (showLoading = true) => {
    if (!token) return;

    try {
      if (showLoading) setIsLoading(true);
      const data = await getCollections(token);
      setCollections(data.results || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      Alert.alert('Error', 'Failed to load collections. Pull down to refresh.');
      setCollections([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      const response = await getCustomers(token);
      setCustomers(response.results || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    }
  };

  const fetchCustomerLoans = async (customerId: string) => {
    if (!token || !customerId) return;
    try {
      const response = await getCustomerLoans(customerId, token);
      setLoans(response.results || []);
    } catch (error) {
      console.error('Failed to fetch customer loans:', error);
      Alert.alert('Error', 'Failed to load customer loans');
    }
  };

  const fetchAllActiveLoans = async () => {
  if (!token) return;
  try {
    const response = await getLoanApplications(token, { status: 'APPROVED' });
    setLoans(response.results || []);
  } catch (error) {
    console.error('Failed to fetch loans:', error);
    Alert.alert('Error', 'Failed to load loan data');
  }
};
  useEffect(() => {
    if (token) {
      fetchCollections();
      fetchCustomers();
      fetchAllActiveLoans();
    }
  }, [token]);

  useEffect(() => {
    if (formData.customerId) {
      fetchCustomerLoans(formData.customerId);
    }
  }, [formData.customerId]);

  const sendRepaymentSMS = async (phoneNumber: string, message: string) => {
    try {
      // Check if the device supports sending SMS
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'SMS is not available on this device.');
        return;
      }

      // do not open SMS app
      
      // Send the SMS
      const { result } = await SMS.sendSMSAsync([phoneNumber], message);
  
      // Handle the result
      if (result === 'sent') {
        Alert.alert('Success', 'SMS sent successfully.');
      } else {
        Alert.alert('Error', 'SMS was not sent.');
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      Alert.alert('Error', 'Failed to send SMS.');
    }
  };
  
  // Modify the handleSubmit function to send an SMS after recording a repayment
const handleSubmit = async () => {
  if (!token) {
    Alert.alert('Error', 'Please log in to add collections');
    return;
  }

  if (!formData.customerId || !formData.loanId || !formData.amount) {
    Alert.alert('Error', 'Please fill in all required fields');
    return;
  }

  if (formData.paymentMethod !== 'cash' && !formData.withdrawalFee) {
    Alert.alert('Error', 'Please enter withdrawal fee');
    return;
  }

  // Prepare the data to match the backend's expected format
  const newCollection = {
    amount_paid: parseFloat(formData.amount),
    payment_date: new Date().toISOString().split('T')[0],
    loan_application: parseInt(formData.loanId, 10),
    payment_method: formData.paymentMethod === 'mobile_money' ? formData.mobileMoneyProvider : formData.paymentMethod,
    withdrawal_fees: formData.withdrawalFee ? parseFloat(formData.withdrawalFee) : 0.0,
    mobile_money_provider: formData.mobileMoneyProvider,
    receipt_image: formData.receiptImage,
  };

  try {
    // Submit the form data to the backend
    await addCollection(newCollection, token);

    // Generate and share the PDF receipt
    await generateReceiptPDF({
      customerName: formData.customerName,
      amountPaid: formData.amount,
      withdrawalFees: formData.withdrawalFee || '0.00',
      paymentMethod: formData.paymentMethod === 'mobile_money' ? formData.mobileMoneyProvider : formData.paymentMethod,
      paymentDate: new Date().toLocaleDateString(),
    });

    // Send an SMS to the customer
    const customer = customers.find(c => c.id.toString() === formData.customerId);
    if (customer && customer.phone) {
      const message = `Dear ${customer.full_name}, your repayment of TZS ${formData.amount} has been recorded. Thank you!`;
      await sendRepaymentSMS(customer.phone, message);
    }

    // Reset the form and close the modal
    setIsModalVisible(false);
    setFormData({
      customerId: '',
      customerName: '',
      loanId: '',
      amount: '',
      paymentMethod: 'cash',
    });

    // Refresh the collections list
    fetchCollections();
  } catch (error) {
    console.error('Failed to add collection:', error);
    Alert.alert('Error', 'Failed to add collection. Please try again.');
  }
};

  const getStatusIcon = (date: string) => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const collectionDate = new Date(date);

    if (collectionDate > twentyFourHoursAgo) {
      return <Ionicons name="time" size={20} color="#FF9500" />;
    }
    return <Ionicons name="checkmark-circle" size={20} color="#34C759" />;
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    const icon = PAYMENT_METHODS.find(m => m.value === method)?.icon || 'cash-outline';
    return <Ionicons name={icon as any} size={20} color="#666666" />;
  };

  const getTotalCollections = (): number => {
    if (!Array.isArray(collections)) {
      console.error("collections is not an array", collections);
      return 0;
    }
    return collections.reduce(
      (sum, collection) => sum + parseFloat(collection.amount_paid),
      0
    );
  };

  const getTodayCollections = (): number => {
    const today = new Date().toISOString().split('T')[0];
    return collections
      .filter(collection => collection.payment_date === today)
      .reduce((sum, collection) => sum + parseFloat(collection.amount_paid), 0);
  };

  const getPendingAmount = (): number => {
    return loans
      .filter(loan => loan.status === 'APPROVED') // Only count active loans
      .reduce((sum, loan) => {
        if (!loan.amount_approved) return sum;
        
        const approvedAmount = parseFloat(loan.amount_approved);
        const interest = loan.interest || 0;
        const totalPaid = loan.total_paid || 0;
        
        if (isNaN(approvedAmount)) return sum;
        
        const totalDue = +approvedAmount + +interest;
        const remaining = totalDue - +totalPaid;
        return sum + (remaining > 0 ? remaining : 0);
      }, 0);
  };

  const pickReceiptImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You've refused to allow this app to access your camera. Please enable camera access in your settings."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({ ...formData, receiptImage: result.assets[0].uri });
    }
  };

  const renderForm = () => {
    const isFormDisabled = formData.customerId && loans.length === 0;

    return (
      <ScrollView style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Customer</Text>
          <View style={styles.pickerContainer}>
          <Picker
  selectedValue={formData.customerId}
  style={styles.picker}
  onValueChange={(itemValue, itemIndex) => {
    const customer = customers.find(c => c.id.toString() === itemValue);
    setFormData({
      ...formData,
      customerId: itemValue,
      customerName: customer?.full_name || '',
      loanId: '',
    });
  }}
>
  <Picker.Item label="Select a customer" value="" />
  {customers.map(customer => (
    <Picker.Item
      key={customer.id.toString()}
      label={`${customer.full_name}`}
      value={customer.id.toString()}
    />
  ))}
</Picker>
          </View>
        </View>

        {formData.customerId && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loan</Text>
            {loans.length > 0 ? (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.loanId}
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    setFormData({ ...formData, loanId: itemValue })
                  }
                >
                  <Picker.Item label="Select a loan" value="" />
                  {loans.map(loan => (
                    <Picker.Item
                      key={loan.id}
                      label={`Loan No: ${loan.id} (${loan.amount_approved 
                        ? `Approved: ${parseFloat(loan.amount_approved).toLocaleString()} Tsh` 
                        : `Requested: ${parseFloat(loan.amount_requested).toFixed(2)} Tsh`})`}
                      value={loan.id}
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text style={styles.noLoansText}>No Active Loans</Text>
            )}
          </View>
        )}

        {formData.loanId && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="Enter amount"
              keyboardType="numeric"
              editable={!isFormDisabled}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Payment Method</Text>
          <View style={styles.paymentMethodsContainer}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.paymentMethodButton,
                  formData.paymentMethod === method.value && styles.paymentMethodButtonActive,
                  isFormDisabled && styles.disabledButton,
                ]}
                onPress={() => !isFormDisabled && setFormData({ ...formData, paymentMethod: method.value })}
                disabled={isFormDisabled || false}
              >
                <Ionicons 
                  name={method.icon as any} 
                  size={20} 
                  color={formData.paymentMethod === method.value ? '#FFFFFF' : '#666666'} 
                />
                <Text style={[
                  styles.paymentMethodButtonText,
                  formData.paymentMethod === method.value && styles.paymentMethodButtonTextActive,
                ]}>
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {formData.paymentMethod === 'mobile_money' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Money Provider</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.mobileMoneyProvider}
                style={styles.picker}
                onValueChange={(itemValue) =>
                  setFormData({ ...formData, mobileMoneyProvider: itemValue })
                }
                enabled={!isFormDisabled}
              >
                <Picker.Item label="Select a provider" value="" />
                {MOBILE_MONEY_PROVIDERS.map(provider => (
                  <Picker.Item
                    key={provider}
                    label={provider}
                    value={provider}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {formData.paymentMethod !== 'cash' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Withdrawal Fee</Text>
            <TextInput
              style={styles.input}
              value={formData.withdrawalFee}
              onChangeText={(text) => setFormData({ ...formData, withdrawalFee: text })}
              placeholder="Enter withdrawal fee"
              keyboardType="numeric"
              editable={!isFormDisabled}
            />
          </View>
        )}

        {formData.paymentMethod === 'bank_transfer' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Receipt</Text>
            <TouchableOpacity 
              onPress={pickReceiptImage} 
              style={[styles.receiptButton, isFormDisabled && styles.disabledButton]}
              disabled={isFormDisabled || false}
            >
              <Text style={styles.receiptButtonText}>Take Photo of Receipt</Text>
            </TouchableOpacity>
            {formData.receiptImage && (
              <Image source={{ uri: formData.receiptImage }} style={styles.receiptImage} />
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => navigation?.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collections</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Collections</Text>
            <Text style={styles.statAmount}>{getTotalCollections().toLocaleString()} Tsh</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Today's Collections</Text>
            <Text style={styles.statAmount}>{getTodayCollections().toLocaleString()} Tsh</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pending Amount</Text>
            <Text style={styles.statAmount}>{getPendingAmount().toLocaleString()} Tsh</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => fetchCollections(true)}
          />
        }
      >
        {collections.map(collection => (
          <TouchableOpacity 
            key={collection.id} 
            style={styles.collectionItem}
            onPress={() => {/* Handle collection details */}}
          >
            <View style={styles.collectionMain}>
              <View style={styles.collectionHeader}>
                <Text style={styles.clientName}>{collection.customer_name}</Text>
                {getStatusIcon(collection.created_at)}
              </View>
              
              <Text style={styles.loanId}>
                Payment Date: {new Date(collection.payment_date).toLocaleDateString()}
              </Text>
              
              <View style={styles.collectionFooter}>
                <Text style={styles.date}>
                  {new Date(collection.payment_date).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <View style={styles.paymentMethod}>
                  {getPaymentMethodIcon(collection.payment_method)}
                  <Text style={styles.paymentMethodText}>
                  {collection.payment_method === 'mobile_money' 
                      ? 'Mobile Money'
                      : collection.payment_method.charAt(0).toUpperCase() + 
                        collection.payment_method.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.amount}>
              {parseFloat(collection.amount_paid).toLocaleString()} Tsh
              {collection.withdrawal_fees !== "0.00" && (
                <Text style={styles.withdrawalFee}>
                  {`\n(+${parseFloat(collection.withdrawal_fees).toLocaleString()} fee)`}
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.addButton, { bottom: insets.bottom + 16 }]} 
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Collection</Text>
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            {renderForm()}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.cancelButton, isFormDisabled && styles.disabledButton]}
                onPress={() => setIsModalVisible(false)}
                disabled={isFormDisabled}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, isFormDisabled && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isFormDisabled}
              >
                <Text style={styles.submitButtonText}>Record Collection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  content: {
    flex: 1,
    padding: 8,
  },
  collectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  collectionMain: {
    flex: 1,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  loanId: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
    alignSelf: 'center',
  },
  withdrawalFee: {
    fontSize: 12,
    color: '#FF9500',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    bottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212529',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
    flex: 1,
    minWidth: '30%',
  },
  paymentMethodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  paymentMethodButtonText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  paymentMethodButtonTextActive: {
    color: '#FFFFFF',
  },
  receiptButton: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  receiptImage: {
    width: 100,
    height: 100,
    marginTop: 8,
    borderRadius: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#E9ECEF',
    opacity: 0.6,
  },
  noLoansText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    padding: 12,
  },
});

export default RevenueScreen;