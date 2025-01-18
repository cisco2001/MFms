import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ClientsScreen from '../screens/ClientsScreen';
import LoansScreen from '../screens/LoansScreen';
import ExpenseTrackerScreen from '../screens/ExpenseTrackerScreen';

// Define types for our navigation
export type RootStackParamList = {
  TabNavigator: undefined;
  Clients: undefined;
  ExpenseTracker: undefined;
  Revenue: undefined;
  Loans: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: 60,
          paddingVertical: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather
              name="home"
              size={24}
              color={focused ? "#1D4ED8" : "#6B7280"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{
              fontSize: 12,
              color: focused ? "#1D4ED8" : "#6B7280",
              fontWeight: focused ? 'bold' : 'normal',
            }}>
              Home
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

SplashScreen.preventAutoHideAsync();

const App = () => {
  useEffect(() => {
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 5000);
  }, []);

  return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="TabNavigator" component={TabNavigator} />
        <Stack.Screen name="Clients" component={ClientsScreen} />
        <Stack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} />
        <Stack.Screen name="Loans" component={LoansScreen} />
      </Stack.Navigator>
  );
};

export default App;