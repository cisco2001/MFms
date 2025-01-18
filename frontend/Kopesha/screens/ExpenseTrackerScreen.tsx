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

type Category = 'all' | 'food' | 'transport';

interface Expense {
  id: string;
  amount: number;
  date: string;
  category: Omit<Category, 'all'>;
}

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'All', value: 'all' },
  { label: 'Food', value: 'food' },
  { label: 'Transport', value: 'transport' },
];

const ExpenseTrackerScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  const getFilteredExpenses = (): Expense[] => {
    return selectedCategory === 'all'
      ? expenses
      : expenses.filter(expense => expense.category === selectedCategory);
  };

  const addExpense = (): void => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: 0, // This would be set from a modal
      date: new Date().toISOString(),
      category: 'food',
    };
    setExpenses([newExpense, ...expenses]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Category Filter Bar */}
      <View style={styles.filterContainer}>
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
      </View>

      {/* Expense List */}
      <ScrollView style={styles.content}>
        {getFilteredExpenses().map(expense => (
          <View key={expense.id} style={styles.expenseItem}>
            <View>
              <Text style={styles.expenseDate}>
                {new Date(expense.date).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short'
                })}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              ${expense.amount.toFixed(2)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Add Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={addExpense}>
          <Text style={styles.addButtonText}>+ Add expense</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
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
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  expenseDate: {
    fontSize: 14,
    color: '#666666',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExpenseTrackerScreen;