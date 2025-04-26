import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, Pressable, Image } from 'react-native';
import { DataContext } from './DataContext';
import Icon from 'react-native-vector-icons/Ionicons';
import I18n from "./translations";

const SecondScreen = () => {
  const { analizData } = useContext(DataContext);


  const [sortedData, setSortedData] = useState(analizData);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setSortedData(analizData);
  }, [analizData]);

  const sortByColumn = (column) => {
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
    const sorted = [...sortedData].sort((a, b) => {
      if (a[column] < b[column]) return newOrder === 'desc' ? -1 : 1;
      if (a[column] > b[column]) return newOrder === 'desc' ? 1 : -1;
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
        <Text style={[styles.tableCell, {flex:0.6, paddingTop: 2}]}>{item.sinyal_zamani <= 24 ? <Image source={require('./assets/new.png')} style={styles.newImage} /> : ""}</Text>
        <Text style={[styles.tableCell, { textAlign: 'left' }]}>{item.coin_name.slice(0, -4)}</Text>
        <Text style={styles.tableCell}>{item.rsi}</Text>
        <Text style={styles.tableCell}>{item.atr}</Text>
        <Text style={styles.tableCell}>{item.degisim}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 20 }}>{I18n.t('signalList')}</Text>
      </View>

      <FlatList
        data={sortedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.rank.toString()}
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <TouchableOpacity style={[styles.headerCell, {flex:0.6}]} onPress={() => sortByColumn('rank')}>
              <Text style={styles.headerText}></Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerCell, { alignItems: 'flex-start' }]} onPress={() => sortByColumn('coin_name')}>
              <Text style={styles.headerText}>Coin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('rsi')}>
              <Text style={styles.headerText}>RSI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('atr')}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.headerText}>ATR</Text>
                <Text style={styles.headerText}>(%)</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => sortByColumn('degisim')}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.headerText}>Değişim</Text>
                <Text style={styles.headerText}>(%)</Text>
              </View>
            </TouchableOpacity>
          </View>
        }
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 60 }}
        style={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
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
                <Text>Signal Date: {selectedItem.signal_date}  {selectedItem.signal_time}</Text>
                <Text>ATR at first signal: {selectedItem.first_atr}</Text>
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
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 5,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#113b4b',
    borderRadius: 5,
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
    justifyContent: 'center'
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
  newImage: {
    width: 40, // Resmin genişliği
    height: 15, // Resmin yüksekliği
  },
});

export default SecondScreen;
