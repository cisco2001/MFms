import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import ClientsScreen from '../screens/ClientsScreen';
import LoansScreen from '../screens/LoansScreen';
import ExpenseTrackerScreen from '../screens/ExpenseTrackerScreen';
import RevenueScreen from '../screens/RevenueScreen';
const Stack = createStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TabNavigator" component={TabNavigator} />
    <Stack.Screen name="Clients" component={ClientsScreen} />
    <Stack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} />
    <Stack.Screen name="Loans" component={LoansScreen} />
    <Stack.Screen name="Revenue" component={RevenueScreen} />
  </Stack.Navigator>
);

export default AppNavigator;