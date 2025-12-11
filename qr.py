from flask import Flask, request, jsonify
from datetime import datetime, timedelta, UTC

app = Flask(__name__)

# Basit, bellek içi token takibi (Redis gerektirmez)
TOKEN_TTL_SECONDS = 300  # 5 dakika
used_tokens = {}  # token -> son_kullanım_zamani


def is_token_used(token: str) -> bool:
    """Token daha önce kullanıldı mı ve süresi dolmadı mı?"""
    info = used_tokens.get(token)
    if not info:
        return False

    expires_at = info["expires_at"]
    if datetime.now(UTC) > expires_at:
        # Süresi dolmuş, temizle
        del used_tokens[token]
        return False

    return True


@app.route("/redeem", methods=["POST"])
def redeem():
    data = request.get_json(silent=True) or {}
    token = data.get("token")

    if not token:
        return jsonify({"error": "Token zorunlu"}), 400

    if is_token_used(token):
        return jsonify({"error": "Token already used"}), 403

    # İlk kez veya süresi dolmuş token: kullanılmış olarak işaretle
    used_tokens[token] = {
        "expires_at": datetime.now(UTC) + timedelta(seconds=TOKEN_TTL_SECONDS)
    }

    # Burada gerçek işlemini yapabilirsin (içerik gösterme vs.)
    return jsonify({"success": "Redeemed", "token": token}), 200


if __name__ == "__main__":
    app.run()
    