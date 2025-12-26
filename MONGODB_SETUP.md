# MongoDB Setup Anleitung

Diese Anleitung hilft Ihnen bei der Einrichtung von MongoDB für das STV Ringelheim Backend.

## Option 1: MongoDB Atlas (Cloud) - Empfohlen für Einfachheit

MongoDB Atlas ist ein kostenloser Cloud-Service, der keine lokale Installation erfordert.

### Schritt 1: Konto erstellen

1. Gehen Sie zu [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Erstellen Sie ein kostenloses Konto
3. Bestätigen Sie Ihre E-Mail-Adresse

### Schritt 2: Cluster erstellen

1. Nach dem Login klicken Sie auf **"Build a Database"**
2. Wählen Sie den **FREE** Plan (M0)
3. Wählen Sie einen Cloud Provider (AWS, Google Cloud, Azure)
4. Wählen Sie eine Region (z.B. `Frankfurt (eu-central-1)` für Deutschland)
5. Klicken Sie auf **"Create"**

### Schritt 3: Datenbank-Benutzer erstellen

1. Unter **"Database Access"** → **"Add New Database User"**
2. Wählen Sie **"Password"** als Authentication Method
3. Geben Sie einen Benutzernamen ein (z.B. `stv-admin`)
4. Generieren Sie ein sicheres Passwort (oder erstellen Sie selbst)
5. **WICHTIG**: Speichern Sie Benutzername und Passwort!
6. Unter **"Database User Privileges"** wählen Sie **"Atlas admin"**
7. Klicken Sie auf **"Add User"**

### Schritt 4: Netzwerk-Zugriff konfigurieren

1. Unter **"Network Access"** → **"Add IP Address"**
2. Für Entwicklung: Klicken Sie auf **"Add Current IP Address"**
3. Oder wählen Sie **"Allow Access from Anywhere"** (0.0.0.0/0) - **Nur für Entwicklung!**
4. Klicken Sie auf **"Confirm"**

### Schritt 5: Connection String kopieren

1. Gehen Sie zurück zu **"Database"** → **"Connect"**
2. Wählen Sie **"Connect your application"**
3. Wählen Sie **"Node.js"** als Driver
4. Kopieren Sie den Connection String (sieht so aus):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Ersetzen Sie `<username>` und `<password>` mit Ihren Datenbank-Benutzerdaten
6. Fügen Sie den Datenbanknamen hinzu: `/stv-ringelheim` vor dem `?`

**Fertig!** Sie haben jetzt einen Connection String wie:
```
mongodb+srv://stv-admin:your-password@cluster0.xxxxx.mongodb.net/stv-ringelheim?retryWrites=true&w=majority
```

---

## Option 2: Lokale MongoDB Installation

### macOS Installation

1. **Mit Homebrew (Empfohlen):**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **MongoDB starten:**
   ```bash
   brew services start mongodb-community
   ```

3. **Prüfen ob MongoDB läuft:**
   ```bash
   brew services list | grep mongodb
   ```

### Windows Installation

1. Download von [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Führen Sie den Installer aus
3. Wählen Sie **"Complete"** Installation
4. Wählen Sie **"Install MongoDB as a Service"**
5. MongoDB startet automatisch

### Linux Installation (Ubuntu/Debian)

```bash
# Import MongoDB GPG Key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB Repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Lokale Connection String

Für lokale Installation:
```
mongodb://localhost:27017/stv-ringelheim
```

---

## Backend konfigurieren

### Schritt 1: .env Datei erstellen

```bash
cd backend
cp .env.example .env
```

### Schritt 2: .env bearbeiten

**Für MongoDB Atlas:**
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://stv-admin:your-password@cluster0.xxxxx.mongodb.net/stv-ringelheim?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

**Für lokale MongoDB:**
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/stv-ringelheim
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

**WICHTIG:** 
- Ersetzen Sie `your-password` mit Ihrem tatsächlichen Passwort
- Ersetzen Sie `your-super-secret-jwt-key...` mit einem sicheren, zufälligen String (mindestens 32 Zeichen)

### Schritt 3: JWT Secret generieren

Sie können ein sicheres JWT Secret generieren mit:

```bash
# macOS/Linux
openssl rand -base64 32

# Oder online: https://randomkeygen.com/
```

---

## Testen der Verbindung

### Schritt 1: Backend installieren

```bash
cd backend
npm install
```

### Schritt 2: Backend starten

```bash
npm run dev
```

Sie sollten sehen:
```
✅ Connected to MongoDB
🌱 Seeding initial data...
✅ Initial users created
✅ Bookings collection ready
🚀 Server running on http://localhost:3001
```

### Schritt 3: Health Check testen

```bash
curl http://localhost:3001/health
```

Erwartete Antwort:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Schritt 4: Login testen

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@stv.de",
    "password": "admin"
  }'
```

Erwartete Antwort:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@stv.de",
    "fullName": "Vorstand (Admin)",
    "role": "ADMIN",
    "status": "APPROVED"
  }
}
```

---

## Troubleshooting

### Fehler: "MongoServerError: Authentication failed"

- Prüfen Sie Benutzername und Passwort im Connection String
- Für MongoDB Atlas: Stellen Sie sicher, dass der Datenbank-Benutzer erstellt wurde

### Fehler: "MongoNetworkError: connect ECONNREFUSED"

- **Lokale MongoDB**: Stellen Sie sicher, dass MongoDB läuft
  ```bash
  # macOS
  brew services start mongodb-community
  
  # Linux
  sudo systemctl start mongod
  
  # Windows: Prüfen Sie Services
  ```

### Fehler: "MongoNetworkError: IP not whitelisted"

- **MongoDB Atlas**: Fügen Sie Ihre IP-Adresse unter "Network Access" hinzu
- Oder verwenden Sie `0.0.0.0/0` für Entwicklung (nicht für Produktion!)

### Fehler: "Cannot find module 'mongodb'"

```bash
cd backend
npm install
```

### Port bereits belegt

Ändern Sie `PORT` in `.env` oder beenden Sie den Prozess auf Port 3001:
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill
```

---

## Standard-Benutzer

Nach dem ersten Start werden automatisch erstellt:

- **Admin**: `admin@stv.de` / `admin`
- **Trainer**: `trainer@stv.de` / `coach`
- **Demo**: `demo@stv.de` / `demo`

---

## Nächste Schritte

1. ✅ MongoDB einrichten (Atlas oder lokal)
2. ✅ Backend `.env` konfigurieren
3. ✅ Backend starten und testen
4. ✅ Frontend `.env.local` konfigurieren (siehe `FRONTEND_API_INTEGRATION.md`)
5. ✅ Frontend starten und testen

Viel Erfolg! 🚀

