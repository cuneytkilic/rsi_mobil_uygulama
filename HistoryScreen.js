import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, Pressable } from 'react-native';
import { DataContext } from './DataContext'; // Yeni eklenen import
import I18n from "./translations";

const HistoryScreen = () => {
  const { historyData } = useContext(DataContext); // Context'ten historyData'yı al

  const [sortedData, setSortedData] = useState([]);

  useEffect(() => {
    if (!historyData) return;

    const sorted = [...historyData].sort((a, b) => {
      const aDateTime = a.exit_date_time
        ? new Date(a.exit_date_time.seconds * 1000 + a.exit_date_time.nanoseconds / 1000000)
        : new Date(a.exit_date); // exit_date_time yoksa exit_date kullan
      const bDateTime = b.exit_date_time
        ? new Date(b.exit_date_time.seconds * 1000 + b.exit_date_time.nanoseconds / 1000000)
        : new Date(b.exit_date); // exit_date_time yoksa exit_date kullan

      // exit_date_time olmayanları en alta yerleştir
      if (a.exit_date_time === undefined && b.exit_date_time === undefined) return 0; // İkisi de yoksa eşit
      if (a.exit_date_time === undefined) return 1; // a yoksa b'nin altında
      if (b.exit_date_time === undefined) return -1; // b yoksa a'nın üstünde

      return bDateTime - aDateTime; // En son gelen veri en üstte olacak şekilde sıralama
    });

    setSortedData(sorted); // Güncellenmiş veriyi set et
  }, [historyData]); // historyData değiştiğinde çalışır

  const [positiveSum, setPositiveSum] = useState(0);
  const [negativeSum, setNegativeSum] = useState(0);
  const [positiveCount, setPositiveCount] = useState(0);
  const [negativeCount, setNegativeCount] = useState(0);

  useEffect(() => {

    const positiveTrades = sortedData.filter(item => item.result_degisim > 0);
    const negativeTrades = sortedData.filter(item => item.result_degisim < 0);


    const posSum = sortedData
      .filter(item => item.result_degisim > 0)
      .reduce((sum, item) => sum + item.result_degisim, 0);

    const negSum = sortedData
      .filter(item => item.result_degisim < 0)
      .reduce((sum, item) => sum + item.result_degisim, 0);

    setPositiveSum(posSum);
    setNegativeSum(negSum);
    setPositiveCount(positiveTrades.length);
    setNegativeCount(negativeTrades.length);

  }, [sortedData]);


  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const sortByColumn = (column) => {
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
    const sorted = [...sortedData].sort((a, b) => {
      if (a[column] < b[column]) return newOrder === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return newOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setSortedData(sorted);
    setSortColumn(column);
    setSortOrder(newOrder);
  };

  const renderItem = ({ item }) => {
    const backgroundColor = item.result_degisim < 0 ? '#ffcccc' : '#ccffcc';

    return (
      <TouchableOpacity
        style={[styles.tableRow, { backgroundColor }]}
        onPress={() => {
          setSelectedItem(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.tableCell}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text>{item.exit_date}</Text>
            <Text>{item.exit_time}</Text>
          </View>
        </Text>

        <Text style={styles.tableCell}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text>{item.signal_date}</Text>
            <Text>{item.signal_time}</Text>
          </View>
        </Text>

        <Text style={styles.tableCell}>{item.coin_name.slice(0, -4)}</Text>
        <Text style={styles.tableCell}>{item.result_degisim}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{I18n.t('signalHistory')}</Text>
        <View style={styles.headerStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Karlı İşlem:</Text>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{positiveCount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} (+{positiveSum.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}%)</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Zararlı İşlem:</Text>
            <Text style={[styles.statValue, { color: '#F44336' }]}>{negativeCount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ({negativeSum.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}%)</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sortedData}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('exit_date')}>
              <Text style={styles.headerText}>Exit Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('signal_date')}>
              <Text style={styles.headerText}>Signal Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('coin_name')}>
              <Text style={styles.headerText}>Coin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('result_degisim')}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.headerText}>Result</Text>
                <Text style={styles.headerText}>(%)</Text>
              </View>
            </TouchableOpacity>
          </View>
        }
        stickyHeaderIndices={[0]}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalContainer} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => { }}>
            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>#{selectedItem.rank} - {selectedItem.coin_name}</Text>
                <Text>Signal Date: {selectedItem.signal_date} - {selectedItem.signal_time}</Text>
                <Text>Exit Date: {selectedItem.exit_date} - {selectedItem.exit_time}</Text>
                <Text>Signal Price: {selectedItem.entryPrice}</Text>
                <Text>Exit Price: {selectedItem.exitPrice}</Text>
                <Text>Result(%): {selectedItem.result_degisim}</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 5,
    alignItems: 'center',
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 5,
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#113b4b',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#113b4b',
    borderRadius: 5,
  },

  headerTitle: {
    color: 'white',
    fontWeight: '600',
    fontSize: 20,
    flex: 1,
    textAlign: 'left',
  },

  headerStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'space-evenly',
  },

  headerStats: {
    alignItems: 'center',
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statLabel: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },

  statValue: {
    fontWeight: 'bold',
  },
});

export default HistoryScreen;
