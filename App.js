import React, { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, SafeAreaView, AppState, Modal, Button } from 'react-native';
import axios from 'axios';
import { format } from 'date-fns'; // For date formatting
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons'; // Arama ikonu için eklendi
import * as RNLocalize from "react-native-localize";
import I18n from "./translations";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SecondScreen from './SecondScreen';
import HistoryScreen from './HistoryScreen';
import { DataProvider, DataContext } from './DataContext'; // Yeni eklenen import

// Global olarak yazı tipini ayarla
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = { fontFamily: 'sans-serif' };

const Stack = createNativeStackNavigator();

// History butonu (SecondScreen'den gelen veriyi HistoryScreen'e aktaracak)
const CustomHistoryButton = ({ navigation, history_data }) => {
  return (
    <TouchableOpacity
      style={{ padding: 15 }}
      onPress={() => navigation.navigate('HistoryScreen', { history_data })}
    >
      <Text style={{ color: '#fff', fontSize: 16 }}>History</Text>
    </TouchableOpacity>
  );
};

const MainScreen = () => {
  const navigation = useNavigation();
  const { setAnalizData, setHistoryData } = useContext(DataContext); // Context'ten fonksiyonları al
  const [rsiData, setRsiData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [updateMessage, setUpdateMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locale, setLocale] = useState('en');
  const [lowRsiCount, setLowRsiCount] = useState(0);
  const [highRsiCount, setHighRsiCount] = useState(0);
  const [son_guncelleme_tarihi, setson_guncelleme_tarihi] = useState("");
  const [analiz_data] = useState([]);
  const [history_data] = useState([]);

  const fetchRsiData = async () => {
    try {
      const response = await axios.get('https://rsi-sven.onrender.com/get-rsi-data');
      const data = response.data;

      // Context'e analiz_data ve history_data'yı kaydet
      setAnalizData(data.analiz_data || []);
      setHistoryData(data.history_data || []);

      // 'data' içinden gerçek coin verisini al
      const rsiData = data.data;

      // Timestamp verisini almak
      let tarih = new Date(data.timestamp.seconds * 1000);  // Örneğin timestamp verisi buradan geliyor

      // AsyncStorage'a son_guncelleme_tarihi'yi kaydet
      await AsyncStorage.setItem('son_guncelleme_tarihi', tarih.toString());
      setson_guncelleme_tarihi(tarih);

      // Sorting the data based on RSI values
      const sortedData = rsiData.sort((a, b) => a.rsi - b.rsi);

      // RSI < 30 ve RSI > 70 olanların sayısını hesapla
      const lowRsiCount = sortedData.filter(item => item.rsi < 30).length;
      const highRsiCount = sortedData.filter(item => item.rsi > 70).length;

      // State güncellemesi yapılabilir
      setLowRsiCount(lowRsiCount);
      setHighRsiCount(highRsiCount);

      // Sorted data'yı döndür
      return sortedData;

    } catch (error) {
      console.error("Error fetching RSI data: ", error);
      return [];
    }
  };

  // Handle AppState changes
  const handleAppStateChange = useCallback(async (currentAppState) => {
    if (currentAppState === 'active') {
      let son_veri_cekilen_tarih = new Date(await AsyncStorage.getItem('son_guncelleme_tarihi'));
      let saat = son_veri_cekilen_tarih.getHours();
      let gun = son_veri_cekilen_tarih.getDay();

      let current_date = new Date();
      let current_hour = current_date.getHours();
      let current_day = current_date.getDay();

      if (saat != current_hour || gun != current_day) {
        setUpdateMessage('(...)');
        startUpdateLogic(); // startUpdateLogic tamamlanana kadar bekle
      }
      else {
        console.log(new Date().toLocaleTimeString() + " - yeni veri olmadığı için güncelleme fonksiyonu çağrılmayacak.");
      }
    }
  }, []);

  // Cihaz dilini çekerek, uygulama dili ayarlanıyor.
  useEffect(() => {
    const locales = RNLocalize.getLocales();
    const deviceLanguage = locales[0]?.languageCode || 'en';  // Varsayılan olarak İngilizce
    I18n.locale = deviceLanguage;  // Dil ayarını I18n ile eşleştir => bu satırda, dil ataması yapılıyor.
    setLocale(deviceLanguage);  // Dil state'ini güncelle
  }, []);

  useEffect(() => {
    load_favorites_and_other_coins();
    startHourlyUpdate(); // Start hourly updates
    const appStateListener = AppState.addEventListener('change', handleAppStateChange); // Add AppState listener

    return () => {
      appStateListener.remove(); // Remove listener on cleanup
    };
  }, []);

  // Start hourly update process
  const startHourlyUpdate = () => {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
    const duration = nextHour - now + (35 * 1000); //ekstra 55sn sonra veri çekmeye başlayacak.

    setTimeout(async () => {
      setUpdateMessage('(...)');
      await startUpdateLogic();
    }, duration);
  };


  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favorites');
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites); // Durum yalnızca geçerli verilerle güncellenir
        return parsedFavorites;
      }
      return []; // Eğer veriler yoksa boş dizi döndürülür
    } catch (error) {
      console.error('Error loading favorites: ', error);
      return []; // Hata durumunda boş dizi döndürülür
    }
  };

  async function load_favorites_and_other_coins() {

    try {

      //daha önce favoriye eklenmiş coinleri çekiyoruz.
      let favori_coinler = await loadFavorites();

      //tüm coinleri çekiyoruz.
      let all_coin_data = await fetchRsiData();

      let fav_coins = []
      for (let i = 0; i < favori_coinler.length; i++) {
        for (let j = all_coin_data.length - 1; j >= 0; j--) {
          if (all_coin_data[j].coin_name == favori_coinler[i]) {
            fav_coins.push(all_coin_data[j]);
            all_coin_data.splice(j, 1);
            break;
          }
        }
      }

      fav_coins = fav_coins.sort((a, b) => a.rsi - b.rsi); //favori coinleri rsi değerine göre sıralıyoruz.
      all_coin_data = all_coin_data.sort((a, b) => a.rsi - b.rsi); //favori olmayan diğer coinleri rsi değerine göre sıralıyoruz.

      const mergedList = [...fav_coins, ...all_coin_data]; //üsste favori coinler altta ise diğer coinler olacak şekilde iki json listesini birleştiriyoruz.

      setRsiData(mergedList);
      setFilteredData(mergedList);

    }
    catch (error) {
      console.log(error)
    }

  }


  const startUpdateLogic = async () => {
    let attemptCount = 0;
    while (attemptCount < 3) {

      let veri_tarihi = new Date(await AsyncStorage.getItem('son_guncelleme_tarihi'));
      let saat = veri_tarihi.getHours();
      let gun = veri_tarihi.getDay();

      let current_date = new Date();
      let current_hour = current_date.getHours();
      let current_day = current_date.getDay();

      attemptCount++;
      try {
        if (saat != current_hour || gun != current_day) {
          load_favorites_and_other_coins();
          setUpdateMessage('');
          startHourlyUpdate();
          return;
        }
        else {
          console.log(new Date().toLocaleTimeString() + " - yeni veri gelmedi! TEST => veri_tarihi.getHours(): " + veri_tarihi.getHours() + " - new Date().getHours(): " + new Date().getHours());
        }

      } catch (error) {
        console.error("Error during updates:", error);
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    startHourlyUpdate();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setFilteredData(
      rsiData
        .filter(item => item.coin_name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (favorites.includes(a.coin_name) ? -1 : 1) - (favorites.includes(b.coin_name) ? -1 : 1))
    );
  };

  const toggleFavorite = async (coinName) => {
    setFavorites((prevFavorites) => {
      const newFavorites = prevFavorites.includes(coinName)
        ? prevFavorites.filter(fav => fav !== coinName)
        : [...prevFavorites, coinName];

      // Favoriler kaydedildikten sonra load_favorites_and_other_coins fonksiyonunu çağır
      saveFavorites(newFavorites).then(() => {
        load_favorites_and_other_coins();
      });

      return newFavorites;
    });
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites: ', error);
    }
  };

  const calculateAverageRsi = (data) => data.reduce((sum, item) => sum + item.rsi, 0) / data.length;

  const formatTimestamp = (timestamp) => {
    try {
      return format(timestamp, 'dd.MM.yyyy HH:mm');
    } catch {
      return '';
    }
  };

  //sinyal geldiğinde, kartların arkaplan rengini değiştiren fonksiyon.
  const getBackgroundStyle = (rsiValue) => {
    if (rsiValue === undefined || rsiValue === null || rsiValue === 0) return { backgroundColor: 'transparent' };
    if (rsiValue < 30) return { backgroundColor: '#28A745' };
    if (rsiValue > 70) return { backgroundColor: '#DC3545' };
    return { backgroundColor: 'transparent' };
  };

  //sinyal oranı kartında sinyal geldiğinde arkaplan rengini değiştiren fonksiyon.
  const getBackgroundStyle_v2 = (rsi_30_oran, rsi_70_oran) => {
    if (rsi_30_oran > 0.9) return { backgroundColor: '#28A745' };
    if (rsi_70_oran > 0.9) return { backgroundColor: '#DC3545' };
    return { backgroundColor: 'transparent' };
  };

  //sinyal geldiğinde, kartların üstündeki text rengini değiştiren fonksiyon.
  const getTextColorStyle = (rsiValue) => {
    if (rsiValue === undefined || rsiValue === null || rsiValue === 0) return { color: '#333' };
    if (rsiValue < 30) return { color: 'white' };
    if (rsiValue > 70) return { color: 'white' };
    return { color: '#333' };
  };

  //sinyal oranı kartında sinyal geldiğinde yazıların rengini beyaz yapan fonksiyon.
  const getTextColorStyle_v2 = (rsi_30_oran, rsi_70_oran) => {
    if (rsi_30_oran > 0.9) return { color: 'white' };
    if (rsi_70_oran > 0.9) return { color: 'white' };
    return { color: '#333' };
  };

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <TouchableOpacity style={{}} onPress={() => toggleFavorite(item.coin_name)}>
        <Text style={styles.favoriteIcon}>{favorites.includes(item.coin_name) ? '★' : '☆'}</Text>
      </TouchableOpacity>
      <View style={styles.tableCell}>
        <Text style={{ fontWeight: item.rank === null ? 'normal' : (item.rank < 100 ? 'bold' : item.rank < 200 ? '600' : 'normal') }}>
          {item.coin_name} {item.rank == null ? null : '#' + item.rank}
        </Text>
      </View>
      <View style={styles.tableCell_v2}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {item.rsi > item.rsi_2 ? (
            <Image source={require('./assets/up_arrow.png')} style={{ width: 15, height: 15 }} />
          ) : item.rsi < item.rsi_2 ? (
            <Image source={require('./assets/down_arrow.png')} style={{ width: 15, height: 15 }} />
          ) : (
            <Image source={require('./assets/equal.png')} style={{ width: 15, height: 15 }} />
          )}
          <Text style={{ fontWeight: item.rank === null ? 'normal' : (item.rank < 100 ? 'bold' : item.rank < 200 ? '600' : 'normal') }}> {item.rsi}</Text>
        </View>
      </View>
      <View style={styles.tableCell_v2}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {item.atr_degisim > item.atr_degisim_2 ? (
            <Image source={require('./assets/up_arrow.png')} style={{ width: 15, height: 15 }} />
          ) : item.atr_degisim < item.atr_degisim_2 ? (
            <Image source={require('./assets/down_arrow.png')} style={{ width: 15, height: 15 }} />
          ) : (
            <Image source={require('./assets/equal.png')} style={{ width: 15, height: 15 }} />
          )}
          <Text style={{ fontWeight: item.rank === null ? 'normal' : (item.rank < 100 ? 'bold' : item.rank < 200 ? '600' : 'normal') }}> {item.atr_degisim}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>

        <View style={styles.header_left}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
          <View style={styles.app_title}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Crypto Signal</Text>
            <Text style={{ color: 'white', fontSize: 14 }}>Monitoring</Text>
          </View>
        </View>

        <View style={styles.header_right}>
          <View style={styles.update_container}>
            <TouchableOpacity onPress={() => handleAppStateChange('active')}><Image source={require('./assets/updated.png')} style={styles.update_logo} /></TouchableOpacity>
            <Text style={styles.headerText}>{I18n.t('lastUpdate')} {updateMessage}</Text>
          </View>
          <Text style={styles.headerText}>{formatTimestamp(son_guncelleme_tarihi)}</Text>
          <Text style={styles.headerText}>{rsiData.length == 0 ? null : I18n.t('coinCount') + ": " + rsiData.length}</Text>
        </View>
      </View>


      <View style={styles.summaryCards}>
        <View style={[styles.card, getBackgroundStyle(calculateAverageRsi(rsiData))]}>
          <Text style={[styles.card_text, getTextColorStyle(calculateAverageRsi(rsiData))]}>{I18n.t('averageRsi')}</Text>
          <Text style={[styles.rsiValue, getTextColorStyle(calculateAverageRsi(rsiData))]}>{rsiData.length ? calculateAverageRsi(rsiData).toFixed(2) : ""}</Text>
        </View>
        <View style={[styles.card, getBackgroundStyle(rsiData.find(item => item.coin_name === 'BTCUSDT')?.rsi)]}>
          <Text style={[styles.card_text, getTextColorStyle(rsiData.find(item => item.coin_name === 'BTCUSDT')?.rsi)]}>Bitcoin RSI</Text>
          <Text style={[styles.rsiValue, getTextColorStyle(rsiData.find(item => item.coin_name === 'BTCUSDT')?.rsi)]}>{rsiData.length ? rsiData.find(item => item.coin_name === 'BTCUSDT')?.rsi.toFixed(2) : ""}</Text>
        </View>
        <View style={[styles.card, getBackgroundStyle_v2(lowRsiCount / rsiData.length, highRsiCount / rsiData.length)]}>
          <Text style={[styles.card_text, getTextColorStyle_v2(lowRsiCount / rsiData.length, highRsiCount / rsiData.length)]}>{I18n.t('signalRate')}</Text>
          <Text style={[styles.rsiCountText, getTextColorStyle_v2(lowRsiCount / rsiData.length, highRsiCount / rsiData.length)]}>{rsiData.length ? "RSI<30: %" + (100 * lowRsiCount / rsiData.length).toFixed(1) : ""}</Text>
          <Text style={[styles.rsiCountText, getTextColorStyle_v2(lowRsiCount / rsiData.length, highRsiCount / rsiData.length)]}>{rsiData.length ? "RSI>70: %" + (100 * highRsiCount / rsiData.length).toFixed(1) : ""}</Text>
        </View>
      </View>


      <View style={styles.searchContainer}>
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder={I18n.t('searchPlaceHolder')}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.nextPageButton}
          onPress={() => navigation.navigate('SecondScreen', { analiz_data:analiz_data, history_data:history_data })}
        >
          <Text>Signal List</Text>
          <Icon style={{ paddingLeft: 10 }} name="arrow-forward" size={30} color="#113b4b" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={item => item.coin_name}
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell]}>{I18n.t('coin_rank')}</Text>
            <Text style={[styles.rsi_column_header]}>RSI</Text>
            <Text style={[styles.atr_column_header]}>ATR (%)</Text>
          </View>
        }
        stickyHeaderIndices={[0]}
      />

      <Text style={styles.footerText}><Text style={{ fontWeight: 'bold' }}>Binance Futures</Text>, {I18n.t('footerText')}</Text>
    </GestureHandlerRootView>
  );
};

