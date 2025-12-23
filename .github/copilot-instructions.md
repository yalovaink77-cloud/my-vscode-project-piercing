# AI Kod Yardımcısı İçin Proje Notları

## Genel Mimari
- Bu repo iki ana parçadan oluşur: statik tek sayfa piercing rehberi (HTML/CSS/JS) ve QR ile korunan özel sayfa için küçük bir Flask servisi (qr.py + templates/special.html).
- Derleme aracı yok; dosyalar doğrudan tarayıcı ve Python ile çalışır.

## Frontend (piercing rehberi)
- Ana giriş dosyası: index.html. index2.html, index3.html, piercing-final.html, piercing-fresh.html ve *.backup dosyaları geçmiş sürümler/denemelerdir; varsayılan olarak index.html + script.js + style.css üzerinde çalış.
- Navigasyon ve içerik bölümleri, id'leri (aci, turler, bakim, malzemeler, gercekler, sss, takip) ve .content-section / .nav-btn sınıfları ile script.js tarafından yönetilir; yeni bölüm eklerken aynı modeli takip et.
- Hero alanındaki butonlar (hero-start-tracking vb.) belirli section id'lerine kaydırma yapar; yeni butonlar eklerken showSection fonksiyonunu kullan.
- script.js sadece DOMContentLoaded içinde vanilla JS kullanır; yeni davranışlar eklerken aynı yapıya ekle, global değişken tanımlamaktan kaçın.
- Takip sistemi (kişisel piercing kaydı) localStorage anahtarı "piercings" altında düz JS objeleri saklar (id, type, location, date, piercer, notes); bu şemayı geriye dönük uyumlu olacak şekilde genişlet.
- Piercing kartları için görünüm ve renkler style.css içindeki .piercing-card* sınıflarına dayanır; yeni statüler/renkler eklerken mevcut sınıf adlandırmasını (piercing-card--ear vb.) takip et.
- Takip formu ve liste, id'leri ile script.js tarafından seçilir; HTML tarafında id isimlerini değiştirirsen JS'i de güncelle.

## JS Davranış Kalıpları
- showSection(sectionId, clickedButton) tüm section'ları gizleyip hedef section'ı aktif hale getirir ve nav butonlarındaki active sınıfını yönetir; yeni sekmeler için bu fonksiyonu kullan.
- Accordion yapısı .accordion-button ve .accordion-item.active sınıflarına dayanır; yeni accordion eklerken aynı HTML sınıf yapısını kullan, JS'i değiştirme.
- Takip kodu, gerekli DOM elementleri yoksa (örneğin başka bir HTML varyantı) hiçbir şey yapmamak için add-piercing-btn ve piercing-form'un varlığını kontrol eder; yeni sayfa türetirken bu elementler yoksa uyarı bekleme.
- Kart aksiyonları (Düzenle/Sil) inline onclick ile window.editPiercing / window.deletePiercing fonksiyonlarına bağlanır; JS tarafında bu fonksiyonları window üzerinden erişilebilir tutmaya devam et.

## Flask / QR Servisi
- qr.py basit bir Flask uygulamasıdır; veri tabanı yok, tek süreçte çalışan bellek içi sözlük (used_tokens) ile token durumunu tutar.
- TOKEN_TTL_SECONDS (varsayılan 300 sn) hem /redeem hem de /special için token'in ne kadar süreyle geçerli olacağını belirler; süre dolmuş token'lar is_token_used içinde otomatik temizlenir.
- /redeem (POST) JSON gövdesinde "token" bekler ve her token'i tek kullanımlık olarak işaretler; bu endpoint'i genişletirken hata mesajı yapısını koru (error / success alanları).
- /special (GET) query parametresi "token" bekler, special.html şablonuna already_used boole'ini geçirir ve token'i ilk erişimde işaretler; template mantığını bu bayrak üzerinden genişlet.
- Kullanım basit geliştirme senaryosuna yöneliktir: çoklu worker veya yeniden başlatmalarda used_tokens sıfırlanır; kalıcı güvenlik veya yüksek trafik için bu servisi genişletmeden önce bu sınırlamayı göz önünde bulundur.

## Geliştirme ve Çalıştırma
- Statik siteyi test etmek için doğrudan index.html dosyasını tarayıcıda açabilir veya repo kökünde basit bir HTTP sunucusu (ör. `python -m http.server`) çalıştırabilirsin.
- Flask servisini lokal çalıştırmak için:
  - Bağımlılık: Flask (pip install flask).
  - Komut: python qr.py (varsayılan olarak 127.0.0.1:5000'de çalışır).
- Flask'ın templates dizini olarak repo kökü altındaki templates klasörü kullanılır; yeni şablon eklerken Jinja sözdizimini ({{ }}, {% %}) special.html ile tutarlı kullan.

## Değişiklik Yaparken Dikkat
- index.html ile çeşitli backup ve index2/index3/piercing-final varyantları arasında içerik farkları var; yeni özellikleri yalnızca aktif versiyona (şu an index.html + script.js + style.css) ekle, diğerlerini ancak özellikle istenirse güncelle.
- LocalStorage yapısını kıracak değişikliklerden kaçın; gerekiyorsa eski veriyi dönüştüren geçiş mantığını script.js içinde ekle.
- Güvenlik açısından qr.py yalnızca eğitim/deneme amaçlıdır; üretim için ek doğrulama, kalıcı veri katmanı ve rate limiting gerekeceğini varsay.
