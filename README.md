# Taksimetre

### Taksi ücreti konusunda “acaba fazla mı kestiler?” diye düşünmeyin.

**Taksimetre**, Türkiye’nin 81 ilinde güncel tarifelerle yolculuk tutarını saniyeler içinde hesaplayan modern bir web uygulaması. Mesafe girin, haritadan varış seçin veya GPS ile canlı takip edin — rakamlar net, kırılım açık, sürpriz yok.

<br />

<p align="center">
  <a href="https://kubradmrgc.github.io/taksimetre/"><strong>Canlı demoyu aç →</strong></a>
  &nbsp;·&nbsp;
  <a href="https://kubradmrgc.github.io/taksimetre/sehirler">81 il tarifeleri</a>
  &nbsp;·&nbsp;
  <a href="https://kubradmrgc.github.io/taksimetre/sehir/istanbul">İstanbul örnek sayfa</a>
</p>

<p align="center">
  <a href="https://kubradmrgc.github.io/taksimetre/">
    <img src="docs/screenshots/01-hesapla-light.png" alt="Taksimetre hesaplayıcı — aydınlık tema" width="900" />
  </a>
</p>

<p align="center"><em>Aydınlık tema · 81 il · anlık ücret kırılımı · paylaşılabilir sonuç</em></p>

---

## Neden Taksimetre?

Yolda herkesin aklında aynı soru vardır: **“Bu gidiş ne kadar tutar?”**  
Taksimetre tam da bunun için var — resmi taksimetrenin yerini almaz; ama cebinizde dürüst bir referans olur.

- **81 il, tek bakış** — İstanbul’dan Hakkâri’ye tarifeler hazır
- **Anlık hesap** — açılış, km, bekleme, indi-bindi, geçişler, gidiş-dönüş
- **Harita + rota** — varış seçin, OSRM ile gerçekçi mesafe ve ücret bandı görün
- **Canlı yolculuk** — GPS ile biriken mesafe ve bekleme (HTTPS gerekir)
- **Taksi çağır / şikayet** — yakındaki duraklar, Beyaz Masa, CİMER, 112
- **Paylaş** — sonucu kopyala veya WhatsApp’tan gönder
- **PWA** — ana ekrana ekleyin, uygulamayı cebinizde taşıyın

<p align="center">
  <img src="docs/screenshots/02-hesapla-dark.png" alt="Taksimetre hesaplayıcı — karanlık tema" width="900" />
</p>

<p align="center"><em>Karanlık tema — gece yolculuğuna yakışır sarı taksi vurgusu</em></p>

---

## İl sayfaları — “Bursa’da km kaç?” diye aratınca

Her il için ayrı bir tarife sayfası var: açılış, km, indi-bindi ve 5 / 10 / 20 km örnekleri. Bilgiyi okuyun, tek tıkla hesaplayıcıya geçin.

<p align="center">
  <img src="docs/screenshots/03-sehirler.png" alt="81 il taksi tarifeleri dizini" width="900" />
</p>

<p align="center">
  <img src="docs/screenshots/04-istanbul.png" alt="İstanbul taksi ücreti tarife sayfası" width="900" />
</p>

---

## Canlı demo

