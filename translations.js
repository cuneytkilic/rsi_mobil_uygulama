import I18n from 'i18n-js';

// Çeviriler
const translations = {
  en: {
    averageRsi: "Avg. Market RSI",  // İngilizce için çeviri
    lastUpdate: "Last Update",
    coinCount: "Coin Count",
    coin_rank: "Coin #Rank",
    footerText: "hourly RSI data analysis.",
    searchPlaceHolder: "Search for coins",
    signalRate: "Signal Rate",
    signalList: "Signal List",
    signalHistory: "Signal History",
    home: "Home"
  },
  tr: {
    averageRsi: "Ort. Piyasa RSI",  // Türkçe için çeviri
    lastUpdate: "Son Güncelleme",
    coinCount: "Coin Sayısı",
    coin_rank: "Coin #Sıra",
    footerText: "saatlik veri analizi yapılmaktadır.",
    searchPlaceHolder: "Coin Ara",
    signalRate: "Sinyal Oranı",
    signalList: "Aktif Sinyaller",
    signalHistory: "Sinyal Geçmişi",
    home: "Anasayfa"
  },
};

// Çevirileri tanımlama
I18n.translations = translations;

// Dil ayarı
I18n.defaultLocale = "en"; // Varsayılan dil
I18n.fallbacks = true; // Eksik çevirilerde varsayılan dile dön

export default I18n;
