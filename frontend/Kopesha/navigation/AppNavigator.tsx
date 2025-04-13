import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import ClientsScreen from '../screens/ClientsScreen';
import LoansScreen from '../screens/LoansScreen';
import ExpenseTrackerScreen from '../screens/ExpenseTrackerScreen';
import RevenueScreen from '../screens/RevenueScreen';
import LoanSummaryScreen from '../screens/LoanSummaryScreen';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the parameter list for the stack navigator
export type RootStackParamList = {
  TabNavigator: undefined;
  Clients: undefined;
  ExpenseTracker: undefined;
  Loans: undefined;
  Revenue: undefined;
  LoanSummary: { 
    loanId: number; 
    clientName: string; 
    loanAmount: number 
  };
};


const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TabNavigator" component={TabNavigator} />
    <Stack.Screen name="Clients" component={ClientsScreen} />
    <Stack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} />
    <Stack.Screen name="Loans" component={LoansScreen} />
    <Stack.Screen name="Revenue" component={RevenueScreen} />
    <Stack.Screen name="LoanSummary" component={LoanSummaryScreen} />
  </Stack.Navigator>
);

export default AppNavigator;