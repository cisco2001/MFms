import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

type Category = 'all' | 'fuel' | 'meals' | 'transport' | 'client_visit' | 'office_supplies';

interface Expense {
  id: string;
  amount: number;
  date: string;
  category: Omit<Category, 'all'>;
  notes: string;
  location: string;
}

interface Props {
  navigation?: any; // For handling navigation
}

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'All', value: 'all' },
  { label: 'Fuel', value: 'fuel' },
  { label: 'Meals', value: 'meals' },
  { label: 'Transport', value: 'transport' },
  { label: 'Client Visit', value: 'client_visit' },
  { label: 'Office Supplies', value: 'office_supplies' },
];

const ExpenseTrackerScreen: React.FC<Props> = ({ navigation }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  const getFilteredExpenses = (): Expense[] => {
    return selectedCategory === 'all'
      ? expenses
      : expenses.filter(expense => expense.category === selectedCategory);
  };

  const getTotalAmount = (): number => {
    return getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0);
  };

  const addExpense = (): void => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: 0,
      date: new Date().toISOString(),
      category: 'fuel',
      notes: '',
      location: '',
    };
    setExpenses([newExpense, ...expenses]);
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
          <Text style={styles.headerTitle}>Field Expenses</Text>
        </View>
        <Text style={styles.totalText}>
          Total: <Text style={styles.totalAmount}>${getTotalAmount().toFixed(2)}</Text>
        </Text>
      </View>

      {/* Category Filter Bar */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.filterButton,
              selectedCategory === category.value && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === category.value && styles.filterButtonTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Expense List */}
      <ScrollView style={styles.content}>
        {getFilteredExpenses().map(expense => (
          <TouchableOpacity key={expense.id} style={styles.expenseItem}>
            <View style={styles.expenseMain}>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseDate}>
                  {new Date(expense.date).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit'
                  })}
                </Text>
                <Text style={styles.expenseCategory}>
                  {expense.category.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Text>
              </View>
              {expense.notes && (
                <Text style={styles.expenseNotes} numberOfLines={2}>
                  {expense.notes}
                </Text>
              )}
              {expense.location && (
                <Text style={styles.expenseLocation}>📍 {expense.location}</Text>
              )}
            </View>
            <Text style={styles.expenseAmount}>
              ${expense.amount.toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={addExpense}
      >
        <Text style={styles.addButtonText}>Record Expense</Text>
      </TouchableOpacity>
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
  filterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#495057',
  },
  filterButtonTextActive: {
    color: '#ffffff',
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
  expenseCategory: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E7F2FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  expenseNotes: {
    fontSize: 14,
    color: '#212529',
    marginTop: 4,
  },
  expenseLocation: {
    fontSize: 12,
    color: '#6C757D',
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
    bottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ExpenseTrackerScreen;