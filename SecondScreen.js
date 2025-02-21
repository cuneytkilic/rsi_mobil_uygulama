import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, Pressable } from 'react-native';
import { DataContext } from './DataContext';
import Icon from 'react-native-vector-icons/Ionicons';

const SecondScreen = () => {
  const { analizData } = useContext(DataContext);

  const [sortedData, setSortedData] = useState(analizData);
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
    const backgroundColor = item.degisim < 0 ? '#ffcccc' : '#ccffcc';

    return (
      <TouchableOpacity
        style={[styles.tableRow, { backgroundColor }]}
        onPress={() => {
          setSelectedItem(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.tableCell}>{item.rank}</Text>
        <Text style={styles.tableCell}>{item.coin_name.slice(0, -4)}</Text>
        <Text style={styles.tableCell}>{item.rsi}</Text>
        <Text style={styles.tableCell}>{item.atr}</Text>
        <Text style={styles.tableCell}>{item.degisim}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.rank.toString()}
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('rank')}>
              <Text>Rank</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('coin_name')}>
              <Text>Coin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('rsi')}>
              <Text>RSI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('atr')}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text>ATR</Text>
                <Text>(%)</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('degisim')}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text>Değişim</Text>
                <Text>(%)</Text>
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
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>#{selectedItem.rank} - {selectedItem.coin_name}</Text>
                <Text>Signal Date: {selectedItem.signal_date} - {selectedItem.signal_time}</Text>
                <Text>Signal Price: {selectedItem.entryPrice}</Text>
                <Text>Last Price: {selectedItem.lastPrice}</Text>
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
    padding: 10,
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
});

export default SecondScreen;
