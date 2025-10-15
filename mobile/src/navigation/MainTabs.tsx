import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import CreateScreen from '../screens/create/CreateScreen';
import CartScreen from '../screens/cart/CartScreen';
import AccountScreen from '../screens/account/AccountScreen';
import { COLORS } from '../constants/colors';

export type MainTabsParamList = {
  Home: undefined;
  Create: undefined;
  Cart: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreateScreen}
        options={{ title: 'Create' }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ title: 'Cart' }}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountScreen}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
