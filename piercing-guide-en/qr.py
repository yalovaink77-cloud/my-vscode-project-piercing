from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta, UTC

app = Flask(__name__)

# Simple in-memory token tracking (no Redis required)
TOKEN_TTL_SECONDS = 300  # 5 minutes
used_tokens = {}  # token -> last_used_info


def is_token_used(token: str) -> bool:
    """Check whether a token was used before and is still valid."""
    info = used_tokens.get(token)
    if not info:
        return False

    expires_at = info["expires_at"]
    if datetime.now(UTC) > expires_at:
        # Expired token should be removed from cache
        del used_tokens[token]
        return False

    return True


@app.route("/redeem", methods=["POST"])
def redeem():
    data = request.get_json(silent=True) or {}
    token = data.get("token")

    if not token:
        return jsonify({"error": "Token is required."}), 400

    if is_token_used(token):
        return jsonify({"error": "Token already used"}), 403

    # Mark newly-issued or expired tokens as used
    used_tokens[token] = {
        "expires_at": datetime.now(UTC) + timedelta(seconds=TOKEN_TTL_SECONDS)
    }

    # Hook for any custom logic (unlocking content, etc.)
    return jsonify({"success": "Redeemed", "token": token}), 200


@app.route("/special")
def special_page():
    """Simple private page unlocked via token (GET /special?token=XYZ)."""
    token = request.args.get("token")

    if not token:
        return "Token is required", 400

    # If the token was used earlier, only show the warning view
    if is_token_used(token):
        return render_template("special.html", already_used=True)

    # First use: mark token and show private content
    used_tokens[token] = {
        "expires_at": datetime.now(UTC) + timedelta(seconds=TOKEN_TTL_SECONDS)
    }

    return render_template("special.html", already_used=False)


if __name__ == "__main__":
    app.run()
    