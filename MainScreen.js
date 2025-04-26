import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { View, Text } from 'react-native';
import { useContext } from 'react';
import { DataContext } from './DataContext'; // DataContext'i içe aktarın

const MainScreen = () => {
  const { setAnalizData, setHistoryData } = useContext(DataContext); // DataContext'ten fonksiyonları al

  const fetchRsiData = async () => {
    try {
      const response = await axios.get('https://rsi-sven.onrender.com/get-rsi-data');
      const data = response.data;
      console.log(data); // Verilerin doğru bir şekilde alınıp alınmadığını kontrol edin

      // Context'e analiz_data ve history_data'yı kaydet
      setAnalizData(data.analiz_data || []);
      setHistoryData(data.history_data || []);
    } catch (error) {
      console.error("Error fetching RSI data: ", error);
    }
  };

  useEffect(() => {
    fetchRsiData();
  }, []);

  return (
    <View>
      <Text>Main Screen Content</Text> {/* Örnek içerik */}
    </View>
  );
};

export default MainScreen; 