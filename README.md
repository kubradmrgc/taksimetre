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

81 il tarifesi forma doldurulur. İstanbul / Ankara / İzmir kısayol butonları üstte durur; diğer iller arama kutusundan seçilir.

Mesafe (veya varış rotası) girildiğinde **ücret aralığı** (min–ortalama–max) gösterilir. Hesaplanan tutar bu bandın dışındaysa sarı/kırmızı bildirim çıkar; canlı yolculukta ek olarak rota/mesafe sapması da uyarılır.

Tarifeler resmi belediye API’si değildir. Açılış, km ve indi-bindi [Hemen Hesap](https://www.hemenhesap.com/arastirma/iller-arasi-taksi-ucretleri-2026) (CC BY 4.0) ve [taksicilerodasi.com](https://taksicilerodasi.com/tr/ucret-hesapla/) HTML tablolarından derlenir; Hemen Hesap’ta olmayan 6 il [taksi724](https://taksi724.com/taksi-ucreti-hesapla) il sayfalarından tamamlanır. Açık REST/GraphQL API yoktur; tarayıcıdan siteye istek CORS’a takılır, senkron yalnızca Node’da çalışır.

```bash
npm run sync:tariffs
```

`npm run dev` ve `npm run build` öncesinde senkron isteğe bağlı çalışır; ağ yoksa mevcut `src/data/tariffs.json` ile devam eder. Script kırılırsa önceki JSON’a dokunulmaz.

Bekleme (dakika) ücreti kaynak tablolarda yoktur. İstanbul / Ankara / İzmir için yerel tamamlayıcı kullanılır; diğer illerde 0’dır ve formdan değiştirilebilir.
