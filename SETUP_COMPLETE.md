# Setup-Anleitung - Schritt für Schritt

Ich habe das Backend vorbereitet. Jetzt müssen Sie nur noch MongoDB Atlas einrichten.

## ✅ Was bereits erledigt ist:

1. ✅ Backend-Abhängigkeiten installiert
2. ✅ Frontend `.env.local` erstellt
3. ✅ Backend `.env` vorbereitet (benötigt noch MongoDB URI)

## 📋 Was Sie jetzt tun müssen:

### Schritt 1: MongoDB Atlas Konto erstellen (5 Minuten)

1. **Gehen Sie zu:** https://www.mongodb.com/cloud/atlas/register
2. **Erstellen Sie ein Konto** (kostenlos)
3. **Bestätigen Sie Ihre E-Mail**

### Schritt 2: Cluster erstellen

1. Nach dem Login → **"Build a Database"**
2. Wählen Sie **FREE** (M0) Plan
3. Cloud Provider: **AWS** (oder andere)
4. Region: **Frankfurt (eu-central-1)** oder näherste
5. Klicken Sie **"Create"**

### Schritt 3: Datenbank-Benutzer erstellen

1. Links im Menü → **"Database Access"**
2. Klicken Sie **"Add New Database User"**
3. Authentication: **"Password"**
4. Username: z.B. `stv-admin`
5. Password: Klicken Sie **"Autogenerate Secure Password"** oder erstellen Sie selbst
6. **WICHTIG:** Kopieren Sie das Passwort! Sie sehen es nicht wieder!
7. Database User Privileges: **"Atlas admin"**
8. Klicken Sie **"Add User"**

### Schritt 4: Netzwerk-Zugriff erlauben

1. Links im Menü → **"Network Access"**
2. Klicken Sie **"Add IP Address"**
3. Für Entwicklung: Klicken Sie **"Allow Access from Anywhere"**
   - Das fügt `0.0.0.0/0` hinzu
4. Klicken Sie **"Confirm"**

### Schritt 5: Connection String kopieren

1. Links im Menü → **"Database"**
2. Klicken Sie **"Connect"** bei Ihrem Cluster
3. Wählen Sie **"Connect your application"**
4. Driver: **"Node.js"**, Version: **"5.5 or later"**
5. **Kopieren Sie den Connection String**

Er sieht so aus:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Schritt 6: Connection String anpassen

Ersetzen Sie:
- `<username>` → Ihr Datenbank-Benutzername (z.B. `stv-admin`)
- `<password>` → Ihr Datenbank-Passwort
- Fügen Sie `/stv-ringelheim` vor dem `?` hinzu

**Beispiel:**
```
mongodb+srv://stv-admin:MeinPasswort123@cluster0.xxxxx.mongodb.net/stv-ringelheim?retryWrites=true&w=majority
```

### Schritt 7: Backend konfigurieren

Öffnen Sie `backend/.env` und fügen Sie Ihren Connection String ein:

```env
MONGODB_URI=mongodb+srv://stv-admin:MeinPasswort123@cluster0.xxxxx.mongodb.net/stv-ringelheim?retryWrites=true&w=majority
```

**WICHTIG:** Ersetzen Sie `stv-admin` und `MeinPasswort123` mit Ihren tatsächlichen Werten!

### Schritt 8: Backend starten

```bash
cd backend
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

### Schritt 9: Frontend starten

In einem neuen Terminal:

```bash
# Im Root-Verzeichnis
npm run dev
```

### Schritt 10: Testen

1. Öffnen Sie http://localhost:3000
2. Login mit:
   - Email: `admin@stv.de`
   - Password: `admin`

---

## 🎉 Fertig!

Wenn alles funktioniert, können Sie:
- Neue Benutzer registrieren
- Buchungen erstellen
- Als Admin Benutzer verwalten

---

## 🐛 Falls etwas nicht funktioniert:

### Backend startet nicht
- Prüfen Sie die MongoDB URI in `backend/.env`
- Prüfen Sie ob Benutzername/Passwort korrekt sind
- Prüfen Sie ob IP-Whitelist in MongoDB Atlas korrekt ist

### "Authentication failed"
- Prüfen Sie Benutzername und Passwort
- Stellen Sie sicher, dass der Datenbank-Benutzer erstellt wurde

### "IP not whitelisted"
- Gehen Sie zu MongoDB Atlas → Network Access
- Fügen Sie Ihre IP-Adresse hinzu oder verwenden Sie 0.0.0.0/0

### Frontend kann nicht verbinden
- Prüfen Sie ob Backend läuft (http://localhost:3001/health)
- Prüfen Sie `.env.local` im Root-Verzeichnis

---

Viel Erfolg! 🚀