const App = () => {
  return (
    <DataProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="MainScreen" component={MainScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="SecondScreen"
            component={SecondScreen}
            options={({ navigation }) => ({
              title: 'Signal List',
              headerTitleAlign: 'center',
              headerStyle: { backgroundColor: '#113b4b' },
              headerTintColor: '#fff',
              headerRight: () => (
                <CustomHistoryButton 
                  navigation={navigation} 
                />
              ),
            })}
          />
          <Stack.Screen
            name="HistoryScreen"
            component={HistoryScreen}
            options={{
              title: 'Signal History',
              headerTitleAlign: 'center',
              headerStyle: { backgroundColor: '#113b4b' },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </DataProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
    marginBottom: 15,
  },
  searchBarContainer: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginRight: 0,
  },
  searchBar: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    color: '#808080',
  },
  app_title: {
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-around',
    backgroundColor: '#113b4b',
    borderRadius: 5,
  },
  header_left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
  },
  header_right: {
    flexDirection: 'column',
    alignItems: "flex-end",
    flex: 1,
    paddingRight: 5,
  },
  logo: {
    height: 50,
    width: 50,
    marginRight: 0,
  },
  update_container: {
    flexDirection: 'row',
    alignItems: "center",
  },
  update_logo: {
    height: 12,
    width: 12,
    margin: 5,
  },
  headerText: {
    fontSize: 12,
    color: 'white',
    margin: 2,
    alignItems: "baseline",
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    elevation: 5, // Android gölge
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',

    // Yeni boxShadow kullanımı (React Native Web destekli)
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
  },
  card_text: {
    fontSize: 14,
    color: '#333',
  },
  rsiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  rsiCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
  },
  tableHeaderCell: {
    flex: 1.4,
    fontWeight: 'bold',
    marginLeft: 30,
  },
  rsi_column_header: {
    flex: 0.5,
    fontWeight: 'bold',
    paddingLeft: 70,
  },
  atr_column_header: {
    flex: 0.5,
    fontWeight: 'bold',
    paddingRight: 20,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  tableCell: {
    flex: 1.4,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  tableCell_v2: {
    flex: 0.5,
    fontSize: 14,
    color: '#333',
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteButton: {
    flex: 0.5,
    justifyContent: 'flex-start',
  },
  favoriteIcon: {
    fontSize: 24,
    color: '#f39c12',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingTop: 5,
  },
  sheetContent: {
    padding: 16,
  },
  nextPageButton: {
    flex: 0.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

export default App;