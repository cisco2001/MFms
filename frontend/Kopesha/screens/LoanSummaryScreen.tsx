import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getLoanDetails, getLoanPayments } from '../services/api'; // Updated API calls

interface Payment {
  id: number;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
}

interface LoanDetails {
  id: number;
  amount_approved: number;
  interest: number;
  referee: {
    full_name: string;
    phone: string;
    photo: string;
  };
  collateral_photo: string;
  collateral_type: string;
  collateral_description: string;
}

type LoanSummaryScreenProps = {
  route: RouteProp<RootStackParamList, 'LoanSummary'>;
  navigation: StackNavigationProp<RootStackParamList, 'LoanSummary'>;
};

const LoanSummaryScreen: React.FC<LoanSummaryScreenProps> = ({ route, navigation }) => {
  const { loanId, clientName } = route.params;
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [loanData, paymentData] = await Promise.all([
          getLoanDetails(loanId, token),
          getLoanPayments(loanId, token), // Fetch payments for this loan
        ]);
        setLoanDetails(loanData);
        setPayments(paymentData); // paymentData should be an array

        // Calculate total amount paid
        const total = paymentData.reduce((sum: number, payment: Payment) => sum + +payment.amount_paid, 0);
        setTotalPaid(total);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loanId, token]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'dollar-sign';
      case 'mobile':
        return 'smartphone';
      case 'bank':
        return 'credit-card';
      default:
        return 'circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Calculate loan total (amount approved + interest)
  const loanTotal = loanDetails ? +loanDetails.amount_approved + +loanDetails.interest : 0;

  // Calculate remaining amount
  const remainingAmount = Math.max(0, loanTotal - totalPaid);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Repayment Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.summaryCard}>
          <Text style={styles.clientName}>{clientName}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan Amount:</Text>
            <Text style={styles.summaryValue}>TZS {loanTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid:</Text>
            <Text style={styles.summaryValue}>TZS {totalPaid.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining:</Text>
            <Text style={[
              styles.summaryValue,
              { color: remainingAmount <= 0 ? '#4CAF50' : '#FF9800' }
            ]}>
              TZS {remainingAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${Math.min((totalPaid / loanTotal) * 100, 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.min(Math.round((totalPaid / loanTotal) * 100), 100)}% Paid
            </Text>
          </View>
        </View>

        {loanDetails && (
          <>
            <Text style={styles.sectionTitle}>Referee Information</Text>
            <View style={styles.refereeCard}>
              <Image source={{ uri: loanDetails.referee.photo }} style={styles.refereePhoto} />
              <View style={styles.refereeDetails}>
                <Text style={styles.refereeName}>{loanDetails.referee.full_name}</Text>
                <Text style={styles.refereePhone}>{loanDetails.referee.phone}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Collateral Information</Text>
            <View style={styles.collateralCard}>
              {loanDetails.collateral_photo && (
                <Image source={{ uri: loanDetails.collateral_photo }} style={styles.collateralPhoto} />
              )}
              <View style={styles.collateralDetails}>
                <Text style={styles.collateralType}>{loanDetails.collateral_type}</Text>
                <Text style={styles.collateralDescription}>{loanDetails.collateral_description}</Text>
              </View>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Payment History</Text>
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="info" size={50} color="#ccc" />
            <Text style={styles.emptyStateText}>No payments recorded yet</Text>
          </View>
        ) : (
          <View style={styles.paymentList}>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentIconContainer}>
                  <Feather name={getPaymentMethodIcon(payment.payment_method)} size={24} color="#007AFF" />
                </View>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentAmount}>TZS {payment.amount_paid.toLocaleString()}</Text>
                  <Text style={styles.paymentMethod}>{payment.payment_method}</Text>
                </View>
                <Text style={styles.paymentDate}>{formatDate(payment.payment_date)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 15,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E9ECEF',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  refereeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refereePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  refereeDetails: {
    flex: 1,
  },
  refereeName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  refereePhone: {
    fontSize: 14,
    color: '#666',
  },
  collateralCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  collateralPhoto: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 16,
  },
  collateralDetails: {
    flex: 1,
  },
  collateralType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  collateralDescription: {
    fontSize: 14,
    color: '#666',
  },
  paymentList: {
    marginHorizontal: 16,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  paymentDate: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default LoanSummaryScreen;