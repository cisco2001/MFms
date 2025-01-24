import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

type PaymentMethod = 'cash' | 'mobile_money' | 'bank_transfer';

interface Collection {
  id: string;
  amount: number;
  date: string;
  clientName: string;
  loanId: string;
  paymentMethod: PaymentMethod;
  status: 'completed' | 'pending' | 'failed';
}

interface Props {
  navigation?: any;
}

const PAYMENT_METHODS: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: 'Cash', value: 'cash', icon: 'cash-outline' },
  { label: 'Mobile Money', value: 'mobile_money', icon: 'phone-portrait-outline' },
  { label: 'Bank Transfer', value: 'bank_transfer', icon: 'card-outline' },
];

const RevenueScreen: React.FC<Props> = ({ navigation }) => {
  const [collections, setCollections] = useState<Collection[]>([
    {
      id: '1',
      amount: 500,
      date: new Date().toISOString(),
      clientName: 'John Doe',
      loanId: 'L123456',
      paymentMethod: 'cash',
      status: 'completed',
    },
    {
      id: '2',
      amount: 750,
      date: new Date().toISOString(),
      clientName: 'Jane Smith',
      loanId: 'L123457',
      paymentMethod: 'mobile_money',
      status: 'completed',
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    loanId: '',
    amount: '',
    paymentMethod: 'cash' as PaymentMethod,
  });

  const getTotalCollections = (): number => {
    return collections.reduce((sum, collection) => 
      collection.status === 'completed' ? sum + collection.amount : sum, 0
    );
  };

  const getStatusIcon = (status: Collection['status']) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={20} color="#34C759" />;
      case 'pending':
        return <Ionicons name="time" size={20} color="#FF9500" />;
      case 'failed':
        return <Ionicons name="close-circle" size={20} color="#FF3B30" />;
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    const icon = PAYMENT_METHODS.find(m => m.value === method)?.icon || 'cash-outline';
    return <Ionicons name={icon as any} size={20} color="#666666" />;
  };

  const handleSubmit = () => {
    if (!formData.clientName || !formData.loanId || !formData.amount) return;

    const newCollection: Collection = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount),
      date: new Date().toISOString(),
      clientName: formData.clientName,
      loanId: formData.loanId,
      paymentMethod: formData.paymentMethod,
      status: 'completed',
    };

    setCollections([newCollection, ...collections]);
    setIsModalVisible(false);
    setFormData({
      clientName: '',
      loanId: '',
      amount: '',
      paymentMethod: 'cash',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Header with Back Button */}
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
            <Text style={styles.statLabel}>Today's Collections</Text>
            <Text style={styles.statAmount}>${getTotalCollections().toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statCount}>{collections.filter(c => c.status === 'pending').length}</Text>
          </View>
        </View>
      </View>

      {/* Collections List */}
      <ScrollView style={styles.content}>
        {collections.map(collection => (
          <TouchableOpacity 
            key={collection.id} 
            style={styles.collectionItem}
            onPress={() => {/* Handle collection details */}}
          >
            <View style={styles.collectionMain}>
              <View style={styles.collectionHeader}>
                <Text style={styles.clientName}>{collection.clientName}</Text>
                {getStatusIcon(collection.status)}
              </View>
              
              <Text style={styles.loanId}>Loan ID: {collection.loanId}</Text>
              
              <View style={styles.collectionFooter}>
                <Text style={styles.date}>
                  {new Date(collection.date).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <View style={styles.paymentMethod}>
                  {getPaymentMethodIcon(collection.paymentMethod)}
                  <Text style={styles.paymentMethodText}>
                    {collection.paymentMethod.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.amount}>${collection.amount.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Record Collection Button */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Record Collection</Text>
      </TouchableOpacity>

      {/* Collection Form Modal */}
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

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Client Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.clientName}
                  onChangeText={(text) => setFormData({...formData, clientName: text})}
                  placeholder="Enter client name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Loan ID</Text>
                <TextInput
                  style={styles.input}
                  value={formData.loanId}
                  onChangeText={(text) => setFormData({...formData, loanId: text})}
                  placeholder="Enter loan ID"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({...formData, amount: text})}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <View style={styles.paymentMethodsContainer}>
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      style={[
                        styles.paymentMethodButton,
                        formData.paymentMethod === method.value && styles.paymentMethodButtonActive
                      ]}
                      onPress={() => setFormData({...formData, paymentMethod: method.value})}
                    >
                      <Ionicons 
                        name={method.icon as any} 
                        size={20} 
                        color={formData.paymentMethod === method.value ? '#FFFFFF' : '#666666'} 
                      />
                      <Text style={[
                        styles.paymentMethodButtonText,
                        formData.paymentMethod === method.value && styles.paymentMethodButtonTextActive
                      ]}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
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
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statCount: {
    fontSize: 24,
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
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    padding: 8,
  },
  formContainer: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#E9ECEF',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F8F9FA',
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginHorizontal: 4,
  },
  paymentMethodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  paymentMethodButtonText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666666',
  },
  paymentMethodButtonTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default RevenueScreen;