import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RecoverPasswordScreen from '../screens/Recover_password';
import ClientsScreen from '../screens/ClientsScreen';
import ExpenseTrackerScreen from '../screens/ExpenseTrackerScreen';
import LoansScreen from '../screens/LoansScreen';
import RevenueScreen from '../screens/RevenueScreen';
import HomeScreen from '../screens/HomeScreen';
import ClientProfileScreen from '@/screens/ClientProfile';
import NewLoanScreen from '../screens/LoansScreen';
import { NavigationContainer } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export type AppStackParamList = {
  TabNavigator: undefined;
  Clients: undefined;
  ExpenseTracker: undefined;
  Revenue: undefined;
  Loans: undefined;
  ClientProfile: { clientId: number };
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const AppStack = createStackNavigator<AppStackParamList>();

const Navigation = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or your loading component
  }

  return (
    <>
      {isAuthenticated ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="TabNavigator" component={HomeScreen} /> 
          <AppStack.Screen name="Clients" component={ClientsScreen} />
          <AppStack.Screen name="ClientProfile" component={ClientProfileScreen} />
          <AppStack.Screen name="NewLoan" component={NewLoanScreen} />
          <AppStack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} />
          <AppStack.Screen name="Loans" component={LoansScreen} />
          <AppStack.Screen name="Revenue" component={RevenueScreen} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="ForgotPassword" component={RecoverPasswordScreen} />
        </AuthStack.Navigator>
      )}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
        <Navigation />
    </AuthProvider>
  );
};

export default App;