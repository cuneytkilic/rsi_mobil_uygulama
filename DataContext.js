import React, { createContext, useState } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [analizData, setAnalizData] = useState([]);
    const [historyData, setHistoryData] = useState([]);

    return (
        <DataContext.Provider value={{ analizData, setAnalizData, historyData, setHistoryData }}>
            {children}
        </DataContext.Provider>
    );
}; 