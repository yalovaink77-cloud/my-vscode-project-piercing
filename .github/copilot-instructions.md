# Copilot talimatları — Proje özeti (kısa)

- **Büyük Resim:** Repo iki parçalı: statik ön yüz tek sayfa rehber (`index.html`, `script.js`, `style.css`) ve küçük bir Flask QR servisi (`qr.py` + `templates/special.html`). Ajanın hedefi: UI değişiklikleri, localStorage takibi ve QR akışını hızlıca test etmek.

## Hızlı Başlangıç (dev)
- Statik siteyi test: çalışma dizininde `python -m http.server` çalıştır veya `index.html` doğrudan aç.
- Flask servisi: bağımlılıkları yükle `pip install -r requirements.txt` (veya `pip install flask`), sonra `python qr.py` (127.0.0.1:5000).

## Önemli Dosyalar & Örnekler
- `index.html` — aktif SPA giriş dosyası. (Yedekler: `index2.html`, `index3.html`, `piercing-final.html`, `*.backup`.)
- `script.js` — tüm DOM davranışları burada: `showSection(sectionId, clickedButton)`, `window.editPiercing`, `window.deletePiercing`. Kod DOMContentLoaded içinde saf JS ile yazılmıştır.
- `style.css` — piercings kart stilleri `.piercing-card*` (ör: `.piercing-card--ear`).
- `qr.py` — bellek içi `used_tokens` sözlüğü, `TOKEN_TTL_SECONDS` (varsayılan 300). Endpointler:
  - `POST /redeem` expects JSON `{ "token": "..." }` (tek kullanımlık işaretleme).
  - `GET /special?token=...` şablonuna `already_used` boolean geçirir.

## Proje-özgü Kurallar ve Davranışlar (uygulama örnekleri)
- LocalStorage anahtarı: `piercings` — kayıt objeleri `{id, type, location, date, piercer, notes}`. Gerçek veriyi bozmamak için şema değişikliklerinde dönüşüm ekle.
- DOM id/sınıf modelleri korunmalı: section id'leri (`aci`, `turler`, `bakim`, `malzemeler`, `gercekler`, `sss`, `takip`) ve `.content-section`/`.nav-btn` desenini kullan.
- Accordionlar `.accordion-button` ve `.accordion-item.active` ile çalışır; yeni accordion eklerken bu sınıfları kullan.
- Kart aksiyonları inline `onclick` ile `window.editPiercing` / `window.deletePiercing` üzerinden çağrılıyor — geriye dönük uyumluluğu koru.

## Entegrasyon Noktaları ve Sınırlar
- `qr.py` bellek içi state kullanır; servis yeniden başlatıldığında `used_tokens` sıfırlanır. Production için persistent store/rate limit gereklidir.
- İngilizce varyant: `piercing-guide-en/` içinde benzer yapı (kendi `qr.py` ve `templates/`) bulunuyor; değişiklikleri paralel düşün.

## Hangi Değişikliklerden Kaçınmalı
- Aktif geliştirme `index.html` + `script.js` + `style.css` üzerindendir — backup dosyaları yalnızca referans içindir.
- LocalStorage şemasını kırma; gerekiyorsa `script.js` içinde migrate adımı ekle.

## Değişiklikleri doğrulama
- Adımlar: 1) `python -m http.server` 2) `python qr.py` 3) tarayıcıda `index.html` gez, takip/kayıt ekle, QR `/special?token=...` test et.

---

Lütfen eksik veya netleştirilmesi gereken bölümleri belirtin; isterseniz örnek `script.js` fonksiyonlarını referans göstererek daha fazla ayrıntı eklerim.
