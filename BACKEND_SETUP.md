# Backend Setup Anleitung

Diese Anleitung erklärt, wie Sie das Backend für die STV Ringelheim Platzbuchung einrichten.

## Architektur

- **Backend**: Node.js mit Express
- **Datenbank**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API

## Voraussetzungen

1. **Node.js** (Version 18 oder höher)
2. **MongoDB** (lokal oder MongoDB Atlas)

## Schritt 1: MongoDB einrichten

### Option A: Lokale MongoDB Installation

1. Installieren Sie MongoDB auf Ihrem System:
   - **macOS**: `brew install mongodb-community`
   - **Windows**: Download von [mongodb.com](https://www.mongodb.com/try/download/community)
   - **Linux**: `sudo apt-get install mongodb`

2. Starten Sie MongoDB:
   ```bash
   # macOS/Linux
   mongod
   
   # Windows (als Service)
   net start MongoDB
   ```

### Option B: MongoDB Atlas (Cloud)

1. Erstellen Sie ein kostenloses Konto auf [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Erstellen Sie einen neuen Cluster
3. Kopieren Sie die Connection String
4. Ersetzen Sie `<password>` mit Ihrem Passwort

## Schritt 2: Backend installieren

1. Navigieren Sie zum Backend-Verzeichnis:
   ```bash
   cd backend
   ```

2. Installieren Sie die Abhängigkeiten:
   ```bash
   npm install
   ```

3. Erstellen Sie eine `.env` Datei:
   ```bash
   cp .env.example .env
   ```

4. Bearbeiten Sie `.env` und fügen Sie Ihre Konfiguration ein:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/stv-ringelheim
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

   **Für MongoDB Atlas:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stv-ringelheim
   ```

## Schritt 3: Backend starten

### Entwicklung (mit Auto-Reload):
```bash
npm run dev
```

### Produktion:
```bash
npm run build
npm start
```

Der Server läuft dann auf `http://localhost:3001`

## Schritt 4: API testen

### Health Check:
```bash
curl http://localhost:3001/health
```

### Registrierung:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Max",
    "lastName": "Mustermann",
    "email": "test@example.com",
    "password": "test123",
    "passwordConfirm": "test123"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@stv.de",
    "password": "admin"
  }'
```

## API Endpunkte

### Authentication
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Einloggen
- `GET /api/auth/me` - Aktueller Benutzer

### Users (Admin only)
- `GET /api/users` - Alle Benutzer abrufen
- `PATCH /api/users/:userId/status` - Benutzerstatus ändern
- `PATCH /api/users/:userId/role` - Benutzerrolle ändern
- `DELETE /api/users/:userId` - Benutzer löschen

### Bookings
- `GET /api/bookings` - Alle Buchungen abrufen
- `GET /api/bookings/date/:date` - Buchungen nach Datum
- `POST /api/bookings` - Buchung erstellen
- `PUT /api/bookings/:bookingId` - Buchung aktualisieren
- `DELETE /api/bookings/:bookingId` - Buchung löschen

## Standard-Benutzer

Nach dem ersten Start werden folgende Benutzer erstellt:

- **Admin**: `admin@stv.de` / `admin`
- **Trainer**: `trainer@stv.de` / `coach`
- **Demo**: `demo@stv.de` / `demo`

## Frontend Integration

Das Frontend muss angepasst werden, um die API-Endpunkte zu verwenden. Siehe `FRONTEND_API_INTEGRATION.md` für Details.

## Produktion

Für Produktion:

1. Ändern Sie `JWT_SECRET` zu einem sicheren, zufälligen String
2. Setzen Sie `NODE_ENV=production`
3. Verwenden Sie einen Reverse Proxy (nginx) für HTTPS
4. Konfigurieren Sie CORS für Ihre Domain
5. Verwenden Sie MongoDB Atlas oder einen anderen Managed Service

## Troubleshooting

### MongoDB Connection Error
- Stellen Sie sicher, dass MongoDB läuft
- Prüfen Sie die `MONGODB_URI` in `.env`
- Für MongoDB Atlas: Prüfen Sie die IP-Whitelist

### Port bereits belegt
- Ändern Sie `PORT` in `.env`
- Oder beenden Sie den Prozess auf Port 3001

### CORS Fehler
- Prüfen Sie `CORS_ORIGIN` in `.env`
- Stellen Sie sicher, dass die Frontend-URL korrekt ist

