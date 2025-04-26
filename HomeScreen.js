import React, { useContext, useEffect } from 'react';
import { DataContext } from './DataContext';

const HomeScreen = () => {
  const { setAnalizData, setHistoryData } = useContext(DataContext);

  useEffect(() => {
    // Verileri çekme işlemi
    const fetchData = async () => {
      const analizData = await getAnalizData(); // Verileri çekme fonksiyonu
      const historyData = await getHistoryData(); // Verileri çekme fonksiyonu

      // Verileri context'e aktarma
      setAnalizData(analizData);
      setHistoryData(historyData);
    };

    fetchData();
  }, [setAnalizData, setHistoryData]);

  // ...
}; 