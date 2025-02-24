import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();

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

export default TabNavigator;