| | |
|---|---|
| **Uygulama** | [kubradmrgc.github.io/taksimetre](https://kubradmrgc.github.io/taksimetre/) |
| **İl tarifeleri** | [/sehirler](https://kubradmrgc.github.io/taksimetre/sehirler) |
| **Örnek il** | [/sehir/istanbul](https://kubradmrgc.github.io/taksimetre/sehir/istanbul) |

> Bilgilendirme amaçlıdır. Yolculukta **resmi taksimetre** esas alınır.

---

## Hızlı başlangıç (geliştirme)

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

---

## Hesap

```
Ara toplam = Açılış + (Mesafe × Km başı) + (Bekleme × Dakika başı)
Yolculuk = max(Ara toplam, İndi-bindi)  [gidiş-dönüş ise ×2]
Nihai tutar = Yolculuk + Geçişler
```

İstanbul’da sarı / turkuaz / 8+1 / siyah segment seçilebilir (20 Temmuz 2026 İBB tarifesi). Köprü-tünel için hazır geçiş kısayolları veya manuel TL alanı vardır.

Canlı yolculukta mesafe ardışık GPS noktaları arasında **Haversine** ile birikir. Anlık hız 10 km/s altındaysa geçen süre bekleme sayacına eklenir.

## Tahmini rota

Varış noktası (isteğe bağlı) Nominatim ile aranır; OSRM sürüş rotası üzerinden tahmini mesafe ve min / ortalama / max ücret aralığı gösterilir. Yolculuk sırasında tutar, mesafe veya rota sapması eşikleri aşılırsa uyarı bandı çıkar.

81 il tarifesi forma doldurulur. İstanbul / Ankara / İzmir kısayol butonları üstte durur; diğer iller arama kutusundan seçilir.

Mesafe (veya varış rotası) girildiğinde **ücret aralığı** (min–ortalama–max) gösterilir. Hesaplanan tutar bu bandın dışındaysa sarı/kırmızı bildirim çıkar; canlı yolculukta ek olarak rota/mesafe sapması da uyarılır.

Tarifeler resmi belediye API’si değildir. Açılış, km ve indi-bindi [Hemen Hesap](https://www.hemenhesap.com/arastirma/iller-arasi-taksi-ucretleri-2026) (CC BY 4.0) ve [taksicilerodasi.com](https://taksicilerodasi.com/tr/ucret-hesapla/) HTML tablolarından derlenir; Hemen Hesap’ta olmayan 6 il [taksi724](https://taksi724.com/taksi-ucreti-hesapla) il sayfalarından tamamlanır. [taksifiyat.online](https://taksifiyat.online/) şehir sayfaları varsa üzerine yazılır (açılış / km / dk / minimum). Açık REST/GraphQL API yoktur; tarayıcıdan siteye istek CORS’a takılır, senkron yalnızca Node’da çalışır.

```bash
npm run sync:tariffs
```

`npm run dev` ve `npm run build` öncesinde senkron isteğe bağlı çalışır; ağ yoksa mevcut `src/data/tariffs.json` ile devam eder. Script kırılırsa önceki JSON’a dokunulmaz.

Bekleme (dakika) ücreti kaynak tablolarda yoktur. İstanbul / Ankara / İzmir için yerel tamamlayıcı kullanılır; diğer illerde 0’dır ve formdan değiştirilebilir.

## İletişim ve şikayet

Sayfanın altında **Acil Durum / Şikayet** ve **Taksi Çağır** sekmeleri vardır.

- Şikayet: `src/data/chambersData.json` içindeki belediye / oda hatları (112, CİMER vb.). Kayıt olmayan illerde Beyaz Masa **ALO 153** ve belediye santralı (`municipalityContacts.json`) otomatik eklenir.
- Taksi Çağır: şehir seçimi + yakındaki duraklar. Sağlayıcı sırası:

1. **Yerel rehber** — [taksi724](https://taksi724.com/), [taksicibul](https://www.taksicibul.com/), [taksiciler](https://taksiciler.com/), [nerede360](https://www.nerede360.com/) HTML senkronu (`public/data/stands/`)  
2. **Google Places** (`VITE_GOOGLE_PLACES_API_KEY`)  
3. **Foursquare** / **Geoapify**  
4. **OSM** (Overpass + Nominatim)  

```bash
# Tüm iller (birkaç dakika sürebilir)
npm run sync:stands

# Tek il
npm run sync:stands -- --city=adiyaman

cp .env.example .env   # isteğe bağlı Google anahtarı
npm run dev
```

## GitHub Pages

`main` dalına push sonrası Actions ile yayınlanır:

**https://kubradmrgc.github.io/taksimetre/**

Ekran görüntülerini yeniden almak için (isteğe bağlı):

```bash
npm install -D playwright
npx playwright install chromium
node scripts/capture-readme-shots.mjs
```
