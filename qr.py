from flask import Flask, request, jsonify, render_template_string
import redis

app = Flask(__name__)
r = redis.Redis(host="localhost", port=6379)


@app.route("/redeem", methods=["POST"])
def redeem():
    token = (request.json or {}).get("token")
    if not token:
        return jsonify({"error": "Token zorunlu"}), 400

    if r.get(token) == b"used":
        return jsonify({"error": "Token already used"}), 403

    r.set(token, "used", ex=300)  # 5 dakika TTL
    return jsonify({"success": "Redeemed"}), 200


@app.route("/redeem/<token>", methods=["GET"])
def redeem_page(token):
    """QR veya tarayıcı ile açılan HTML sayfası."""
    was_used_before = r.get(token) == b"used"
    if not was_used_before:
        # İlk kez kullanılıyorsa işaretle
        r.set(token, "used", ex=300)

    html = """
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>Kupon Durumu</title>
        <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#111827; color:#e5e7eb; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
            .card { background:#1f2937; padding:32px 28px; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.35); max-width:360px; text-align:center; }
            h1 { font-size:20px; margin-bottom:8px; }
            p { margin:4px 0 18px; font-size:14px; color:#9ca3af; }
            .status { font-weight:600; margin-bottom:18px; }
            .status.ok { color:#22c55e; }
            .status.used { color:#f97316; }
            code { font-size:13px; background:#111827; padding:2px 6px; border-radius:6px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>QR / Kupon Durumu</h1>
            <p>Bu sayfa bir QR kodu veya özel link ile açıldı.</p>
            {% if used %}
                <div class="status used">Bu kod daha önce kullanılmış.</div>
            {% else %}
                <div class="status ok">Kod başarıyla kullanıldı. Hoş geldin!</div>
            {% endif %}
            <p>Kod: <code>{{ token }}</code></p>
        </div>
    </body>
    </html>
    """

    return render_template_string(html, token=token, used=was_used_before)


if __name__ == "__main__":
    app.run()
    