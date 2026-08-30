# Taksimetre

Mesafe, bekleme süresi ve tarife bilgileriyle taksi ücretini anlık hesaplayan web uygulaması.

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

## Hesap

```
Ara toplam = Açılış + (Mesafe × Km başı) + (Bekleme × Dakika başı)
Nihai tutar = max(Ara toplam, İndi-bindi)
```

İstanbul, Ankara ve İzmir butonları 2026 belediye / oda duyurularındaki sarı taksi tarifelerini forma doldurur. Değerler elle değiştirilebilir.
