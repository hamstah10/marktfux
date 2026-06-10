# marktFUX — Hostinger VPS Deployment

Komplette Anleitung zur Installation auf einem **Hostinger Cloud / KVM VPS** (Ubuntu 22.04 LTS oder 24.04 LTS).

## Stack
- **Backend**: FastAPI (Python 3.11+) auf Port `8001`, gemanagt über systemd
- **Frontend**: React 19 statisch gebuildet, ausgeliefert über Nginx
- **Datenbank**: MongoDB 7.x
- **Reverse Proxy**: Nginx (Routes `/api/*` → Backend, alles andere → React-Build)
- **SSL**: Let's Encrypt via Certbot

---

## 1. VPS bestellen & vorbereiten

Im Hostinger Panel: **VPS → Ubuntu 24.04 LTS** wählen. Nach Provisionierung über SSH einloggen:

```bash
ssh root@DEINE-VPS-IP
```

System updaten + Basis-Tools installieren:

```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential ufw nginx ca-certificates gnupg
```

Firewall aktivieren:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

User anlegen (nicht als `root` arbeiten):

```bash
adduser marktfux
usermod -aG sudo marktfux
rsync -a ~/.ssh /home/marktfux/
chown -R marktfux:marktfux /home/marktfux/.ssh
```

Ab jetzt als `marktfux` weitermachen:

```bash
su - marktfux
```

---

## 2. Python 3.11 + Yarn + Node 20 installieren

```bash
# Python 3.11 (bei 22.04 nötig; auf 24.04 schon dabei)
sudo apt install -y python3 python3-venv python3-pip

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Yarn (Corepack)
sudo corepack enable
corepack prepare yarn@stable --activate

node --version  # v20.x
yarn --version  # 4.x oder 1.22.x
```

---

## 3. MongoDB 7.x installieren

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
sudo systemctl status mongod   # sollte "active (running)" sein
```

> **Hinweis:** Bind-Adresse standardmäßig `127.0.0.1` — MongoDB nicht öffentlich exposen. Falls Auth gewünscht, in `/etc/mongod.conf` `security: authorization: enabled` und einen Admin-User anlegen.

---

## 4. App-Code deployen

```bash
sudo mkdir -p /opt/marktfux
sudo chown marktfux:marktfux /opt/marktfux
cd /opt/marktfux

# Variante A — eigenes Git-Repo
git clone https://github.com/DEIN-USER/marktfux.git .

# Variante B — Code per scp/rsync vom Build-Rechner hochladen
# (vom lokalen Rechner aus:)
# rsync -avz --exclude='node_modules' --exclude='__pycache__' /pfad/zu/app/ marktfux@VPS-IP:/opt/marktfux/
```

Erwartete Struktur:

```
/opt/marktfux/
├── backend/         # FastAPI
├── frontend/        # React
├── deploy/          # diese Anleitung + DB-Dump
└── ...
```

---

## 5. Backend einrichten

```bash
cd /opt/marktfux/backend

# Virtuelle Umgebung
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```

`.env` für Production erstellen:

```bash
nano /opt/marktfux/backend/.env
```

```ini
MONGO_URL="mongodb://localhost:27017"
DB_NAME="marktfux"
CORS_ORIGINS="https://deine-domain.de"
JWT_SECRET="HIER-EINEN-NEUEN-256BIT-SECRET-EINFÜGEN"
ADMIN_EMAIL="admin@deine-domain.de"
ADMIN_PASSWORD="ÄNDERE-MICH-SOFORT"
EMERGENT_LLM_KEY="sk-emergent-XXXXXXXX"
APP_NAME="marktfux"
DEALER_AUTO_APPROVE="false"
```

> JWT-Secret generieren: `python3 -c "import secrets; print(secrets.token_hex(32))"`

### Systemd-Service

```bash
sudo nano /etc/systemd/system/marktfux-backend.service
```

```ini
[Unit]
Description=marktFUX FastAPI Backend
After=network.target mongod.service

[Service]
Type=simple
User=marktfux
Group=marktfux
WorkingDirectory=/opt/marktfux/backend
EnvironmentFile=/opt/marktfux/backend/.env
ExecStart=/opt/marktfux/backend/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Starten:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now marktfux-backend
sudo systemctl status marktfux-backend
curl http://localhost:8001/api/   # sollte JSON liefern
```

---

## 6. Frontend bauen

```bash
cd /opt/marktfux/frontend
yarn install --frozen-lockfile

# Production-API auf Domain zeigen lassen
cat > .env <<EOF
REACT_APP_BACKEND_URL=https://deine-domain.de
WDS_SOCKET_PORT=443
EOF

