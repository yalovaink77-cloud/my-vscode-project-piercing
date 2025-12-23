# PiercingGuide (English Edition)

This folder contains the fully translated English version of the Piercing Guide microsite and the single-use QR Flask helper.

## Structure

- `index.html` – landing page + tracker UI
- `style.css` – shared styles
- `script.js` – navigation + tracker logic (localStorage, CSV/JSON export)
- `assets/` – shared artwork/logo
- `qr.py` – Flask service for QR token redemption
- `templates/special.html` – single-use private page rendered by Flask

## Local preview

```bash
# static site
cd piercing-guide-en
python -m http.server 8000
# open http://localhost:8000/index.html
```

## QR/Flask service

```bash
pip install flask
cd piercing-guide-en
python qr.py
# visit http://127.0.0.1:5000/special?token=YOUR_TOKEN
```

`/redeem` accepts `POST {"token": "..."}` and marks the token as used for 5 minutes.
