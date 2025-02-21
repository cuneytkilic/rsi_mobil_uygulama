import I18n from 'i18n-js';

// Çeviriler
const translations = {
  en: {
    averageRsi: "Average RSI",  // İngilizce için çeviri
    lastUpdate: "Last Update",
    coinCount: "Coin Count",
    coin_rank: "Coin #Rank",
    footerText: "hourly RSI data analysis.",
    searchPlaceHolder: "Search for coins",
    signalRate: "Signal Rate",
  },
  tr: {
    averageRsi: "Ortalama RSI",  // Türkçe için çeviri
    lastUpdate: "Son Güncelleme",
    coinCount: "Coin Sayısı",
    coin_rank: "Coin #Sıra",
    footerText: "saatlik veri analizi yapılmaktadır.",
    searchPlaceHolder: "Coni Ara",
    signalRate: "Sinyal Oranı",
  },
};

// Çevirileri tanımlama
I18n.translations = translations;

// Dil ayarı
I18n.defaultLocale = "en"; // Varsayılan dil
I18n.fallbacks = true; // Eksik çevirilerde varsayılan dile dön

export default I18n;