yarn build   # erzeugt /opt/marktfux/frontend/build/
```

---

## 7. Nginx konfigurieren

```bash
sudo nano /etc/nginx/sites-available/marktfux
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name deine-domain.de www.deine-domain.de;

    # Logo, Favicon, etc. aus /frontend/public landen im build/
    root /opt/marktfux/frontend/build;
    index index.html;

    client_max_body_size 12M;   # für Bilder-Upload

    # SPA fallback
    location / {
        try_files $uri /index.html;
    }

    # Backend
    location /api/ {
        proxy_pass         http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # SSE Streaming (AI-Beschreibung)
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    # Static assets caching
    location ~* \.(?:png|jpg|jpeg|webp|svg|ico|woff2?|ttf|otf|eot|css|js|map)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

Aktivieren + Reload:

```bash
sudo ln -s /etc/nginx/sites-available/marktfux /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Domain im Hostinger DNS-Panel auf die VPS-IP zeigen lassen (A-Record für `@` + `www`).

---

## 8. SSL via Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d deine-domain.de -d www.deine-domain.de \
  --agree-tos --no-eff-email -m admin@deine-domain.de --redirect
```

Auto-Renewal ist nach Installation aktiv (`systemctl status certbot.timer`).

---

## 9. MongoDB-Dump importieren

Der Dump liegt unter `/opt/marktfux/deploy/marktfux-mongo-dump.tar.gz`.

```bash
cd /opt/marktfux/deploy
tar -xzf marktfux-mongo-dump.tar.gz

# Restore in produktive DB. Quelle: "test_database" → Ziel: "marktfux" (oder dein DB_NAME)
mongorestore \
  --uri="mongodb://localhost:27017" \
  --nsFrom='test_database.*' \
  --nsTo='marktfux.*' \
  --drop \
  mongodb-dump/
```

> `--drop` ersetzt vorhandene Collections gleichen Namens. Weglassen wenn du nur ergänzen willst.
> Falls Auth aktiv: `mongorestore --uri="mongodb://USER:PASS@localhost:27017/?authSource=admin" ...`

Validieren:

```bash
mongosh marktfux --eval "db.users.countDocuments(); db.vehicles.countDocuments();"
```

---

## 10. Smoke-Test

```bash
# Backend lokal
curl https://deine-domain.de/api/

# Login als Admin (aus .env)
curl -X POST https://deine-domain.de/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@deine-domain.de","password":"DEIN-PASSWORT"}'
```

Browser auf `https://deine-domain.de` → Landing-Page muss laden.

---

## 11. Updates ausrollen

```bash
cd /opt/marktfux
git pull   # oder neuen Code per rsync hochladen

# Backend
cd backend
source .venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart marktfux-backend

# Frontend
cd ../frontend
yarn install --frozen-lockfile
yarn build
# Nginx braucht kein Reload für statische Dateien
```

---

## 12. Backups (empfohlen)

Tägliches MongoDB-Backup per Cron:

```bash
sudo nano /etc/cron.daily/marktfux-mongodump
```

```bash
#!/bin/bash
TS=$(date +%Y-%m-%d)
OUT=/var/backups/marktfux
mkdir -p "$OUT"
mongodump --uri="mongodb://localhost:27017" --db=marktfux --archive="$OUT/marktfux-$TS.archive" --gzip
find "$OUT" -name "marktfux-*.archive" -mtime +14 -delete
```

```bash
sudo chmod +x /etc/cron.daily/marktfux-mongodump
```

Object-Storage-Inhalte (Fahrzeugbilder) liegen extern bei Emergent — kein lokales Backup nötig. Bei Eigen-Hosting → `aws s3 sync` einbauen.

---

## 13. Troubleshooting

| Problem | Lösung |
|---------|--------|
| `502 Bad Gateway` | `sudo systemctl status marktfux-backend && journalctl -u marktfux-backend -n 100` |
| `MongoConnection refused` | `sudo systemctl status mongod` |
| Frontend zeigt 404 auf Sub-Routen | Nginx `try_files $uri /index.html` Zeile fehlt |
| Bilder-Upload schlägt fehl mit 413 | Nginx `client_max_body_size 12M` im server-Block prüfen |
| AI-Beschreibung stoppt nach 60s | `proxy_read_timeout 300s` im `/api/` Block |
| SSL-Renewal fehlgeschlagen | `sudo certbot renew --dry-run` |

Logs:
```bash
journalctl -u marktfux-backend -f
sudo tail -f /var/log/nginx/error.log /var/log/nginx/access.log
sudo tail -f /var/log/mongodb/mongod.log
```

---

## 14. Standard-Zugangsdaten (NACH DEPLOYMENT ÄNDERN!)

Nach Import des Dumps existiert ein vorkonfigurierter Admin-Account:

- **E-Mail**: `admin@auto-markt.de`
- **Passwort**: `Admin123!`

**Sofort nach erstem Login das Passwort ändern** oder via Mongo-Shell:

```bash
mongosh marktfux
> db.users.deleteOne({ email: "admin@auto-markt.de" })
```

Dann Backend neu starten — der Admin aus deinem `.env` wird automatisch beim Boot neu geseedet.

---

**Hosting-Empfehlung Hostinger**: KVM 2 oder höher (2 vCPU, 8 GB RAM, 100 GB NVMe) reicht für mehrere tausend Inserate + moderaten Traffic locker aus.
