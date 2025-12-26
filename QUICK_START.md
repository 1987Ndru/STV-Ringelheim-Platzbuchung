# Quick Start Guide

Schnelle Anleitung zum Starten des STV Ringelheim Backends.

## 🚀 Schnellstart (MongoDB Atlas - Empfohlen)

### Schritt 1: MongoDB Atlas einrichten (5 Minuten)

1. Gehen Sie zu [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Erstellen Sie ein kostenloses Konto
3. Erstellen Sie einen **FREE Cluster** (M0)
4. Erstellen Sie einen **Database User**:
   - Username: z.B. `stv-admin`
   - Password: Generieren Sie ein sicheres Passwort
5. Unter **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
6. Kopieren Sie den **Connection String**:
   - Database → Connect → Connect your application
   - Kopieren Sie den String und ersetzen Sie `<password>` mit Ihrem Passwort
   - Fügen Sie `/stv-ringelheim` vor dem `?` hinzu

**Beispiel Connection String:**
```
mongodb+srv://stv-admin:MeinPasswort123@cluster0.xxxxx.mongodb.net/stv-ringelheim?retryWrites=true&w=majority
```

### Schritt 2: Backend konfigurieren

```bash
cd backend

# .env Datei bearbeiten
nano .env  # oder verwenden Sie einen anderen Editor
```

Fügen Sie Ihren MongoDB Atlas Connection String ein:
```env
MONGODB_URI=mongodb+srv://stv-admin:MeinPasswort123@cluster0.xxxxx.mongodb.net/stv-ringelheim?retryWrites=true&w=majority
```

### Schritt 3: Backend installieren und starten

```bash
cd backend
npm install
npm run dev
```

Sie sollten sehen:
```
✅ Connected to MongoDB
🌱 Seeding initial data...
✅ Initial users created
🚀 Server running on http://localhost:3001
```

### Schritt 4: Frontend konfigurieren

Erstellen Sie `.env.local` im Root-Verzeichnis:
```env
VITE_API_URL=http://localhost:3001/api
```

### Schritt 5: Frontend starten

```bash
# Im Root-Verzeichnis
npm run dev
```

### Schritt 6: Testen

1. Öffnen Sie http://localhost:3000
2. Login mit: `admin@stv.de` / `admin`

---

## 🔧 Alternative: Lokale MongoDB Installation

Falls Sie MongoDB lokal installieren möchten:

### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Dann in `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/stv-ringelheim
```

### Windows:
1. Download von [mongodb.com](https://www.mongodb.com/try/download/community)
2. Installieren Sie MongoDB
3. MongoDB startet automatisch als Service

### Linux:
Siehe `MONGODB_SETUP.md` für detaillierte Anleitung

---

## 📚 Weitere Hilfe

- **Detaillierte MongoDB Setup**: Siehe `MONGODB_SETUP.md`
- **Backend Setup**: Siehe `BACKEND_SETUP.md`
- **Frontend Integration**: Siehe `FRONTEND_API_INTEGRATION.md`

---

## ✅ Standard-Benutzer

Nach dem ersten Start verfügbar:

- **Admin**: `admin@stv.de` / `admin`
- **Trainer**: `trainer@stv.de` / `coach`
- **Demo**: `demo@stv.de` / `demo`

---

## 🐛 Troubleshooting

### Backend startet nicht
- Prüfen Sie ob Port 3001 frei ist
- Prüfen Sie die MongoDB URI in `.env`
- Prüfen Sie die Logs für Fehlermeldungen

### MongoDB Connection Error
- Für Atlas: Prüfen Sie IP-Whitelist
- Für lokal: Prüfen Sie ob MongoDB läuft
- Prüfen Sie Benutzername/Passwort

### Frontend kann nicht verbinden
- Prüfen Sie ob Backend läuft
- Prüfen Sie `VITE_API_URL` in `.env.local`
- Prüfen Sie CORS-Einstellungen im Backend

---

Viel Erfolg! 🎾

