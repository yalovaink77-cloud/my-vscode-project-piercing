# QR / Kupon Sistemi

Bu klasördeki `qr.py` dosyası, tek kullanımlık token mantığı ile çalışan basit bir kupon/QR doğrulama backend'idir.

## Kurulum

```bash
cd /home/murat/piercing-app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Redis sunucusunun da çalışıyor olması gerekir (varsayılan: `localhost:6379`).

## Sunucuyu Çalıştırma

```bash
source venv/bin/activate
python3 qr.py
```

Tarayıcıdan örnek istek:

```text
http://127.0.0.1:5000/redeem/DENEME999
```

İlk ziyaret: "Kod başarıyla kullanıldı. Hoş geldin!"  
Yenilediğinde: "Bu kod daha önce kullanılmış." mesajını görürsün.

## QR Kod Üretme

```bash
source venv/bin/activate
python3 make_qr.py
```

İstediğin token'ı (ör. `DENEME999`) gir; `qr_DENEME999.png` dosyası oluşur. Telefonla okutulduğunda ilgili `redeem` sayfasını açar.
