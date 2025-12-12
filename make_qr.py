import qrcode

BASE_URL = "http://127.0.0.1:5000/redeem/"


def main() -> None:
    print("QR oluşturulacak taban URL:", BASE_URL)
    token = input("Token değeri gir (ör: DENEME999): ").strip()
    if not token:
        print("Boş token ile QR oluşturulamaz.")
        return

    full_url = BASE_URL + token
    print("Oluşturulacak URL:", full_url)

    img = qrcode.make(full_url)
    filename = f"qr_{token}.png"
    img.save(filename)

    print("QR dosyası kaydedildi:", filename)
    print("Bu QR'ı telefonla okuttuğunda şu adrese gidecek:")
    print(full_url)


if __name__ == "__main__":
    main()
