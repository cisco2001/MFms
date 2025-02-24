import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Alert,
    RefreshControl,
    Animated,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getExpenses, addExpense } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    GestureHandlerRootView,
    PanGestureHandler,
    PanGestureHandlerGestureEvent,
    State,
} from 'react-native-gesture-handler';

interface Props {
    navigation?: any;
}

interface Expense {
    id: number;
    amount: string;
    date: string;
    description: string;
    expense_type: 'personal' | 'institution';
    created_at: string;
    updated_at: string;
    user: number;
}

interface ExpenseResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Expense[];
}

interface ExpenseFormData {
    amount: string;
    description: string;
    expense_type: 'personal' | 'institution';
    date: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PULL_THRESHOLD = 100;

const ExpenseTrackerScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpenseFormVisible, setIsExpenseFormVisible] = useState(false);
    const [formData, setFormData] = useState<ExpenseFormData>({
        amount: '',
        description: '',
        expense_type: 'personal',
        date: new Date().toISOString().split('T')[0],
    });
    const { token } = useAuth();

    // Animation values
    const translateY = useRef(new Animated.Value(0)).current;
    const modalOpacity = useRef(new Animated.Value(1)).current;

    const fetchExpenses = async (showLoading = true) => {
        if (!token) return;
        
        try {
            if (showLoading) setIsLoading(true);
            const response = await getExpenses(token);
            const data: ExpenseResponse = typeof response === 'string' ? JSON.parse(response) : response;
            setExpenses(data.results || []);
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
            Alert.alert('Error', 'Failed to load expenses. Pull down to refresh.');
            setExpenses([]);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchExpenses();
        }
    }, [token]);

    const handleSubmitExpense = async () => {
        if (!token) {
            Alert.alert('Error', 'Please log in to add expenses');
            return;
        }
        
        if (!formData.amount || !formData.description) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const newExpense = {
            ...formData,
            amount: parseFloat(formData.amount).toFixed(2),
        };
        
        try {
            await addExpense(newExpense, token);
            setIsExpenseFormVisible(false);
            setFormData({
                amount: '',
                description: '',
                expense_type: 'personal',
                date: new Date().toISOString().split('T')[0],
            });
            fetchExpenses();
        } catch (error) {
            console.error('Failed to add expense:', error);
            Alert.alert('Error', 'Failed to add expense. Please try again.');
        }
    };

    const getTotalAmount = (): number => {
        return expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
        });
    };

    const onGestureEvent = Animated.event<PanGestureHandlerGestureEvent>(
        [{ nativeEvent: { translationY: translateY } }],
        { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
      if (event.nativeEvent.state === State.END) {  // Changed from oldState === 4 to state === State.END
          if (event.nativeEvent.translationY > PULL_THRESHOLD) {
              Animated.parallel([
                  Animated.timing(translateY, {
                      toValue: SCREEN_HEIGHT,
                      duration: 200,
                      useNativeDriver: true,
                  }),
                  Animated.timing(modalOpacity, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                  }),
              ]).start(() => {
                  translateY.setValue(0);
                  modalOpacity.setValue(1);
                  setIsExpenseFormVisible(false);
              });
          } else {
              Animated.spring(translateY, {
                  toValue: 0,
                  useNativeDriver: true,
              }).start();
          }
      }
  };

  const renderExpenseForm = () => {
    if (!isExpenseFormVisible) return null;

    return (
        <GestureHandlerRootView style={StyleSheet.absoluteFill}>
            <Animated.View 
                style={[
                    styles.modalOverlay,
                    {
                        opacity: modalOpacity,
                    }
                ]}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[styles.modalContainer, { paddingBottom: insets.bottom }]}
                >
                    <Animated.View 
                        style={[
                            styles.modalContent,
                            {
                                transform: [{
                                    translateY: translateY.interpolate({
                                        inputRange: [0, SCREEN_HEIGHT],
                                        outputRange: [0, SCREEN_HEIGHT],
                                        extrapolate: 'clamp',
                                    })
                                }]
                            }
                        ]}
                    >
                        <PanGestureHandler
                            onGestureEvent={onGestureEvent}
                            onHandlerStateChange={onHandlerStateChange}
                        >
                            <Animated.View>
                                <View style={styles.pullIndicator} />
                                
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Record Expense</Text>
                                    <TouchableOpacity 
                                        onPress={() => setIsExpenseFormVisible(false)}
                                        style={styles.closeButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="close" size={24} color="#000" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.formContainer} bounces={false}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Amount (Required)</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="decimal-pad"
                                            value={formData.amount}
                                            onChangeText={(text) => setFormData({ ...formData, amount: text })}
                                            placeholder="Enter amount"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Description (Required)</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            multiline
                                            numberOfLines={3}
                                            value={formData.description}
                                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                                            placeholder="Enter description"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Expense Type</Text>
                                        <View style={styles.typeContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.typeButton,
                                                    formData.expense_type === 'personal' && styles.typeButtonActive
                                                ]}
                                                onPress={() => setFormData({ ...formData, expense_type: 'personal' })}
                                            >
                                                <Text style={[
                                                    styles.typeButtonText,
                                                    formData.expense_type === 'personal' && styles.typeButtonTextActive
                                                ]}>Personal</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.typeButton,
                                                    formData.expense_type === 'institution' && styles.typeButtonActive
                                                ]}
                                                onPress={() => setFormData({ ...formData, expense_type: 'institution' })}
                                            >
                                                <Text style={[
                                                    styles.typeButtonText,
                                                    formData.expense_type === 'institution' && styles.typeButtonTextActive
                                                ]}>Institution</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={[styles.button, styles.cancelButton]}
                                            onPress={() => setIsExpenseFormVisible(false)}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.button, styles.submitButton]}
                                            onPress={handleSubmitExpense}
                                        >
                                            <Text style={styles.submitButtonText}>Save Expense</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </Animated.View>
                        </PanGestureHandler>
                    </Animated.View>
                </KeyboardAvoidingView>
            </Animated.View>
        </GestureHandlerRootView>
    );
};

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="auto" />
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        onPress={() => navigation?.goBack()} 
                        style={styles.backButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Field Expenses</Text>
                </View>
                <Text style={styles.totalText}>
                Total: <Text style={styles.totalAmount}>Tsh {getTotalAmount().toLocaleString('en-US')}</Text>
                </Text>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={() => fetchExpenses(true)}
                    />
                }
            >
                {expenses.map(expense => (
                    <TouchableOpacity 
                        key={expense.id} 
                        style={styles.expenseItem}
                        activeOpacity={0.7}
                    >
                        <View style={styles.expenseMain}>
                            <View style={styles.expenseHeader}>
                                <Text style={styles.expenseDate}>
                                    {formatDate(expense.date)}
                                </Text>
                                <Text style={[
                                    styles.expenseType,
                                    expense.expense_type === 'personal' ? styles.personalType : styles.institutionType
                                ]}>
                                    {expense.expense_type === 'personal' ? 'Personal' : 'Institution'}
                                </Text>
                            </View>
                            <Text style={styles.expenseDescription}>{expense.description}</Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                            Tsh {parseFloat(expense.amount).toLocaleString('en-US')}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity 
                style={[styles.addButton, { bottom: insets.bottom + 16 }]}
                onPress={() => setIsExpenseFormVisible(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.addButtonText}>Record Expense</Text>
            </TouchableOpacity>

            {renderExpenseForm()}
        </View>
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
        marginBottom: 8,
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
    totalText: {
        fontSize: 16,
        color: '#495057',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    content: {
        flex: 1,
    },
    expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#ffffff',
        marginBottom: 1,
    },
    expenseMain: {
        flex: 1,
        marginRight: 16,
    },
    expenseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    expenseDate: {
        fontSize: 14,
        color: '#495057',
    },
    expenseType: {
        fontSize: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    personalType: {
        backgroundColor: '#E7F2FF',
        color: '#007AFF',
    },
    institutionType: {
        backgroundColor: '#E9ECEF',
        color: '#495057',
    },
    expenseDescription: {
        fontSize: 14,
        color: '#212529',
        marginTop: 4,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
    },
    addButton: {
        position: 'absolute',
        right: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        backgroundColor: '#007AFF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'transparent',
  },
  modalContent: {
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
  },
  pullIndicator: {
      width: 40,
      height: 4,
      backgroundColor: '#CED4DA',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
  },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    formContainer: {
        maxHeight: '100%',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#212529',
    },
    input: {
        borderWidth: 1,
        borderColor: '#CED4DA',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#ffffff',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CED4DA',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    typeButtonText: {
        fontSize: 16,
        color: '#212529',
    },
    typeButtonTextActive: {
      color: '#ffffff',
  },
  buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      marginBottom: 20,
  },
  button: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
  },
  cancelButton: {
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#CED4DA',
  },
  submitButton: {
      backgroundColor: '#007AFF',
  },
  cancelButtonText: {
      fontSize: 16,
      color: '#212529',
  },
  submitButtonText: {
      fontSize: 16,
      color: '#ffffff',
      fontWeight: '600',
  },
});

export default ExpenseTrackerScreen;