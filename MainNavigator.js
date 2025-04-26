import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './HomeScreen';
import SecondScreen from './SecondScreen';
import HistoryScreen from './HistoryScreen';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Aktif Sinyaller" component={SecondScreen} />
      <Tab.Screen name="Sinyal Geçmişi" component={HistoryScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator; 