# Taksimetre

Mesafe, bekleme süresi ve tarife bilgileriyle taksi ücretini anlık hesaplayan web uygulaması. İsteğe bağlı GPS ile canlı yolculuk takibi, tahmini rota (OSRM) ve sapma uyarısı destekler.

## Çalıştırma

```bash
npm install
npm run dev
```

Üretim derlemesi:

```bash
npm run build
npm run preview
```

Konum API’si yalnızca **HTTPS** veya **localhost** üzerinde çalışır. Canlı yolculukta tarayıcı konum izni ister; ekranın uykuya geçmesini engellemek için Wake Lock kullanılır (destekleyen tarayıcılarda).

## Hesap

```
Ara toplam = Açılış + (Mesafe × Km başı) + (Bekleme × Dakika başı)
Nihai tutar = max(Ara toplam, İndi-bindi)
```

Canlı yolculukta mesafe ardışık GPS noktaları arasında **Haversine** ile birikir. Anlık hız 10 km/s altındaysa geçen süre bekleme sayacına eklenir.

## Tahmini rota

Varış noktası (isteğe bağlı) Nominatim ile aranır; OSRM sürüş rotası üzerinden tahmini mesafe ve min / ortalama / max ücret aralığı gösterilir. Yolculuk sırasında tutar, mesafe veya rota sapması eşikleri aşılırsa uyarı bandı çıkar.

İstanbul, Ankara ve İzmir butonları 2026 sarı taksi tarifelerini forma doldurur.
